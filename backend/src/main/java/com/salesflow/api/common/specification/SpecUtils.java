package com.salesflow.api.common.specification;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import java.time.Instant;
import org.springframework.data.jpa.domain.Specification;

/** Small helpers shared by every resource's Specification builder. */
public final class SpecUtils {

    private SpecUtils() {}

    public static <T> Specification<T> notDeleted() {
        return (root, query, cb) -> cb.isNull(root.get("deletedAt"));
    }

    public static <T> Specification<T> onlyDeleted() {
        return (root, query, cb) -> cb.isNotNull(root.get("deletedAt"));
    }

    /** Case-insensitive LIKE search across one or more text paths, OR-combined. */
    @SafeVarargs
    public static <T> Specification<T> searchAcross(String term, PathResolver<T>... paths) {
        if (term == null || term.isBlank()) {
            return null;
        }
        String pattern = "%" + term.toLowerCase() + "%";
        return (root, query, cb) -> {
            Predicate[] predicates = new Predicate[paths.length];
            for (int i = 0; i < paths.length; i++) {
                predicates[i] = cb.like(cb.lower(paths[i].resolve(root, cb)), pattern);
            }
            return cb.or(predicates);
        };
    }

    public interface PathResolver<T> {
        Path<String> resolve(jakarta.persistence.criteria.Root<T> root, CriteriaBuilder cb);
    }

    @SafeVarargs
    public static <T> Specification<T> and(Specification<T>... specs) {
        Specification<T> result = Specification.where(null);
        for (Specification<T> spec : specs) {
            if (spec != null) {
                result = result.and(spec);
            }
        }
        return result;
    }
}
