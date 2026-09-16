package com.salesflow.api.common.exception;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record ApiError(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        List<FieldViolation> fieldErrors
) {
    public record FieldViolation(String field, String message) {}

    public static ApiError of(int status, String error, String message, String path) {
        return new ApiError(Instant.now(), status, error, message, path, List.of());
    }

    public static ApiError ofFieldErrors(int status, String error, String path, Map<String, String> errors) {
        return new ApiError(
                Instant.now(), status, error, "Validation failed", path,
                errors.entrySet().stream().map(e -> new FieldViolation(e.getKey(), e.getValue())).toList());
    }
}
