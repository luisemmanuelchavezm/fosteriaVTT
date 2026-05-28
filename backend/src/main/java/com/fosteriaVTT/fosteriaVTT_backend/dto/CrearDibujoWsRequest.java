package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.util.List;

public record CrearDibujoWsRequest(
        Long pestanaId,
        String capa,
        String tipo,
        String color,
        Boolean relleno,
        List<PuntoDibujoPayload> puntos
) {
}
