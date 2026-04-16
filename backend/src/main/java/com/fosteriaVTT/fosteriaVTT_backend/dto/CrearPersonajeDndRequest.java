package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.util.List;
import java.util.Map;

public record CrearPersonajeDndRequest(
        String nombre,
        String claseId,
        String trasfondoId,
        String razaId,
        String subrazaId,
        Map<String, Integer> estadisticas,
        List<String> competenciasClase,
        Map<String, List<String>> eleccionesTrasfondo,
        Map<String, List<String>> eleccionesRaza,
        Map<String, Integer> gruposEquipamiento,
        Map<String, Long> catalogosEquipamiento
) {
}