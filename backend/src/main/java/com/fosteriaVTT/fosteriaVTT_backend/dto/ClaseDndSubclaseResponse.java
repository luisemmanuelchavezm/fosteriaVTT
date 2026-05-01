package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.util.List;

public record ClaseDndSubclaseResponse(
        String id,
        String nombre,
        String descripcion,
        int nivelDesbloqueo,
        List<ClaseDndTablaResponse> tablas
) {
}