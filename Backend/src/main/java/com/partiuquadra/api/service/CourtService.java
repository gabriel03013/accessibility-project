package com.partiuquadra.api.service;

import com.partiuquadra.api.exception.ApiException;
import com.partiuquadra.api.dto.CourtDtos;
import com.partiuquadra.api.model.AccountType;
import com.partiuquadra.api.model.AmenityEntity;
import com.partiuquadra.api.repository.AmenityRepository;
import com.partiuquadra.api.model.CourtEntity;
import com.partiuquadra.api.model.CourtPhotoEntity;
import com.partiuquadra.api.repository.CourtRepository;
import com.partiuquadra.api.model.CourtSportEntity;
import com.partiuquadra.api.model.CourtStatus;
import com.partiuquadra.api.model.SavedCourtEntity;
import com.partiuquadra.api.repository.SavedCourtRepository;
import com.partiuquadra.api.model.SportEntity;
import com.partiuquadra.api.repository.SportRepository;
import com.partiuquadra.api.model.UserEntity;
import com.partiuquadra.api.repository.UserRepository;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CourtService {

    private final CourtRepository courts;
    private final SavedCourtRepository savedCourts;
    private final UserRepository users;
    private final SportRepository sports;
    private final AmenityRepository amenities;

    public CourtService(
            CourtRepository courts,
            SavedCourtRepository savedCourts,
            UserRepository users,
            SportRepository sports,
            AmenityRepository amenities) {
        this.courts = courts;
        this.savedCourts = savedCourts;
        this.users = users;
        this.sports = sports;
        this.amenities = amenities;
    }

    @Transactional(readOnly = true)
    public Page<CourtDtos.Summary> search(
            String location,
            String sport,
            String query,
            Pageable pageable) {
        String locationFilter = clean(location);
        String sportFilter = clean(sport);
        String queryFilter = clean(query);
        return courts.searchPublished(
                        locationFilter,
                        contains(locationFilter),
                        locationFilter.toLowerCase(Locale.ROOT),
                        sportFilter,
                        queryFilter,
                        contains(queryFilter),
                        pageable)
                .map(this::toSummary);
    }

    @Transactional(readOnly = true)
    public CourtDtos.Detail getPublished(String slug) {
        CourtEntity court = courts.findBySlugIgnoreCaseAndStatus(slug, CourtStatus.PUBLISHED)
                .orElseThrow(() -> notFound("Quadra não encontrada."));
        return toDetail(court);
    }

    @Transactional
    public CourtDtos.Detail create(UUID ownerId, CourtDtos.CreateRequest request) {
        UserEntity owner = users.findById(ownerId)
                .orElseThrow(() -> notFound("Conta não encontrada."));
        if (owner.getAccountType() != AccountType.OWNER) {
            owner.setAccountType(AccountType.OWNER);
        }
        List<Long> sportIds = request.sports().stream()
                .map(CourtDtos.SportInput::sportId)
                .distinct()
                .toList();
        Map<Long, SportEntity> sportById = sports.findAllByIdInAndActiveTrue(sportIds)
                .stream()
                .collect(Collectors.toMap(SportEntity::getId, Function.identity()));
        if (sportById.size() != sportIds.size()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_SPORT",
                    "Uma das modalidades informadas não está disponível.");
        }
        List<Long> amenityIds = request.amenityIds() == null
                ? List.of()
                : request.amenityIds().stream().distinct().toList();
        List<AmenityEntity> selectedAmenities = amenities.findAllByIdIn(amenityIds);
        if (selectedAmenities.size() != amenityIds.size()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_AMENITY",
                    "Um dos itens de estrutura informados não está disponível.");
        }
        long coverCount = request.photos().stream()
                .filter(CourtDtos.PhotoInput::cover)
                .count();
        if (coverCount > 1) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "MULTIPLE_COVER_PHOTOS",
                    "Escolha somente uma foto de capa.");
        }

        CourtEntity court = new CourtEntity();
        court.setOwner(owner);
        court.setName(request.name().trim());
        court.setSlug(simpleSlug(request.name())
                + "-"
                + UUID.randomUUID().toString().substring(0, 8));
        court.setDescription(request.description().trim());
        court.setObservation(trimToNull(request.observation()));
        court.setAddressLine(request.addressLine().trim());
        court.setAddressNumber(request.addressNumber().trim());
        court.setAddressComplement(trimToNull(request.addressComplement()));
        court.setNeighborhood(request.neighborhood().trim());
        court.setCity(request.city().trim());
        court.setState(request.state().trim().toUpperCase(Locale.ROOT));
        court.setPostalCode(request.postalCode().trim());
        court.setTimezone(request.timezone().trim());
        court.setStatus(CourtStatus.PUBLISHED);
        court.setPublishedAt(Instant.now());
        court.getAmenities().addAll(selectedAmenities);

        for (CourtDtos.SportInput input : request.sports()) {
            CourtSportEntity courtSport = new CourtSportEntity();
            courtSport.setCourt(court);
            courtSport.setSport(sportById.get(input.sportId()));
            courtSport.setPricePerHour(input.pricePerHour());
            courtSport.setMinDurationMinutes(input.minDurationMinutes());
            courtSport.setMaxParticipants(input.maxParticipants());
            court.getSports().add(courtSport);
        }

        boolean hasCover = request.photos().stream().anyMatch(CourtDtos.PhotoInput::cover);
        for (int index = 0; index < request.photos().size(); index++) {
            CourtDtos.PhotoInput input = request.photos().get(index);
            CourtPhotoEntity photo = new CourtPhotoEntity();
            photo.setCourt(court);
            photo.setStorageKey(input.storageKey().trim());
            photo.setPublicUrl(input.publicUrl().trim());
            photo.setAltText(input.altText().trim());
            photo.setSortOrder((short) index);
            photo.setCover(hasCover ? input.cover() : index == 0);
            court.getPhotos().add(photo);
        }

        courts.saveAndFlush(court);
        return toDetail(court);
    }

    @Transactional(readOnly = true)
    public Page<CourtDtos.Summary> mine(UUID ownerId, Pageable pageable) {
        return courts.findAllByOwnerIdOrderByCreatedAtDesc(ownerId, pageable)
                .map(this::toSummary);
    }

    @Transactional
    public void save(UUID userId, UUID courtId) {
        if (savedCourts.existsByUserIdAndCourtId(userId, courtId)) {
            return;
        }
        UserEntity user = users.findById(userId)
                .orElseThrow(() -> notFound("Conta não encontrada."));
        CourtEntity court = courts.findById(courtId)
                .filter(found -> found.getStatus() == CourtStatus.PUBLISHED)
                .orElseThrow(() -> notFound("Quadra não encontrada."));
        SavedCourtEntity saved = new SavedCourtEntity();
        saved.setUser(user);
        saved.setCourt(court);
        savedCourts.save(saved);
    }

    @Transactional
    public void unsave(UUID userId, UUID courtId) {
        savedCourts.deleteByUserIdAndCourtId(userId, courtId);
    }

    @Transactional(readOnly = true)
    public Page<CourtDtos.Summary> saved(UUID userId, Pageable pageable) {
        return savedCourts.findAllByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(saved -> toSummary(saved.getCourt()));
    }

    private CourtDtos.Summary toSummary(CourtEntity court) {
        CourtDtos.PhotoView cover = court.getPhotos().stream()
                .sorted(Comparator.comparing(CourtPhotoEntity::isCover).reversed()
                        .thenComparing(CourtPhotoEntity::getSortOrder))
                .findFirst()
                .map(this::toPhoto)
                .orElse(null);
        BigDecimal startingPrice = court.getSports().stream()
                .map(CourtSportEntity::getPricePerHour)
                .min(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
        List<String> sportNames = court.getSports().stream()
                .map(item -> item.getSport().getName())
                .sorted()
                .toList();
        return new CourtDtos.Summary(
                court.getId(),
                court.getSlug(),
                court.getName(),
                court.getCity(),
                court.getState(),
                court.getNeighborhood(),
                startingPrice,
                court.getAverageRating(),
                court.getReviewCount(),
                cover,
                sportNames);
    }

    private CourtDtos.Detail toDetail(CourtEntity court) {
        List<CourtDtos.SportView> sportViews = court.getSports().stream()
                .map(item -> new CourtDtos.SportView(
                        item.getSport().getId(),
                        item.getSport().getSlug(),
                        item.getSport().getName(),
                        item.getPricePerHour(),
                        item.getMinDurationMinutes(),
                        item.getMaxParticipants()))
                .sorted(Comparator.comparing(CourtDtos.SportView::name))
                .toList();
        List<CourtDtos.PhotoView> photoViews = court.getPhotos().stream()
                .sorted(Comparator.comparing(CourtPhotoEntity::getSortOrder))
                .map(this::toPhoto)
                .toList();
        CourtDtos.AddressView address = new CourtDtos.AddressView(
                court.getAddressLine(),
                court.getAddressNumber(),
                court.getAddressComplement(),
                court.getNeighborhood(),
                court.getCity(),
                court.getState(),
                court.getPostalCode());
        return new CourtDtos.Detail(
                court.getId(),
                court.getSlug(),
                court.getName(),
                court.getDescription(),
                court.getObservation(),
                court.getOwner().getDisplayName(),
                address,
                court.getStatus(),
                court.getAverageRating(),
                court.getReviewCount(),
                court.getAmenities()
                        .stream()
                        .map(amenity -> new CourtDtos.AmenityView(
                                amenity.getId(),
                                amenity.getSlug(),
                                amenity.getName()))
                        .sorted(Comparator.comparing(CourtDtos.AmenityView::name))
                        .toList(),
                sportViews,
                photoViews,
                court.getCreatedAt());
    }

    private CourtDtos.PhotoView toPhoto(CourtPhotoEntity photo) {
        return new CourtDtos.PhotoView(
                photo.getId(),
                photo.getPublicUrl(),
                photo.getAltText(),
                photo.isCover(),
                photo.getSortOrder());
    }

    private String simpleSlug(String value) {
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        return normalized.isBlank() ? "quadra" : normalized;
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? "" : value.trim();
    }

    private String contains(String value) {
        return "%" + value.toLowerCase(Locale.ROOT) + "%";
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private ApiException notFound(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, "COURT_NOT_FOUND", message);
    }
}
