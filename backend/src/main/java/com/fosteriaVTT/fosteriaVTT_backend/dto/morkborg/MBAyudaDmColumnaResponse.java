package com.fosteriaVTT.fosteriaVTT_backend.dto.morkborg;

import java.util.List;

public record MBAyudaDmColumnaResponse(
        String titulo,
        String descripcion,
        List<String> lista,
        List<MBAyudaDmBloqueResponse> bloques
) {
}
