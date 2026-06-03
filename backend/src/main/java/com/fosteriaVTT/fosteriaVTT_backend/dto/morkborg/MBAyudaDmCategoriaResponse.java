package com.fosteriaVTT.fosteriaVTT_backend.dto.morkborg;

import java.util.List;

public record MBAyudaDmCategoriaResponse(
        String id,
        String titulo,
        String color,
        List<String> seccionIds
) {
}
