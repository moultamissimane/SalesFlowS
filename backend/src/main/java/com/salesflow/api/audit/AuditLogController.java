package com.salesflow.api.audit;

import com.salesflow.api.common.PageResponse;
import com.salesflow.api.common.PageableFactory;
import com.salesflow.api.common.specification.SpecUtils;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
@Tag(name = "Compliance")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    public record AuditLogResponse(
            String id, String entityType, String entityId, String entityName, AuditAction action,
            String userId, String userName, String userRole, String userIp, String details, Instant createdAt) {
        static AuditLogResponse from(AuditLog l) {
            return new AuditLogResponse(
                    l.getId().toString(), l.getEntityType(), l.getEntityId(),
                    l.getEntityName() != null ? l.getEntityName() : "",
                    l.getAction(),
                    l.getUserId() != null ? l.getUserId().toString() : null, l.getUserName(), l.getUserRole(),
                    l.getUserIp() != null ? l.getUserIp() : "",
                    l.getDetails() != null ? l.getDetails() : "",
                    l.getCreatedAt());
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<AuditLogResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) AuditAction action) {
        var spec = SpecUtils.<AuditLog>and(
                entityType == null ? null : (root, query, cb) -> cb.equal(root.get("entityType"), entityType),
                action == null ? null : (root, query, cb) -> cb.equal(root.get("action"), action));
        Page<AuditLog> result = auditLogRepository.findAll(spec, PageableFactory.of(page, size, sort));
        return PageResponse.of(result, result.getContent().stream().map(AuditLogResponse::from).toList());
    }
}
