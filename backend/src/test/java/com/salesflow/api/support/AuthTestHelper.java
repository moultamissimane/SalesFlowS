package com.salesflow.api.support;

import com.salesflow.api.auth.dto.AuthRequests.RegisterRequest;
import com.salesflow.api.auth.dto.AuthResponse;
import com.salesflow.api.user.UserRole;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;

public final class AuthTestHelper {
    private AuthTestHelper() {}

    public static String registerAndGetToken(TestRestTemplate restTemplate, String baseUrl, String email) {
        RegisterRequest request = new RegisterRequest("Test User " + email, email, "SuperSecret1", UserRole.SALES_AGENT, "Sales");
        AuthResponse response = restTemplate.postForEntity(baseUrl + "/api/v1/auth/register", request, AuthResponse.class).getBody();
        return response.accessToken();
    }

    public static HttpEntity<Void> bearer(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return new HttpEntity<>(headers);
    }

    public static <T> HttpEntity<T> bearerWithBody(String token, T body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, headers);
    }
}
