package com.fosteriaVTT.fosteriaVTT_backend.dto;

public record WebSocketErrorResponse(
        int status,
        String error,
        String message
) {
}
