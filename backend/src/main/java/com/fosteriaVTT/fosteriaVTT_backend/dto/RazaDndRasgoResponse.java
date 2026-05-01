package com.fosteriaVTT.fosteriaVTT_backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

public record RazaDndRasgoResponse(
        @JsonAlias("nombre")
        String titulo,
        String descripcion
) {
}