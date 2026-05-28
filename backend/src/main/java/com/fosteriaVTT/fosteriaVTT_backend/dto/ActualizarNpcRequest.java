package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.util.Map;

public record ActualizarNpcRequest(
        String nombre,
        String biografia,
        String vd,
        Map<String, Integer> estadisticas
) {}
