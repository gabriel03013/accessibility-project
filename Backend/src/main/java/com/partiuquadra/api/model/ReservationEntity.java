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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reservations")
public class ReservationEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "rental_request_id", nullable = false, unique = true)
    private RentalRequestEntity rentalRequest;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "court_id", nullable = false)
    private CourtEntity court;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sport_id", nullable = false)
    private SportEntity sport;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booked_by", nullable = false)
    private UserEntity bookedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private TeamEntity team;

    @Column(name = "confirmation_code", nullable = false, unique = true, length = 16)
    private String confirmationCode;

    @Column(name = "starts_at", nullable = false)
    private Instant startsAt;

    @Column(name = "ends_at", nullable = false)
    private Instant endsAt;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency = "BRL";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private ReservationStatus status = ReservationStatus.AWAITING_PAYMENT;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    public UUID getId() {
        return id;
    }

    public RentalRequestEntity getRentalRequest() {
        return rentalRequest;
    }

    public void setRentalRequest(RentalRequestEntity rentalRequest) {
        this.rentalRequest = rentalRequest;
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

    public UserEntity getBookedBy() {
        return bookedBy;
    }

    public void setBookedBy(UserEntity bookedBy) {
        this.bookedBy = bookedBy;
    }

    public TeamEntity getTeam() {
        return team;
    }

    public void setTeam(TeamEntity team) {
        this.team = team;
    }

    public String getConfirmationCode() {
        return confirmationCode;
    }

    public void setConfirmationCode(String confirmationCode) {
        this.confirmationCode = confirmationCode;
    }

    public Instant getStartsAt() {
        return startsAt;
    }

    public void setStartsAt(Instant startsAt) {
        this.startsAt = startsAt;
    }

    public Instant getEndsAt() {
        return endsAt;
    }

    public void setEndsAt(Instant endsAt) {
        this.endsAt = endsAt;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public ReservationStatus getStatus() {
        return status;
    }

    public void setStatus(ReservationStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

