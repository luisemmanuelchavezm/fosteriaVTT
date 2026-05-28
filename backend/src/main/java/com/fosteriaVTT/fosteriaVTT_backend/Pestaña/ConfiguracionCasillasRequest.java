package com.fosteriaVTT.fosteriaVTT_backend.Pestaña;

public record ConfiguracionCasillasRequest(
        Integer nCuadriculasX,
        Integer nCuadriculasY,
        Integer distanciaCasilla,
        String sistemaMetrico
) {}
