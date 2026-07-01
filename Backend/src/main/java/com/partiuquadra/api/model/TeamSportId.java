package com.partiuquadra.api.model;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class TeamSportId implements Serializable {

    private UUID team;
    private Long sport;

    public TeamSportId() {
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof TeamSportId that)) {
            return false;
        }
        return Objects.equals(team, that.team) && Objects.equals(sport, that.sport);
    }

    @Override
    public int hashCode() {
        return Objects.hash(team, sport);
    }
}

