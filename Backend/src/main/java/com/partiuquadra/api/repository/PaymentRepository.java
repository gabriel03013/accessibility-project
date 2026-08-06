package com.partiuquadra.api.repository;

import com.partiuquadra.api.model.PaymentEntity;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<PaymentEntity, UUID> {

    @EntityGraph(attributePaths = {"reservation", "reservation.court", "payer"})
    Optional<PaymentEntity> findByReservationId(UUID reservationId);
}
