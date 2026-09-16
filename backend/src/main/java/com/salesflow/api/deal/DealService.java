package com.salesflow.api.deal;

import com.salesflow.api.activity.ActivityEntityType;
import com.salesflow.api.activity.ActivityService;
import com.salesflow.api.activity.ActivityType;
import com.salesflow.api.audit.AuditAction;
import com.salesflow.api.audit.AuditLogService;
import com.salesflow.api.common.PageResponse;
import com.salesflow.api.common.exception.BadRequestException;
import com.salesflow.api.common.exception.ResourceNotFoundException;
import com.salesflow.api.common.specification.SpecUtils;
import com.salesflow.api.company.Company;
import com.salesflow.api.company.CompanyRepository;
import com.salesflow.api.contact.Contact;
import com.salesflow.api.contact.ContactRepository;
import com.salesflow.api.deal.dto.DealDtos.DealAttachmentResponse;
import com.salesflow.api.deal.dto.DealDtos.DealRequest;
import com.salesflow.api.deal.dto.DealDtos.DealResponse;
import com.salesflow.api.email.EmailService;
import com.salesflow.api.email.EmailTemplateType;
import com.salesflow.api.security.CurrentUserService;
import com.salesflow.api.storage.FileStorageService;
import com.salesflow.api.user.User;
import com.salesflow.api.user.UserRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class DealService {

    private final DealRepository dealRepository;
    private final DealAttachmentRepository dealAttachmentRepository;
    private final CompanyRepository companyRepository;
    private final ContactRepository contactRepository;
    private final UserRepository userRepository;
    private final ActivityService activityService;
    private final AuditLogService auditLogService;
    private final CurrentUserService currentUserService;
    private final EmailService emailService;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public PageResponse<DealResponse> list(Pageable pageable, String q, PipelineStage stage, DealPriority priority,
                                            UUID agentId, UUID companyId, BigDecimal minValue, BigDecimal maxValue) {
        var spec = SpecUtils.<Deal>and(
                DealSpecifications.active(),
                DealSpecifications.search(q),
                DealSpecifications.stageEquals(stage),
                DealSpecifications.priorityEquals(priority),
                DealSpecifications.assignedAgentIdEquals(agentId),
                DealSpecifications.companyIdEquals(companyId),
                DealSpecifications.minValue(minValue),
                DealSpecifications.maxValue(maxValue));
        Page<Deal> page = dealRepository.findAll(spec, pageable);
        return PageResponse.of(page, page.getContent().stream().map(this::toResponse).toList());
    }

    @Transactional(readOnly = true)
    public DealResponse get(UUID id) {
        return toResponse(findActive(id));
    }

    @Transactional
    public DealResponse create(DealRequest request) {
        Deal deal = Deal.builder()
                .title(request.title())
                .company(resolveCompany(request.companyId()))
                .contact(resolveContact(request.contactId()))
                .value(request.value())
                .currency(request.currency() != null ? request.currency() : Currency.MAD)
                .stage(request.stage() != null ? request.stage() : PipelineStage.NEW_LEAD)
                .probability((request.stage() != null ? request.stage() : PipelineStage.NEW_LEAD).defaultProbability())
                .expectedCloseDate(request.expectedCloseDate())
                .assignedAgent(resolveAgent(request.assignedAgentId()))
                .priority(request.priority() != null ? request.priority() : DealPriority.MEDIUM)
                .tags(request.tags() != null ? new java.util.ArrayList<>(request.tags()) : new java.util.ArrayList<>())
                .build();
        dealRepository.save(deal);
        auditLogService.record(AuditAction.CREATE, "DEAL", deal.getId().toString(), deal.getTitle(),
                currentUserService.entity(), null, "Created deal valued at " + deal.getValue() + " " + deal.getCurrency());
        return toResponse(deal);
    }

    @Transactional
    public DealResponse update(UUID id, DealRequest request) {
        Deal deal = findActive(id);
        deal.setTitle(request.title());
        deal.setCompany(resolveCompany(request.companyId()));
        deal.setContact(resolveContact(request.contactId()));
        deal.setValue(request.value());
        if (request.currency() != null) deal.setCurrency(request.currency());
        deal.setExpectedCloseDate(request.expectedCloseDate());
        deal.setAssignedAgent(resolveAgent(request.assignedAgentId()));
        if (request.priority() != null) deal.setPriority(request.priority());
        if (request.tags() != null) deal.setTags(new java.util.ArrayList<>(request.tags()));
        deal.setUpdatedAt(Instant.now());
        auditLogService.record(AuditAction.UPDATE, "DEAL", deal.getId().toString(), deal.getTitle(),
                currentUserService.entity(), null, "Updated deal metadata & details");
        return toResponse(deal);
    }

    @Transactional
    public DealResponse updateStage(UUID id, PipelineStage newStage, String reason) {
        Deal deal = findActive(id);
        PipelineStage oldStage = deal.getStage();
        if (oldStage == newStage) {
            return toResponse(deal);
        }

        deal.setStage(newStage);
        deal.setProbability(newStage.defaultProbability());
        if (reason != null && !reason.isBlank()) {
            deal.setWonLostReason(reason);
        }
        deal.setLastActivityDate(Instant.now());

        User actor = currentUserService.entity();

        activityService.log(ActivityEntityType.DEAL, deal.getId(), deal.getTitle(), ActivityType.STAGE_CHANGE,
                newStage == PipelineStage.WON ? "Deal Won!" : "Moved to " + newStage.name().replace('_', ' '),
                reason != null ? "Reason: " + reason : "Stage updated from " + oldStage + " to " + newStage,
                "Probability updated to " + deal.getProbability() + "%", actor);

        auditLogService.record(AuditAction.STAGE_CHANGE, "DEAL", deal.getId().toString(), deal.getTitle(), actor, null,
                "Updated pipeline stage " + oldStage + " -> " + newStage + (reason != null ? " (Reason: " + reason + ")" : ""));

        if (newStage == PipelineStage.WON && deal.getContact() != null) {
            emailService.send(deal.getContact().getEmail(), deal.getContact().getFirstName(),
                    "Partnership Confirmed: " + deal.getTitle(),
                    EmailTemplateType.DEAL_WON,
                    "Dear " + deal.getContact().getFirstName() + ", we are thrilled to confirm our agreement for \""
                            + deal.getTitle() + "\". Our team will be in touch to begin onboarding.");
        }

        return toResponse(deal);
    }

    @Transactional
    public void softDelete(UUID id) {
        Deal deal = findActive(id);
        deal.setDeletedAt(Instant.now());
        auditLogService.record(AuditAction.SOFT_DELETE, "DEAL", deal.getId().toString(), deal.getTitle(),
                currentUserService.entity(), null, "Soft-deleted deal (moved to Recycle Bin)");
    }

    @Transactional
    public DealAttachmentResponse uploadAttachment(UUID dealId, MultipartFile file) {
        Deal deal = findActive(dealId);
        String storageKey = fileStorageService.store(file, "deals/" + dealId);

        DealAttachment attachment = DealAttachment.builder()
                .deal(deal)
                .fileName(file.getOriginalFilename())
                .fileSize(file.getSize())
                .fileType(file.getContentType())
                .storageKey(storageKey)
                .uploadedBy(currentUserService.entity())
                .build();
        dealAttachmentRepository.save(attachment);
        deal.setUpdatedAt(Instant.now());

        auditLogService.record(AuditAction.FILE_UPLOAD, "FILE", attachment.getId().toString(), attachment.getFileName(),
                currentUserService.entity(), null, "Uploaded file to deal #" + dealId);

        return DealAttachmentResponse.from(attachment);
    }

    @Transactional
    public void deleteAttachment(UUID dealId, UUID attachmentId) {
        DealAttachment attachment = dealAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> ResourceNotFoundException.of("Attachment", attachmentId));
        if (!attachment.getDeal().getId().equals(dealId)) {
            throw new BadRequestException("Attachment does not belong to this deal");
        }
        fileStorageService.delete(attachment.getStorageKey());
        dealAttachmentRepository.delete(attachment);
    }

    @Transactional(readOnly = true)
    public DownloadableFile downloadAttachment(UUID dealId, UUID attachmentId) {
        DealAttachment attachment = dealAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> ResourceNotFoundException.of("Attachment", attachmentId));
        if (!attachment.getDeal().getId().equals(dealId)) {
            throw new BadRequestException("Attachment does not belong to this deal");
        }
        Resource resource = fileStorageService.load(attachment.getStorageKey());
        return new DownloadableFile(resource, attachment.getFileName(), attachment.getFileType());
    }

    public record DownloadableFile(Resource resource, String fileName, String contentType) {}

    private Company resolveCompany(UUID companyId) {
        return companyRepository.findById(companyId)
                .orElseThrow(() -> ResourceNotFoundException.of("Company", companyId));
    }

    private Contact resolveContact(UUID contactId) {
        if (contactId == null) return null;
        return contactRepository.findById(contactId).orElseThrow(() -> ResourceNotFoundException.of("Contact", contactId));
    }

    private User resolveAgent(UUID agentId) {
        if (agentId == null) return null;
        return userRepository.findById(agentId).orElse(null);
    }

    private Deal findActive(UUID id) {
        Deal deal = dealRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Deal", id));
        if (deal.getDeletedAt() != null) {
            throw ResourceNotFoundException.of("Deal", id);
        }
        return deal;
    }

    private DealResponse toResponse(Deal deal) {
        long notes = activityService.countForEntity(ActivityEntityType.DEAL, deal.getId());
        return DealResponse.from(deal, notes);
    }
}
