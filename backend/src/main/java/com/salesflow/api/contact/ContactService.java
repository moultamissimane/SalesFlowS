package com.salesflow.api.contact;

import com.salesflow.api.audit.AuditAction;
import com.salesflow.api.audit.AuditLogService;
import com.salesflow.api.activity.ActivityEntityType;
import com.salesflow.api.activity.ActivityService;
import com.salesflow.api.common.PageResponse;
import com.salesflow.api.common.exception.ResourceNotFoundException;
import com.salesflow.api.common.specification.SpecUtils;
import com.salesflow.api.company.Company;
import com.salesflow.api.company.CompanyRepository;
import com.salesflow.api.contact.dto.ContactDtos.ContactRequest;
import com.salesflow.api.contact.dto.ContactDtos.ContactResponse;
import com.salesflow.api.deal.DealRepository;
import com.salesflow.api.security.CurrentUserService;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ContactService {

    private final ContactRepository contactRepository;
    private final CompanyRepository companyRepository;
    private final DealRepository dealRepository;
    private final AuditLogService auditLogService;
    private final ActivityService activityService;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public PageResponse<ContactResponse> list(Pageable pageable, String q, ContactStatus status, UUID companyId) {
        var spec = SpecUtils.<Contact>and(
                ContactSpecifications.active(),
                ContactSpecifications.search(q),
                ContactSpecifications.statusEquals(status),
                ContactSpecifications.companyIdEquals(companyId));
        Page<Contact> page = contactRepository.findAll(spec, pageable);
        return PageResponse.of(page, page.getContent().stream().map(this::toResponse).toList());
    }

    @Transactional(readOnly = true)
    public ContactResponse get(UUID id) {
        return toResponse(findActive(id));
    }

    @Transactional
    public ContactResponse create(ContactRequest request) {
        Contact contact = Contact.builder()
                .company(resolveCompany(request.companyId()))
                .firstName(request.firstName())
                .lastName(request.lastName())
                .email(request.email())
                .phone(request.phone())
                .jobTitle(request.jobTitle())
                .avatarUrl(request.avatar())
                .status(request.status() != null ? request.status() : ContactStatus.ACTIVE)
                .build();
        contactRepository.save(contact);
        auditLogService.record(AuditAction.CREATE, "CONTACT", contact.getId().toString(),
                contact.getFirstName() + " " + contact.getLastName(), currentUserService.entity(), null, "Created contact");
        return toResponse(contact);
    }

    @Transactional
    public ContactResponse update(UUID id, ContactRequest request) {
        Contact contact = findActive(id);
        contact.setCompany(resolveCompany(request.companyId()));
        contact.setFirstName(request.firstName());
        contact.setLastName(request.lastName());
        contact.setEmail(request.email());
        contact.setPhone(request.phone());
        contact.setJobTitle(request.jobTitle());
        if (request.avatar() != null) contact.setAvatarUrl(request.avatar());
        if (request.status() != null) contact.setStatus(request.status());
        auditLogService.record(AuditAction.UPDATE, "CONTACT", contact.getId().toString(),
                contact.getFirstName() + " " + contact.getLastName(), currentUserService.entity(), null, "Updated contact details");
        return toResponse(contact);
    }

    @Transactional
    public void softDelete(UUID id) {
        Contact contact = findActive(id);
        contact.setDeletedAt(Instant.now());
        auditLogService.record(AuditAction.SOFT_DELETE, "CONTACT", contact.getId().toString(),
                contact.getFirstName() + " " + contact.getLastName(), currentUserService.entity(), null,
                "Soft-deleted contact (moved to Recycle Bin)");
    }

    private Company resolveCompany(UUID companyId) {
        if (companyId == null) return null;
        return companyRepository.findById(companyId)
                .orElseThrow(() -> ResourceNotFoundException.of("Company", companyId));
    }

    private Contact findActive(UUID id) {
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Contact", id));
        if (contact.getDeletedAt() != null) {
            throw ResourceNotFoundException.of("Contact", id);
        }
        return contact;
    }

    private ContactResponse toResponse(Contact c) {
        BigDecimal total = dealRepository.sumValueByContactId(c.getId());
        long notes = activityService.countForEntity(ActivityEntityType.CONTACT, c.getId());
        return ContactResponse.from(c, total, notes);
    }
}
