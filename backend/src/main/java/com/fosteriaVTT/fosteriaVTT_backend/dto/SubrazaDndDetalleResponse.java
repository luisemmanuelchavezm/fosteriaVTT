package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.util.List;

public record SubrazaDndDetalleResponse(
        String id,
        String nombre,
        String descripcion,
        List<String> aumentoCaracteristicas,
        List<String> competencias,
        List<RazaDndRasgoResponse> rasgos,
        List<RazaDndEleccionResponse> elecciones
) {
}