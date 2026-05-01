package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.util.List;

public record RazaDndDetalleResponse(
        String id,
        String nombre,
        String descripcion,
        List<String> aumentoCaracteristicas,
        String edad,
        String tamano,
        int velocidad,
        List<String> idiomas,
        List<String> competencias,
        List<RazaDndRasgoResponse> rasgos,
        List<RazaDndEleccionResponse> elecciones,
        List<SubrazaDndDetalleResponse> subrazas
) {
}