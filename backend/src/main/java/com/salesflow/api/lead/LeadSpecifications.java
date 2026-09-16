package com.salesflow.api.lead;

import com.salesflow.api.common.specification.SpecUtils;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;

public final class LeadSpecifications {
    private LeadSpecifications() {}

    public static Specification<Lead> active() {
        return SpecUtils.notDeleted();
    }

    public static Specification<Lead> deletedOnly() {
        return SpecUtils.onlyDeleted();
    }

    public static Specification<Lead> statusEquals(LeadStatus status) {
        if (status == null) return null;
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<Lead> sourceEquals(LeadSource source) {
        if (source == null) return null;
        return (root, query, cb) -> cb.equal(root.get("source"), source);
    }

    public static Specification<Lead> assignedAgentIdEquals(UUID agentId) {
        if (agentId == null) return null;
        return (root, query, cb) -> cb.equal(root.get("assignedAgent").get("id"), agentId);
    }

    public static Specification<Lead> search(String term) {
        return SpecUtils.searchAcross(term,
                (root, cb) -> root.get("title"),
                (root, cb) -> root.get("company"),
                (root, cb) -> root.get("contactName"));
    }
}
