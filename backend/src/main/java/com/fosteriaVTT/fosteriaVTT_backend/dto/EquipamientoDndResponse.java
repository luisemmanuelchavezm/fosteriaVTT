package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.util.List;

public record EquipamientoDndResponse(
        List<EquipamientoDndOpcionResponse> fijos,
        List<EquipamientoDndGrupoResponse> gruposEleccion
) {
}