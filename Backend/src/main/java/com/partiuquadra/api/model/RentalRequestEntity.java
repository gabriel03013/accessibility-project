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
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "rental_requests")
public class RentalRequestEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "court_id", nullable = false)
    private CourtEntity court;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sport_id", nullable = false)
    private SportEntity sport;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requester_id", nullable = false)
    private UserEntity requester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private TeamEntity team;

    @Column(name = "requested_starts_at", nullable = false)
    private Instant requestedStartsAt;

    @Column(name = "requested_ends_at", nullable = false)
    private Instant requestedEndsAt;

    @Column(nullable = false)
    private short participants;

    @Column(length = 1000)
    private String message;

    @Column(name = "quoted_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal quotedAmount;

    @Column(nullable = false, length = 3)
    private String currency = "BRL";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 28)
    private RentalRequestStatus status = RentalRequestStatus.PENDING;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "responded_at")
    private Instant respondedAt;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    public UUID getId() {
        return id;
    }

    public CourtEntity getCourt() {
        return court;
    }

    public void setCourt(CourtEntity court) {
        this.court = court;
    }

    public SportEntity getSport() {
        return sport;
    }

    public void setSport(SportEntity sport) {
        this.sport = sport;
    }

    public UserEntity getRequester() {
        return requester;
    }

    public void setRequester(UserEntity requester) {
        this.requester = requester;
    }

    public TeamEntity getTeam() {
        return team;
    }

    public void setTeam(TeamEntity team) {
        this.team = team;
    }

    public Instant getRequestedStartsAt() {
        return requestedStartsAt;
    }

    public void setRequestedStartsAt(Instant requestedStartsAt) {
        this.requestedStartsAt = requestedStartsAt;
    }

    public Instant getRequestedEndsAt() {
        return requestedEndsAt;
    }

    public void setRequestedEndsAt(Instant requestedEndsAt) {
        this.requestedEndsAt = requestedEndsAt;
    }

    public short getParticipants() {
        return participants;
    }

    public void setParticipants(short participants) {
        this.participants = participants;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public BigDecimal getQuotedAmount() {
        return quotedAmount;
    }

    public void setQuotedAmount(BigDecimal quotedAmount) {
        this.quotedAmount = quotedAmount;
    }

    public String getCurrency() {
        return currency;
    }

    public RentalRequestStatus getStatus() {
        return status;
    }

    public void setStatus(RentalRequestStatus status) {
        this.status = status;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Instant getRespondedAt() {
        return respondedAt;
    }

    public void setRespondedAt(Instant respondedAt) {
        this.respondedAt = respondedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

