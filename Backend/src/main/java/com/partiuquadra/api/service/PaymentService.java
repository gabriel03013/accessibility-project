package com.partiuquadra.api.service;

import com.partiuquadra.api.exception.ApiException;
import com.partiuquadra.api.dto.PaymentDtos;
import com.partiuquadra.api.model.PaymentEntity;
import com.partiuquadra.api.repository.PaymentRepository;
import com.partiuquadra.api.model.ReservationEntity;
import com.partiuquadra.api.repository.ReservationRepository;
import com.partiuquadra.api.model.ReservationStatus;

import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {

    private final PaymentRepository payments;
    private final ReservationRepository reservations;

    public PaymentService(
            PaymentRepository payments,
            ReservationRepository reservations) {
        this.payments = payments;
        this.reservations = reservations;
    }

    @Transactional
    public PaymentDtos.PaymentView pay(
            UUID payerId,
            PaymentDtos.PayRequest request) {
        PaymentEntity existing = payments
                .findByReservationId(request.reservationId())
                .orElse(null);
        if (existing != null) {
            if (!existing.getPayer().getId().equals(payerId)) {
                throw new ApiException(
                        HttpStatus.FORBIDDEN,
                        "PAYMENT_FORBIDDEN",
                        "Você não pode consultar este pagamento.");
            }
            return toView(existing);
        }

        ReservationEntity reservation = reservations.findWithRelationsById(request.reservationId())
                .orElseThrow(() -> notFound("Reserva não encontrada."));
        if (!reservation.getBookedBy().getId().equals(payerId)) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "PAYMENT_FORBIDDEN",
                    "Você não pode pagar esta reserva.");
        }
        if (reservation.getStatus() != ReservationStatus.AWAITING_PAYMENT) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "RESERVATION_NOT_PAYABLE",
                    "Esta reserva não está disponível para pagamento.");
        }

        PaymentEntity payment = new PaymentEntity();
        payment.setReservation(reservation);
        payment.setPayer(reservation.getBookedBy());
        payment.setAmount(reservation.getAmount());
        reservation.setStatus(ReservationStatus.CONFIRMED);
        payments.saveAndFlush(payment);
        return toView(payment);
    }

    private PaymentDtos.PaymentView toView(PaymentEntity payment) {
        return new PaymentDtos.PaymentView(
                payment.getId(),
                payment.getReservation().getId(),
                payment.getReservation().getCourt().getName(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getCreatedAt());
    }

    private ApiException notFound(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, "PAYMENT_NOT_FOUND", message);
    }
}
