package com.salesflow.api.contact;

import com.salesflow.api.common.PageResponse;
import com.salesflow.api.common.PageableFactory;
import com.salesflow.api.contact.dto.ContactDtos.ContactRequest;
import com.salesflow.api.contact.dto.ContactDtos.ContactResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
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
@RequestMapping("/api/v1/contacts")
@RequiredArgsConstructor
@Tag(name = "Contacts")
public class ContactController {

    private final ContactService contactService;

    @GetMapping
    public PageResponse<ContactResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) ContactStatus status,
            @RequestParam(required = false) UUID companyId) {
        return contactService.list(PageableFactory.of(page, size, sort), q, status, companyId);
    }

    @GetMapping("/{id}")
    public ContactResponse get(@PathVariable UUID id) {
        return contactService.get(id);
    }

    @PostMapping
    public ResponseEntity<ContactResponse> create(@Valid @RequestBody ContactRequest request) {
        return ResponseEntity.ok(contactService.create(request));
    }

    @PutMapping("/{id}")
    public ContactResponse update(@PathVariable UUID id, @Valid @RequestBody ContactRequest request) {
        return contactService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        contactService.softDelete(id);
        return ResponseEntity.noContent().build();
    }
}
