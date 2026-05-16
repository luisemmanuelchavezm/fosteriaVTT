package com.fosteriaVTT.fosteriaVTT_backend.dto;

public record MapaResumenResponse(
        Long id,
        String nombre,
        String mapa,
        boolean esPublico
) {
}
