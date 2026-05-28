package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.time.LocalDateTime;

public record WebSocketChatMessageDTO(
        Long id,
        String username,
        String mensaje,
        LocalDateTime enviadoEn
) {
}
