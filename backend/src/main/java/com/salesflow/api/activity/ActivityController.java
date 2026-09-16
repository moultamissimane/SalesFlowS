package com.salesflow.api.activity;

import com.salesflow.api.activity.dto.ActivityDtos.ActivityResponse;
import com.salesflow.api.activity.dto.ActivityDtos.CreateActivityRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/activities")
@RequiredArgsConstructor
@Tag(name = "Activities")
public class ActivityController {

    private final ActivityService activityService;

    /** With no filters, returns the most recent activities across all entities (used for the global timeline). */
    @GetMapping
    public List<ActivityResponse> list(
            @RequestParam(required = false) ActivityEntityType entityType,
            @RequestParam(required = false) UUID entityId) {
        return activityService.list(entityType, entityId);
    }

    @PostMapping
    public ResponseEntity<ActivityResponse> create(@Valid @RequestBody CreateActivityRequest request) {
        Activity activity = activityService.log(
                request.entityType(), request.entityId(), request.entityTitle(),
                request.type(), request.title(), request.description(), null);
        return ResponseEntity.ok(ActivityResponse.from(activity));
    }
}
