package com.salesflow.api.auth.dto;

import com.salesflow.api.user.dto.UserDtos.UserSummary;

public record AuthResponse(
        String tokenType,
        String accessToken,
        long expiresIn,
        UserSummary user
) {
    public static AuthResponse of(String accessToken, long expiresIn, UserSummary user) {
        return new AuthResponse("Bearer", accessToken, expiresIn, user);
    }
}
