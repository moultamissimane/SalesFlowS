package com.salesflow.api.lead.dto;

import com.salesflow.api.lead.Lead;
import com.salesflow.api.lead.LeadSource;
import com.salesflow.api.lead.LeadStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public final class LeadDtos {
    private LeadDtos() {}

    public record LeadResponse(
            UUID id, String title, String company, String contactName, String email, String phone,
            LeadSource source, Integer score, LeadStatus status, BigDecimal estimatedValue,
            UUID assignedAgentId, String assignedAgentName, String city,
            Instant createdAt, Instant updatedAt, Instant deletedAt
    ) {
        public static LeadResponse from(Lead l) {
            return new LeadResponse(
                    l.getId(), l.getTitle(), orEmpty(l.getCompany()), orEmpty(l.getContactName()),
                    orEmpty(l.getEmail()), orEmpty(l.getPhone()),
                    l.getSource(), l.getScore(), l.getStatus(), l.getEstimatedValue(),
                    l.getAssignedAgent() != null ? l.getAssignedAgent().getId() : null,
                    l.getAssignedAgent() != null ? l.getAssignedAgent().getFullName() : "Unassigned",
                    orEmpty(l.getCity()), l.getCreatedAt(), l.getUpdatedAt(), l.getDeletedAt());
        }

        private static String orEmpty(String value) {
            return value != null ? value : "";
        }
    }

    public record LeadRequest(
            @NotBlank String title,
            String company,
            String contactName,
            String email,
            String phone,
            @NotNull LeadSource source,
            @Min(0) @Max(100) Integer score,
            LeadStatus status,
            @PositiveOrZero BigDecimal estimatedValue,
            UUID assignedAgentId,
            String city
    ) {}

    public record ConvertToDealRequest(
            @NotBlank String dealTitle,
            @NotNull @PositiveOrZero BigDecimal dealValue
    ) {}
}
