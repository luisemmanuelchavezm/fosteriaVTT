package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.util.List;
import java.util.Map;

public record SubirNivelPersonajeRequest(
        String claseId,
        String subclaseId,
        Map<String, List<String>> eleccionesClase,
        String modoMejoraCaracteristica,
        String caracteristicaPrimaria,
        String caracteristicaSecundaria,
        SeleccionDoteRequest dote
) {
}