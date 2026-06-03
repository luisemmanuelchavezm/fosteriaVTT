package com.fosteriaVTT.fosteriaVTT_backend.dto.morkborg;

import java.util.Map;

public record ActualizarSuministrosMBRequest(
        Integer plata,
        Integer comida,
        Map<Integer, Integer> decocciones
) {}
