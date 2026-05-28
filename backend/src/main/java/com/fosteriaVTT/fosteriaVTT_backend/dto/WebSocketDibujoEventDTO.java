package com.fosteriaVTT.fosteriaVTT_backend.dto;

public record WebSocketDibujoEventDTO(
        String accion,
        Long dibujoId,
        DibujoResponse dibujo
) {
}
