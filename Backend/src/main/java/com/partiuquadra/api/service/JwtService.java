package com.partiuquadra.api.service;

import com.partiuquadra.api.config.JwtProperties;
import com.partiuquadra.api.model.AccountType;
import com.partiuquadra.api.model.UserEntity;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private static final String ACCESS = "access";
    private static final String REFRESH = "refresh";

    private final JwtProperties properties;
    private final SecretKey key;

    public JwtService(JwtProperties properties) {
        this.properties = properties;
        this.key = Keys.hmacShaKeyFor(
                properties.secret().getBytes(StandardCharsets.UTF_8));
    }

    public String issueAccessToken(UserEntity user) {
        return issue(user, ACCESS, properties.accessTtl().toSeconds());
    }

    public String issueRefreshToken(UserEntity user) {
        return issue(user, REFRESH, properties.refreshTtl().toSeconds());
    }

    public TokenData parseAccessToken(String token) {
        return parse(token, ACCESS);
    }

    public TokenData parseRefreshToken(String token) {
        return parse(token, REFRESH);
    }

    public long accessTokenExpiresInSeconds() {
        return properties.accessTtl().toSeconds();
    }

    private String issue(UserEntity user, String type, long expiresInSeconds) {
        Instant now = Instant.now();
        return Jwts.builder()
                .issuer(properties.issuer())
                .subject(user.getId().toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(expiresInSeconds)))
                .claim("username", user.getUsername())
                .claim("role", user.getAccountType().name())
                .claim("type", type)
                .signWith(key)
                .compact();
    }

    private TokenData parse(String token, String expectedType) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .requireIssuer(properties.issuer())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        String type = claims.get("type", String.class);
        if (!expectedType.equals(type)) {
            throw new IllegalArgumentException("Invalid token type");
        }
        return new TokenData(
                UUID.fromString(claims.getSubject()),
                claims.get("username", String.class),
                AccountType.valueOf(claims.get("role", String.class)));
    }

    public record TokenData(
            UUID userId,
            String username,
            AccountType accountType) {
    }
}
