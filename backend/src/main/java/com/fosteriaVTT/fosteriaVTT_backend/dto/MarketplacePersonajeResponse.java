package com.fosteriaVTT.fosteriaVTT_backend.dto;

public record MarketplacePersonajeResponse(
        Long id,
        String nombre,
        String retrato,
        String sistemaDeJuego,
        String tipo,
        String creadorUsername,
        boolean yaTienesCopia
) {}
