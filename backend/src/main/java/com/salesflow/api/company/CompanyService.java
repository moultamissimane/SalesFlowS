package com.salesflow.api.company;

import com.salesflow.api.audit.AuditAction;
import com.salesflow.api.audit.AuditLogService;
import com.salesflow.api.common.PageResponse;
import com.salesflow.api.common.exception.ResourceNotFoundException;
import com.salesflow.api.common.specification.SpecUtils;
import com.salesflow.api.company.dto.CompanyDtos.CompanyRequest;
import com.salesflow.api.company.dto.CompanyDtos.CompanyResponse;
import com.salesflow.api.contact.ContactRepository;
import com.salesflow.api.deal.DealRepository;
import com.salesflow.api.deal.PipelineStage;
import com.salesflow.api.security.CurrentUserService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private static final List<PipelineStage> CLOSED_STAGES = List.of(PipelineStage.WON, PipelineStage.LOST);

    private final CompanyRepository companyRepository;
    private final ContactRepository contactRepository;
    private final DealRepository dealRepository;
    private final AuditLogService auditLogService;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public PageResponse<CompanyResponse> list(Pageable pageable, String q, CompanyStatus status, String city) {
        var spec = SpecUtils.<Company>and(
                CompanySpecifications.active(),
                CompanySpecifications.search(q),
                CompanySpecifications.statusEquals(status),
                CompanySpecifications.cityEquals(city));
        Page<Company> page = companyRepository.findAll(spec, pageable);
        return PageResponse.of(page, page.getContent().stream().map(this::toResponse).toList());
    }

    @Transactional(readOnly = true)
    public CompanyResponse get(UUID id) {
        return toResponse(findActive(id));
    }

    @Transactional
    public CompanyResponse create(CompanyRequest request) {
        Company company = Company.builder()
                .name(request.name())
                .industry(request.industry())
                .website(request.website())
                .phone(request.phone())
                .city(request.city() != null ? request.city() : "Casablanca")
                .country(request.country() != null ? request.country() : "Morocco")
                .annualRevenue(request.annualRevenue() != null ? request.annualRevenue() : java.math.BigDecimal.ZERO)
                .employeeCount(request.employeeCount() != null ? request.employeeCount() : 1)
                .status(request.status() != null ? request.status() : CompanyStatus.ACTIVE)
                .build();
        companyRepository.save(company);
        auditLogService.record(AuditAction.CREATE, "COMPANY", company.getId().toString(), company.getName(),
                currentUserService.entity(), null, "Created company");
        return toResponse(company);
    }

    @Transactional
    public CompanyResponse update(UUID id, CompanyRequest request) {
        Company company = findActive(id);
        company.setName(request.name());
        company.setIndustry(request.industry());
        company.setWebsite(request.website());
        company.setPhone(request.phone());
        if (request.city() != null) company.setCity(request.city());
        if (request.country() != null) company.setCountry(request.country());
        if (request.annualRevenue() != null) company.setAnnualRevenue(request.annualRevenue());
        if (request.employeeCount() != null) company.setEmployeeCount(request.employeeCount());
        if (request.status() != null) company.setStatus(request.status());
        auditLogService.record(AuditAction.UPDATE, "COMPANY", company.getId().toString(), company.getName(),
                currentUserService.entity(), null, "Updated company details");
        return toResponse(company);
    }

    @Transactional
    public void softDelete(UUID id) {
        Company company = findActive(id);
        company.setDeletedAt(java.time.Instant.now());
        auditLogService.record(AuditAction.SOFT_DELETE, "COMPANY", company.getId().toString(), company.getName(),
                currentUserService.entity(), null, "Soft-deleted company (moved to Recycle Bin)");
    }

    private Company findActive(UUID id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Company", id));
        if (company.getDeletedAt() != null) {
            throw ResourceNotFoundException.of("Company", id);
        }
        return company;
    }

    private CompanyResponse toResponse(Company c) {
        long contactsCount = contactRepository.countByCompany_IdAndDeletedAtIsNull(c.getId());
        long activeDealsCount = dealRepository.countByCompany_IdAndDeletedAtIsNullAndStageNotIn(c.getId(), CLOSED_STAGES);
        return CompanyResponse.from(c, contactsCount, activeDealsCount);
    }
}
