package com.salesflow.api.security;

import com.salesflow.api.common.exception.UnauthorizedException;
import com.salesflow.api.user.User;
import com.salesflow.api.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/** Resolves the fully-loaded {@link User} entity for the authenticated caller. */
@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserRepository userRepository;

    public UserPrincipal principal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal principal)) {
            throw new UnauthorizedException("No authenticated user in context");
        }
        return principal;
    }

    public User entity() {
        return userRepository.findByIdAndDeletedAtIsNull(principal().getId())
                .orElseThrow(() -> new UnauthorizedException("Authenticated user no longer exists"));
    }
}
