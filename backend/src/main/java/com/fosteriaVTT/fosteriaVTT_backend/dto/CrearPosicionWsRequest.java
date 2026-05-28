package com.fosteriaVTT.fosteriaVTT_backend.dto;

public record CrearPosicionWsRequest(
        Long pestanaId,
        String capa,
        Long personajeId,
        Integer posicionX,
        Integer posicionY
) {
}
