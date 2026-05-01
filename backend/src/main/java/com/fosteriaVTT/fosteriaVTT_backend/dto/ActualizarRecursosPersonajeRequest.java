package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.util.Map;

public record ActualizarRecursosPersonajeRequest(
        Integer vidaActual,
        Integer vidaTemporal,
        Map<Integer, Integer> espaciosConjuroActuales,
        Map<Integer, Integer> recursosExtraActuales,
        Map<String, Integer> dinero
) {
}