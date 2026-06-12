package com.fosteriaVTT.fosteriaVTT_backend.Pestaña;

import java.util.Map;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

/**
 * Retransmite a todos los clientes de una campaña los cambios de configuración
 * de cuadrícula de una pestaña (nCuadriculasX/Y, distancia, métrico).
 * El DM publica aquí después de guardar via REST; los jugadores se sincronizan
 * sin tener que recargar la pestaña.
 */
@Controller
public class PestañaWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    public PestañaWebSocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/campanas/{campañaId}/pestana/config")
    public void broadcastConfig(
            @DestinationVariable Long campañaId,
            @Payload Map<String, Object> payload) {
        messagingTemplate.convertAndSend(
                "/topic/campanas/" + campañaId + "/pestana/config", payload);
    }

    @MessageMapping("/campanas/{campañaId}/pestana/cambio")
    public void broadcastCambioPestana(
            @DestinationVariable Long campañaId,
            @Payload Map<String, Object> payload) {
        messagingTemplate.convertAndSend(
                "/topic/campanas/" + campañaId + "/pestana/cambio", payload);
    }
}
