package com.fosteriaVTT.fosteriaVTT_backend.dto;

public record HabilidadResponse(
        Long id,
        String nombre,
        Integer bonificacion,
        String formula,
        String descripcion,
        String tags
) {
}