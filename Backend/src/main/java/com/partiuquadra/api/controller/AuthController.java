package com.partiuquadra.api.controller;

import com.partiuquadra.api.dto.AuthDtos;
import com.partiuquadra.api.exception.ApiException;
import com.partiuquadra.api.config.JwtProperties;
import com.partiuquadra.api.service.AuthService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final String REFRESH_COOKIE = "partiu_refresh";

    private final AuthService authService;
    private final JwtProperties jwtProperties;

    public AuthController(AuthService authService, JwtProperties jwtProperties) {
        this.authService = authService;
        this.jwtProperties = jwtProperties;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    AuthDtos.TokenResponse register(
            @Valid @RequestBody AuthDtos.RegisterRequest request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {
        AuthService.AuthSession session = authService.register(
                request);
        writeRefreshCookie(servletRequest, servletResponse, session);
        return session.response();
    }

    @PostMapping("/login")
    AuthDtos.TokenResponse login(
            @Valid @RequestBody AuthDtos.LoginRequest request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {
        AuthService.AuthSession session = authService.login(
                request);
        writeRefreshCookie(servletRequest, servletResponse, session);
        return session.response();
    }

    @PostMapping("/refresh")
    AuthDtos.TokenResponse refresh(
            @CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {
        if (refreshToken == null || refreshToken.isBlank()) {
            clearRefreshCookie(servletRequest, servletResponse);
            throw new ApiException(
                    HttpStatus.UNAUTHORIZED,
                    "INVALID_REFRESH_TOKEN",
                    "Sua sessão expirou. Faça login novamente.");
        }
        AuthService.AuthSession session = authService.refresh(refreshToken);
        writeRefreshCookie(servletRequest, servletResponse, session);
        return session.response();
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void logout(
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {
        clearRefreshCookie(servletRequest, servletResponse);
    }

    @GetMapping("/me")
    AuthDtos.UserView me(@AuthenticationPrincipal UUID userId) {
        return authService.me(userId);
    }

    @PatchMapping("/me")
    AuthDtos.UserView updateProfile(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody AuthDtos.UpdateProfileRequest request) {
        return authService.updateProfile(userId, request);
    }

    private void writeRefreshCookie(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthService.AuthSession session) {
        ResponseCookie cookie = cookieBuilder(request, session.refreshToken())
                .maxAge(jwtProperties.refreshTtl())
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshCookie(
            HttpServletRequest request,
            HttpServletResponse response) {
        ResponseCookie cookie = cookieBuilder(request, "")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private ResponseCookie.ResponseCookieBuilder cookieBuilder(
            HttpServletRequest request,
            String value) {
        return ResponseCookie.from(REFRESH_COOKIE, value)
                .httpOnly(true)
                .secure(request.isSecure())
                .sameSite("Strict")
                .path("/api/v1/auth");
    }
}
