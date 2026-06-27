package com.partiuquadra.api.repository;

import com.partiuquadra.api.model.SavedCourtEntity;
import com.partiuquadra.api.model.SavedCourtId;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SavedCourtRepository extends JpaRepository<SavedCourtEntity, SavedCourtId> {

    boolean existsByUserIdAndCourtId(UUID userId, UUID courtId);

    void deleteByUserIdAndCourtId(UUID userId, UUID courtId);

    Page<SavedCourtEntity> findAllByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
}

