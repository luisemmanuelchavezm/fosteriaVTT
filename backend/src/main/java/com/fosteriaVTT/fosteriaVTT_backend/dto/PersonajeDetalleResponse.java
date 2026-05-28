package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record PersonajeDetalleResponse(
        Long id,
        String nombre,
        String retrato,
        String biografia,
        String sistemaDeJuego,
        String raza,
        String subraza,
        List<ClasePersonajeResponse> clases,
        String caracteristicaLanzamientoConjuros,
        Map<String, Integer> estadisticas,
        List<HabilidadResponse> habilidades,
        List<MochilaPersonajeResponse> mochila,
        LocalDateTime usado,
        String tipo,
        String vd,
        String propietario
) {
}
