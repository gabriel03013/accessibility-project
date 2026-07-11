package com.partiuquadra.api.model;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class ConversationParticipantId implements Serializable {

    private UUID conversation;
    private UUID user;

    public ConversationParticipantId() {
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof ConversationParticipantId that)) {
            return false;
        }
        return Objects.equals(conversation, that.conversation)
                && Objects.equals(user, that.user);
    }

    @Override
    public int hashCode() {
        return Objects.hash(conversation, user);
    }
}

