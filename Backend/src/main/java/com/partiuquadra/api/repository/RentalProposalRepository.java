package com.partiuquadra.api.repository;

import com.partiuquadra.api.model.RentalProposalEntity;

import java.util.Optional;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RentalProposalRepository extends JpaRepository<RentalProposalEntity, UUID> {

    Optional<RentalProposalEntity> findByIdAndRentalRequestId(UUID id, UUID rentalRequestId);

    List<RentalProposalEntity> findAllByRentalRequestIdOrderByCreatedAtDesc(UUID rentalRequestId);
}
