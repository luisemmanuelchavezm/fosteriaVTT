package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.util.List;

public record EquipamientoDndGrupoResponse(
        String id,
        String etiqueta,
        List<EquipamientoDndOpcionResponse> opciones
) {
}