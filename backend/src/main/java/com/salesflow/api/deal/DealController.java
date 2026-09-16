package com.salesflow.api.deal;

import com.salesflow.api.common.PageResponse;
import com.salesflow.api.common.PageableFactory;
import com.salesflow.api.deal.dto.DealDtos.DealAttachmentResponse;
import com.salesflow.api.deal.dto.DealDtos.DealRequest;
import com.salesflow.api.deal.dto.DealDtos.DealResponse;
import com.salesflow.api.deal.dto.DealDtos.StageChangeRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/deals")
@RequiredArgsConstructor
@Tag(name = "Deals")
public class DealController {

    private final DealService dealService;

    @GetMapping
    public PageResponse<DealResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) PipelineStage stage,
            @RequestParam(required = false) DealPriority priority,
            @RequestParam(required = false) UUID assignedAgentId,
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) BigDecimal minValue,
            @RequestParam(required = false) BigDecimal maxValue) {
        return dealService.list(PageableFactory.of(page, size, sort), q, stage, priority, assignedAgentId, companyId, minValue, maxValue);
    }

    @GetMapping("/{id}")
    public DealResponse get(@PathVariable UUID id) {
        return dealService.get(id);
    }

    @PostMapping
    public ResponseEntity<DealResponse> create(@Valid @RequestBody DealRequest request) {
        return ResponseEntity.ok(dealService.create(request));
    }

    @PutMapping("/{id}")
    public DealResponse update(@PathVariable UUID id, @Valid @RequestBody DealRequest request) {
        return dealService.update(id, request);
    }

    @PatchMapping("/{id}/stage")
    public DealResponse updateStage(@PathVariable UUID id, @Valid @RequestBody StageChangeRequest request) {
        return dealService.updateStage(id, request.stage(), request.wonLostReason());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        dealService.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DealAttachmentResponse> uploadAttachment(@PathVariable UUID id, @RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(dealService.uploadAttachment(id, file));
    }

    @DeleteMapping("/{id}/attachments/{attachmentId}")
    public ResponseEntity<Void> deleteAttachment(@PathVariable UUID id, @PathVariable UUID attachmentId) {
        dealService.deleteAttachment(id, attachmentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/attachments/{attachmentId}/download")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable UUID id, @PathVariable UUID attachmentId) {
        DealService.DownloadableFile file = dealService.downloadAttachment(id, attachmentId);
        MediaType mediaType = file.contentType() != null ? MediaType.parseMediaType(file.contentType()) : MediaType.APPLICATION_OCTET_STREAM;
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.fileName() + "\"")
                .body(file.resource());
    }
}
