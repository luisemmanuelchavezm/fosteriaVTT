package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record DibujoResponse(
        Long id,
        Long pestanaId,
        String capa,
        String tipo,
        String color,
        boolean relleno,
        Integer largo,
        Integer ancho,
        List<PuntoDibujoPayload> puntos,
        LocalDateTime actualizadoEn
) {
}
