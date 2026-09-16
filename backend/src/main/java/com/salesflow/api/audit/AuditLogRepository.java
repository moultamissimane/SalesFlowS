package com.salesflow.api.audit;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID>, JpaSpecificationExecutor<AuditLog> {
    Optional<AuditLog> findFirstByEntityTypeAndEntityIdAndActionOrderByCreatedAtDesc(
            String entityType, String entityId, AuditAction action);
}
