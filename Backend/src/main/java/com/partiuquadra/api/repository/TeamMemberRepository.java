package com.partiuquadra.api.repository;

import com.partiuquadra.api.model.TeamMemberEntity;
import com.partiuquadra.api.model.TeamMemberId;
import com.partiuquadra.api.model.TeamMemberRole;

import java.util.UUID;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamMemberRepository extends JpaRepository<TeamMemberEntity, TeamMemberId> {

    boolean existsByTeamIdAndUserId(UUID teamId, UUID userId);

    boolean existsByTeamIdAndUserIdAndRole(
            UUID teamId,
            UUID userId,
            TeamMemberRole role);

    long countByTeamId(UUID teamId);

    @EntityGraph(attributePaths = "user")
    List<TeamMemberEntity> findAllByTeamIdAndRole(UUID teamId, TeamMemberRole role);

    @EntityGraph(attributePaths = {"team", "team.sports", "team.sports.sport"})
    List<TeamMemberEntity> findAllByUserId(UUID userId);
}
