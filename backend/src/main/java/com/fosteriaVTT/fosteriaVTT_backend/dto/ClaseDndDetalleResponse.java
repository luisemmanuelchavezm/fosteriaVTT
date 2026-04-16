package com.fosteriaVTT.fosteriaVTT_backend.dto;

public record ClaseDndDetalleResponse(
        String id,
        String nombre,
        String insignia,
        String descripcion,
        ClaseDndPuntosGolpeResponse puntosGolpe,
        ClaseDndCompetenciasResponse competencias,
        ClaseDndLanzamientoConjurosResponse lanzamientoConjuros,
        EquipamientoDndResponse equipamiento
) {
}