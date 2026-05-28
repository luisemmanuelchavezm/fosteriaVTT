package com.fosteriaVTT.fosteriaVTT_backend.dto;

public record WebSocketPlayerEventDTO(
        String username,
        boolean dm,
        String eventType
) {
}
