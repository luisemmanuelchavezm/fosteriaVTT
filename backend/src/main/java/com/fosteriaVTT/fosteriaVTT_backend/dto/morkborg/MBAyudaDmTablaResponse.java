package com.fosteriaVTT.fosteriaVTT_backend.dto.morkborg;

import java.util.List;

public record MBAyudaDmTablaResponse(
        String titulo,
        List<String> encabezados,
        List<String> anchos,
        List<List<String>> filas
) {
}
