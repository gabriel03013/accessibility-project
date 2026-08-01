package com.partiuquadra.api.repository;

import com.partiuquadra.api.model.UserEntity;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<UserEntity, UUID> {

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, UUID id);

    boolean existsByUsernameIgnoreCaseAndIdNot(String username, UUID id);

    Optional<UserEntity> findByEmailIgnoreCase(String email);

    Optional<UserEntity> findByUsernameIgnoreCase(String username);

    @EntityGraph(attributePaths = "favoriteSports")
    Optional<UserEntity> findProfileById(UUID id);
}
