package com.partiuquadra.api.repository;

import com.partiuquadra.api.model.TeamInvitationEntity;

import java.util.Optional;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamInvitationRepository extends JpaRepository<TeamInvitationEntity, UUID> {

    @EntityGraph(attributePaths = {"team", "invitedUser"})
    Optional<TeamInvitationEntity> findWithTeamById(UUID id);

    @EntityGraph(attributePaths = {"team", "invitedUser"})
    List<TeamInvitationEntity> findAllByInvitedUserIdAndStatusOrderByCreatedAtDesc(
            UUID invitedUserId,
            com.partiuquadra.api.model.InvitationStatus status);
}
