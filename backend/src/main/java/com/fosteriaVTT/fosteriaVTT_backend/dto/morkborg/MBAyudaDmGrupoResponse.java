package com.fosteriaVTT.fosteriaVTT_backend.dto.morkborg;

import java.util.List;

public record MBAyudaDmGrupoResponse(
        String titulo,
        List<String> entradas,
        List<String> etiquetas
) {
}
