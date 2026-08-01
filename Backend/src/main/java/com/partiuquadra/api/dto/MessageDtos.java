package com.partiuquadra.api.dto;

import com.partiuquadra.api.model.ConversationType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

public final class MessageDtos {

    private MessageDtos() {
    }

    public record SendRequest(
            @NotBlank @Size(max = 4000) String body) {
    }

    public record ConversationView(
            UUID id,
            ConversationType type,
            UUID courtId,
            UUID rentalRequestId,
            UUID challengeId,
            String title,
            boolean unread,
            Instant createdAt) {
    }

    public record MessageView(
            UUID id,
            UUID conversationId,
            UUID senderId,
            String senderName,
            String body,
            Instant sentAt) {
    }
}
