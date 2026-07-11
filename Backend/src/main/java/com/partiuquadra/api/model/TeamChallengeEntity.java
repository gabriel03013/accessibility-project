package com.partiuquadra.api.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "team_challenges")
public class TeamChallengeEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "challenger_team_id", nullable = false)
    private TeamEntity challengerTeam;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "challenged_team_id", nullable = false)
    private TeamEntity challengedTeam;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sport_id", nullable = false)
    private SportEntity sport;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private UserEntity createdBy;

    @Column(length = 1000)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private ChallengeStatus status = ChallengeStatus.PENDING;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "accepted_proposal_id")
    private UUID acceptedProposalId;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    public UUID getId() {
        return id;
    }

    public TeamEntity getChallengerTeam() {
        return challengerTeam;
    }

    public void setChallengerTeam(TeamEntity challengerTeam) {
        this.challengerTeam = challengerTeam;
    }

    public TeamEntity getChallengedTeam() {
        return challengedTeam;
    }

    public void setChallengedTeam(TeamEntity challengedTeam) {
        this.challengedTeam = challengedTeam;
    }

    public SportEntity getSport() {
        return sport;
    }

    public void setSport(SportEntity sport) {
        this.sport = sport;
    }

    public void setCreatedBy(UserEntity createdBy) {
        this.createdBy = createdBy;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public ChallengeStatus getStatus() {
        return status;
    }

    public void setStatus(ChallengeStatus status) {
        this.status = status;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public UUID getAcceptedProposalId() {
        return acceptedProposalId;
    }

    public void setAcceptedProposalId(UUID acceptedProposalId) {
        this.acceptedProposalId = acceptedProposalId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

