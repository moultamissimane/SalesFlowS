package com.salesflow.api.auth;

import com.salesflow.api.common.exception.UnauthorizedException;
import com.salesflow.api.security.JwtProperties;
import com.salesflow.api.security.TokenHasher;
import com.salesflow.api.user.User;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtProperties jwtProperties;

    @Transactional
    public String issue(User user, String ip) {
        String raw = TokenHasher.newOpaqueToken();
        RefreshToken token = RefreshToken.builder()
                .user(user)
                .tokenHash(TokenHasher.sha256(raw))
                .expiresAt(Instant.now().plus(jwtProperties.getRefreshTokenTtlDays(), ChronoUnit.DAYS))
                .createdByIp(ip)
                .build();
        refreshTokenRepository.save(token);
        return raw;
    }

    /** Validates + revokes the presented token and issues a fresh one (rotation), returning the new raw token. */
    @Transactional
    public RotationResult rotate(String rawToken, String ip) {
        RefreshToken existing = refreshTokenRepository.findByTokenHash(TokenHasher.sha256(rawToken))
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (!existing.isActive()) {
            throw new UnauthorizedException("Refresh token expired or already used");
        }

        String newRaw = issue(existing.getUser(), ip);
        existing.setRevokedAt(Instant.now());
        existing.setReplacedByTokenHash(TokenHasher.sha256(newRaw));
        refreshTokenRepository.save(existing);

        return new RotationResult(existing.getUser(), newRaw);
    }

    @Transactional
    public void revoke(String rawToken) {
        refreshTokenRepository.findByTokenHash(TokenHasher.sha256(rawToken))
                .ifPresent(t -> {
                    t.setRevokedAt(Instant.now());
                    refreshTokenRepository.save(t);
                });
    }

    @Transactional
    public void revokeAllForUser(java.util.UUID userId) {
        refreshTokenRepository.findAllByUser_IdAndRevokedAtIsNull(userId)
                .forEach(t -> t.setRevokedAt(Instant.now()));
    }

    public record RotationResult(User user, String rawToken) {}
}
