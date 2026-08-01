package com.partiuquadra.api.repository;

import com.partiuquadra.api.model.ConversationParticipantEntity;
import com.partiuquadra.api.model.ConversationParticipantId;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConversationParticipantRepository
        extends JpaRepository<ConversationParticipantEntity, ConversationParticipantId> {

    boolean existsByConversationIdAndUserId(UUID conversationId, UUID userId);

    Optional<ConversationParticipantEntity> findByConversationIdAndUserId(
            UUID conversationId,
            UUID userId);
}
