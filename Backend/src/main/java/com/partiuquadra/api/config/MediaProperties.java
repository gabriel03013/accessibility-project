package com.partiuquadra.api.config;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.nio.file.Path;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.media")
public record MediaProperties(
        @NotBlank String storageDirectory,
        @Min(1024) @Max(10_485_760) long maxFileSize,
        @Min(1) @Max(100_000_000) long maxPixels) {

    public Path storagePath() {
        return Path.of(storageDirectory).toAbsolutePath().normalize();
    }
}
