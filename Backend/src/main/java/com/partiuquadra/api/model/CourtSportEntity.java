package com.partiuquadra.api.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@IdClass(CourtSportId.class)
@Table(name = "court_sports")
public class CourtSportEntity {

    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "court_id", nullable = false)
    private CourtEntity court;

    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sport_id", nullable = false)
    private SportEntity sport;

    @Column(name = "price_per_hour", nullable = false, precision = 12, scale = 2)
    private BigDecimal pricePerHour;

    @Column(name = "min_duration_minutes", nullable = false)
    private short minDurationMinutes = 60;

    @Column(name = "max_participants")
    private Short maxParticipants;

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

    public BigDecimal getPricePerHour() {
        return pricePerHour;
    }

    public void setPricePerHour(BigDecimal pricePerHour) {
        this.pricePerHour = pricePerHour;
    }

    public short getMinDurationMinutes() {
        return minDurationMinutes;
    }

    public void setMinDurationMinutes(short minDurationMinutes) {
        this.minDurationMinutes = minDurationMinutes;
    }

    public Short getMaxParticipants() {
        return maxParticipants;
    }

    public void setMaxParticipants(Short maxParticipants) {
        this.maxParticipants = maxParticipants;
    }
}

