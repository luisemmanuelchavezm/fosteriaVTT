package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.util.List;

public record TrasfondoDndDetalleResponse(
        String id,
        String nombre,
        String descripcion,
        List<String> competenciasHabilidades,
        List<String> competenciasHerramientas,
        List<String> resumenIdiomas,
        String nombreRasgo,
        String descripcionRasgo,
        List<TrasfondoDndEleccionResponse> elecciones,
        EquipamientoDndResponse equipamiento
) {
}