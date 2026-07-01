package com.partiuquadra.api.model;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class SavedCourtId implements Serializable {

    private UUID user;
    private UUID court;

    public SavedCourtId() {
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof SavedCourtId that)) {
            return false;
        }
        return Objects.equals(user, that.user) && Objects.equals(court, that.court);
    }

    @Override
    public int hashCode() {
        return Objects.hash(user, court);
    }
}

