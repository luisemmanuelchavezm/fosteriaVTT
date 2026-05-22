package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.time.LocalDateTime;

public record PersonajeResumenResponse(
        Long id,
        String nombre,
        String retrato,
        String sistemaDeJuego,
        LocalDateTime usado,
        String tipo
) {
}