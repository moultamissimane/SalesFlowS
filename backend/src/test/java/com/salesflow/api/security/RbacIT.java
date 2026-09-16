package com.salesflow.api.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.salesflow.api.auth.dto.AuthRequests.LoginRequest;
import com.salesflow.api.auth.dto.AuthRequests.RegisterRequest;
import com.salesflow.api.auth.dto.AuthResponse;
import com.salesflow.api.support.IntegrationTestBase;
import com.salesflow.api.user.User;
import com.salesflow.api.user.UserRepository;
import com.salesflow.api.user.UserRole;
import com.salesflow.api.user.UserStatus;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

class RbacIT extends IntegrationTestBase {

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    private String tokenFor(String email, String password, UserRole role) {
        if (userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(email).isEmpty()) {
            userRepository.save(User.builder()
                    .email(email).passwordHash(passwordEncoder.encode(password))
                    .fullName("RBAC Test " + role).role(role).status(UserStatus.ACTIVE)
                    .monthlyQuota(BigDecimal.ZERO).build());
        }
        ResponseEntity<AuthResponse> response = restTemplate.postForEntity(
                baseUrl() + "/api/v1/auth/login", new LoginRequest(email, password), AuthResponse.class);
        return response.getBody().accessToken();
    }

    private HttpEntity<Void> bearer(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return new HttpEntity<>(headers);
    }

    @Test
    void salesAgentCannotAccessAuditLogs() {
        RegisterRequest register = new RegisterRequest("Plain Agent", "plainagent@example.com", "SuperSecret1", UserRole.SALES_AGENT, "Sales");
        String token = restTemplate.postForEntity(baseUrl() + "/api/v1/auth/register", register, AuthResponse.class).getBody().accessToken();

        ResponseEntity<String> response = restTemplate.exchange(
                baseUrl() + "/api/v1/audit-logs", HttpMethod.GET, bearer(token), String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void adminCanAccessAuditLogs() {
        String token = tokenFor("admin-rbac@example.com", "SuperSecret1", UserRole.ADMIN);
        ResponseEntity<String> response = restTemplate.exchange(
                baseUrl() + "/api/v1/audit-logs", HttpMethod.GET, bearer(token), String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void salesAgentCannotAccessDashboardAnalytics() {
        RegisterRequest register = new RegisterRequest("Analytics Agent", "analyticsagent@example.com", "SuperSecret1", UserRole.SALES_AGENT, "Sales");
        String token = restTemplate.postForEntity(baseUrl() + "/api/v1/auth/register", register, AuthResponse.class).getBody().accessToken();

        ResponseEntity<String> response = restTemplate.exchange(
                baseUrl() + "/api/v1/analytics/dashboard", HttpMethod.GET, bearer(token), String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void salesManagerCanAccessDashboardAnalyticsViaRoleHierarchy() {
        String token = tokenFor("manager-rbac@example.com", "SuperSecret1", UserRole.SALES_MANAGER);
        ResponseEntity<String> response = restTemplate.exchange(
                baseUrl() + "/api/v1/analytics/dashboard", HttpMethod.GET, bearer(token), String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void onlyAdminCanPurgeFromRecycleBin() {
        String managerToken = tokenFor("manager-purge@example.com", "SuperSecret1", UserRole.SALES_MANAGER);
        java.util.UUID randomId = java.util.UUID.randomUUID();
        ResponseEntity<String> response = restTemplate.exchange(
                baseUrl() + "/api/v1/admin/purge/TASK/" + randomId, HttpMethod.DELETE, bearer(managerToken), String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }
}
