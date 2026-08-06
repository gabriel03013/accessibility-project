package com.partiuquadra.api.repository;

import com.partiuquadra.api.model.ConversationEntity;
import com.partiuquadra.api.model.ConversationParticipantEntity;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ConversationRepository extends JpaRepository<ConversationEntity, UUID> {

    Optional<ConversationEntity> findByRentalRequestId(UUID rentalRequestId);

    Optional<ConversationEntity> findByChallengeId(UUID challengeId);

    @EntityGraph(attributePaths = {"court", "rentalRequest", "challenge"})
    @Query("""
            select participant.conversation
            from ConversationParticipantEntity participant
            where participant.user.id = :userId
            order by participant.conversation.createdAt desc
            """)
    Page<ConversationEntity> findAllForUser(@Param("userId") UUID userId, Pageable pageable);
}

