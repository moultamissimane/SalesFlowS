package com.salesflow.api.storage;

import java.io.InputStream;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

/**
 * Storage abstraction for uploaded files. {@link LocalFileStorageService} is the only
 * implementation today (writes to a local/volume-mounted directory); swapping in an
 * S3-backed implementation later only requires implementing this interface and switching
 * the active profile - no caller changes.
 */
public interface FileStorageService {

    /** Persists the file and returns an opaque storage key used to retrieve it later. */
    String store(MultipartFile file, String subDirectory);

    Resource load(String storageKey);

    void delete(String storageKey);
}
