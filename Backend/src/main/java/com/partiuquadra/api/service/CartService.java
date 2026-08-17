package com.partiuquadra.api.service;

import com.partiuquadra.api.dto.BookingDtos;
import com.partiuquadra.api.dto.CartDtos;
import com.partiuquadra.api.exception.ApiException;
import com.partiuquadra.api.model.CartItemEntity;
import com.partiuquadra.api.model.CourtPhotoEntity;
import com.partiuquadra.api.model.CourtSportEntity;
import com.partiuquadra.api.model.CourtStatus;
import com.partiuquadra.api.repository.CartItemRepository;
import com.partiuquadra.api.repository.CourtSportRepository;
import com.partiuquadra.api.repository.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CartService {

    private final CartItemRepository cartItems;
    private final CourtSportRepository courtSports;
    private final UserRepository users;
    private final BookingService bookingService;

    public CartService(
            CartItemRepository cartItems,
            CourtSportRepository courtSports,
            UserRepository users,
            BookingService bookingService) {
        this.cartItems = cartItems;
        this.courtSports = courtSports;
        this.users = users;
        this.bookingService = bookingService;
    }

    @Transactional(readOnly = true)
    public List<CartDtos.ItemView> items(UUID userId) {
        return cartItems.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toView)
                .toList();
    }

    @Transactional
    public CartDtos.ItemView add(UUID userId, CartDtos.AddItemRequest input) {
        validatePeriod(input.startsAt(), input.endsAt());
        CourtSportEntity courtSport = courtSports.findByCourtIdAndSportId(input.courtId(), input.sportId())
                .filter(item -> item.getCourt().getStatus() == CourtStatus.PUBLISHED)
                .orElseThrow(() -> notFound("Quadra ou modalidade não encontrada."));
        if (courtSport.getCourt().getOwner().getId().equals(userId)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "OWNER_CANNOT_BOOK_OWN_COURT",
                    "Você não pode adicionar a própria quadra ao carrinho.");
        }
        long minutes = Duration.between(input.startsAt(), input.endsAt()).toMinutes();
        if (minutes < courtSport.getMinDurationMinutes()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "MINIMUM_DURATION_NOT_MET",
                    "O período é menor que a duração mínima da quadra.");
        }
        if (courtSport.getMaxParticipants() != null
                && input.participants() > courtSport.getMaxParticipants()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "PARTICIPANT_LIMIT_EXCEEDED",
                    "A quantidade de pessoas ultrapassa o limite da quadra.");
        }

        CartItemEntity item = new CartItemEntity();
        item.setUser(users.getReferenceById(userId));
        item.setCourt(courtSport.getCourt());
        item.setSport(courtSport.getSport());
        item.setStartsAt(input.startsAt());
        item.setEndsAt(input.endsAt());
        item.setParticipants(input.participants());
        cartItems.saveAndFlush(item);
        return toView(item);
    }

    @Transactional
    public void remove(UUID userId, UUID itemId) {
        CartItemEntity item = findOwned(userId, itemId);
        cartItems.delete(item);
    }

    @Transactional
    public BookingDtos.RentalRequestView checkout(UUID userId, UUID itemId) {
        CartItemEntity item = findOwned(userId, itemId);
        BookingDtos.RentalRequestView request = bookingService.create(
                userId,
                new BookingDtos.CreateRequest(
                        item.getCourt().getId(),
                        item.getSport().getId(),
                        null,
                        item.getStartsAt(),
                        item.getEndsAt(),
                        item.getParticipants(),
                        null));
        cartItems.delete(item);
        return request;
    }

    @Transactional
    public List<BookingDtos.RentalRequestView> checkout(UUID userId) {
        List<CartItemEntity> items = cartItems.findAllByUserIdOrderByCreatedAtDesc(userId);
        if (items.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CART_EMPTY", "Seu carrinho está vazio.");
        }
        List<BookingDtos.RentalRequestView> requests = items.stream()
                .map(item -> bookingService.create(
                        userId,
                        new BookingDtos.CreateRequest(
                                item.getCourt().getId(),
                                item.getSport().getId(),
                                null,
                                item.getStartsAt(),
                                item.getEndsAt(),
                                item.getParticipants(),
                                null)))
                .toList();
        cartItems.deleteAll(items);
        return requests;
    }

    private CartItemEntity findOwned(UUID userId, UUID itemId) {
        return cartItems.findByIdAndUserId(itemId, userId)
                .orElseThrow(() -> notFound("Item do carrinho não encontrado."));
    }

    private CartDtos.ItemView toView(CartItemEntity item) {
        BigDecimal hours = BigDecimal.valueOf(Duration.between(item.getStartsAt(), item.getEndsAt()).toMinutes())
                .divide(BigDecimal.valueOf(60), 4, RoundingMode.HALF_UP);
        BigDecimal pricePerHour = item.getCourt().getSports().stream()
                .filter(sport -> sport.getSport().getId().equals(item.getSport().getId()))
                .findFirst()
                .map(CourtSportEntity::getPricePerHour)
                .orElse(BigDecimal.ZERO);
        String imageUrl = item.getCourt().getPhotos().stream()
                .sorted(Comparator.comparing(CourtPhotoEntity::isCover).reversed()
                        .thenComparing(CourtPhotoEntity::getSortOrder))
                .map(CourtPhotoEntity::getPublicUrl)
                .findFirst()
                .orElse(null);
        return new CartDtos.ItemView(
                item.getId(),
                item.getCourt().getId(),
                item.getCourt().getName(),
                imageUrl,
                item.getSport().getId(),
                item.getSport().getName(),
                item.getStartsAt(),
                item.getEndsAt(),
                item.getParticipants(),
                pricePerHour.multiply(hours).setScale(2, RoundingMode.HALF_UP),
                "BRL",
                item.getCreatedAt());
    }

    private void validatePeriod(Instant startsAt, Instant endsAt) {
        if (!endsAt.isAfter(startsAt)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_BOOKING_PERIOD", "O horário final deve ser posterior ao inicial.");
        }
        if (Duration.between(startsAt, endsAt).compareTo(Duration.ofHours(12)) > 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "BOOKING_PERIOD_TOO_LONG", "Uma reserva não pode ultrapassar 12 horas.");
        }
    }

    private ApiException notFound(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, "CART_ITEM_NOT_FOUND", message);
    }
}
