package com.salesflow.api.auth;

import static org.assertj.core.api.Assertions.assertThat;

import com.salesflow.api.auth.dto.AuthRequests.LoginRequest;
import com.salesflow.api.auth.dto.AuthRequests.RegisterRequest;
import com.salesflow.api.auth.dto.AuthResponse;
import com.salesflow.api.support.IntegrationTestBase;
import com.salesflow.api.user.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

class AuthFlowIT extends IntegrationTestBase {

    @Test
    void registerThenLoginSucceeds() {
        RegisterRequest register = new RegisterRequest("Test Agent", "agent@example.com", "SuperSecret1", UserRole.SALES_AGENT, "Sales");
        ResponseEntity<AuthResponse> registerResponse = restTemplate.postForEntity(baseUrl() + "/api/v1/auth/register", register, AuthResponse.class);

        assertThat(registerResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(registerResponse.getBody()).isNotNull();
        assertThat(registerResponse.getBody().accessToken()).isNotBlank();
        assertThat(registerResponse.getBody().user().role()).isEqualTo(UserRole.SALES_AGENT);

        LoginRequest login = new LoginRequest("agent@example.com", "SuperSecret1");
        ResponseEntity<AuthResponse> loginResponse = restTemplate.postForEntity(baseUrl() + "/api/v1/auth/login", login, AuthResponse.class);

        assertThat(loginResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(loginResponse.getBody()).isNotNull();
        assertThat(loginResponse.getBody().accessToken()).isNotBlank();
    }

    @Test
    void loginWithWrongPasswordReturns401() {
        RegisterRequest register = new RegisterRequest("Wrong Pass", "wrongpass@example.com", "CorrectPass1", UserRole.SALES_AGENT, "Sales");
        restTemplate.postForEntity(baseUrl() + "/api/v1/auth/register", register, AuthResponse.class);

        LoginRequest badLogin = new LoginRequest("wrongpass@example.com", "IncorrectPass1");
        ResponseEntity<String> response = restTemplate.postForEntity(baseUrl() + "/api/v1/auth/login", badLogin, String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void registerAsAdminIsDowngradedToSalesAgent() {
        RegisterRequest register = new RegisterRequest("Sneaky Admin", "sneaky@example.com", "SuperSecret1", UserRole.ADMIN, "Sales");
        ResponseEntity<AuthResponse> response = restTemplate.postForEntity(baseUrl() + "/api/v1/auth/register", register, AuthResponse.class);

        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().user().role()).isEqualTo(UserRole.SALES_AGENT);
    }

    @Test
    void accessingProtectedEndpointWithoutTokenIsUnauthorized() {
        ResponseEntity<String> response = restTemplate.exchange(
                baseUrl() + "/api/v1/companies", HttpMethod.GET, HttpEntity.EMPTY, String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void refreshRotatesAccessToken() {
        RegisterRequest register = new RegisterRequest("Refresh User", "refresh@example.com", "SuperSecret1", UserRole.SALES_AGENT, "Sales");
        ResponseEntity<AuthResponse> registerResponse = restTemplate.postForEntity(baseUrl() + "/api/v1/auth/register", register, AuthResponse.class);
        String cookie = registerResponse.getHeaders().getFirst(HttpHeaders.SET_COOKIE);
        assertThat(cookie).isNotNull().contains("refresh_token=");

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.COOKIE, cookie.split(";")[0]);
        ResponseEntity<AuthResponse> refreshResponse = restTemplate.postForEntity(
                baseUrl() + "/api/v1/auth/refresh", new HttpEntity<>(headers), AuthResponse.class);

        assertThat(refreshResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(refreshResponse.getBody()).isNotNull();
        assertThat(refreshResponse.getBody().accessToken()).isNotEqualTo(registerResponse.getBody().accessToken());
    }
}
