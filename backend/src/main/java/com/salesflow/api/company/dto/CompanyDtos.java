package com.salesflow.api.company.dto;

import com.salesflow.api.company.Company;
import com.salesflow.api.company.CompanyStatus;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public final class CompanyDtos {
    private CompanyDtos() {}

    public record CompanyResponse(
            UUID id, String name, String industry, String website, String phone,
            String city, String country, BigDecimal annualRevenue, Integer employeeCount,
            CompanyStatus status, long contactsCount, long activeDealsCount,
            Instant createdAt, Instant updatedAt, Instant deletedAt
    ) {
        public static CompanyResponse from(Company c, long contactsCount, long activeDealsCount) {
            return new CompanyResponse(
                    c.getId(), c.getName(), orEmpty(c.getIndustry()), orEmpty(c.getWebsite()), orEmpty(c.getPhone()),
                    c.getCity(), c.getCountry(), c.getAnnualRevenue(), c.getEmployeeCount(),
                    c.getStatus(), contactsCount, activeDealsCount,
                    c.getCreatedAt(), c.getUpdatedAt(), c.getDeletedAt());
        }

        private static String orEmpty(String value) {
            return value != null ? value : "";
        }
    }

    public record CompanyRequest(
            @NotBlank String name,
            String industry,
            String website,
            String phone,
            String city,
            String country,
            BigDecimal annualRevenue,
            Integer employeeCount,
            CompanyStatus status
    ) {}
}
