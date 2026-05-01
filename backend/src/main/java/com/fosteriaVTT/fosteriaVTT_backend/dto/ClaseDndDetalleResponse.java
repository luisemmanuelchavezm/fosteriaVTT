package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.util.List;

public record ClaseDndDetalleResponse(
        String id,
        String nombre,
        String insignia,
        String descripcion,
        ClaseDndPuntosGolpeResponse puntosGolpe,
        ClaseDndCompetenciasResponse competencias,
        ClaseDndLanzamientoConjurosResponse lanzamientoConjuros,
        List<ClaseDndSubclaseResponse> subclases,
        List<ClaseDndEleccionResponse> elecciones,
        EquipamientoDndResponse equipamiento
) {
}