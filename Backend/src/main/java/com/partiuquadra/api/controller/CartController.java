package com.partiuquadra.api.controller;

import com.partiuquadra.api.dto.BookingDtos;
import com.partiuquadra.api.dto.CartDtos;
import com.partiuquadra.api.service.CartService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    List<CartDtos.ItemView> items(@AuthenticationPrincipal UUID userId) {
        return cartService.items(userId);
    }

    @PostMapping("/items")
    @ResponseStatus(HttpStatus.CREATED)
    CartDtos.ItemView add(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody CartDtos.AddItemRequest input) {
        return cartService.add(userId, input);
    }

    @DeleteMapping("/items/{itemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void remove(@AuthenticationPrincipal UUID userId, @PathVariable UUID itemId) {
        cartService.remove(userId, itemId);
    }

    @PostMapping("/checkout")
    @ResponseStatus(HttpStatus.CREATED)
    List<BookingDtos.RentalRequestView> checkout(@AuthenticationPrincipal UUID userId) {
        return cartService.checkout(userId);
    }

    @PostMapping("/items/{itemId}/checkout")
    @ResponseStatus(HttpStatus.CREATED)
    BookingDtos.RentalRequestView checkout(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID itemId) {
        return cartService.checkout(userId, itemId);
    }
}
