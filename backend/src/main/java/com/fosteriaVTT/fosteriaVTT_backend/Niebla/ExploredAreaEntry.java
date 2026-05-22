package com.fosteriaVTT.fosteriaVTT_backend.Niebla;

public record ExploredAreaEntry(
        String id,
        double posicionX,
        double posicionY,
        String arcType,
        double radius,
        double apertura,
        double rotation,
        double angle,
        double length,
        double width,
        double height
) {}
