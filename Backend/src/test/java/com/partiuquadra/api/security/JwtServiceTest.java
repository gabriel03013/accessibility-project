package com.partiuquadra.api.security;

import com.partiuquadra.api.config.JwtProperties;
import com.partiuquadra.api.model.AccountType;
import com.partiuquadra.api.service.JwtService;
import com.partiuquadra.api.model.UserEntity;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class JwtServiceTest {

    @Test
    void issuesAndParsesSignedAccessToken() {
        JwtProperties properties = new JwtProperties(
                "https://auth.partiuquadra.test",
                "1234567890123456789012345678901234567890123456789012345678901234",
                Duration.ofMinutes(15),
                Duration.ofDays(30));
        UserEntity user = new UserEntity();
        UUID userId = UUID.randomUUID();
        ReflectionTestUtils.setField(user, "id", userId);
        user.setUsername("gabriel");
        user.setAccountType(AccountType.PLAYER);

        JwtService jwtService = new JwtService(properties);
        String token = jwtService.issueAccessToken(user);
        JwtService.TokenData decoded = jwtService.parseAccessToken(token);

        assertThat(decoded.userId()).isEqualTo(userId);
        assertThat(decoded.username()).isEqualTo("gabriel");
        assertThat(decoded.accountType()).isEqualTo(AccountType.PLAYER);
    }
}
