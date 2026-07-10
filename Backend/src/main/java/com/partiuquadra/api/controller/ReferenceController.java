package com.partiuquadra.api.controller;

import com.partiuquadra.api.repository.AmenityRepository;
import com.partiuquadra.api.repository.SportRepository;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reference")
public class ReferenceController {

    private final SportRepository sports;
    private final AmenityRepository amenities;

    public ReferenceController(
            SportRepository sports,
            AmenityRepository amenities) {
        this.sports = sports;
        this.amenities = amenities;
    }

    @GetMapping("/sports")
    List<SportView> sports() {
        return sports.findAllByActiveTrueOrderByName()
                .stream()
                .map(sport -> new SportView(sport.getId(), sport.getSlug(), sport.getName()))
                .toList();
    }

    record SportView(Long id, String slug, String name) {
    }

    @GetMapping("/amenities")
    List<AmenityView> amenities() {
        return amenities.findAllByOrderByName()
                .stream()
                .map(amenity -> new AmenityView(
                        amenity.getId(),
                        amenity.getSlug(),
                        amenity.getName()))
                .toList();
    }

    record AmenityView(Long id, String slug, String name) {
    }
}
