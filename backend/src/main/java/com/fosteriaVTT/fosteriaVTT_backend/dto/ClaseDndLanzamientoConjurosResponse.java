package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.util.List;

public record ClaseDndLanzamientoConjurosResponse(
        String modo,
        String caracteristica,
        String formulaConjurosPreparados,
        List<ClaseDndNivelLanzamientoConjurosResponse> niveles
) {
}