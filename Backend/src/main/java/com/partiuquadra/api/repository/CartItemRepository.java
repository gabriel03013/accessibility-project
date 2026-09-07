package com.partiuquadra.api.repository;

import com.partiuquadra.api.model.CartItemEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItemEntity, UUID> {

    @EntityGraph(attributePaths = {"court", "court.owner", "court.photos", "court.sports", "sport"})
    List<CartItemEntity> findAllByUserIdOrderByCreatedAtDesc(UUID userId);

    @EntityGraph(attributePaths = {"user", "court", "court.owner", "court.photos", "court.sports", "sport"})
    Optional<CartItemEntity> findByIdAndUserId(UUID id, UUID userId);
}
