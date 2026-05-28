package com.fosteriaVTT.fosteriaVTT_backend.Iniciativa;

public record TirarIniciativaRequest(
        Long personajeId,
        String nombre,
        String retrato,
        int tirada,
        int bonificacion
) {}
