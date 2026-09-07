package com.partiuquadra.api.controller;

import com.partiuquadra.api.dto.CourtDtos;
import com.partiuquadra.api.service.CourtService;

import jakarta.validation.Valid;
import java.util.Locale;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/courts")
public class CourtController {

    private final CourtService courtService;

    public CourtController(CourtService courtService) {
        this.courtService = courtService;
    }

    @GetMapping
    Page<CourtDtos.Summary> search(
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String sport,
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(defaultValue = "RECENT") String order,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        Sort sort = switch (order.trim().toUpperCase(Locale.ROOT)) {
            case "RATING" -> Sort.by(
                    Sort.Order.desc("averageRating"),
                    Sort.Order.desc("createdAt"));
            case "NAME" -> Sort.by(
                    Sort.Order.asc("name"),
                    Sort.Order.desc("createdAt"));
            default -> Sort.by("createdAt").descending();
        };
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 50),
                sort);
        return courtService.search(location, sport, query, pageable);
    }

    @GetMapping("/mine")
    Page<CourtDtos.Summary> mine(
            @AuthenticationPrincipal UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return courtService.mine(
                userId,
                PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50)));
    }

    @GetMapping("/saved")
    Page<CourtDtos.Summary> saved(
            @AuthenticationPrincipal UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return courtService.saved(
                userId,
                PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50)));
    }

    @GetMapping("/{slug}")
    CourtDtos.Detail get(@PathVariable String slug) {
        return courtService.getPublished(slug);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    CourtDtos.Detail create(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody CourtDtos.CreateRequest request) {
        return courtService.create(userId, request);
    }

    @PostMapping("/{courtId}/saved")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void save(@AuthenticationPrincipal UUID userId, @PathVariable UUID courtId) {
        courtService.save(userId, courtId);
    }

    @DeleteMapping("/{courtId}/saved")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void unsave(@AuthenticationPrincipal UUID userId, @PathVariable UUID courtId) {
        courtService.unsave(userId, courtId);
    }
}
