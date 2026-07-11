package com.partiuquadra.api.repository;

import com.partiuquadra.api.model.RentalRequestEntity;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RentalRequestRepository extends JpaRepository<RentalRequestEntity, UUID> {

    @EntityGraph(attributePaths = {"court", "court.owner", "sport", "requester", "team"})
    Optional<RentalRequestEntity> findWithRelationsById(UUID id);

    @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"court", "court.owner", "sport", "requester", "team"})
    @Query("select request from RentalRequestEntity request where request.id = :id")
    Optional<RentalRequestEntity> findLockedWithRelationsById(@Param("id") UUID id);

    @EntityGraph(attributePaths = {"court", "sport", "requester", "team"})
    Page<RentalRequestEntity> findAllByRequesterIdOrderByCreatedAtDesc(
            UUID requesterId,
            Pageable pageable);

    @EntityGraph(attributePaths = {"court", "sport", "requester", "team"})
    Page<RentalRequestEntity> findAllByCourtOwnerIdOrderByCreatedAtDesc(
            UUID ownerId,
            Pageable pageable);
}
