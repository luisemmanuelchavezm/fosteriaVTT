package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.util.List;

public record HabilidadNivelResponse(
        Integer nivel,
        List<HabilidadResponse> habilidades
) {
}