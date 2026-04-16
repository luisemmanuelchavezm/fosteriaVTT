package com.fosteriaVTT.fosteriaVTT_backend.dto;

public record MochilaPersonajeResponse(
        Long id,
        String nombre,
        int cantidad,
        boolean equipado,
        String tags,
        String tipoObjeto
) {
}