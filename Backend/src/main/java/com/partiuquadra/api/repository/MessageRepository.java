package com.partiuquadra.api.repository;

import com.partiuquadra.api.model.MessageEntity;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageRepository extends JpaRepository<MessageEntity, UUID> {

    @EntityGraph(attributePaths = "sender")
    Page<MessageEntity> findAllByConversationIdOrderBySentAtDesc(
            UUID conversationId,
            Pageable pageable);

    boolean existsByConversationIdAndSenderIdNot(
            UUID conversationId,
            UUID senderId);

    boolean existsByConversationIdAndSenderIdNotAndSentAtAfter(
            UUID conversationId,
            UUID senderId,
            java.time.Instant sentAt);
}
