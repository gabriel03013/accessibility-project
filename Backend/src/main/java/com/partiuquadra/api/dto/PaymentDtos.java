package com.partiuquadra.api.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public final class PaymentDtos {

    private PaymentDtos() {
    }

    public record PayRequest(
            @NotNull UUID reservationId) {
    }

    public record PaymentView(
            UUID id,
            UUID reservationId,
            String courtName,
            BigDecimal amount,
            String currency,
            Instant paidAt) {
    }
}
