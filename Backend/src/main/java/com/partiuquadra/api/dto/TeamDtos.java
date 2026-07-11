package com.partiuquadra.api.dto;

import com.partiuquadra.api.model.ChallengeStatus;
import com.partiuquadra.api.model.InvitationStatus;
import com.partiuquadra.api.model.ProposalStatus;
import com.partiuquadra.api.model.SkillLevel;
import com.partiuquadra.api.model.TeamMemberRole;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class TeamDtos {

    private TeamDtos() {
    }

    public record CreateRequest(
            @NotBlank @Size(max = 100) String name,
            @Size(max = 1000) String description,
            @NotNull SkillLevel skillLevel,
            @Size(max = 500) String routine,
            @Min(2) @Max(100) short maxMembers,
            boolean publicProfile,
            @NotEmpty @Size(max = 8) List<@NotNull Long> sportIds) {
    }

    public record InviteRequest(
            @NotBlank @Size(max = 32) String username,
            @Size(max = 500) String message) {
    }

    public record ChallengeRequest(
            @NotNull UUID challengedTeamId,
            @NotNull Long sportId,
            @Size(max = 1000) String message,
            @NotNull @Future Instant expiresAt) {
    }

    public record ProposalRequest(
            @NotNull UUID proposedByTeamId,
            UUID courtId,
            @NotNull @Future Instant startsAt,
            @NotNull @Future Instant endsAt,
            @Size(max = 500) String message) {
    }

    public record ChallengeResponse(
            @NotNull ChallengeStatus status,
            UUID proposalId) {
    }

    public record MemberView(
            UUID userId,
            String displayName,
            String username,
            TeamMemberRole role,
            Instant joinedAt) {
    }

    public record TeamView(
            UUID id,
            String slug,
            String name,
            String description,
            SkillLevel skillLevel,
            String routine,
            short maxMembers,
            boolean publicProfile,
            List<String> sports,
            List<MemberView> members,
            Instant createdAt) {
    }

    public record InvitationView(
            UUID id,
            UUID teamId,
            String teamName,
            String invitedUsername,
            String message,
            InvitationStatus status,
            Instant expiresAt) {
    }

    public record ChallengeView(
            UUID id,
            UUID challengerTeamId,
            String challengerTeamName,
            UUID challengedTeamId,
            String challengedTeamName,
            Long sportId,
            String sport,
            String message,
            ChallengeStatus status,
            UUID acceptedProposalId,
            Instant expiresAt,
            Instant createdAt) {
    }

    public record ProposalView(
            UUID id,
            UUID challengeId,
            UUID proposedByTeamId,
            UUID courtId,
            String courtName,
            String courtSlug,
            Instant startsAt,
            Instant endsAt,
            String message,
            ProposalStatus status) {
    }
}
