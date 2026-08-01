package com.partiuquadra.api.model;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class CourtSportId implements Serializable {

    private UUID court;
    private Long sport;

    public CourtSportId() {
    }

    public CourtSportId(UUID court, Long sport) {
        this.court = court;
        this.sport = sport;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof CourtSportId that)) {
            return false;
        }
        return Objects.equals(court, that.court) && Objects.equals(sport, that.sport);
    }

    @Override
    public int hashCode() {
        return Objects.hash(court, sport);
    }
}

