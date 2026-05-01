package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.util.List;

public record EquipamientoDndOpcionResponse(
        String id,
        String etiqueta,
        Integer cantidad,
        ObjetoInicialResponse objeto,
        String catalogo,
        List<ObjetoInicialResponse> opcionesCatalogo
) {
}