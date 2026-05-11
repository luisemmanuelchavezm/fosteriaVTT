package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.time.LocalDateTime;

public record PestañaCampañaResponse(
        Long id,
        String nombre,
        Integer nCuadriculasX,
        Integer nCuadriculasY,
        Integer distanciaCasilla,
        String sistemaMetrico,
        String nieblaDeGuerra,
        String imagenBaseUrl,
        LocalDateTime ultimaVezUsada
) {
}
