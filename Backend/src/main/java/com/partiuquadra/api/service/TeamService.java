package com.partiuquadra.api.service;

import com.partiuquadra.api.exception.ApiException;
import com.partiuquadra.api.model.ChallengeProposalEntity;
import com.partiuquadra.api.repository.ChallengeProposalRepository;
import com.partiuquadra.api.model.ChallengeStatus;
import com.partiuquadra.api.model.CourtEntity;
import com.partiuquadra.api.repository.CourtRepository;
import com.partiuquadra.api.model.CourtStatus;
import com.partiuquadra.api.model.InvitationStatus;
import com.partiuquadra.api.model.ProposalStatus;
import com.partiuquadra.api.model.SkillLevel;
import com.partiuquadra.api.model.SportEntity;
import com.partiuquadra.api.repository.SportRepository;
import com.partiuquadra.api.model.TeamChallengeEntity;
import com.partiuquadra.api.repository.TeamChallengeRepository;
import com.partiuquadra.api.dto.TeamDtos;
import com.partiuquadra.api.model.TeamEntity;
import com.partiuquadra.api.model.TeamInvitationEntity;
import com.partiuquadra.api.repository.TeamInvitationRepository;
import com.partiuquadra.api.model.TeamMemberEntity;
import com.partiuquadra.api.repository.TeamMemberRepository;
import com.partiuquadra.api.model.TeamMemberRole;
import com.partiuquadra.api.repository.TeamRepository;
import com.partiuquadra.api.model.TeamSportEntity;
import com.partiuquadra.api.model.TeamStatus;
import com.partiuquadra.api.model.UserEntity;
import com.partiuquadra.api.repository.UserRepository;

