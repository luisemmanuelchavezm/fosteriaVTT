package com.fosteriaVTT.fosteriaVTT_backend.Iniciativa;

public record IniciativaEntrada(
        Long personajeId,
        String nombre,
        String retrato,
        int tirada,
        int bonificacion,
        int total
) {}
