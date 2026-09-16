package com.salesflow.api.company;

import com.salesflow.api.common.specification.SpecUtils;
import org.springframework.data.jpa.domain.Specification;

public final class CompanySpecifications {
    private CompanySpecifications() {}

    public static Specification<Company> active() {
        return SpecUtils.notDeleted();
    }

    public static Specification<Company> deletedOnly() {
        return SpecUtils.onlyDeleted();
    }

    public static Specification<Company> statusEquals(CompanyStatus status) {
        if (status == null) return null;
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<Company> cityEquals(String city) {
        if (city == null || city.isBlank()) return null;
        return (root, query, cb) -> cb.equal(cb.lower(root.get("city")), city.toLowerCase());
    }

    public static Specification<Company> search(String term) {
        return SpecUtils.searchAcross(term,
                (root, cb) -> root.get("name"),
                (root, cb) -> root.get("industry"),
                (root, cb) -> root.get("city"));
    }
}
