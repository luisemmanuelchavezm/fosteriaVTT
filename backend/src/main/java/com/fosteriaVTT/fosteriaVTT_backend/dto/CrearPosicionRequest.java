package com.fosteriaVTT.fosteriaVTT_backend.dto;

public record CrearPosicionRequest(
        Long pestanaId,
        String capa,
        Long personajeId,
        Integer posicionX,
        Integer posicionY
) {
}