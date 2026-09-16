package com.salesflow.api.auth;

import com.salesflow.api.audit.AuditAction;
import com.salesflow.api.audit.AuditLogService;
import com.salesflow.api.auth.dto.AuthRequests.ForgotPasswordRequest;
import com.salesflow.api.auth.dto.AuthRequests.LoginRequest;
import com.salesflow.api.auth.dto.AuthRequests.RegisterRequest;
import com.salesflow.api.auth.dto.AuthRequests.ResetPasswordRequest;
import com.salesflow.api.auth.dto.AuthResponse;
import com.salesflow.api.common.exception.BadRequestException;
import com.salesflow.api.common.exception.UnauthorizedException;
import com.salesflow.api.email.EmailService;
import com.salesflow.api.email.EmailTemplateType;
import com.salesflow.api.security.JwtService;
import com.salesflow.api.security.TokenHasher;
import com.salesflow.api.security.UserPrincipal;
import com.salesflow.api.user.User;
import com.salesflow.api.user.UserRepository;
import com.salesflow.api.user.UserRole;
import com.salesflow.api.user.UserStatus;
import com.salesflow.api.user.dto.UserDtos.UserSummary;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;
    private final AuditLogService auditLogService;

    public record LoginResult(AuthResponse response, String refreshToken) {}

    @Transactional
    public LoginResult register(RegisterRequest request, String ip) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new BadRequestException("An account with this email already exists");
        }

        // Public self-registration may only grant SALES_AGENT or SALES_MANAGER - never ADMIN.
        UserRole grantedRole = (request.role() == UserRole.SALES_MANAGER)
                ? UserRole.SALES_MANAGER
                : UserRole.SALES_AGENT;

        User user = User.builder()
                .email(request.email().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .role(grantedRole)
                .department(request.department())
                .status(UserStatus.ACTIVE)
                .build();
        userRepository.save(user);

        emailService.send(user.getEmail(), user.getFullName(),
                "Welcome to SalesFlow CRM",
                EmailTemplateType.WELCOME,
                "Hi " + user.getFullName() + ", your SalesFlow account has been created with role " + grantedRole + ".");

        auditLogService.record(AuditAction.CREATE, "USER", user.getId().toString(), user.getFullName(),
                user, ip, "Self-registered account with role " + grantedRole);

        return issueTokens(user, ip);
    }

    @Transactional
    public LoginResult login(LoginRequest request, String ip) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        } catch (org.springframework.security.core.AuthenticationException e) {
            throw new org.springframework.security.authentication.BadCredentialsException("Invalid email or password");
        }

        User user = userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(request.email())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        auditLogService.record(AuditAction.AUTH_LOGIN, "USER", user.getId().toString(), user.getFullName(),
                user, ip, "Authenticated via password login");

        return issueTokens(user, ip);
    }

    @Transactional
    public LoginResult refresh(String rawRefreshToken, String ip) {
        if (rawRefreshToken == null) {
            throw new UnauthorizedException("Missing refresh token");
        }
        RefreshTokenService.RotationResult rotated = refreshTokenService.rotate(rawRefreshToken, ip);
        User user = rotated.user();
        String accessToken = jwtService.generateAccessToken(new UserPrincipal(user));
        AuthResponse response = AuthResponse.of(accessToken, jwtService.accessTokenTtlSeconds(), UserSummary.from(user));
        return new LoginResult(response, rotated.rawToken());
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken != null) {
            refreshTokenService.revoke(rawRefreshToken);
        }
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(request.email()).ifPresent(user -> {
            String raw = TokenHasher.newOpaqueToken();
            PasswordResetToken token = PasswordResetToken.builder()
                    .user(user)
                    .tokenHash(TokenHasher.sha256(raw))
                    .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                    .build();
            passwordResetTokenRepository.save(token);

            emailService.send(user.getEmail(), user.getFullName(),
                    "Reset your SalesFlow password",
                    EmailTemplateType.PASSWORD_RESET,
                    "Use this one-time token to reset your password (valid 1 hour): " + raw);
        });
        // Always return silently (no user enumeration) - controller replies 200 regardless.
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken token = passwordResetTokenRepository.findByTokenHash(TokenHasher.sha256(request.token()))
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset token"));

        if (!token.isUsable()) {
            throw new BadRequestException("Invalid or expired reset token");
        }

        User user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        token.setUsedAt(Instant.now());
        passwordResetTokenRepository.save(token);

        refreshTokenService.revokeAllForUser(user.getId());
    }

    private LoginResult issueTokens(User user, String ip) {
        String accessToken = jwtService.generateAccessToken(new UserPrincipal(user));
        String refreshToken = refreshTokenService.issue(user, ip);
        AuthResponse response = AuthResponse.of(accessToken, jwtService.accessTokenTtlSeconds(), UserSummary.from(user));
        return new LoginResult(response, refreshToken);
    }
}
