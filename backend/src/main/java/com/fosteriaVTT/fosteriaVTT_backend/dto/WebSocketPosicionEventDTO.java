package com.fosteriaVTT.fosteriaVTT_backend.dto;

public record WebSocketPosicionEventDTO(
        String accion,
        Long posicionId,
        PosicionResponse posicion
) {
}
