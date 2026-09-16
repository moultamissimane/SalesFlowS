package com.salesflow.api.email;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final EmailNotificationRepository emailNotificationRepository;

    @Value("${salesflow.mail.from}")
    private String fromAddress;

    @Async("emailTaskExecutor")
    @Transactional
    public void send(String recipientEmail, String recipientName, String subject,
                      EmailTemplateType templateType, String content) {
        EmailStatus status;
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(recipientEmail);
            helper.setSubject(subject);
            helper.setText(content, false);
            mailSender.send(message);
            status = EmailStatus.DELIVERED;
        } catch (MailException | jakarta.mail.MessagingException e) {
            log.warn("Failed to send email to {}: {}", recipientEmail, e.getMessage());
            status = EmailStatus.FAILED;
        }

        EmailNotification record = EmailNotification.builder()
                .recipientEmail(recipientEmail)
                .recipientName(recipientName)
                .subject(subject)
                .templateType(templateType)
                .content(content)
                .status(status)
                .build();
        emailNotificationRepository.save(record);
    }
}
