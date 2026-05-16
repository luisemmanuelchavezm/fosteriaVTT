package com.fosteriaVTT.fosteriaVTT_backend.dto;

public record PosicionResponse(
        Long id,
        Long pestanaId,
        String capa,
        Long personajeId,
        String personajeNombre,
        String retrato,
        Integer posicionX,
        Integer posicionY,
        Integer largo,
        Integer ancho
) {
}