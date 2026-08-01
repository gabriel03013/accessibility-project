package com.partiuquadra.api.dto;

import com.partiuquadra.api.model.RentalProposalStatus;
import com.partiuquadra.api.model.RentalRequestStatus;
import com.partiuquadra.api.model.ReservationStatus;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public final class BookingDtos {

    private BookingDtos() {
    }

    public record CreateRequest(
            @NotNull UUID courtId,
            @NotNull Long sportId,
            UUID teamId,
            @NotNull @Future Instant startsAt,
            @NotNull @Future Instant endsAt,
            @Min(1) @Max(200) short participants,
            @Size(max = 1000) String message) {
    }

    public record CounterRequest(
            @NotNull @Future Instant startsAt,
            @NotNull @Future Instant endsAt,
            @NotNull @DecimalMin("0.00") BigDecimal amount,
            @Size(max = 500) String message) {
    }

    public record RejectRequest(@Size(max = 500) String reason) {
    }

    public record RentalRequestView(
            UUID id,
            UUID courtId,
            String courtName,
            String sport,
            UUID requesterId,
            String requesterName,
            UUID teamId,
            Instant startsAt,
            Instant endsAt,
            short participants,
            String message,
            BigDecimal amount,
            String currency,
            RentalRequestStatus status,
            Instant expiresAt,
            Instant createdAt) {
    }

    public record ProposalView(
            UUID id,
            UUID rentalRequestId,
            Instant startsAt,
            Instant endsAt,
            BigDecimal amount,
            String message,
            RentalProposalStatus status) {
    }

    public record ReservationView(
            UUID id,
            UUID rentalRequestId,
            UUID courtId,
            String courtName,
            String sport,
            String confirmationCode,
            Instant startsAt,
            Instant endsAt,
            BigDecimal amount,
            String currency,
            ReservationStatus status,
            Instant createdAt) {
    }
}

