package com.partiuquadra.api.dto;

import com.partiuquadra.api.model.AccountType;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Set;
import java.util.List;
import java.util.UUID;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank @Size(max = 100) String displayName,
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank
            @Pattern(
                    regexp = "^[a-zA-Z0-9._-]{3,32}$",
                    message = "Use de 3 a 32 letras, números, ponto, hífen ou sublinhado.")
            String username,
            @NotBlank
            @Size(
                    min = 12,
                    max = 72,
                    message = "A senha deve ter entre 12 e 72 caracteres.")
            String password,
            @NotNull AccountType accountType) {
    }

    public record LoginRequest(
            @NotBlank @Size(max = 254) String identifier,
            @NotBlank @Size(max = 72) String password) {
    }

    public record UserView(
            UUID id,
            String displayName,
            String username,
            String email,
            String phone,
            List<SportPreference> favoriteSports,
            Set<String> roles) {
    }

    public record SportPreference(
            Long id,
            String slug,
            String name) {
    }

    public record UpdateProfileRequest(
            @NotBlank @Size(max = 100) String displayName,
            @NotBlank
            @Pattern(
                    regexp = "^[a-zA-Z0-9._-]{3,32}$",
                    message = "Use de 3 a 32 letras, números, ponto, hífen ou sublinhado.")
            String username,
            @NotBlank @Email @Size(max = 254) String email,
            @Size(max = 24) String phone,
            @Size(max = 12) List<@NotNull Long> favoriteSportIds) {
    }

    public record TokenResponse(
            String accessToken,
            String tokenType,
            long expiresIn,
            UserView user) {
    }
}
