package com.fosteriaVTT.fosteriaVTT_backend.dto.morkborg;

import java.util.List;

public record MBAyudaDmBloqueResponse(
        String titulo,
        String descripcion,
        List<String> lista
) {
}
