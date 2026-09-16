package com.salesflow.api.lead;

import com.salesflow.api.audit.AuditAction;
import com.salesflow.api.audit.AuditLogService;
import com.salesflow.api.common.PageResponse;
import com.salesflow.api.common.exception.ResourceNotFoundException;
import com.salesflow.api.common.specification.SpecUtils;
import com.salesflow.api.company.Company;
import com.salesflow.api.company.CompanyRepository;
import com.salesflow.api.company.CompanyStatus;
import com.salesflow.api.contact.Contact;
import com.salesflow.api.contact.ContactRepository;
import com.salesflow.api.contact.ContactStatus;
import com.salesflow.api.deal.Deal;
import com.salesflow.api.deal.DealPriority;
import com.salesflow.api.deal.DealRepository;
import com.salesflow.api.deal.PipelineStage;
import com.salesflow.api.lead.dto.LeadDtos.ConvertToDealRequest;
import com.salesflow.api.lead.dto.LeadDtos.LeadRequest;
import com.salesflow.api.lead.dto.LeadDtos.LeadResponse;
import com.salesflow.api.security.CurrentUserService;
import com.salesflow.api.user.User;
import com.salesflow.api.user.UserRepository;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LeadService {

    private final LeadRepository leadRepository;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final ContactRepository contactRepository;
    private final DealRepository dealRepository;
    private final AuditLogService auditLogService;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public PageResponse<LeadResponse> list(Pageable pageable, String q, LeadStatus status, LeadSource source, UUID agentId) {
        var spec = SpecUtils.<Lead>and(
                LeadSpecifications.active(),
                LeadSpecifications.search(q),
                LeadSpecifications.statusEquals(status),
                LeadSpecifications.sourceEquals(source),
                LeadSpecifications.assignedAgentIdEquals(agentId));
        Page<Lead> page = leadRepository.findAll(spec, pageable);
        return PageResponse.of(page, page.getContent().stream().map(LeadResponse::from).toList());
    }

    @Transactional(readOnly = true)
    public LeadResponse get(UUID id) {
        return LeadResponse.from(findActive(id));
    }

    @Transactional
    public LeadResponse create(LeadRequest request) {
        Lead lead = Lead.builder()
                .title(request.title())
                .company(request.company())
                .contactName(request.contactName())
                .email(request.email())
                .phone(request.phone())
                .source(request.source())
                .score(request.score() != null ? request.score() : 50)
                .status(request.status() != null ? request.status() : LeadStatus.NEW)
                .estimatedValue(request.estimatedValue())
                .assignedAgent(resolveAgent(request.assignedAgentId()))
                .city(request.city())
                .build();
        leadRepository.save(lead);
        auditLogService.record(AuditAction.CREATE, "LEAD", lead.getId().toString(), lead.getTitle(),
                currentUserService.entity(), null, "Created lead, score " + lead.getScore() + "/100");
        return LeadResponse.from(lead);
    }

    @Transactional
    public LeadResponse update(UUID id, LeadRequest request) {
        Lead lead = findActive(id);
        lead.setTitle(request.title());
        lead.setCompany(request.company());
        lead.setContactName(request.contactName());
        lead.setEmail(request.email());
        lead.setPhone(request.phone());
        lead.setSource(request.source());
        if (request.score() != null) lead.setScore(request.score());
        if (request.status() != null) lead.setStatus(request.status());
        if (request.estimatedValue() != null) lead.setEstimatedValue(request.estimatedValue());
        lead.setAssignedAgent(resolveAgent(request.assignedAgentId()));
        lead.setCity(request.city());
        auditLogService.record(AuditAction.UPDATE, "LEAD", lead.getId().toString(), lead.getTitle(),
                currentUserService.entity(), null, "Updated lead details");
        return LeadResponse.from(lead);
    }

    @Transactional
    public void softDelete(UUID id) {
        Lead lead = findActive(id);
        lead.setDeletedAt(Instant.now());
        auditLogService.record(AuditAction.SOFT_DELETE, "LEAD", lead.getId().toString(), lead.getTitle(),
                currentUserService.entity(), null, "Soft-deleted lead (moved to Recycle Bin)");
    }

    /** Converts a lead into a qualified Deal, auto-creating the Company/Contact if they don't exist yet. */
    @Transactional
    public UUID convertToDeal(UUID id, ConvertToDealRequest request) {
        Lead lead = findActive(id);

        Company company = (lead.getCompany() == null || lead.getCompany().isBlank())
                ? null
                : companyRepository.findAll(
                        (root, query, cb) -> cb.and(cb.equal(cb.lower(root.get("name")), lead.getCompany().toLowerCase()),
                                cb.isNull(root.get("deletedAt"))))
                    .stream().findFirst()
                    .orElseGet(() -> companyRepository.save(Company.builder()
                            .name(lead.getCompany())
                            .status(CompanyStatus.ACTIVE)
                            .build()));

        if (company == null) {
            company = companyRepository.save(Company.builder().name(lead.getTitle() + " (converted lead)").status(CompanyStatus.LEAD).build());
        }

        Contact contact = null;
        if (lead.getEmail() != null && !lead.getEmail().isBlank()) {
            final Company finalCompany = company;
            contact = contactRepository.findAll(
                    (root, query, cb) -> cb.and(cb.equal(cb.lower(root.get("email")), lead.getEmail().toLowerCase()),
                            cb.isNull(root.get("deletedAt"))))
                .stream().findFirst()
                .orElseGet(() -> {
                    String[] names = splitName(lead.getContactName());
                    return contactRepository.save(Contact.builder()
                            .company(finalCompany)
                            .firstName(names[0])
                            .lastName(names[1])
                            .email(lead.getEmail())
                            .phone(lead.getPhone())
                            .status(ContactStatus.ACTIVE)
                            .build());
                });
        }

        Deal deal = Deal.builder()
                .title(request.dealTitle())
                .company(company)
                .contact(contact)
                .value(request.dealValue())
                .stage(PipelineStage.QUALIFIED)
                .probability(PipelineStage.QUALIFIED.defaultProbability())
                .assignedAgent(lead.getAssignedAgent())
                .priority(DealPriority.MEDIUM)
                .tags(new java.util.ArrayList<>(java.util.List.of("Converted Lead", lead.getSource().name())))
                .build();
        dealRepository.save(deal);

        lead.setStatus(LeadStatus.QUALIFIED);

        auditLogService.record(AuditAction.UPDATE, "LEAD", lead.getId().toString(), lead.getTitle(),
                currentUserService.entity(), null, "Converted lead into Deal #" + deal.getId());

        return deal.getId();
    }

    private String[] splitName(String fullName) {
        if (fullName == null || fullName.isBlank()) return new String[]{"Unknown", "Contact"};
        String[] parts = fullName.trim().split("\\s+", 2);
        return parts.length == 2 ? parts : new String[]{parts[0], ""};
    }

    private User resolveAgent(UUID agentId) {
        if (agentId == null) return null;
        return userRepository.findById(agentId).orElse(null);
    }

    private Lead findActive(UUID id) {
        Lead lead = leadRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Lead", id));
        if (lead.getDeletedAt() != null) {
            throw ResourceNotFoundException.of("Lead", id);
        }
        return lead;
    }
}
