package com.salesflow.api.task;

import com.salesflow.api.common.specification.SpecUtils;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;

public final class TaskSpecifications {
    private TaskSpecifications() {}

    public static Specification<Task> active() {
        return SpecUtils.notDeleted();
    }

    public static Specification<Task> deletedOnly() {
        return SpecUtils.onlyDeleted();
    }

    public static Specification<Task> statusEquals(TaskStatus status) {
        if (status == null) return null;
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<Task> assignedAgentIdEquals(UUID agentId) {
        if (agentId == null) return null;
        return (root, query, cb) -> cb.equal(root.get("assignedAgent").get("id"), agentId);
    }

    public static Specification<Task> search(String term) {
        return SpecUtils.searchAcross(term, (root, cb) -> root.get("title"));
    }
}
