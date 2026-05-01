package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.util.List;
import java.util.Map;

public record SeleccionDoteRequest(
        String nombre,
        String descripcion,
        String formula,
        Map<String, Integer> bonificacionesCaracteristica,
                List<String> competencias,
        List<String> habilidades,
        List<String> idiomas,
        List<String> conjuros,
        String claseConjuros
) {
}