package com.salesflow.api.email;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/emails")
@RequiredArgsConstructor
@Tag(name = "Emails")
public class EmailController {

    private final EmailService emailService;
    private final EmailNotificationRepository emailNotificationRepository;

    public record SendEmailRequest(
            @NotBlank @Email String recipientEmail,
            String recipientName,
            @NotBlank String subject,
            @NotNull EmailTemplateType templateType,
            @NotBlank String content
    ) {}

    public record EmailNotificationResponse(
            UUID id, String recipientEmail, String recipientName, String subject,
            EmailTemplateType templateType, Instant sentAt, EmailStatus status
    ) {
        static EmailNotificationResponse from(EmailNotification e) {
            return new EmailNotificationResponse(
                    e.getId(), e.getRecipientEmail(), e.getRecipientName(), e.getSubject(),
                    e.getTemplateType(), e.getSentAt(), e.getStatus());
        }
    }

    @PostMapping
    public ResponseEntity<Void> send(@Valid @RequestBody SendEmailRequest request) {
        emailService.send(request.recipientEmail(), request.recipientName(), request.subject(),
                request.templateType(), request.content());
        return ResponseEntity.accepted().build();
    }

    /** Admin-only: email bodies can carry sensitive one-time tokens (password resets), so this is not general-purpose. */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<EmailNotificationResponse> list() {
        return emailNotificationRepository.findAll(Sort.by(Sort.Direction.DESC, "sentAt")).stream()
                .filter(e -> e.getTemplateType() != EmailTemplateType.PASSWORD_RESET)
                .map(EmailNotificationResponse::from)
                .toList();
    }
}
