package com.partiuquadra.api.dto;

public final class MediaDtos {

    private MediaDtos() {
    }

    public record UploadView(
            String storageKey,
            String publicUrl,
            String contentType,
            int width,
            int height) {
    }
}
