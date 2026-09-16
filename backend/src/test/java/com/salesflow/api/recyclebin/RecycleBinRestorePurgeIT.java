package com.salesflow.api.recyclebin;

import static org.assertj.core.api.Assertions.assertThat;

import com.salesflow.api.company.CompanyStatus;
import com.salesflow.api.company.dto.CompanyDtos.CompanyRequest;
import com.salesflow.api.company.dto.CompanyDtos.CompanyResponse;
import com.salesflow.api.support.AuthTestHelper;
import com.salesflow.api.support.IntegrationTestBase;
import com.salesflow.api.user.User;
import com.salesflow.api.user.UserRepository;
import com.salesflow.api.user.UserRole;
import com.salesflow.api.user.UserStatus;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

class RecycleBinRestorePurgeIT extends IntegrationTestBase {

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Test
    void restoreBringsCompanyBackAndAdminCanPermanentlyPurge() {
        String agentToken = AuthTestHelper.registerAndGetToken(restTemplate, baseUrl(), "recyclebin-agent@example.com");

        CompanyRequest request = new CompanyRequest("Recycle Me Inc", "Retail", null, null, "Marrakech", "Morocco", null, null, CompanyStatus.ACTIVE);
        CompanyResponse company = restTemplate.exchange(baseUrl() + "/api/v1/companies", HttpMethod.POST,
                AuthTestHelper.bearerWithBody(agentToken, request), CompanyResponse.class).getBody();

        restTemplate.exchange(baseUrl() + "/api/v1/companies/" + company.id(), HttpMethod.DELETE,
                AuthTestHelper.bearer(agentToken), Void.class);

        restTemplate.exchange(baseUrl() + "/api/v1/recycle-bin/COMPANY/" + company.id() + "/restore",
                HttpMethod.POST, AuthTestHelper.bearer(agentToken), Void.class);

        ResponseEntity<CompanyResponse> restored = restTemplate.exchange(
                baseUrl() + "/api/v1/companies/" + company.id(), HttpMethod.GET,
                AuthTestHelper.bearer(agentToken), CompanyResponse.class);
        assertThat(restored.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(restored.getBody().deletedAt()).isNull();

        restTemplate.exchange(baseUrl() + "/api/v1/companies/" + company.id(), HttpMethod.DELETE,
                AuthTestHelper.bearer(agentToken), Void.class);

        String adminEmail = "recyclebin-admin@example.com";
        userRepository.save(User.builder()
                .email(adminEmail).passwordHash(passwordEncoder.encode("SuperSecret1"))
                .fullName("Purge Admin").role(UserRole.ADMIN).status(UserStatus.ACTIVE)
                .monthlyQuota(BigDecimal.ZERO).build());
        String adminToken = restTemplate.postForEntity(baseUrl() + "/api/v1/auth/login",
                new com.salesflow.api.auth.dto.AuthRequests.LoginRequest(adminEmail, "SuperSecret1"),
                com.salesflow.api.auth.dto.AuthResponse.class).getBody().accessToken();

        ResponseEntity<Void> purge = restTemplate.exchange(
                baseUrl() + "/api/v1/admin/purge/COMPANY/" + company.id(), HttpMethod.DELETE,
                AuthTestHelper.bearer(adminToken), Void.class);
        assertThat(purge.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        ResponseEntity<Object[]> trash = restTemplate.exchange(
                baseUrl() + "/api/v1/recycle-bin", HttpMethod.GET, AuthTestHelper.bearer(adminToken), Object[].class);
        boolean stillThere = java.util.Arrays.stream(trash.getBody())
                .anyMatch(item -> item.toString().contains(company.id().toString()));
        assertThat(stillThere).isFalse();
    }
}
