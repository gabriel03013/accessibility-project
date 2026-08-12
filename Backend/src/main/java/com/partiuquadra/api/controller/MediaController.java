package com.partiuquadra.api.controller;

import com.partiuquadra.api.dto.MediaDtos;
import com.partiuquadra.api.integration.ImageStorageService;

import java.util.concurrent.TimeUnit;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/media/images")
public class MediaController {

    private final ImageStorageService imageStorage;

    public MediaController(ImageStorageService imageStorage) {
        this.imageStorage = imageStorage;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    MediaDtos.UploadView upload(@RequestPart("file") MultipartFile file) {
        return imageStorage.store(file);
    }

    @GetMapping("/{storageKey}")
    ResponseEntity<org.springframework.core.io.Resource> get(
            @PathVariable String storageKey) {
        ImageStorageService.StoredImage image = imageStorage.load(storageKey);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic().immutable())
                .contentType(MediaType.parseMediaType(image.contentType()))
                .header("X-Content-Type-Options", "nosniff")
                .body(image.resource());
    }
}
