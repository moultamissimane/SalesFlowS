package com.salesflow.api.lead;

import com.salesflow.api.common.PageResponse;
import com.salesflow.api.common.PageableFactory;
import com.salesflow.api.lead.dto.LeadDtos.ConvertToDealRequest;
import com.salesflow.api.lead.dto.LeadDtos.LeadRequest;
import com.salesflow.api.lead.dto.LeadDtos.LeadResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/leads")
@RequiredArgsConstructor
@Tag(name = "Leads")
public class LeadController {

    private final LeadService leadService;

    @GetMapping
    public PageResponse<LeadResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) LeadStatus status,
            @RequestParam(required = false) LeadSource source,
            @RequestParam(required = false) UUID assignedAgentId) {
        return leadService.list(PageableFactory.of(page, size, sort), q, status, source, assignedAgentId);
    }

    @GetMapping("/{id}")
    public LeadResponse get(@PathVariable UUID id) {
        return leadService.get(id);
    }

    @PostMapping
    public ResponseEntity<LeadResponse> create(@Valid @RequestBody LeadRequest request) {
        return ResponseEntity.ok(leadService.create(request));
    }

    @PutMapping("/{id}")
    public LeadResponse update(@PathVariable UUID id, @Valid @RequestBody LeadRequest request) {
        return leadService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        leadService.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/convert-to-deal")
    public ResponseEntity<Map<String, UUID>> convertToDeal(@PathVariable UUID id, @Valid @RequestBody ConvertToDealRequest request) {
        UUID dealId = leadService.convertToDeal(id, request);
        return ResponseEntity.ok(Map.of("dealId", dealId));
    }
}
