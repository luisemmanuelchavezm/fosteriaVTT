package com.fosteriaVTT.fosteriaVTT_backend.Capa;

import com.fosteriaVTT.fosteriaVTT_backend.dto.AsignarMapaCapaRequest;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

@Controller
public class CapaWebSocketController {

    private final CapaService capaService;

    public CapaWebSocketController(CapaService capaService) {
        this.capaService = capaService;
    }

    @MessageMapping("/campanas/{campaniaId}/capas/mapa/asignar")
    public void asignarMapa(
            @DestinationVariable("campaniaId") Long campañaId,
            @Payload AsignarMapaCapaRequest request,
            Authentication authentication
    ) {
        String username = authentication == null ? null : authentication.getName();
        capaService.asignarMapaACapaYEmitir(campañaId, request, username);
    }
}
