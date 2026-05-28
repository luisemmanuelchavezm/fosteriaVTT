package com.fosteriaVTT.fosteriaVTT_backend.dto;

public record AgregarHabilidadNpcRequest(
        String nombre,
        String descripcion,
        String tags,
        String formula,
        Integer bonificacion
) {
}
