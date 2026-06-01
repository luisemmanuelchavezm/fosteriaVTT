package com.fosteriaVTT.fosteriaVTT_backend.dto.morkborg;

import java.util.List;

public record EscoriaEspecialidadRequest(
        List<Long> habilidadesAEliminar,
        List<Integer> nuevosIdxs
) {}
