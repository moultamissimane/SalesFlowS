package com.salesflow.api.company;

import static org.assertj.core.api.Assertions.assertThat;

import com.salesflow.api.company.dto.CompanyDtos.CompanyRequest;
import com.salesflow.api.support.AuthTestHelper;
import com.salesflow.api.support.IntegrationTestBase;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;

class CompanyPaginationIT extends IntegrationTestBase {

    @Test
    void listSupportsPaginationFilteringAndSearch() {
        String token = AuthTestHelper.registerAndGetToken(restTemplate, baseUrl(), "pagination-agent@example.com");

        for (int i = 0; i < 5; i++) {
            CompanyRequest request = new CompanyRequest("Zebra Corp " + i, "Retail", null, null, "Rabat", "Morocco", null, null, CompanyStatus.ACTIVE);
            restTemplate.exchange(baseUrl() + "/api/v1/companies", HttpMethod.POST,
                    AuthTestHelper.bearerWithBody(token, request), Void.class);
        }
        CompanyRequest churned = new CompanyRequest("Unrelated Churned Co", "Retail", null, null, "Fes", "Morocco", null, null, CompanyStatus.CHURNED);
        restTemplate.exchange(baseUrl() + "/api/v1/companies", HttpMethod.POST,
                AuthTestHelper.bearerWithBody(token, churned), Void.class);

        ResponseEntity<Map> page1 = restTemplate.exchange(
                baseUrl() + "/api/v1/companies?page=0&size=3&sort=name,asc",
                HttpMethod.GET, AuthTestHelper.bearer(token), Map.class);
        assertThat(page1.getBody().get("size")).isEqualTo(3);
        assertThat((List<?>) page1.getBody().get("content")).hasSize(3);

        ResponseEntity<Map> searched = restTemplate.exchange(
                baseUrl() + "/api/v1/companies?q=Zebra&size=50",
                HttpMethod.GET, AuthTestHelper.bearer(token), Map.class);
        List<?> content = (List<?>) searched.getBody().get("content");
        assertThat(content).hasSize(5);

        ResponseEntity<Map> filtered = restTemplate.exchange(
                baseUrl() + "/api/v1/companies?status=CHURNED&size=50",
                HttpMethod.GET, AuthTestHelper.bearer(token), Map.class);
        List<?> churnedContent = (List<?>) filtered.getBody().get("content");
        assertThat(churnedContent).hasSize(1);
    }
}
