package com.partiuquadra.api.service;

import com.partiuquadra.api.exception.ApiException;
import com.partiuquadra.api.model.ConversationEntity;
import com.partiuquadra.api.model.ConversationParticipantEntity;
import com.partiuquadra.api.repository.ConversationParticipantRepository;
import com.partiuquadra.api.repository.ConversationRepository;
import com.partiuquadra.api.model.ConversationType;
import com.partiuquadra.api.dto.MessageDtos;
import com.partiuquadra.api.model.MessageEntity;
import com.partiuquadra.api.repository.MessageRepository;
import com.partiuquadra.api.model.RentalRequestEntity;
import com.partiuquadra.api.repository.RentalRequestRepository;
import com.partiuquadra.api.model.TeamChallengeEntity;
import com.partiuquadra.api.repository.TeamChallengeRepository;
import com.partiuquadra.api.model.TeamMemberEntity;
import com.partiuquadra.api.repository.TeamMemberRepository;
import com.partiuquadra.api.model.TeamMemberRole;
import com.partiuquadra.api.model.UserEntity;
import com.partiuquadra.api.repository.UserRepository;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;
import java.time.Instant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MessageService {

    private final ConversationRepository conversations;
    private final ConversationParticipantRepository participants;
    private final MessageRepository messages;
    private final RentalRequestRepository rentalRequests;
    private final TeamChallengeRepository challenges;
    private final TeamMemberRepository teamMembers;
    private final UserRepository users;

    public MessageService(
            ConversationRepository conversations,
            ConversationParticipantRepository participants,
            MessageRepository messages,
            RentalRequestRepository rentalRequests,
            TeamChallengeRepository challenges,
            TeamMemberRepository teamMembers,
            UserRepository users) {
        this.conversations = conversations;
        this.participants = participants;
        this.messages = messages;
        this.rentalRequests = rentalRequests;
        this.challenges = challenges;
        this.teamMembers = teamMembers;
        this.users = users;
    }

    @Transactional
    public MessageDtos.ConversationView forRentalRequest(UUID userId, UUID rentalRequestId) {
        ConversationEntity existing = conversations.findByRentalRequestId(rentalRequestId)
                .orElse(null);
        if (existing != null) {
            requireParticipant(existing.getId(), userId);
            return toConversationView(existing, userId);
        }
        RentalRequestEntity rentalRequest = rentalRequests.findWithRelationsById(rentalRequestId)
                .orElseThrow(() -> notFound("Solicitação não encontrada."));
        Set<UserEntity> usersToAdd = Set.of(
                rentalRequest.getRequester(),
                rentalRequest.getCourt().getOwner());
        if (usersToAdd.stream().noneMatch(user -> user.getId().equals(userId))) {
            throw forbidden();
        }
        ConversationEntity conversation = new ConversationEntity();
        conversation.setType(ConversationType.COURT_BOOKING);
        conversation.setCourt(rentalRequest.getCourt());
        conversation.setRentalRequest(rentalRequest);
        conversations.saveAndFlush(conversation);
        addParticipants(conversation, usersToAdd);
        return toConversationView(conversation, userId);
    }

    @Transactional
    public MessageDtos.ConversationView forChallenge(UUID userId, UUID challengeId) {
        ConversationEntity existing = conversations.findByChallengeId(challengeId).orElse(null);
        if (existing != null) {
            requireParticipant(existing.getId(), userId);
            return toConversationView(existing, userId);
        }
        TeamChallengeEntity challenge = challenges.findWithTeamsById(challengeId)
                .orElseThrow(() -> notFound("Desafio não encontrado."));
        Set<UserEntity> admins = new LinkedHashSet<>();
        teamMembers.findAllByTeamIdAndRole(
                        challenge.getChallengerTeam().getId(),
                        TeamMemberRole.ADMIN)
                .stream()
                .map(TeamMemberEntity::getUser)
                .forEach(admins::add);
        teamMembers.findAllByTeamIdAndRole(
                        challenge.getChallengedTeam().getId(),
                        TeamMemberRole.ADMIN)
                .stream()
                .map(TeamMemberEntity::getUser)
                .forEach(admins::add);
        if (admins.stream().noneMatch(user -> user.getId().equals(userId))) {
            throw forbidden();
        }
        ConversationEntity conversation = new ConversationEntity();
        conversation.setType(ConversationType.TEAM_CHALLENGE);
        conversation.setChallenge(challenge);
        conversations.saveAndFlush(conversation);
        addParticipants(conversation, admins);
        return toConversationView(conversation, userId);
    }

    @Transactional(readOnly = true)
    public Page<MessageDtos.ConversationView> list(UUID userId, Pageable pageable) {
        return conversations.findAllForUser(userId, pageable)
                .map(conversation -> toConversationView(conversation, userId));
    }

    @Transactional
    public Page<MessageDtos.MessageView> messages(
            UUID userId,
            UUID conversationId,
            Pageable pageable) {
        ConversationParticipantEntity participant = participant(conversationId, userId);
        Page<MessageDtos.MessageView> page =
                messages.findAllByConversationIdOrderBySentAtDesc(conversationId, pageable)
                .map(this::toMessageView);
        participant.setLastReadAt(Instant.now());
        return page;
    }

    @Transactional
    public MessageDtos.MessageView send(
            UUID userId,
            UUID conversationId,
            MessageDtos.SendRequest request) {
        requireParticipant(conversationId, userId);
        ConversationEntity conversation = conversations.findById(conversationId)
                .orElseThrow(() -> notFound("Conversa não encontrada."));
        MessageEntity message = new MessageEntity();
        message.setConversation(conversation);
        message.setSender(users.getReferenceById(userId));
        message.setBody(request.body().trim());
        messages.saveAndFlush(message);
        return toMessageView(message);
    }

    private void addParticipants(
            ConversationEntity conversation,
            Set<UserEntity> usersToAdd) {
        for (UserEntity user : usersToAdd) {
            ConversationParticipantEntity participant = new ConversationParticipantEntity();
            participant.setConversation(conversation);
            participant.setUser(user);
            participants.save(participant);
        }
    }

    private void requireParticipant(UUID conversationId, UUID userId) {
        if (!participants.existsByConversationIdAndUserId(conversationId, userId)) {
            throw forbidden();
        }
    }

    private MessageDtos.ConversationView toConversationView(
            ConversationEntity conversation,
            UUID userId) {
        return new MessageDtos.ConversationView(
                conversation.getId(),
                conversation.getType(),
                conversation.getCourt() == null ? null : conversation.getCourt().getId(),
                conversation.getRentalRequest() == null
                        ? null
                        : conversation.getRentalRequest().getId(),
                conversation.getChallenge() == null
                        ? null
                        : conversation.getChallenge().getId(),
                conversationTitle(conversation),
                hasUnread(conversation.getId(), userId),
                conversation.getCreatedAt());
    }

    private boolean hasUnread(UUID conversationId, UUID userId) {
        ConversationParticipantEntity participant = participant(conversationId, userId);
        if (participant.getLastReadAt() == null) {
            return messages.existsByConversationIdAndSenderIdNot(conversationId, userId);
        }
        return messages.existsByConversationIdAndSenderIdNotAndSentAtAfter(
                conversationId,
                userId,
                participant.getLastReadAt());
    }

    private ConversationParticipantEntity participant(UUID conversationId, UUID userId) {
        return participants.findByConversationIdAndUserId(conversationId, userId)
                .orElseThrow(this::forbidden);
    }

    private String conversationTitle(ConversationEntity conversation) {
        if (conversation.getCourt() != null) {
            return conversation.getCourt().getName();
        }
        if (conversation.getChallenge() != null) {
            return conversation.getChallenge().getChallengerTeam().getName()
                    + " × "
                    + conversation.getChallenge().getChallengedTeam().getName();
        }
        return "Conversa";
    }

    private MessageDtos.MessageView toMessageView(MessageEntity message) {
        return new MessageDtos.MessageView(
                message.getId(),
                message.getConversation().getId(),
                message.getSender().getId(),
                message.getSender().getDisplayName(),
                message.getBody(),
                message.getSentAt());
    }

    private ApiException notFound(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, "MESSAGE_RESOURCE_NOT_FOUND", message);
    }

    private ApiException forbidden() {
        return new ApiException(
                HttpStatus.FORBIDDEN,
                "CONVERSATION_FORBIDDEN",
                "Você não participa desta conversa.");
    }
}
