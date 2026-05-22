package com.fosteriaVTT.fosteriaVTT_backend.Niebla;

public record VisionConfigEntry(
        Long posicionId,
        boolean revelaArea,
        String arcType,
        double radius,
        double apertura,
        double rotation,
        double angle,
        double length,
        double width,
        double height
) {}
