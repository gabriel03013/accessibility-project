package com.partiuquadra.api.dto;

import com.partiuquadra.api.model.CourtStatus;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class CourtDtos {

    private CourtDtos() {
    }

    public record CreateRequest(
            @NotBlank @Size(max = 120) String name,
            @NotBlank @Size(max = 3000) String description,
            @Size(max = 1500) String observation,
            @NotBlank @Size(max = 180) String addressLine,
            @NotBlank @Size(max = 20) String addressNumber,
            @Size(max = 100) String addressComplement,
            @NotBlank @Size(max = 100) String neighborhood,
            @NotBlank @Size(max = 100) String city,
            @NotBlank
            @Pattern(regexp = "^[A-Za-z]{2}$", message = "Use a sigla do estado com duas letras.")
            String state,
            @NotBlank @Size(max = 12) String postalCode,
            @NotBlank @Size(max = 60) String timezone,
            @Size(max = 30) List<@NotNull Long> amenityIds,
            @NotEmpty @Size(max = 12) List<@Valid SportInput> sports,
            @NotEmpty @Size(max = 20) List<@Valid PhotoInput> photos) {
    }

    public record SportInput(
            @NotNull Long sportId,
            @NotNull @DecimalMin("0.00") BigDecimal pricePerHour,
            @Min(30) @Max(720) short minDurationMinutes,
            @Min(1) @Max(200) Short maxParticipants) {
    }

    public record PhotoInput(
            @NotBlank @Size(max = 500) String storageKey,
            @NotBlank @Size(max = 1000) String publicUrl,
            @NotBlank @Size(max = 180) String altText,
            boolean cover) {
    }

    public record SportView(
            Long id,
            String slug,
            String name,
            BigDecimal pricePerHour,
            short minDurationMinutes,
            Short maxParticipants) {
    }

    public record PhotoView(
            UUID id,
            String url,
            String altText,
            boolean cover,
            short sortOrder) {
    }

    public record Summary(
            UUID id,
            String slug,
            String name,
            String city,
            String state,
            String neighborhood,
            BigDecimal startingPrice,
            BigDecimal averageRating,
            int reviewCount,
            PhotoView coverPhoto,
            List<String> sports) {
    }

    public record Detail(
            UUID id,
            String slug,
            String name,
            String description,
            String observation,
            String ownerName,
            AddressView address,
            CourtStatus status,
            BigDecimal averageRating,
            int reviewCount,
            List<AmenityView> amenities,
            List<SportView> sports,
            List<PhotoView> photos,
            Instant createdAt) {
    }

    public record AddressView(
            String addressLine,
            String addressNumber,
            String addressComplement,
            String neighborhood,
            String city,
            String state,
            String postalCode) {
    }

    public record AmenityView(
            Long id,
            String slug,
            String name) {
    }
}
