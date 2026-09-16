package com.salesflow.api.user;

import com.salesflow.api.security.CurrentUserService;
import com.salesflow.api.user.dto.UserDtos.UserResponse;
import com.salesflow.api.user.dto.UserDtos.UserSummary;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users")
public class UserController {

    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;

    @GetMapping
    public List<UserSummary> list() {
        return userRepository.findAll().stream()
                .filter(u -> u.getDeletedAt() == null)
                .map(UserSummary::from)
                .toList();
    }

    @GetMapping("/me")
    public UserResponse me() {
        return UserResponse.from(currentUserService.entity());
    }
}
