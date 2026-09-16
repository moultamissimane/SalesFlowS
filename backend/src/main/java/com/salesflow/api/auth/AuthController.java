package com.salesflow.api.auth;

import com.salesflow.api.auth.dto.AuthRequests.ForgotPasswordRequest;
import com.salesflow.api.auth.dto.AuthRequests.LoginRequest;
import com.salesflow.api.auth.dto.AuthRequests.RegisterRequest;
import com.salesflow.api.auth.dto.AuthRequests.ResetPasswordRequest;
import com.salesflow.api.auth.dto.AuthResponse;
import com.salesflow.api.common.HttpUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication")
public class AuthController {

    private static final String REFRESH_COOKIE = "refresh_token";

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new account and auto-login (grants SALES_AGENT or SALES_MANAGER only)")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request,
                                                  HttpServletRequest req, HttpServletResponse res) {
        AuthService.LoginResult result = authService.register(request, HttpUtils.clientIp(req));
        setRefreshCookie(res, result.refreshToken());
        return ResponseEntity.ok(result.response());
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate and issue an access token + httpOnly refresh cookie")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request,
                                               HttpServletRequest req, HttpServletResponse res) {
        AuthService.LoginResult result = authService.login(request, HttpUtils.clientIp(req));
        setRefreshCookie(res, result.refreshToken());
        return ResponseEntity.ok(result.response());
    }

    @PostMapping("/refresh")
    @Operation(summary = "Rotate the refresh token cookie and issue a new access token")
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest req, HttpServletResponse res) {
        String raw = readRefreshCookie(req);
        AuthService.LoginResult result = authService.refresh(raw, HttpUtils.clientIp(req));
        setRefreshCookie(res, result.refreshToken());
        return ResponseEntity.ok(result.response());
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke the current refresh token and clear the cookie")
    public ResponseEntity<Void> logout(HttpServletRequest req, HttpServletResponse res) {
        authService.logout(readRefreshCookie(req));
        clearRefreshCookie(res);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request a password-reset email (always 200, does not confirm account existence)")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Consume a password-reset token and set a new password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok().build();
    }

    private void setRefreshCookie(HttpServletResponse res, String rawToken) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE, rawToken)
                .httpOnly(true)
                .secure(false) // set true behind HTTPS in production
                .sameSite("Lax")
                .path("/api/v1/auth")
                .maxAge(java.time.Duration.ofDays(7))
                .build();
        res.addHeader("Set-Cookie", cookie.toString());
    }

    private void clearRefreshCookie(HttpServletResponse res) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE, "")
                .httpOnly(true)
                .sameSite("Lax")
                .path("/api/v1/auth")
                .maxAge(0)
                .build();
        res.addHeader("Set-Cookie", cookie.toString());
    }

    private String readRefreshCookie(HttpServletRequest req) {
        if (req.getCookies() == null) return null;
        for (Cookie c : req.getCookies()) {
            if (REFRESH_COOKIE.equals(c.getName())) {
                return c.getValue();
            }
        }
        return null;
    }
}
