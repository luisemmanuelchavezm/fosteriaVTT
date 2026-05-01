package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.util.List;
import java.util.Map;

public record CrearPersonajeDndRequest(
        String nombre,
        String claseId,
        String subclaseId,
        String trasfondoId,
        String razaId,
        String subrazaId,
        String alineamiento,
        String historiaPersonal,
        Map<String, Integer> estadisticas,
        List<String> competenciasClase,
        Map<String, List<String>> eleccionesClase,
        Map<String, List<String>> eleccionesTrasfondo,
        Map<String, List<String>> eleccionesRaza,
        Map<String, Integer> gruposEquipamiento,
        Map<String, Long> catalogosEquipamiento
) {
}