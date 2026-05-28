package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.util.Map;

public record CrearNpcRequest(
        String nombre,
        String tipo,
        String sistemaDeJuego,
        String vd,
        String biografia,
        Boolean esPublico,
        Map<String, Integer> estadisticas
) {
}
