package com.salesflow.api.activity.dto;

import com.salesflow.api.activity.Activity;
import com.salesflow.api.activity.ActivityEntityType;
import com.salesflow.api.activity.ActivityType;
import com.salesflow.api.user.UserRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public final class ActivityDtos {
    private ActivityDtos() {}

    public record ActivityResponse(
            UUID id, ActivityEntityType entityType, UUID entityId, String entityTitle,
            ActivityType type, String title, String description,
            String performedBy, UserRole performedByRole, Instant performedAt, String outcome
    ) {
        public static ActivityResponse from(Activity a) {
            return new ActivityResponse(
                    a.getId(), a.getEntityType(), a.getEntityId(), a.getEntityTitle(),
                    a.getType(), a.getTitle(), a.getDescription(),
                    a.getPerformedBy() != null ? a.getPerformedBy().getFullName() : "system",
                    a.getPerformedBy() != null ? a.getPerformedBy().getRole() : null,
                    a.getPerformedAt(), a.getOutcome());
        }
    }

    public record CreateActivityRequest(
            @NotNull ActivityEntityType entityType,
            @NotNull UUID entityId,
            String entityTitle,
            @NotNull ActivityType type,
            @NotBlank String title,
            String description
    ) {}
}
