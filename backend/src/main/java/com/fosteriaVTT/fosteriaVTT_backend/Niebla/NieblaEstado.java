package com.fosteriaVTT.fosteriaVTT_backend.Niebla;

import java.util.List;

public record NieblaEstado(
        Long pestanaId,
        boolean activa,
        boolean zonasExploradas,
        boolean vistaJugador,
        List<VisionConfigEntry> visionConfigs,
        List<ExploredAreaEntry> exploredAreas
) {}
