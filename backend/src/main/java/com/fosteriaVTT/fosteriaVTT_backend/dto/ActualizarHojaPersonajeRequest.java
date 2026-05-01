package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.util.List;
import java.util.Map;

public record ActualizarHojaPersonajeRequest(
        String nombre,
        String alineamiento,
        String historiaPersonal,
        String idiomasTexto,
        List<String> competenciasArmasArmaduras,
        List<String> competenciasHerramientas,
        Map<String, Integer> estadisticasBase,
        Integer movimiento,
        Integer vidaMaxima,
        Map<Integer, Integer> espaciosConjuroMaximos,
        Map<Integer, Integer> espaciosConjuroActuales,
        Map<Integer, Integer> recursosExtraMaximos,
        Map<Integer, Integer> recursosExtraActuales,
        List<String> salvacionesCompetentes,
        List<String> habilidadesCompetentes
) {
}