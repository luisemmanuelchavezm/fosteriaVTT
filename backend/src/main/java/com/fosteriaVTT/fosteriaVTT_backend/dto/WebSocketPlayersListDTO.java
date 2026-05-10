package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.util.List;

public record WebSocketPlayersListDTO(
        List<JugadorCampañaResponse> players
) {
}
