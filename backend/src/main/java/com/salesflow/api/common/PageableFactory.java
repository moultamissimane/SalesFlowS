package com.salesflow.api.common;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public final class PageableFactory {
    private PageableFactory() {}

    /** sort format: "field,dir" e.g. "value,desc". Falls back to createdAt,desc if malformed. */
    public static Pageable of(int page, int size, String sort) {
        Sort resolved = Sort.by(Sort.Direction.DESC, "createdAt");
        if (sort != null && sort.contains(",")) {
            String[] parts = sort.split(",", 2);
            try {
                Sort.Direction dir = Sort.Direction.fromString(parts[1]);
                resolved = Sort.by(dir, parts[0]);
            } catch (IllegalArgumentException ignored) {
                // keep default
            }
        }
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), resolved);
    }
}
