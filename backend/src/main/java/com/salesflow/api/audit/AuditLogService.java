package com.salesflow.api.audit;

import com.salesflow.api.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Appends to the immutable audit trail. Every mutating operation across the app calls this
 * within its own transaction, so the audit entry commits or rolls back atomically with the
 * business change it describes.
 */
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void record(AuditAction action, String entityType, String entityId, String entityName,
                        User actingUser, String userIp, String details) {
        AuditLog log = AuditLog.builder()
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .entityName(entityName)
                .userId(actingUser != null ? actingUser.getId() : null)
                .userName(actingUser != null ? actingUser.getFullName() : "system")
                .userRole(actingUser != null ? actingUser.getRole().name() : "SYSTEM")
                .userIp(userIp)
                .details(details)
                .build();
        auditLogRepository.save(log);
    }
}
