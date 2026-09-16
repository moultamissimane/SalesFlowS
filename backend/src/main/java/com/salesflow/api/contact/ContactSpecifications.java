package com.salesflow.api.contact;

import com.salesflow.api.common.specification.SpecUtils;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;

public final class ContactSpecifications {
    private ContactSpecifications() {}

    public static Specification<Contact> active() {
        return SpecUtils.notDeleted();
    }

    public static Specification<Contact> deletedOnly() {
        return SpecUtils.onlyDeleted();
    }

    public static Specification<Contact> statusEquals(ContactStatus status) {
        if (status == null) return null;
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<Contact> companyIdEquals(UUID companyId) {
        if (companyId == null) return null;
        return (root, query, cb) -> cb.equal(root.get("company").get("id"), companyId);
    }

    public static Specification<Contact> search(String term) {
        if (term == null || term.isBlank()) return null;
        String pattern = "%" + term.toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("firstName")), pattern),
                cb.like(cb.lower(root.get("lastName")), pattern),
                cb.like(cb.lower(root.get("email")), pattern));
    }
}
