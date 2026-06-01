package com.fosteriaVTT.fosteriaVTT_backend.dto;

public record MochilaPersonajeResponse(
        Long id,
        Long objetoId,
        String nombre,
        String formula,
        String descripcion,
        int cantidad,
        boolean equipado,
        String tags,
        String tipoObjeto
) {
}