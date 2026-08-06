package com.partiuquadra.api.service;

import com.partiuquadra.api.dto.PaymentDtos;
import com.partiuquadra.api.model.CourtEntity;
import com.partiuquadra.api.model.PaymentEntity;
import com.partiuquadra.api.repository.PaymentRepository;
import com.partiuquadra.api.model.ReservationEntity;
import com.partiuquadra.api.repository.ReservationRepository;
import com.partiuquadra.api.model.ReservationStatus;
import com.partiuquadra.api.model.UserEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class PaymentServiceTest {

    @Test
    void confirmsReservationImmediately() {
        PaymentRepository payments = mock(PaymentRepository.class);
        ReservationRepository reservations = mock(ReservationRepository.class);
        PaymentService service = new PaymentService(payments, reservations);

        UUID payerId = UUID.randomUUID();
        UUID reservationId = UUID.randomUUID();
        UserEntity payer = new UserEntity();
        ReflectionTestUtils.setField(payer, "id", payerId);
        ReservationEntity reservation = new ReservationEntity();
        ReflectionTestUtils.setField(reservation, "id", reservationId);
        reservation.setBookedBy(payer);
        reservation.setAmount(new BigDecimal("120.00"));
        CourtEntity court = new CourtEntity();
        court.setName("Arena do Vale");
        reservation.setCourt(court);

        when(payments.findByReservationId(reservationId))
                .thenReturn(Optional.empty());
        when(reservations.findWithRelationsById(reservationId))
                .thenReturn(Optional.of(reservation));

        PaymentDtos.PayRequest request = new PaymentDtos.PayRequest(reservationId);

        PaymentDtos.PaymentView payment = service.pay(payerId, request);

        assertThat(reservation.getStatus()).isEqualTo(ReservationStatus.CONFIRMED);
        assertThat(payment.reservationId()).isEqualTo(reservationId);
        assertThat(payment.amount()).isEqualByComparingTo("120.00");
        verify(payments).saveAndFlush(
                org.mockito.ArgumentMatchers.any(PaymentEntity.class));
    }
}
