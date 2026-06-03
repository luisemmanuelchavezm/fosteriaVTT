package com.fosteriaVTT.fosteriaVTT_backend.dto;

public record ObjetoCatalogoResponse(
        Long id,
        String nombre,
        String formula,
        String descripcion,
        String tipoObjeto,
        String tags
) {
}