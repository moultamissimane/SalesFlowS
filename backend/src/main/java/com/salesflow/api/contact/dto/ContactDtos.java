package com.salesflow.api.contact.dto;

import com.salesflow.api.contact.Contact;
import com.salesflow.api.contact.ContactStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public final class ContactDtos {
    private ContactDtos() {}

    public record ContactResponse(
            UUID id, UUID companyId, String companyName,
            String firstName, String lastName, String email, String phone, String jobTitle, String avatar,
            ContactStatus status, BigDecimal totalDealValue, long notesCount,
            Instant createdAt, Instant updatedAt, Instant deletedAt
    ) {
        public static ContactResponse from(Contact c, BigDecimal totalDealValue, long notesCount) {
            return new ContactResponse(
                    c.getId(),
                    c.getCompany() != null ? c.getCompany().getId() : null,
                    c.getCompany() != null ? c.getCompany().getName() : "",
                    c.getFirstName(), c.getLastName(), c.getEmail(),
                    orEmpty(c.getPhone()), orEmpty(c.getJobTitle()), orEmpty(c.getAvatarUrl()),
                    c.getStatus(), totalDealValue, notesCount,
                    c.getCreatedAt(), c.getUpdatedAt(), c.getDeletedAt());
        }

        private static String orEmpty(String value) {
            return value != null ? value : "";
        }
    }

    public record ContactRequest(
            UUID companyId,
            @NotBlank String firstName,
            @NotBlank String lastName,
            @NotBlank @Email String email,
            String phone,
            String jobTitle,
            String avatar,
            ContactStatus status
    ) {}
}
