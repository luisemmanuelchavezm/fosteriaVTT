package com.fosteriaVTT.fosteriaVTT_backend.dto;

public record HabilidadResponse(
        Long id,
        String nombre,
        String formula,
        String descripcion,
        String tags
) {
}