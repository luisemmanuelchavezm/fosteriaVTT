package com.fosteriaVTT.fosteriaVTT_backend.dto;

public record CapaMapaResponse(
        Long capaId,
        Long pestanaId,
        Long mapaId,
        String mapaUrl
) {
}
