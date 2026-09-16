package com.salesflow.api.task;

import com.salesflow.api.audit.AuditAction;
import com.salesflow.api.audit.AuditLogService;
import com.salesflow.api.common.PageResponse;
import com.salesflow.api.common.exception.ResourceNotFoundException;
import com.salesflow.api.common.specification.SpecUtils;
import com.salesflow.api.contact.ContactRepository;
import com.salesflow.api.deal.DealRepository;
import com.salesflow.api.security.CurrentUserService;
import com.salesflow.api.task.dto.TaskDtos.TaskRequest;
import com.salesflow.api.task.dto.TaskDtos.TaskResponse;
import com.salesflow.api.user.UserRepository;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final DealRepository dealRepository;
    private final ContactRepository contactRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public PageResponse<TaskResponse> list(Pageable pageable, String q, TaskStatus status, UUID agentId) {
        var spec = SpecUtils.<Task>and(
                TaskSpecifications.active(),
                TaskSpecifications.search(q),
                TaskSpecifications.statusEquals(status),
                TaskSpecifications.assignedAgentIdEquals(agentId));
        Page<Task> page = taskRepository.findAll(spec, pageable);
        return PageResponse.of(page, page.getContent().stream().map(TaskResponse::from).toList());
    }

    @Transactional
    public TaskResponse create(TaskRequest request) {
        Task task = Task.builder()
                .title(request.title())
                .description(request.description())
                .deal(request.dealId() != null ? dealRepository.findById(request.dealId()).orElse(null) : null)
                .contact(request.contactId() != null ? contactRepository.findById(request.contactId()).orElse(null) : null)
                .assignedAgent(request.assignedAgentId() != null ? userRepository.findById(request.assignedAgentId()).orElse(null) : currentUserService.entity())
                .dueDate(request.dueDate())
                .priority(request.priority() != null ? request.priority() : TaskPriority.MEDIUM)
                .status(TaskStatus.PENDING)
                .build();
        taskRepository.save(task);
        auditLogService.record(AuditAction.CREATE, "TASK", task.getId().toString(), task.getTitle(),
                currentUserService.entity(), null, "Created scheduled task");
        return TaskResponse.from(task);
    }

    @Transactional
    public TaskResponse update(UUID id, TaskRequest request) {
        Task task = findActive(id);
        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setDeal(request.dealId() != null ? dealRepository.findById(request.dealId()).orElse(null) : null);
        task.setContact(request.contactId() != null ? contactRepository.findById(request.contactId()).orElse(null) : null);
        if (request.assignedAgentId() != null) {
            task.setAssignedAgent(userRepository.findById(request.assignedAgentId()).orElse(null));
        }
        task.setDueDate(request.dueDate());
        if (request.priority() != null) task.setPriority(request.priority());
        auditLogService.record(AuditAction.UPDATE, "TASK", task.getId().toString(), task.getTitle(),
                currentUserService.entity(), null, "Updated task details");
        return TaskResponse.from(task);
    }

    @Transactional
    public TaskResponse toggleStatus(UUID id) {
        Task task = findActive(id);
        TaskStatus next = task.getStatus() == TaskStatus.COMPLETED ? TaskStatus.PENDING : TaskStatus.COMPLETED;
        task.setStatus(next);
        task.setCompletedAt(next == TaskStatus.COMPLETED ? Instant.now() : null);
        auditLogService.record(AuditAction.UPDATE, "TASK", task.getId().toString(), task.getTitle(),
                currentUserService.entity(), null, "Toggled status to " + next);
        return TaskResponse.from(task);
    }

    @Transactional
    public void softDelete(UUID id) {
        Task task = findActive(id);
        task.setDeletedAt(Instant.now());
        auditLogService.record(AuditAction.SOFT_DELETE, "TASK", task.getId().toString(), task.getTitle(),
                currentUserService.entity(), null, "Soft-deleted task (moved to Recycle Bin)");
    }

    private Task findActive(UUID id) {
        Task task = taskRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Task", id));
        if (task.getDeletedAt() != null) {
            throw ResourceNotFoundException.of("Task", id);
        }
        return task;
    }
}
