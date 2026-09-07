package com.partiuquadra.api.repository;

import com.partiuquadra.api.model.TeamEntity;
import com.partiuquadra.api.model.SkillLevel;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TeamRepository extends JpaRepository<TeamEntity, UUID> {

    boolean existsBySlugIgnoreCase(String slug);

    @EntityGraph(attributePaths = {"sports", "sports.sport", "members", "members.user"})
    Optional<TeamEntity> findWithMembersById(UUID id);

    @EntityGraph(attributePaths = {"sports", "sports.sport", "members", "members.user"})
    @Query("""
            select distinct team
            from TeamEntity team
            left join team.sports teamSport
            left join teamSport.sport sport
            where team.status = com.partiuquadra.api.model.TeamStatus.ACTIVE
              and team.publicProfile = true
              and (:sport = '' or sport.slug = :sport)
              and (:level is null or team.skillLevel = :level)
              and (:query = ''
                   or lower(team.name) like :queryPattern
                   or lower(coalesce(team.description, '')) like :queryPattern)
            """)
    Page<TeamEntity> searchPublic(
            @Param("sport") String sport,
            @Param("query") String query,
            @Param("queryPattern") String queryPattern,
            @Param("level") SkillLevel level,
            Pageable pageable);
}
