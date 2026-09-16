package com.salesflow.api.deal;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DealAttachmentRepository extends JpaRepository<DealAttachment, UUID> {
}
