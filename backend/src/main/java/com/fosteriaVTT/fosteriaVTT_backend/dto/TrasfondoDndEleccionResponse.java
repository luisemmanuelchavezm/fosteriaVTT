package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.util.List;

public record TrasfondoDndEleccionResponse(
        String id,
        String etiqueta,
        String resumen,
        String catalogo,
        int cantidad,
        List<String> opciones
) {
}