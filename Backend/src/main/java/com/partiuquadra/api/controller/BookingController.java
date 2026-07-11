package com.partiuquadra.api.controller;

import com.partiuquadra.api.dto.BookingDtos;
import com.partiuquadra.api.service.BookingService;

import jakarta.validation.Valid;
import java.util.UUID;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping("/rental-requests")
    @ResponseStatus(HttpStatus.CREATED)
    BookingDtos.RentalRequestView create(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody BookingDtos.CreateRequest request) {
        return bookingService.create(userId, request);
    }

    @GetMapping("/rental-requests/mine")
    Page<BookingDtos.RentalRequestView> mine(
            @AuthenticationPrincipal UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return bookingService.mine(
                userId,
                page(page, size));
    }

    @GetMapping("/rental-requests/{requestId}")
    BookingDtos.RentalRequestView getRequest(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID requestId) {
        return bookingService.getRequest(userId, requestId);
    }

    @GetMapping("/rental-requests/{requestId}/proposals")
    List<BookingDtos.ProposalView> proposals(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID requestId) {
        return bookingService.proposals(userId, requestId);
    }

    @GetMapping("/rental-requests/owner")
    Page<BookingDtos.RentalRequestView> forOwner(
            @AuthenticationPrincipal UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return bookingService.forOwner(
                userId,
                page(page, size));
    }

    @PatchMapping("/rental-requests/{requestId}/accept")
    BookingDtos.ReservationView accept(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID requestId) {
        return bookingService.accept(userId, requestId);
    }

    @PatchMapping("/rental-requests/{requestId}/reject")
    BookingDtos.RentalRequestView reject(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID requestId,
            @Valid @RequestBody(required = false) BookingDtos.RejectRequest request) {
        return bookingService.reject(userId, requestId);
    }

    @PostMapping("/rental-requests/{requestId}/counter")
    @ResponseStatus(HttpStatus.CREATED)
    BookingDtos.ProposalView counter(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID requestId,
            @Valid @RequestBody BookingDtos.CounterRequest request) {
        return bookingService.counter(userId, requestId, request);
    }

    @PatchMapping("/rental-requests/{requestId}/proposals/{proposalId}/accept")
    BookingDtos.ReservationView acceptCounter(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID requestId,
            @PathVariable UUID proposalId) {
        return bookingService.acceptCounter(
                userId,
                requestId,
                proposalId);
    }

    @PatchMapping("/rental-requests/{requestId}/proposals/{proposalId}/reject")
    BookingDtos.RentalRequestView rejectCounter(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID requestId,
            @PathVariable UUID proposalId) {
        return bookingService.rejectCounter(
                userId,
                requestId,
                proposalId);
    }

    @GetMapping("/reservations/mine")
    Page<BookingDtos.ReservationView> reservations(
            @AuthenticationPrincipal UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return bookingService.reservations(
                userId,
                page(page, size));
    }

    @GetMapping("/reservations/owner")
    Page<BookingDtos.ReservationView> ownerReservations(
            @AuthenticationPrincipal UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return bookingService.ownerReservations(
                userId,
                page(page, size));
    }

    @GetMapping("/reservations/{reservationId}")
    BookingDtos.ReservationView reservation(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID reservationId) {
        return bookingService.reservation(
                userId,
                reservationId);
    }

    private PageRequest page(int page, int size) {
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50));
    }
}
