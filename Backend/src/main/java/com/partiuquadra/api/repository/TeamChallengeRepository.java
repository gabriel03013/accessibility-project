package com.partiuquadra.api.repository;

import com.partiuquadra.api.model.TeamChallengeEntity;

import java.util.Optional;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamChallengeRepository extends JpaRepository<TeamChallengeEntity, UUID> {

    @EntityGraph(attributePaths = {"challengerTeam", "challengedTeam", "sport"})
    Optional<TeamChallengeEntity> findWithTeamsById(UUID id);

    @EntityGraph(attributePaths = {"challengerTeam", "challengedTeam", "sport"})
    List<TeamChallengeEntity>
            findAllByChallengerTeamIdInOrChallengedTeamIdInOrderByCreatedAtDesc(
                    Collection<UUID> challengerTeamIds,
                    Collection<UUID> challengedTeamIds);
}
