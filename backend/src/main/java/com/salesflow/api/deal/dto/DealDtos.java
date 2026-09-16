package com.salesflow.api.deal.dto;

import com.salesflow.api.deal.Currency;
import com.salesflow.api.deal.Deal;
import com.salesflow.api.deal.DealAttachment;
import com.salesflow.api.deal.DealPriority;
import com.salesflow.api.deal.PipelineStage;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class DealDtos {
    private DealDtos() {}

    public record DealAttachmentResponse(
            UUID id, UUID dealId, String fileName, long fileSize, String fileType,
            String uploadedBy, Instant uploadedAt, String downloadUrl
    ) {
        public static DealAttachmentResponse from(DealAttachment a) {
            return new DealAttachmentResponse(
                    a.getId(), a.getDeal().getId(), a.getFileName(), a.getFileSize(), a.getFileType(),
                    a.getUploadedBy() != null ? a.getUploadedBy().getFullName() : "Unknown",
                    a.getUploadedAt(),
                    "/api/v1/deals/" + a.getDeal().getId() + "/attachments/" + a.getId() + "/download");
        }
    }

    public record DealResponse(
            UUID id, String title,
            UUID companyId, String companyName,
            UUID contactId, String contactName, String contactEmail,
            BigDecimal value, Currency currency, PipelineStage stage, Integer probability,
            LocalDate expectedCloseDate,
            UUID assignedAgentId, String assignedAgentName,
            DealPriority priority, List<String> tags, List<DealAttachmentResponse> attachments,
            long notesCount, Instant lastActivityDate,
            Instant createdAt, Instant updatedAt, Instant deletedAt, String wonLostReason
    ) {
        public static DealResponse from(Deal d, long notesCount) {
            return new DealResponse(
                    d.getId(), d.getTitle(),
                    d.getCompany().getId(), d.getCompany().getName(),
                    d.getContact() != null ? d.getContact().getId() : null,
                    d.getContact() != null ? d.getContact().getFirstName() + " " + d.getContact().getLastName() : "",
                    d.getContact() != null ? d.getContact().getEmail() : "",
                    d.getValue(), d.getCurrency(), d.getStage(), d.getProbability(),
                    d.getExpectedCloseDate(),
                    d.getAssignedAgent() != null ? d.getAssignedAgent().getId() : null,
                    d.getAssignedAgent() != null ? d.getAssignedAgent().getFullName() : "Unassigned",
                    d.getPriority(), new java.util.ArrayList<>(d.getTags()),
                    d.getAttachments().stream().map(DealAttachmentResponse::from).toList(),
                    notesCount, d.getLastActivityDate(),
                    d.getCreatedAt(), d.getUpdatedAt(), d.getDeletedAt(), d.getWonLostReason());
        }
    }

    public record DealRequest(
            @NotBlank String title,
            @NotNull UUID companyId,
            UUID contactId,
            @NotNull @PositiveOrZero BigDecimal value,
            Currency currency,
            PipelineStage stage,
            LocalDate expectedCloseDate,
            UUID assignedAgentId,
            DealPriority priority,
            List<String> tags
    ) {}

    public record StageChangeRequest(
            @NotNull PipelineStage stage,
            String wonLostReason
    ) {}
}
