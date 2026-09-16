package com.salesflow.api.recyclebin;

import com.salesflow.api.audit.AuditAction;
import com.salesflow.api.audit.AuditLogRepository;
import com.salesflow.api.audit.AuditLogService;
import com.salesflow.api.common.exception.ResourceNotFoundException;
import com.salesflow.api.company.Company;
import com.salesflow.api.company.CompanyRepository;
import com.salesflow.api.company.CompanySpecifications;
import com.salesflow.api.contact.Contact;
import com.salesflow.api.contact.ContactRepository;
import com.salesflow.api.contact.ContactSpecifications;
import com.salesflow.api.deal.Deal;
import com.salesflow.api.deal.DealRepository;
import com.salesflow.api.deal.DealSpecifications;
import com.salesflow.api.lead.Lead;
import com.salesflow.api.lead.LeadRepository;
import com.salesflow.api.lead.LeadSpecifications;
import com.salesflow.api.security.CurrentUserService;
import com.salesflow.api.task.Task;
import com.salesflow.api.task.TaskRepository;
import com.salesflow.api.task.TaskSpecifications;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RecycleBinService {

    private final CompanyRepository companyRepository;
    private final ContactRepository contactRepository;
    private final LeadRepository leadRepository;
    private final DealRepository dealRepository;
    private final TaskRepository taskRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditLogService auditLogService;
    private final CurrentUserService currentUserService;

    public record TrashItem(String id, TrashEntityType type, String name, Instant deletedAt, String deletedBy) {}

    @Transactional(readOnly = true)
    public List<TrashItem> list() {
        List<TrashItem> items = new ArrayList<>();
        companyRepository.findAll(CompanySpecifications.deletedOnly())
                .forEach(c -> items.add(toItem(TrashEntityType.COMPANY, c.getId(), c.getName(), c.getDeletedAt())));
        contactRepository.findAll(ContactSpecifications.deletedOnly())
                .forEach(c -> items.add(toItem(TrashEntityType.CONTACT, c.getId(), c.getFirstName() + " " + c.getLastName(), c.getDeletedAt())));
        leadRepository.findAll(LeadSpecifications.deletedOnly())
                .forEach(l -> items.add(toItem(TrashEntityType.LEAD, l.getId(), l.getTitle(), l.getDeletedAt())));
        dealRepository.findAll(DealSpecifications.deletedOnly())
                .forEach(d -> items.add(toItem(TrashEntityType.DEAL, d.getId(), d.getTitle(), d.getDeletedAt())));
        taskRepository.findAll(TaskSpecifications.deletedOnly())
                .forEach(t -> items.add(toItem(TrashEntityType.TASK, t.getId(), t.getTitle(), t.getDeletedAt())));
        items.sort((a, b) -> b.deletedAt().compareTo(a.deletedAt()));
        return items;
    }

    @Transactional
    public void restore(TrashEntityType type, UUID id) {
        String name = switch (type) {
            case COMPANY -> restoreCompany(id);
            case CONTACT -> restoreContact(id);
            case LEAD -> restoreLead(id);
            case DEAL -> restoreDeal(id);
            case TASK -> restoreTask(id);
        };
        auditLogService.record(AuditAction.RESTORE, type.name(), id.toString(), name,
                currentUserService.entity(), null, "Restored soft-deleted " + type + " record");
    }

    @Transactional
    public void purge(TrashEntityType type, UUID id) {
        String name = switch (type) {
            case COMPANY -> { Company c = companyRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Company", id)); companyRepository.delete(c); yield c.getName(); }
            case CONTACT -> { Contact c = contactRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Contact", id)); contactRepository.delete(c); yield c.getFirstName() + " " + c.getLastName(); }
            case LEAD -> { Lead l = leadRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Lead", id)); leadRepository.delete(l); yield l.getTitle(); }
            case DEAL -> { Deal d = dealRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Deal", id)); dealRepository.delete(d); yield d.getTitle(); }
            case TASK -> { Task t = taskRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Task", id)); taskRepository.delete(t); yield t.getTitle(); }
        };
        auditLogService.record(AuditAction.PERMANENT_DELETE, type.name(), id.toString(), name,
                currentUserService.entity(), null, "Permanently purged " + type + " record from the database");
    }

    private String restoreCompany(UUID id) {
        Company c = companyRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Company", id));
        c.setDeletedAt(null);
        return c.getName();
    }

    private String restoreContact(UUID id) {
        Contact c = contactRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Contact", id));
        c.setDeletedAt(null);
        return c.getFirstName() + " " + c.getLastName();
    }

    private String restoreLead(UUID id) {
        Lead l = leadRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Lead", id));
        l.setDeletedAt(null);
        return l.getTitle();
    }

    private String restoreDeal(UUID id) {
        Deal d = dealRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Deal", id));
        d.setDeletedAt(null);
        return d.getTitle();
    }

    private String restoreTask(UUID id) {
        Task t = taskRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Task", id));
        t.setDeletedAt(null);
        return t.getTitle();
    }

    private TrashItem toItem(TrashEntityType type, UUID id, String name, Instant deletedAt) {
        String deletedBy = auditLogRepository
                .findFirstByEntityTypeAndEntityIdAndActionOrderByCreatedAtDesc(type.name(), id.toString(), AuditAction.SOFT_DELETE)
                .map(com.salesflow.api.audit.AuditLog::getUserName)
                .orElse("Unknown");
        return new TrashItem(id.toString(), type, name, deletedAt, deletedBy);
    }
}
