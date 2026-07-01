package com.partiuquadra.api.repository;

import com.partiuquadra.api.model.AmenityEntity;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AmenityRepository extends JpaRepository<AmenityEntity, Long> {

    List<AmenityEntity> findAllByOrderByName();

    List<AmenityEntity> findAllByIdIn(List<Long> ids);
}
