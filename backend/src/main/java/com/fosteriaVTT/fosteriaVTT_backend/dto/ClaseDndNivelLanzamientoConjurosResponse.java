package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.util.List;

public record ClaseDndNivelLanzamientoConjurosResponse(
        int nivel,
        Integer trucosConocidos,
        Integer conjurosConocidos,
        Integer conjurosEnLibro,
        List<Integer> espaciosConjuro,
        Integer ranurasPacto,
        Integer nivelRanuraPacto,
        List<Integer> arcanosMisticos,
        Integer invocacionesConocidas
) {
}