package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.util.List;

public record DndCompetencyCatalogResponse(
        List<String> habilidades,
        List<String> armasArmaduras,
        List<String> herramientas
) {
}