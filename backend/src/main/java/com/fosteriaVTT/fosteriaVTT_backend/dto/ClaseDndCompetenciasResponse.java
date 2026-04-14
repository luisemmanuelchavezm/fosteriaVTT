package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.util.List;

public record ClaseDndCompetenciasResponse(
        List<String> armaduras,
        List<String> armas,
        List<String> herramientas,
        List<String> salvaciones,
        List<String> habilidades
) {
}