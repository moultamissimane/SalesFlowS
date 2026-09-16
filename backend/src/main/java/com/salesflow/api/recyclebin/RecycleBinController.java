package com.salesflow.api.recyclebin;

import com.salesflow.api.recyclebin.RecycleBinService.TrashItem;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Tag(name = "Recycle Bin")
public class RecycleBinController {

    private final RecycleBinService recycleBinService;

    @GetMapping("/api/v1/recycle-bin")
    public List<TrashItem> list() {
        return recycleBinService.list();
    }

    @PostMapping("/api/v1/recycle-bin/{type}/{id}/restore")
    public ResponseEntity<Void> restore(@PathVariable TrashEntityType type, @PathVariable UUID id) {
        recycleBinService.restore(type, id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/api/v1/admin/purge/{type}/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> purge(@PathVariable TrashEntityType type, @PathVariable UUID id) {
        recycleBinService.purge(type, id);
        return ResponseEntity.noContent().build();
    }
}
