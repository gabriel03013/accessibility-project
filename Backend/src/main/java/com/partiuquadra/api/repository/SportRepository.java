package com.partiuquadra.api.repository;

import com.partiuquadra.api.model.SportEntity;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SportRepository extends JpaRepository<SportEntity, Long> {

    List<SportEntity> findAllByIdInAndActiveTrue(Collection<Long> ids);

    List<SportEntity> findAllByActiveTrueOrderByName();
}

