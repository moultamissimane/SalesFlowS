package com.salesflow.api.task.dto;

import com.salesflow.api.task.Task;
import com.salesflow.api.task.TaskPriority;
import com.salesflow.api.task.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public final class TaskDtos {
    private TaskDtos() {}

    public record TaskResponse(
            UUID id, String title, String description,
            UUID dealId, String dealTitle, UUID contactId, String contactName,
            UUID assignedAgentId, String assignedAgentName,
            LocalDate dueDate, TaskPriority priority, TaskStatus status,
            Instant completedAt, Instant createdAt, Instant deletedAt
    ) {
        public static TaskResponse from(Task t) {
            return new TaskResponse(
                    t.getId(), t.getTitle(), t.getDescription() != null ? t.getDescription() : "",
                    t.getDeal() != null ? t.getDeal().getId() : null,
                    t.getDeal() != null ? t.getDeal().getTitle() : null,
                    t.getContact() != null ? t.getContact().getId() : null,
                    t.getContact() != null ? t.getContact().getFirstName() + " " + t.getContact().getLastName() : null,
                    t.getAssignedAgent() != null ? t.getAssignedAgent().getId() : null,
                    t.getAssignedAgent() != null ? t.getAssignedAgent().getFullName() : "Unassigned",
                    t.getDueDate(), t.getPriority(), t.getStatus(),
                    t.getCompletedAt(), t.getCreatedAt(), t.getDeletedAt());
        }
    }

    public record TaskRequest(
            @NotBlank String title,
            String description,
            UUID dealId,
            UUID contactId,
            UUID assignedAgentId,
            LocalDate dueDate,
            TaskPriority priority
    ) {}
}
