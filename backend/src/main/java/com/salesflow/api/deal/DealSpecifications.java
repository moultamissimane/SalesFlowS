package com.salesflow.api.deal;

import com.salesflow.api.common.specification.SpecUtils;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;

public final class DealSpecifications {
    private DealSpecifications() {}

    public static Specification<Deal> active() {
        return SpecUtils.notDeleted();
    }

    public static Specification<Deal> deletedOnly() {
        return SpecUtils.onlyDeleted();
    }

    public static Specification<Deal> stageEquals(PipelineStage stage) {
        if (stage == null) return null;
        return (root, query, cb) -> cb.equal(root.get("stage"), stage);
    }

    public static Specification<Deal> priorityEquals(DealPriority priority) {
        if (priority == null) return null;
        return (root, query, cb) -> cb.equal(root.get("priority"), priority);
    }

    public static Specification<Deal> assignedAgentIdEquals(UUID agentId) {
        if (agentId == null) return null;
        return (root, query, cb) -> cb.equal(root.get("assignedAgent").get("id"), agentId);
    }

    public static Specification<Deal> companyIdEquals(UUID companyId) {
        if (companyId == null) return null;
        return (root, query, cb) -> cb.equal(root.get("company").get("id"), companyId);
    }

    public static Specification<Deal> minValue(BigDecimal min) {
        if (min == null) return null;
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("value"), min);
    }

    public static Specification<Deal> maxValue(BigDecimal max) {
        if (max == null) return null;
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("value"), max);
    }

    public static Specification<Deal> closingBefore(LocalDate date) {
        if (date == null) return null;
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("expectedCloseDate"), date);
    }

    public static Specification<Deal> search(String term) {
        return SpecUtils.searchAcross(term,
                (root, cb) -> root.get("title"),
                (root, cb) -> root.get("company").get("name"));
    }
}
