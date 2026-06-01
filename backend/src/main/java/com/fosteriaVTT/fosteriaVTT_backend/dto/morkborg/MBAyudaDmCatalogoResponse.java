package com.fosteriaVTT.fosteriaVTT_backend.dto.morkborg;

import java.util.List;

public record MBAyudaDmCatalogoResponse(
        List<MBAyudaDmCategoriaResponse> categorias,
        List<MBAyudaDmSeccionResponse> secciones
) {
}
