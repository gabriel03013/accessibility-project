package com.partiuquadra.api.repository;

import com.partiuquadra.api.model.CourtSportEntity;
import com.partiuquadra.api.model.CourtSportId;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourtSportRepository extends JpaRepository<CourtSportEntity, CourtSportId> {

    @EntityGraph(attributePaths = {"court", "court.owner", "sport"})
    Optional<CourtSportEntity> findByCourtIdAndSportId(UUID courtId, Long sportId);
}

