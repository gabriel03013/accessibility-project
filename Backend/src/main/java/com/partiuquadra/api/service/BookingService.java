package com.partiuquadra.api.service;

import com.partiuquadra.api.exception.ApiException;
import com.partiuquadra.api.dto.BookingDtos;
import com.partiuquadra.api.model.CourtSportEntity;
import com.partiuquadra.api.repository.CourtSportRepository;
import com.partiuquadra.api.model.CourtStatus;
import com.partiuquadra.api.model.RentalProposalEntity;
import com.partiuquadra.api.repository.RentalProposalRepository;
import com.partiuquadra.api.model.RentalProposalStatus;
import com.partiuquadra.api.model.RentalRequestEntity;
import com.partiuquadra.api.repository.RentalRequestRepository;
import com.partiuquadra.api.model.RentalRequestStatus;
import com.partiuquadra.api.model.ReservationEntity;
import com.partiuquadra.api.repository.ReservationRepository;
import com.partiuquadra.api.model.ReservationStatus;
import com.partiuquadra.api.model.TeamEntity;
import com.partiuquadra.api.repository.TeamMemberRepository;
import com.partiuquadra.api.repository.TeamRepository;
import com.partiuquadra.api.model.UserEntity;
import com.partiuquadra.api.repository.UserRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingService {

    private static final char[] CONFIRMATION_ALPHABET =
            "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();

    private final RentalRequestRepository rentalRequests;
    private final RentalProposalRepository proposals;
    private final ReservationRepository reservations;
    private final CourtSportRepository courtSports;
    private final UserRepository users;
    private final TeamRepository teams;
    private final TeamMemberRepository teamMembers;
    private final SecureRandom secureRandom = new SecureRandom();

    public BookingService(
            RentalRequestRepository rentalRequests,
            RentalProposalRepository proposals,
            ReservationRepository reservations,
            CourtSportRepository courtSports,
            UserRepository users,
            TeamRepository teams,
            TeamMemberRepository teamMembers) {
        this.rentalRequests = rentalRequests;
        this.proposals = proposals;
        this.reservations = reservations;
        this.courtSports = courtSports;
        this.users = users;
        this.teams = teams;
        this.teamMembers = teamMembers;
    }

    @Transactional
    public BookingDtos.RentalRequestView create(
            UUID requesterId,
            BookingDtos.CreateRequest request) {
        validatePeriod(request.startsAt(), request.endsAt());
        UserEntity requester = users.findById(requesterId)
                .orElseThrow(() -> notFound("Conta não encontrada."));
        CourtSportEntity courtSport = courtSports
                .findByCourtIdAndSportId(request.courtId(), request.sportId())
                .filter(item -> item.getCourt().getStatus() == CourtStatus.PUBLISHED)
                .orElseThrow(() -> notFound("Quadra ou modalidade não encontrada."));
        if (courtSport.getCourt().getOwner().getId().equals(requesterId)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "OWNER_CANNOT_BOOK_OWN_COURT",
                    "Você não pode solicitar a própria quadra.");
        }

        long minutes = Duration.between(request.startsAt(), request.endsAt()).toMinutes();
        if (minutes < courtSport.getMinDurationMinutes()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "MINIMUM_DURATION_NOT_MET",
                    "O período é menor que a duração mínima da quadra.");
        }
        if (courtSport.getMaxParticipants() != null
                && request.participants() > courtSport.getMaxParticipants()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "PARTICIPANT_LIMIT_EXCEEDED",
                    "A quantidade de pessoas ultrapassa o limite da quadra.");
        }

        TeamEntity team = null;
        if (request.teamId() != null) {
            if (!teamMembers.existsByTeamIdAndUserId(request.teamId(), requesterId)) {
                throw new ApiException(
                        HttpStatus.FORBIDDEN,
                        "TEAM_MEMBERSHIP_REQUIRED",
                        "Você precisa fazer parte do time selecionado.");
            }
            team = teams.findById(request.teamId())
                    .orElseThrow(() -> notFound("Time não encontrado."));
        }

        BigDecimal hours = BigDecimal.valueOf(minutes)
                .divide(BigDecimal.valueOf(60), 4, RoundingMode.HALF_UP);
        BigDecimal amount = courtSport.getPricePerHour()
                .multiply(hours)
                .setScale(2, RoundingMode.HALF_UP);

        RentalRequestEntity rentalRequest = new RentalRequestEntity();
        rentalRequest.setCourt(courtSport.getCourt());
        rentalRequest.setSport(courtSport.getSport());
        rentalRequest.setRequester(requester);
        rentalRequest.setTeam(team);
        rentalRequest.setRequestedStartsAt(request.startsAt());
        rentalRequest.setRequestedEndsAt(request.endsAt());
        rentalRequest.setParticipants(request.participants());
        rentalRequest.setMessage(trimToNull(request.message()));
        rentalRequest.setQuotedAmount(amount);
        rentalRequest.setExpiresAt(Instant.now().plus(24, ChronoUnit.HOURS));
        rentalRequests.saveAndFlush(rentalRequest);
        return toRentalView(rentalRequest);
    }

    @Transactional
    public BookingDtos.ReservationView accept(UUID ownerId, UUID requestId) {
        RentalRequestEntity request = ownerRequest(ownerId, requestId);
        assertPending(request);
        assertAvailable(request.getCourt().getId(), request.getRequestedStartsAt(), request.getRequestedEndsAt());
        request.setStatus(RentalRequestStatus.ACCEPTED);
        request.setRespondedAt(Instant.now());
        return toReservationView(createReservation(request));
    }

    @Transactional
    public BookingDtos.RentalRequestView reject(UUID ownerId, UUID requestId) {
        RentalRequestEntity request = ownerRequest(ownerId, requestId);
        assertPending(request);
        request.setStatus(RentalRequestStatus.REJECTED);
        request.setRespondedAt(Instant.now());
        return toRentalView(request);
    }

    @Transactional
    public BookingDtos.ProposalView counter(
            UUID ownerId,
            UUID requestId,
            BookingDtos.CounterRequest input) {
        validatePeriod(input.startsAt(), input.endsAt());
        RentalRequestEntity request = ownerRequest(ownerId, requestId);
        assertPending(request);
        assertAvailable(request.getCourt().getId(), input.startsAt(), input.endsAt());

        RentalProposalEntity proposal = new RentalProposalEntity();
        proposal.setRentalRequest(request);
        proposal.setProposedBy(users.getReferenceById(ownerId));
        proposal.setStartsAt(input.startsAt());
        proposal.setEndsAt(input.endsAt());
        proposal.setAmount(input.amount());
        proposal.setMessage(trimToNull(input.message()));
        proposals.saveAndFlush(proposal);
        request.setStatus(RentalRequestStatus.COUNTER_PROPOSED);
        request.setRespondedAt(Instant.now());
        return toProposalView(proposal);
    }

    @Transactional
    public BookingDtos.ReservationView acceptCounter(
            UUID requesterId,
            UUID requestId,
            UUID proposalId) {
        RentalRequestEntity request = rentalRequests.findLockedWithRelationsById(requestId)
                .orElseThrow(() -> notFound("Solicitação não encontrada."));
        if (!request.getRequester().getId().equals(requesterId)) {
            throw forbidden();
        }
        if (request.getStatus() != RentalRequestStatus.COUNTER_PROPOSED) {
            throw invalidState();
        }
        RentalProposalEntity proposal = proposals
                .findByIdAndRentalRequestId(proposalId, requestId)
                .filter(item -> item.getStatus() == RentalProposalStatus.PENDING)
                .orElseThrow(() -> notFound("Proposta não encontrada."));
        assertAvailable(request.getCourt().getId(), proposal.getStartsAt(), proposal.getEndsAt());
        proposal.setStatus(RentalProposalStatus.ACCEPTED);
        request.setRequestedStartsAt(proposal.getStartsAt());
        request.setRequestedEndsAt(proposal.getEndsAt());
        request.setQuotedAmount(proposal.getAmount());
        request.setStatus(RentalRequestStatus.ACCEPTED);
        return toReservationView(createReservation(request));
    }

    @Transactional(readOnly = true)
    public Page<BookingDtos.RentalRequestView> mine(UUID userId, Pageable pageable) {
        return rentalRequests.findAllByRequesterIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toRentalView);
    }

    @Transactional(readOnly = true)
    public BookingDtos.RentalRequestView getRequest(UUID userId, UUID requestId) {
        RentalRequestEntity request = participantRequest(userId, requestId);
        return toRentalView(request);
    }

    @Transactional(readOnly = true)
    public List<BookingDtos.ProposalView> proposals(UUID userId, UUID requestId) {
        participantRequest(userId, requestId);
        return proposals.findAllByRentalRequestIdOrderByCreatedAtDesc(requestId)
                .stream()
                .map(this::toProposalView)
                .toList();
    }

    @Transactional
    public BookingDtos.RentalRequestView rejectCounter(
            UUID requesterId,
            UUID requestId,
            UUID proposalId) {
        RentalRequestEntity request = rentalRequests.findLockedWithRelationsById(requestId)
                .orElseThrow(() -> notFound("Solicitação não encontrada."));
        if (!request.getRequester().getId().equals(requesterId)) {
            throw forbidden();
        }
        if (request.getStatus() != RentalRequestStatus.COUNTER_PROPOSED) {
            throw invalidState();
        }
        RentalProposalEntity proposal = proposals
                .findByIdAndRentalRequestId(proposalId, requestId)
                .filter(item -> item.getStatus() == RentalProposalStatus.PENDING)
                .orElseThrow(() -> notFound("Proposta não encontrada."));
        proposal.setStatus(RentalProposalStatus.REJECTED);
        request.setStatus(RentalRequestStatus.CANCELLED);
        return toRentalView(request);
    }

    @Transactional(readOnly = true)
    public Page<BookingDtos.RentalRequestView> forOwner(UUID ownerId, Pageable pageable) {
        return rentalRequests.findAllByCourtOwnerIdOrderByCreatedAtDesc(ownerId, pageable)
                .map(this::toRentalView);
    }

    @Transactional(readOnly = true)
    public Page<BookingDtos.ReservationView> reservations(UUID userId, Pageable pageable) {
        return reservations.findAllByBookedByIdOrderByStartsAtDesc(userId, pageable)
                .map(this::toReservationView);
    }

    @Transactional(readOnly = true)
    public Page<BookingDtos.ReservationView> ownerReservations(
            UUID ownerId,
            Pageable pageable) {
        return reservations.findAllByCourtOwnerIdOrderByStartsAtDesc(ownerId, pageable)
                .map(this::toReservationView);
    }

    @Transactional(readOnly = true)
    public BookingDtos.ReservationView reservation(UUID userId, UUID reservationId) {
        ReservationEntity reservation = reservations.findWithRelationsById(reservationId)
                .orElseThrow(() -> notFound("Reserva não encontrada."));
        boolean participant = reservation.getBookedBy().getId().equals(userId)
                || reservation.getCourt().getOwner().getId().equals(userId);
        if (!participant) {
            throw forbidden();
        }
        return toReservationView(reservation);
    }

    private RentalRequestEntity ownerRequest(UUID ownerId, UUID requestId) {
        RentalRequestEntity request = rentalRequests.findLockedWithRelationsById(requestId)
                .orElseThrow(() -> notFound("Solicitação não encontrada."));
        if (!request.getCourt().getOwner().getId().equals(ownerId)) {
            throw forbidden();
        }
        return request;
    }

    private RentalRequestEntity participantRequest(UUID userId, UUID requestId) {
        RentalRequestEntity request = rentalRequests.findWithRelationsById(requestId)
                .orElseThrow(() -> notFound("Solicitação não encontrada."));
        boolean participant = request.getRequester().getId().equals(userId)
                || request.getCourt().getOwner().getId().equals(userId);
        if (!participant) {
            throw forbidden();
        }
        return request;
    }

    private ReservationEntity createReservation(RentalRequestEntity request) {
        ReservationEntity reservation = new ReservationEntity();
        reservation.setRentalRequest(request);
        reservation.setCourt(request.getCourt());
        reservation.setSport(request.getSport());
        reservation.setBookedBy(request.getRequester());
        reservation.setTeam(request.getTeam());
        reservation.setConfirmationCode(nextConfirmationCode());
        reservation.setStartsAt(request.getRequestedStartsAt());
        reservation.setEndsAt(request.getRequestedEndsAt());
        reservation.setAmount(request.getQuotedAmount());
        return reservations.save(reservation);
    }

    private void assertPending(RentalRequestEntity request) {
        if (request.getStatus() != RentalRequestStatus.PENDING) {
            throw invalidState();
        }
        if (!request.getExpiresAt().isAfter(Instant.now())) {
            request.setStatus(RentalRequestStatus.EXPIRED);
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "RENTAL_REQUEST_EXPIRED",
                    "Esta solicitação expirou.");
        }
    }

    private void assertAvailable(UUID courtId, Instant startsAt, Instant endsAt) {
        boolean unavailable = reservations.existsOverlap(
                courtId,
                startsAt,
                endsAt,
                List.of(
                        ReservationStatus.AWAITING_PAYMENT,
                        ReservationStatus.CONFIRMED,
                        ReservationStatus.IN_PROGRESS));
        if (unavailable) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "COURT_TIME_UNAVAILABLE",
                    "Este horário não está mais disponível.");
        }
    }

    private void validatePeriod(Instant startsAt, Instant endsAt) {
        if (!endsAt.isAfter(startsAt)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_BOOKING_PERIOD",
                    "O horário final deve ser posterior ao inicial.");
        }
        if (Duration.between(startsAt, endsAt).toHours() > 12) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "BOOKING_PERIOD_TOO_LONG",
                    "Uma reserva não pode ultrapassar 12 horas.");
        }
    }

    private String nextConfirmationCode() {
        StringBuilder value = new StringBuilder("PQ-");
        for (int index = 0; index < 8; index++) {
            value.append(CONFIRMATION_ALPHABET[
                    secureRandom.nextInt(CONFIRMATION_ALPHABET.length)]);
        }
        return value.toString();
    }

    private BookingDtos.RentalRequestView toRentalView(RentalRequestEntity request) {
        return new BookingDtos.RentalRequestView(
                request.getId(),
                request.getCourt().getId(),
                request.getCourt().getName(),
                request.getSport().getName(),
                request.getRequester().getId(),
                request.getRequester().getDisplayName(),
                request.getTeam() == null ? null : request.getTeam().getId(),
                request.getRequestedStartsAt(),
                request.getRequestedEndsAt(),
                request.getParticipants(),
                request.getMessage(),
                request.getQuotedAmount(),
                request.getCurrency(),
                request.getStatus(),
                request.getExpiresAt(),
                request.getCreatedAt());
    }

    private BookingDtos.ProposalView toProposalView(RentalProposalEntity proposal) {
        return new BookingDtos.ProposalView(
                proposal.getId(),
                proposal.getRentalRequest().getId(),
                proposal.getStartsAt(),
                proposal.getEndsAt(),
                proposal.getAmount(),
                proposal.getMessage(),
                proposal.getStatus());
    }

    private BookingDtos.ReservationView toReservationView(ReservationEntity reservation) {
        return new BookingDtos.ReservationView(
                reservation.getId(),
                reservation.getRentalRequest().getId(),
                reservation.getCourt().getId(),
                reservation.getCourt().getName(),
                reservation.getSport().getName(),
                reservation.getConfirmationCode(),
                reservation.getStartsAt(),
                reservation.getEndsAt(),
                reservation.getAmount(),
                reservation.getCurrency(),
                reservation.getStatus(),
                reservation.getCreatedAt());
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private ApiException notFound(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, "BOOKING_NOT_FOUND", message);
    }

    private ApiException forbidden() {
        return new ApiException(
                HttpStatus.FORBIDDEN,
                "BOOKING_FORBIDDEN",
                "Você não pode alterar esta solicitação.");
    }

    private ApiException invalidState() {
        return new ApiException(
                HttpStatus.CONFLICT,
                "INVALID_BOOKING_STATE",
                "Esta solicitação já foi respondida.");
    }
}
