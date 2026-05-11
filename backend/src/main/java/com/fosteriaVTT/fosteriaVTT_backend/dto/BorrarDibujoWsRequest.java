package com.fosteriaVTT.fosteriaVTT_backend.dto;

public record BorrarDibujoWsRequest(
        Long pestanaId,
        String capa,
        Long dibujoId
) {
}
