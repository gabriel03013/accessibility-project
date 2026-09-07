package com.partiuquadra.api.repository;

import com.partiuquadra.api.model.CourtEntity;
import com.partiuquadra.api.model.CourtStatus;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CourtRepository extends JpaRepository<CourtEntity, UUID> {

    boolean existsBySlugIgnoreCase(String slug);

    @EntityGraph(attributePaths = {"sports", "sports.sport", "photos"})
    @Query("""
            select distinct court
            from CourtEntity court
            left join court.sports courtSport
            left join courtSport.sport sport
            where court.status = com.partiuquadra.api.model.CourtStatus.PUBLISHED
              and (:location = ''
                   or lower(court.city) like :locationPattern
                   or lower(court.neighborhood) like :locationPattern
                   or lower(court.state) = :locationExact)
              and (:sport = '' or sport.slug = :sport)
              and (:query = ''
                   or lower(court.name) like :queryPattern
                   or lower(court.description) like :queryPattern
                   or lower(court.neighborhood) like :queryPattern)
            """)
    Page<CourtEntity> searchPublished(
            @Param("location") String location,
            @Param("locationPattern") String locationPattern,
            @Param("locationExact") String locationExact,
            @Param("sport") String sport,
            @Param("query") String query,
            @Param("queryPattern") String queryPattern,
            Pageable pageable);

    @EntityGraph(attributePaths = {"owner", "sports", "sports.sport", "photos", "amenities"})
    Optional<CourtEntity> findBySlugIgnoreCaseAndStatus(String slug, CourtStatus status);

    @EntityGraph(attributePaths = {"owner", "sports", "sports.sport", "photos", "amenities"})
    Optional<CourtEntity> findWithOwnerById(UUID id);

    Page<CourtEntity> findAllByOwnerIdOrderByCreatedAtDesc(UUID ownerId, Pageable pageable);
}
