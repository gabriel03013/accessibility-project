package com.partiuquadra.api.exception;

import org.springframework.http.HttpStatus;

public final class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    public ApiException(HttpStatus status, String code, String userMessage) {
        super(userMessage);
        this.status = status;
        this.code = code;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }
}

