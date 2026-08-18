package com.partiuquadra.api.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public final class CartDtos {

    private CartDtos() {
    }

    public record AddItemRequest(
            @NotNull UUID courtId,
            @NotNull Long sportId,
            @NotNull @Future Instant startsAt,
            @NotNull @Future Instant endsAt,
            @Min(1) @Max(200) short participants) {
    }

    public record ItemView(
            UUID id,
            UUID courtId,
            String courtName,
            String imageUrl,
            Long sportId,
            String sport,
            Instant startsAt,
            Instant endsAt,
            short participants,
            BigDecimal amount,
            String currency,
            Instant createdAt) {
    }
}
