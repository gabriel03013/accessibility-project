package com.partiuquadra.api.controller;

import com.partiuquadra.api.dto.MessageDtos;
import com.partiuquadra.api.service.MessageService;

import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/conversations")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @PostMapping("/rental-requests/{rentalRequestId}")
    @ResponseStatus(HttpStatus.CREATED)
    MessageDtos.ConversationView forRentalRequest(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID rentalRequestId) {
        return messageService.forRentalRequest(
                userId,
                rentalRequestId);
    }

    @PostMapping("/challenges/{challengeId}")
    @ResponseStatus(HttpStatus.CREATED)
    MessageDtos.ConversationView forChallenge(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID challengeId) {
        return messageService.forChallenge(
                userId,
                challengeId);
    }

    @GetMapping
    Page<MessageDtos.ConversationView> list(
            @AuthenticationPrincipal UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return messageService.list(
                userId,
                page(page, size));
    }

    @GetMapping("/{conversationId}/messages")
    Page<MessageDtos.MessageView> messages(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return messageService.messages(
                userId,
                conversationId,
                page(page, size));
    }

    @PostMapping("/{conversationId}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    MessageDtos.MessageView send(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID conversationId,
            @Valid @RequestBody MessageDtos.SendRequest request) {
        return messageService.send(
                userId,
                conversationId,
                request);
    }

    private PageRequest page(int page, int size) {
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100));
    }
}

