package com.partiuquadra.api.controller;

import com.partiuquadra.api.dto.PaymentDtos;
import com.partiuquadra.api.service.PaymentService;

import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    PaymentDtos.PaymentView pay(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody PaymentDtos.PayRequest request) {
        return paymentService.pay(userId, request);
    }
}
