package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.time.LocalDateTime;

public record CampañaResumenResponse(
        Long id,
        String nombre,
        String portadaUrl,
        String sistemaDeJuego,
        String dmUsername,
        LocalDateTime ultimaVezAccedido
) {
}