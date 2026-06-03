package com.fosteriaVTT.fosteriaVTT_backend.dto.morkborg;

public record MejorarPersonajeMBRequest(
        Integer modFuerza,
        Integer modAgilidad,
        Integer modPresencia,
        Integer modResistencia,
        Integer vidaMaxima,
        Integer plataGanada
) {}
