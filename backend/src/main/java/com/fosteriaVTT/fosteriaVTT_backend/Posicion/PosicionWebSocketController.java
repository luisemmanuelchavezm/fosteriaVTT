package com.fosteriaVTT.fosteriaVTT_backend.Posicion;

import com.fosteriaVTT.fosteriaVTT_backend.dto.CrearPosicionWsRequest;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

@Controller
public class PosicionWebSocketController {

    private final PosicionService posicionService;

    public PosicionWebSocketController(PosicionService posicionService) {
        this.posicionService = posicionService;
    }

    @MessageMapping("/campanas/{campañaId}/posiciones/crear")
    public void crearPosicion(
            @DestinationVariable("campañaId") Long campañaId,
            @Payload CrearPosicionWsRequest request,
            Authentication authentication
    ) {
        String username = authentication == null ? null : authentication.getName();
        posicionService.crearOActualizarPosicionYEmitir(campañaId, request, username);
    }

    @MessageMapping("/campanas/{campañaId}/posiciones/mover")
    public void moverPosicion(
            @DestinationVariable("campañaId") Long campañaId,
            @Payload PosicionMovePayload payload,
            Authentication authentication
    ) {
        String username = authentication == null ? null : authentication.getName();
        posicionService.moverPosicionYEmitir(campañaId, payload, username);
    }

    @MessageMapping("/campanas/{campañaId}/posiciones/cambiarCapa")
    public void cambiarCapaPosicion(
            @DestinationVariable("campañaId") Long campañaId,
            @Payload CambiarCapaPayload payload,
            Authentication authentication
    ) {
        String username = authentication == null ? null : authentication.getName();
        posicionService.cambiarCapaYEmitir(campañaId, payload, username);
    }

    public record PosicionMovePayload(
            Long posicionId,
            Integer posicionX,
            Integer posicionY
    ) {}

    public record CambiarCapaPayload(Long posicionId, String capa) {}
}
