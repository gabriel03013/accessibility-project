package com.partiuquadra.api.repository;

import com.partiuquadra.api.model.ReservationEntity;
import com.partiuquadra.api.model.ReservationStatus;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReservationRepository extends JpaRepository<ReservationEntity, UUID> {

    @EntityGraph(attributePaths = {"court", "sport", "bookedBy", "team"})
    Optional<ReservationEntity> findWithRelationsById(UUID id);

    @EntityGraph(attributePaths = {"court", "sport", "bookedBy", "team"})
    Page<ReservationEntity> findAllByBookedByIdOrderByStartsAtDesc(
            UUID userId,
            Pageable pageable);

    @EntityGraph(attributePaths = {"court", "sport", "bookedBy", "team"})
    Page<ReservationEntity> findAllByCourtOwnerIdOrderByStartsAtDesc(
            UUID ownerId,
            Pageable pageable);

    @Query("""
            select count(reservation) > 0
            from ReservationEntity reservation
            where reservation.court.id = :courtId
              and reservation.status in :statuses
              and reservation.startsAt < :endsAt
              and reservation.endsAt > :startsAt
            """)
    boolean existsOverlap(
            @Param("courtId") UUID courtId,
            @Param("startsAt") Instant startsAt,
            @Param("endsAt") Instant endsAt,
            @Param("statuses") List<ReservationStatus> statuses);
}