import java.text.Normalizer;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TeamService {

    private final TeamRepository teams;
    private final TeamMemberRepository members;
    private final TeamInvitationRepository invitations;
    private final TeamChallengeRepository challenges;
    private final ChallengeProposalRepository proposals;
    private final UserRepository users;
    private final SportRepository sports;
    private final CourtRepository courts;

    public TeamService(
            TeamRepository teams,
            TeamMemberRepository members,
            TeamInvitationRepository invitations,
            TeamChallengeRepository challenges,
            ChallengeProposalRepository proposals,
            UserRepository users,
            SportRepository sports,
            CourtRepository courts) {
        this.teams = teams;
        this.members = members;
        this.invitations = invitations;
        this.challenges = challenges;
        this.proposals = proposals;
        this.users = users;
        this.sports = sports;
        this.courts = courts;
    }

    @Transactional
    public TeamDtos.TeamView create(UUID userId, TeamDtos.CreateRequest request) {
        UserEntity creator = users.findById(userId)
                .orElseThrow(() -> notFound("Conta não encontrada."));
        List<Long> sportIds = request.sportIds().stream().distinct().toList();
        Map<Long, SportEntity> sportById = sports.findAllByIdInAndActiveTrue(sportIds)
                .stream()
                .collect(Collectors.toMap(SportEntity::getId, Function.identity()));
        if (sportById.size() != sportIds.size()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_SPORT",
                    "Uma das modalidades informadas não está disponível.");
        }

        TeamEntity team = new TeamEntity();
        team.setCreatedBy(creator);
        team.setName(request.name().trim());
        team.setSlug(simpleSlug(request.name())
                + "-"
                + UUID.randomUUID().toString().substring(0, 8));
        team.setDescription(trimToNull(request.description()));
        team.setSkillLevel(request.skillLevel());
        team.setRoutine(trimToNull(request.routine()));
        team.setMaxMembers(request.maxMembers());
        team.setPublicProfile(request.publicProfile());

        for (Long sportId : sportIds) {
            TeamSportEntity teamSport = new TeamSportEntity();
            teamSport.setTeam(team);
            teamSport.setSport(sportById.get(sportId));
            team.getSports().add(teamSport);
        }

        TeamMemberEntity admin = new TeamMemberEntity();
        admin.setTeam(team);
        admin.setUser(creator);
        admin.setRole(TeamMemberRole.ADMIN);
        team.getMembers().add(admin);
        teams.saveAndFlush(team);
        return toView(team);
    }

    @Transactional(readOnly = true)
    public Page<TeamDtos.TeamView> search(
            String sport,
            String query,
            SkillLevel level,
            Pageable pageable) {
        return teams.searchPublic(clean(sport), clean(query), level, pageable).map(this::toView);
    }

    @Transactional(readOnly = true)
    public TeamDtos.TeamView get(UUID teamId) {
        TeamEntity team = teams.findWithMembersById(teamId)
                .filter(found -> found.getStatus() == TeamStatus.ACTIVE)
                .orElseThrow(() -> notFound("Time não encontrado."));
        return toView(team);
    }

    @Transactional(readOnly = true)
    public TeamDtos.TeamView get(UUID viewerId, UUID teamId) {
        TeamEntity team = teams.findWithMembersById(teamId)
                .filter(found -> found.getStatus() == TeamStatus.ACTIVE)
                .orElseThrow(() -> notFound("Time não encontrado."));
        if (!team.isPublicProfile() && !members.existsByTeamIdAndUserId(teamId, viewerId)) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "TEAM_FORBIDDEN",
                    "Este time não está disponível para você.");
        }
        return toView(team);
    }

    @Transactional(readOnly = true)
    public List<TeamDtos.TeamView> mine(UUID userId) {
        return members.findAllByUserId(userId)
                .stream()
                .map(member -> member.getTeam().getId())
                .distinct()
                .map(teamId -> teams.findWithMembersById(teamId)
                        .orElseThrow(() -> notFound("Time não encontrado.")))
                .map(this::toView)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TeamDtos.InvitationView> invitations(UUID userId) {
        return invitations.findAllByInvitedUserIdAndStatusOrderByCreatedAtDesc(
                        userId,
                        InvitationStatus.PENDING)
                .stream()
                .map(this::toInvitationView)
                .toList();
    }

    @Transactional
    public TeamDtos.InvitationView declineInvitation(UUID userId, UUID invitationId) {
        TeamInvitationEntity invitation = invitations.findWithTeamById(invitationId)
                .orElseThrow(() -> notFound("Convite não encontrado."));
        if (!invitation.getInvitedUser().getId().equals(userId)) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "INVITATION_FORBIDDEN",
                    "Este convite foi enviado para outra pessoa.");
        }
        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "INVITATION_UNAVAILABLE",
                    "Este convite não está mais disponível.");
        }
        invitation.setStatus(InvitationStatus.DECLINED);
        invitation.setRespondedAt(Instant.now());
        return toInvitationView(invitation);
    }

    @Transactional(readOnly = true)
    public List<TeamDtos.ChallengeView> challenges(UUID userId) {
        List<UUID> teamIds = members.findAllByUserId(userId)
                .stream()
                .map(member -> member.getTeam().getId())
                .distinct()
                .toList();
        if (teamIds.isEmpty()) {
            return List.of();
        }
        return challenges
                .findAllByChallengerTeamIdInOrChallengedTeamIdInOrderByCreatedAtDesc(
                        teamIds,
                        teamIds)
                .stream()
                .map(this::toChallengeView)
                .toList();
    }

    @Transactional(readOnly = true)
    public TeamDtos.ChallengeView challenge(UUID userId, UUID challengeId) {
        TeamChallengeEntity challenge = participantChallenge(userId, challengeId);
        return toChallengeView(challenge);
    }

    @Transactional(readOnly = true)
    public List<TeamDtos.ProposalView> proposals(UUID userId, UUID challengeId) {
        participantChallenge(userId, challengeId);
        return proposals.findAllByChallengeIdOrderByCreatedAtDesc(challengeId)
                .stream()
                .map(this::toProposalView)
                .toList();
    }

    @Transactional
    public TeamDtos.InvitationView invite(
            UUID actorId,
            UUID teamId,
            TeamDtos.InviteRequest request) {
        requireAdmin(teamId, actorId);
        TeamEntity team = teams.findById(teamId)
                .orElseThrow(() -> notFound("Time não encontrado."));
        UserEntity invitedUser = users.findByUsernameIgnoreCase(
                        request.username().trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> notFound("Usuário não encontrado."));
        if (members.existsByTeamIdAndUserId(teamId, invitedUser.getId())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "ALREADY_TEAM_MEMBER",
                    "Esta pessoa já faz parte do time.");
        }

        TeamInvitationEntity invitation = new TeamInvitationEntity();
        invitation.setTeam(team);
        invitation.setInvitedUser(invitedUser);
        invitation.setInvitedUsername(invitedUser.getUsername());
        invitation.setInvitedBy(users.getReferenceById(actorId));
        invitation.setMessage(trimToNull(request.message()));
        invitation.setExpiresAt(Instant.now().plus(7, ChronoUnit.DAYS));
        invitations.saveAndFlush(invitation);
        return toInvitationView(invitation);
    }

    @Transactional
    public TeamDtos.TeamView acceptInvitation(UUID userId, UUID invitationId) {
        TeamInvitationEntity invitation = invitations.findWithTeamById(invitationId)
                .orElseThrow(() -> notFound("Convite não encontrado."));
        if (invitation.getStatus() != InvitationStatus.PENDING
                || !invitation.getExpiresAt().isAfter(Instant.now())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "INVITATION_UNAVAILABLE",
                    "Este convite não está mais disponível.");
        }
        if (!invitation.getInvitedUser().getId().equals(userId)) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "INVITATION_FORBIDDEN",
                    "Este convite foi enviado para outra pessoa.");
        }
        TeamEntity team = invitation.getTeam();
        if (members.countByTeamId(team.getId()) >= team.getMaxMembers()) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "TEAM_FULL",
                    "O time já atingiu o limite de membros.");
        }
        TeamMemberEntity member = new TeamMemberEntity();
        member.setTeam(team);
        member.setUser(invitation.getInvitedUser());
        member.setRole(TeamMemberRole.MEMBER);
        members.save(member);
        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitation.setRespondedAt(Instant.now());
        return get(team.getId());
    }

    @Transactional
    public TeamDtos.ChallengeView challenge(
            UUID actorId,
            UUID challengerTeamId,
            TeamDtos.ChallengeRequest request) {
        requireAdmin(challengerTeamId, actorId);
        if (challengerTeamId.equals(request.challengedTeamId())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "SAME_TEAM_CHALLENGE",
                    "Escolha outro time para o desafio.");
        }
        TeamEntity challenger = teams.findWithMembersById(challengerTeamId)
                .orElseThrow(() -> notFound("Time não encontrado."));
        TeamEntity challenged = teams.findWithMembersById(request.challengedTeamId())
                .filter(TeamEntity::isPublicProfile)
                .orElseThrow(() -> notFound("Time adversário não encontrado."));
        SportEntity sport = sports.findById(request.sportId())
                .filter(SportEntity::isActive)
                .orElseThrow(() -> notFound("Modalidade não encontrada."));
        if (!supportsSport(challenger, sport.getId()) || !supportsSport(challenged, sport.getId())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "UNSUPPORTED_CHALLENGE_SPORT",
                    "Os dois times precisam praticar a modalidade escolhida.");
        }

        TeamChallengeEntity challenge = new TeamChallengeEntity();
        challenge.setChallengerTeam(challenger);
        challenge.setChallengedTeam(challenged);
        challenge.setSport(sport);
        challenge.setCreatedBy(users.getReferenceById(actorId));
        challenge.setMessage(trimToNull(request.message()));
        challenge.setExpiresAt(request.expiresAt());
        challenges.saveAndFlush(challenge);
        return toChallengeView(challenge);
    }

    @Transactional
    public TeamDtos.ProposalView propose(
            UUID actorId,
            UUID challengeId,
            TeamDtos.ProposalRequest request) {
        if (!request.endsAt().isAfter(request.startsAt())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_PROPOSAL_PERIOD",
                    "O horário final deve ser posterior ao inicial.");
        }
        TeamChallengeEntity challenge = challenges.findWithTeamsById(challengeId)
                .orElseThrow(() -> notFound("Desafio não encontrado."));
        UUID proposedByTeamId = request.proposedByTeamId();
        boolean involved = proposedByTeamId.equals(challenge.getChallengerTeam().getId())
                || proposedByTeamId.equals(challenge.getChallengedTeam().getId());
        if (!involved) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "TEAM_NOT_IN_CHALLENGE",
                    "Este time não participa do desafio.");
        }
        requireAdmin(proposedByTeamId, actorId);
        CourtEntity court = request.courtId() == null
                ? null
                : courts.findById(request.courtId())
                        .filter(found -> found.getStatus() == CourtStatus.PUBLISHED)
                        .orElseThrow(() -> notFound("Quadra não encontrada."));

        ChallengeProposalEntity proposal = new ChallengeProposalEntity();
        proposal.setChallenge(challenge);
        proposal.setProposedByTeam(teams.getReferenceById(proposedByTeamId));
        proposal.setCourt(court);
        proposal.setStartsAt(request.startsAt());
        proposal.setEndsAt(request.endsAt());
        proposal.setMessage(trimToNull(request.message()));
        proposals.saveAndFlush(proposal);
        challenge.setStatus(ChallengeStatus.NEGOTIATING);
        return toProposalView(proposal);
    }

    @Transactional
    public TeamDtos.ChallengeView respond(
            UUID actorId,
            UUID challengeId,
            TeamDtos.ChallengeResponse response) {
        TeamChallengeEntity challenge = challenges.findWithTeamsById(challengeId)
                .orElseThrow(() -> notFound("Desafio não encontrado."));
        requireAdmin(challenge.getChallengedTeam().getId(), actorId);
        if (response.status() != ChallengeStatus.ACCEPTED
                && response.status() != ChallengeStatus.DECLINED) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_CHALLENGE_RESPONSE",
                    "Escolha aceitar ou recusar o desafio.");
        }
        if (response.status() == ChallengeStatus.ACCEPTED) {
            UUID proposalId = response.proposalId();
            if (proposalId == null) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "PROPOSAL_REQUIRED",
                        "Escolha uma proposta antes de aceitar.");
            }
            ChallengeProposalEntity proposal = proposals
                    .findByIdAndChallengeId(proposalId, challengeId)
                    .orElseThrow(() -> notFound("Proposta não encontrada."));
            proposal.setStatus(ProposalStatus.ACCEPTED);
            challenge.setAcceptedProposalId(proposalId);
        }
        challenge.setStatus(response.status());
        return toChallengeView(challenge);
    }

    private TeamDtos.TeamView toView(TeamEntity team) {
        List<String> sportNames = team.getSports().stream()
                .map(item -> item.getSport().getName())
                .sorted()
                .toList();
        List<TeamDtos.MemberView> memberViews = team.getMembers().stream()
                .map(member -> new TeamDtos.MemberView(
                        member.getUser().getId(),
                        member.getUser().getDisplayName(),
                        member.getUser().getUsername(),
                        member.getRole(),
                        member.getJoinedAt()))
                .sorted(Comparator.comparing(TeamDtos.MemberView::displayName))
                .toList();
        return new TeamDtos.TeamView(
                team.getId(),
                team.getSlug(),
                team.getName(),
                team.getDescription(),
                team.getSkillLevel(),
                team.getRoutine(),
                team.getMaxMembers(),
                team.isPublicProfile(),
                sportNames,
                memberViews,
                team.getCreatedAt());
    }

    private TeamDtos.InvitationView toInvitationView(TeamInvitationEntity invitation) {
        return new TeamDtos.InvitationView(
                invitation.getId(),
                invitation.getTeam().getId(),
                invitation.getTeam().getName(),
                invitation.getInvitedUsername(),
                invitation.getMessage(),
                invitation.getStatus(),
                invitation.getExpiresAt());
    }

    private TeamDtos.ChallengeView toChallengeView(TeamChallengeEntity challenge) {
        return new TeamDtos.ChallengeView(
                challenge.getId(),
                challenge.getChallengerTeam().getId(),
                challenge.getChallengerTeam().getName(),
                challenge.getChallengedTeam().getId(),
                challenge.getChallengedTeam().getName(),
                challenge.getSport().getId(),
                challenge.getSport().getName(),
                challenge.getMessage(),
                challenge.getStatus(),
                challenge.getAcceptedProposalId(),
                challenge.getExpiresAt(),
                challenge.getCreatedAt());
    }

    private TeamDtos.ProposalView toProposalView(ChallengeProposalEntity proposal) {
        return new TeamDtos.ProposalView(
                proposal.getId(),
                proposal.getChallenge().getId(),
                proposal.getProposedByTeam().getId(),
                proposal.getCourt() == null ? null : proposal.getCourt().getId(),
                proposal.getCourt() == null ? null : proposal.getCourt().getName(),
                proposal.getCourt() == null ? null : proposal.getCourt().getSlug(),
                proposal.getStartsAt(),
                proposal.getEndsAt(),
                proposal.getMessage(),
                proposal.getStatus());
    }

    private void requireAdmin(UUID teamId, UUID userId) {
        if (!members.existsByTeamIdAndUserIdAndRole(teamId, userId, TeamMemberRole.ADMIN)) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "TEAM_ADMIN_REQUIRED",
                    "Somente administradores do time podem realizar esta ação.");
        }
    }

    private TeamChallengeEntity participantChallenge(UUID userId, UUID challengeId) {
        TeamChallengeEntity challenge = challenges.findWithTeamsById(challengeId)
                .orElseThrow(() -> notFound("Desafio não encontrado."));
        boolean participant = members.existsByTeamIdAndUserId(
                        challenge.getChallengerTeam().getId(),
                        userId)
                || members.existsByTeamIdAndUserId(
                        challenge.getChallengedTeam().getId(),
                        userId);
        if (!participant) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "CHALLENGE_FORBIDDEN",
                    "Este desafio não está disponível para você.");
        }
        return challenge;
    }

    private boolean supportsSport(TeamEntity team, Long sportId) {
        return team.getSports().stream().anyMatch(item -> item.getSport().getId().equals(sportId));
    }

    private String simpleSlug(String value) {
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        return normalized.isBlank() ? "time" : normalized;
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private ApiException notFound(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", message);
    }
}
