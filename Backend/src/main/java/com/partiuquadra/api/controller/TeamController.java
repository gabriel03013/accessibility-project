package com.partiuquadra.api.controller;

import com.partiuquadra.api.dto.TeamDtos;
import com.partiuquadra.api.model.SkillLevel;
import com.partiuquadra.api.service.TeamService;

import jakarta.validation.Valid;
import java.util.UUID;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/teams")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @GetMapping
    Page<TeamDtos.TeamView> search(
            @RequestParam(required = false) String sport,
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(required = false) SkillLevel level,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return teamService.search(
                sport,
                query,
                level,
                PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50)));
    }

    @GetMapping("/{teamId}")
    TeamDtos.TeamView get(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID teamId) {
        return teamService.get(userId, teamId);
    }

    @GetMapping("/mine")
    List<TeamDtos.TeamView> mine(@AuthenticationPrincipal UUID userId) {
        return teamService.mine(userId);
    }

    @GetMapping("/invitations/mine")
    List<TeamDtos.InvitationView> invitations(@AuthenticationPrincipal UUID userId) {
        return teamService.invitations(userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    TeamDtos.TeamView create(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody TeamDtos.CreateRequest request) {
        return teamService.create(userId, request);
    }

    @PostMapping("/{teamId}/invitations")
    @ResponseStatus(HttpStatus.CREATED)
    TeamDtos.InvitationView invite(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID teamId,
            @Valid @RequestBody TeamDtos.InviteRequest request) {
        return teamService.invite(userId, teamId, request);
    }

    @PostMapping("/invitations/{invitationId}/accept")
    TeamDtos.TeamView acceptInvitation(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID invitationId) {
        return teamService.acceptInvitation(userId, invitationId);
    }

    @PatchMapping("/invitations/{invitationId}/decline")
    TeamDtos.InvitationView declineInvitation(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID invitationId) {
        return teamService.declineInvitation(
                userId,
                invitationId);
    }

    @GetMapping("/challenges/mine")
    List<TeamDtos.ChallengeView> challenges(@AuthenticationPrincipal UUID userId) {
        return teamService.challenges(userId);
    }

    @GetMapping("/challenges/{challengeId}")
    TeamDtos.ChallengeView challenge(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID challengeId) {
        return teamService.challenge(userId, challengeId);
    }

    @GetMapping("/challenges/{challengeId}/proposals")
    List<TeamDtos.ProposalView> proposals(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID challengeId) {
        return teamService.proposals(userId, challengeId);
    }

    @PostMapping("/{teamId}/challenges")
    @ResponseStatus(HttpStatus.CREATED)
    TeamDtos.ChallengeView challenge(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID teamId,
            @Valid @RequestBody TeamDtos.ChallengeRequest request) {
        return teamService.challenge(userId, teamId, request);
    }

    @PostMapping("/challenges/{challengeId}/proposals")
    @ResponseStatus(HttpStatus.CREATED)
    TeamDtos.ProposalView propose(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID challengeId,
            @Valid @RequestBody TeamDtos.ProposalRequest request) {
        return teamService.propose(userId, challengeId, request);
    }

    @PatchMapping("/challenges/{challengeId}")
    TeamDtos.ChallengeView respond(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID challengeId,
            @Valid @RequestBody TeamDtos.ChallengeResponse request) {
        return teamService.respond(userId, challengeId, request);
    }
}
