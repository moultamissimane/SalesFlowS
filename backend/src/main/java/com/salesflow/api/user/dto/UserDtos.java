package com.salesflow.api.user.dto;

import com.salesflow.api.user.User;
import com.salesflow.api.user.UserRole;
import com.salesflow.api.user.UserStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public final class UserDtos {
    private UserDtos() {}

    public record UserSummary(
            UUID id,
            String name,
            String email,
            UserRole role,
            String avatar,
            String department,
            String location,
            BigDecimal quota,
            UserStatus status
    ) {
        public static UserSummary from(User u) {
            return new UserSummary(
                    u.getId(), u.getFullName(), u.getEmail(), u.getRole(),
                    u.getAvatarUrl(), u.getDepartment(), u.getLocation(),
                    u.getMonthlyQuota(), u.getStatus());
        }
    }

    public record UserResponse(
            UUID id,
            String name,
            String email,
            UserRole role,
            String avatar,
            String department,
            String location,
            BigDecimal quota,
            UserStatus status,
            Instant createdAt,
            Instant updatedAt
    ) {
        public static UserResponse from(User u) {
            return new UserResponse(
                    u.getId(), u.getFullName(), u.getEmail(), u.getRole(),
                    u.getAvatarUrl(), u.getDepartment(), u.getLocation(),
                    u.getMonthlyQuota(), u.getStatus(), u.getCreatedAt(), u.getUpdatedAt());
        }
    }
}
