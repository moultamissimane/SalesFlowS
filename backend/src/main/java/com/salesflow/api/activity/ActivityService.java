package com.salesflow.api.activity;

import com.salesflow.api.activity.dto.ActivityDtos.ActivityResponse;
import com.salesflow.api.security.CurrentUserService;
import com.salesflow.api.user.User;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final CurrentUserService currentUserService;

    @Transactional
    public Activity log(ActivityEntityType entityType, UUID entityId, String entityTitle,
                         ActivityType type, String title, String description, String outcome) {
        return log(entityType, entityId, entityTitle, type, title, description, outcome, currentUserService.entity());
    }

    @Transactional
    public Activity log(ActivityEntityType entityType, UUID entityId, String entityTitle,
                         ActivityType type, String title, String description, String outcome, User performedBy) {
        Activity activity = Activity.builder()
                .entityType(entityType)
                .entityId(entityId)
                .entityTitle(entityTitle)
                .type(type)
                .title(title)
                .description(description)
                .performedBy(performedBy)
                .outcome(outcome)
                .build();
        return activityRepository.save(activity);
    }

    public long countForEntity(ActivityEntityType entityType, UUID entityId) {
        return activityRepository.countByEntityTypeAndEntityId(entityType, entityId);
    }

    @Transactional(readOnly = true)
    public List<ActivityResponse> list(ActivityEntityType entityType, UUID entityId) {
        Sort sort = Sort.by(Sort.Direction.DESC, "performedAt");
        List<Activity> activities = (entityType != null && entityId != null)
                ? activityRepository.findByEntityTypeAndEntityId(entityType, entityId, sort)
                : activityRepository.findAll(sort).stream().limit(500).toList();
        return activities.stream().map(ActivityResponse::from).toList();
    }
}
