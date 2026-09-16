package com.salesflow.api.activity;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActivityRepository extends JpaRepository<Activity, UUID> {
    long countByEntityTypeAndEntityId(ActivityEntityType entityType, UUID entityId);

    List<Activity> findByEntityTypeAndEntityId(ActivityEntityType entityType, UUID entityId, Sort sort);
}
