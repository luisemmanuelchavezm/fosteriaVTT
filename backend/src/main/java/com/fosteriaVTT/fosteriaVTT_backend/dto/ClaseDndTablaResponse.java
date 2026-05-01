package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.util.List;

public record ClaseDndTablaResponse(
        String titulo,
        List<String> columnas,
        List<List<String>> filas
) {
}