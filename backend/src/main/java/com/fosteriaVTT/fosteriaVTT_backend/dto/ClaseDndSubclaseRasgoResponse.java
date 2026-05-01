package com.fosteriaVTT.fosteriaVTT_backend.dto;

public record ClaseDndSubclaseRasgoResponse(
        String subclaseId,
        int nivel,
        String nombre,
        String formula,
        String descripcion
) {
}
