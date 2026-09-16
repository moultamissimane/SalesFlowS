package com.salesflow.api.deal;

import static org.assertj.core.api.Assertions.assertThat;

import com.salesflow.api.company.dto.CompanyDtos.CompanyRequest;
import com.salesflow.api.company.dto.CompanyDtos.CompanyResponse;
import com.salesflow.api.deal.dto.DealDtos.DealRequest;
import com.salesflow.api.deal.dto.DealDtos.DealResponse;
import com.salesflow.api.deal.dto.DealDtos.StageChangeRequest;
import com.salesflow.api.support.AuthTestHelper;
import com.salesflow.api.support.IntegrationTestBase;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

class DealPipelineIT extends IntegrationTestBase {

    @Test
    void movingDealToWonRecalculatesProbabilityAndLogsActivity() {
        String token = AuthTestHelper.registerAndGetToken(restTemplate, baseUrl(), "pipeline-agent@example.com");

        CompanyRequest companyRequest = new CompanyRequest("Pipeline Test Co", "Tech", null, null, "Casablanca", "Morocco", null, null, null);
        CompanyResponse company = restTemplate.exchange(baseUrl() + "/api/v1/companies", HttpMethod.POST,
                AuthTestHelper.bearerWithBody(token, companyRequest), CompanyResponse.class).getBody();

        DealRequest dealRequest = new DealRequest("Pipeline Test Deal", company.id(), null, new BigDecimal("100000"),
                Currency.MAD, PipelineStage.NEW_LEAD, null, null, DealPriority.MEDIUM, List.of("Test"));
        DealResponse deal = restTemplate.exchange(baseUrl() + "/api/v1/deals", HttpMethod.POST,
                AuthTestHelper.bearerWithBody(token, dealRequest), DealResponse.class).getBody();

        assertThat(deal.stage()).isEqualTo(PipelineStage.NEW_LEAD);
        assertThat(deal.probability()).isEqualTo(10);

        StageChangeRequest wonRequest = new StageChangeRequest(PipelineStage.WON, null);
        ResponseEntity<DealResponse> wonResponse = restTemplate.exchange(
                baseUrl() + "/api/v1/deals/" + deal.id() + "/stage", HttpMethod.PATCH,
                AuthTestHelper.bearerWithBody(token, wonRequest), DealResponse.class);

        assertThat(wonResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(wonResponse.getBody().stage()).isEqualTo(PipelineStage.WON);
        assertThat(wonResponse.getBody().probability()).isEqualTo(100);

        ResponseEntity<Object[]> activities = restTemplate.exchange(
                baseUrl() + "/api/v1/activities?entityType=DEAL&entityId=" + deal.id(),
                HttpMethod.GET, AuthTestHelper.bearer(token), Object[].class);
        assertThat(activities.getBody()).isNotEmpty();
    }

    @Test
    void softDeletedDealIsExcludedFromListButAppearsInRecycleBin() {
        String token = AuthTestHelper.registerAndGetToken(restTemplate, baseUrl(), "softdelete-agent@example.com");

        CompanyRequest companyRequest = new CompanyRequest("SoftDelete Co", "Tech", null, null, "Casablanca", "Morocco", null, null, null);
        CompanyResponse company = restTemplate.exchange(baseUrl() + "/api/v1/companies", HttpMethod.POST,
                AuthTestHelper.bearerWithBody(token, companyRequest), CompanyResponse.class).getBody();

        DealRequest dealRequest = new DealRequest("Soft Delete Me", company.id(), null, new BigDecimal("50000"),
                Currency.MAD, PipelineStage.NEW_LEAD, null, null, DealPriority.LOW, List.of());
        DealResponse deal = restTemplate.exchange(baseUrl() + "/api/v1/deals", HttpMethod.POST,
                AuthTestHelper.bearerWithBody(token, dealRequest), DealResponse.class).getBody();

        restTemplate.exchange(baseUrl() + "/api/v1/deals/" + deal.id(), HttpMethod.DELETE,
                AuthTestHelper.bearer(token), Void.class);

        ResponseEntity<String> getDeleted = restTemplate.exchange(
                baseUrl() + "/api/v1/deals/" + deal.id(), HttpMethod.GET, AuthTestHelper.bearer(token), String.class);
        assertThat(getDeleted.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

        ResponseEntity<Object[]> trash = restTemplate.exchange(
                baseUrl() + "/api/v1/recycle-bin", HttpMethod.GET, AuthTestHelper.bearer(token), Object[].class);
        assertThat(trash.getBody()).isNotEmpty();
    }
}
