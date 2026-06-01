package com.fosteriaVTT.fosteriaVTT_backend.dto.morkborg;

public record MBRasgoClaseResponse(
        Long id,
        String nombre,
        String descripcion,
        String formula,
        String tags,
        String tipo
) {}
