package com.salesflow.api.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.salesflow.api.user.User;
import com.salesflow.api.user.UserRole;
import com.salesflow.api.user.UserStatus;
import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret("unit-test-secret-key-must-be-long-enough-for-hs256-signing-1234567890");
        properties.setAccessTokenTtlMinutes(15);
        properties.setRefreshTokenTtlDays(7);
        jwtService = new JwtService(properties);
    }

    private UserPrincipal principal() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("jwt-test@example.com")
                .passwordHash("hash")
                .fullName("JWT Test User")
                .role(UserRole.SALES_AGENT)
                .monthlyQuota(BigDecimal.ZERO)
                .status(UserStatus.ACTIVE)
                .build();
        return new UserPrincipal(user);
    }

    @Test
    void generatedTokenIsValidAndExtractsCorrectUserId() {
        UserPrincipal principal = principal();
        String token = jwtService.generateAccessToken(principal);

        assertThat(jwtService.isValid(token)).isTrue();
        assertThat(jwtService.extractUserId(token)).isEqualTo(principal.getId());
    }

    @Test
    void tamperedTokenIsInvalid() {
        String token = jwtService.generateAccessToken(principal());
        String tampered = token.substring(0, token.length() - 4) + "abcd";

        assertThat(jwtService.isValid(tampered)).isFalse();
    }

    @Test
    void garbageStringIsNotValid() {
        assertThat(jwtService.isValid("not-a-jwt")).isFalse();
    }
}
