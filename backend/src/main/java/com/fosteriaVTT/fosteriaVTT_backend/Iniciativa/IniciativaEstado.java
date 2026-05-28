package com.fosteriaVTT.fosteriaVTT_backend.Iniciativa;

import java.util.List;

public record IniciativaEstado(
        boolean activa,
        List<IniciativaEntrada> entradas
) {}
