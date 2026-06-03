package com.fosteriaVTT.fosteriaVTT_backend.dto.morkborg;

import java.util.List;

public record MBAyudaDmSeccionResponse(
        String id,
        String titulo,
        String dado,
        List<String> entradas,
        List<String> etiquetas,
        String descripcion,
        List<MBAyudaDmGrupoResponse> grupos,
        List<MBAyudaDmColumnaResponse> columnas,
        String nota,
        List<MBAyudaDmTablaResponse> tablas,
        String layout
) {
}
