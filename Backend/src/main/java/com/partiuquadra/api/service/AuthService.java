package com.partiuquadra.api.service;

import com.partiuquadra.api.dto.AuthDtos;
import com.partiuquadra.api.exception.ApiException;
import com.partiuquadra.api.model.SportEntity;
import com.partiuquadra.api.model.UserEntity;
import com.partiuquadra.api.repository.SportRepository;
import com.partiuquadra.api.repository.UserRepository;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository users;
    private final SportRepository sports;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final String dummyPasswordHash;

    public AuthService(
            UserRepository users,
            SportRepository sports,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.users = users;
        this.sports = sports;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.dummyPasswordHash = passwordEncoder.encode("timing-normalization-value");
    }

    @Transactional
    public AuthSession register(AuthDtos.RegisterRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String username = request.username().trim().toLowerCase(Locale.ROOT);
        if (users.existsByEmailIgnoreCase(email)) {
            throw conflict("EMAIL_ALREADY_REGISTERED", "Este e-mail já está em uso.");
        }
        if (users.existsByUsernameIgnoreCase(username)) {
            throw conflict(
                    "USERNAME_ALREADY_REGISTERED",
                    "Este nome de usuário já está em uso.");
        }

        UserEntity user = new UserEntity();
        user.setDisplayName(request.displayName().trim());
        user.setEmail(email);
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setAccountType(request.accountType());
        users.saveAndFlush(user);
        return issueSession(user);
    }

    @Transactional(readOnly = true)
    public AuthSession login(AuthDtos.LoginRequest request) {
        String identifier = request.identifier().trim().toLowerCase(Locale.ROOT);
        UserEntity user = (identifier.contains("@")
                        ? users.findByEmailIgnoreCase(identifier)
                        : users.findByUsernameIgnoreCase(identifier))
                .orElse(null);

        String storedPassword = user == null ? dummyPasswordHash : user.getPasswordHash();
        if (user == null || !passwordEncoder.matches(request.password(), storedPassword)) {
            throw invalidCredentials();
        }
        return issueSession(user);
    }

    @Transactional(readOnly = true)
    public AuthSession refresh(String refreshToken) {
        JwtService.TokenData data;
        try {
            data = jwtService.parseRefreshToken(refreshToken);
        } catch (RuntimeException exception) {
            throw invalidRefreshToken();
        }
        UserEntity user = users.findProfileById(data.userId())
                .orElseThrow(this::invalidRefreshToken);
        return issueSession(user);
    }

    @Transactional(readOnly = true)
    public AuthDtos.UserView me(UUID userId) {
        return users.findProfileById(userId)
                .map(this::toView)
                .orElseThrow(this::invalidCredentials);
    }

    @Transactional
    public AuthDtos.UserView updateProfile(
            UUID userId,
            AuthDtos.UpdateProfileRequest request) {
        UserEntity user = users.findProfileById(userId)
                .orElseThrow(this::invalidCredentials);
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String username = request.username().trim().toLowerCase(Locale.ROOT);
        if (users.existsByEmailIgnoreCaseAndIdNot(email, userId)) {
            throw conflict("EMAIL_ALREADY_REGISTERED", "Este e-mail já está em uso.");
        }
        if (users.existsByUsernameIgnoreCaseAndIdNot(username, userId)) {
            throw conflict(
                    "USERNAME_ALREADY_REGISTERED",
                    "Este nome de usuário já está em uso.");
        }

        List<Long> sportIds = request.favoriteSportIds() == null
                ? List.of()
                : request.favoriteSportIds().stream().distinct().toList();
        List<SportEntity> favoriteSports = sports.findAllByIdInAndActiveTrue(sportIds);
        if (favoriteSports.size() != sportIds.size()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_SPORT",
                    "Uma das modalidades informadas não está disponível.");
        }

        user.setDisplayName(request.displayName().trim());
        user.setUsername(username);
        user.setEmail(email);
        user.setPhone(trimToNull(request.phone()));
        user.getFavoriteSports().clear();
        user.getFavoriteSports().addAll(favoriteSports);
        return toView(user);
    }

    private AuthSession issueSession(UserEntity user) {
        AuthDtos.TokenResponse response = new AuthDtos.TokenResponse(
                jwtService.issueAccessToken(user),
                "Bearer",
                jwtService.accessTokenExpiresInSeconds(),
                toView(user));
        return new AuthSession(response, jwtService.issueRefreshToken(user));
    }

    private AuthDtos.UserView toView(UserEntity user) {
        return new AuthDtos.UserView(
                user.getId(),
                user.getDisplayName(),
                user.getUsername(),
                user.getEmail(),
                user.getPhone(),
                user.getFavoriteSports()
                        .stream()
                        .map(sport -> new AuthDtos.SportPreference(
                                sport.getId(),
                                sport.getSlug(),
                                sport.getName()))
                        .sorted(Comparator.comparing(AuthDtos.SportPreference::name))
                        .toList(),
                Set.of(user.getAccountType().name()));
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private ApiException conflict(String code, String message) {
        return new ApiException(HttpStatus.CONFLICT, code, message);
    }

    private ApiException invalidCredentials() {
        return new ApiException(
                HttpStatus.UNAUTHORIZED,
                "INVALID_CREDENTIALS",
                "E-mail, nome de usuário ou senha incorretos.");
    }

    private ApiException invalidRefreshToken() {
        return new ApiException(
                HttpStatus.UNAUTHORIZED,
                "INVALID_REFRESH_TOKEN",
                "Sua sessão expirou. Faça login novamente.");
    }

    public record AuthSession(
            AuthDtos.TokenResponse response,
            String refreshToken) {
    }
}
