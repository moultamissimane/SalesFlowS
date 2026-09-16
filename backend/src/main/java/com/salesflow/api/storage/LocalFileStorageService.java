package com.salesflow.api.storage;

import com.salesflow.api.common.exception.BadRequestException;
import com.salesflow.api.common.exception.ResourceNotFoundException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
public class LocalFileStorageService implements FileStorageService {

    private final Path root;

    public LocalFileStorageService(@Value("${salesflow.storage.upload-dir}") String uploadDir) {
        this.root = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new IllegalStateException("Could not initialize upload directory: " + root, e);
        }
    }

    @Override
    public String store(MultipartFile file, String subDirectory) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded file is empty");
        }
        String originalName = Path.of(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file").getFileName().toString();
        String storageKey = subDirectory + "/" + UUID.randomUUID() + "-" + originalName;
        Path target = root.resolve(storageKey).normalize();

        if (!target.startsWith(root)) {
            throw new BadRequestException("Invalid file path");
        }

        try {
            Files.createDirectories(target.getParent());
            file.transferTo(target);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to store file " + originalName, e);
        }
        return storageKey;
    }

    @Override
    public Resource load(String storageKey) {
        try {
            Path file = root.resolve(storageKey).normalize();
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw ResourceNotFoundException.of("File", storageKey);
            }
            return resource;
        } catch (java.net.MalformedURLException e) {
            throw ResourceNotFoundException.of("File", storageKey);
        }
    }

    @Override
    public void delete(String storageKey) {
        try {
            Files.deleteIfExists(root.resolve(storageKey).normalize());
        } catch (IOException e) {
            log.warn("Failed to delete file {}: {}", storageKey, e.getMessage());
        }
    }
}
