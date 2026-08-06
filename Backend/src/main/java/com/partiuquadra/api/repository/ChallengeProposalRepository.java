package com.partiuquadra.api.repository;

import com.partiuquadra.api.model.ChallengeProposalEntity;

import java.util.Optional;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChallengeProposalRepository
        extends JpaRepository<ChallengeProposalEntity, UUID> {

    Optional<ChallengeProposalEntity> findByIdAndChallengeId(UUID id, UUID challengeId);

    @EntityGraph(attributePaths = {"challenge", "proposedByTeam", "court"})
    List<ChallengeProposalEntity> findAllByChallengeIdOrderByCreatedAtDesc(UUID challengeId);
}
