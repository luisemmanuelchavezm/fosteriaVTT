package com.fosteriaVTT.fosteriaVTT_backend.Chat;

import com.fosteriaVTT.fosteriaVTT_backend.Campaña.CampañaService;
import com.fosteriaVTT.fosteriaVTT_backend.dto.JugadorCampañaResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.WebSocketPlayersListDTO;
import java.util.List;
import java.util.Map;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class CampaignWebSocketPresenceListener {

    private final CampañaService campañaService;
    private final SimpMessagingTemplate messagingTemplate;

    public CampaignWebSocketPresenceListener(
            CampañaService campañaService,
            SimpMessagingTemplate messagingTemplate
    ) {
        this.campañaService = campañaService;
        this.messagingTemplate = messagingTemplate;
    }

    @EventListener
    public void onSessionConnected(SessionConnectedEvent event) {
        broadcastPlayers(event.getMessage());
    }

    @EventListener
    public void onSessionDisconnected(SessionDisconnectEvent event) {
        broadcastPlayers(event.getMessage());
    }

    private void broadcastPlayers(Message<byte[]> message) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
        if (sessionAttributes == null) {
            return;
        }

        Long campaignId = coerceCampaignId(sessionAttributes.get("campaignId"));
        String username = coerceUsername(sessionAttributes.get("username"));
        if (campaignId == null || username == null) {
            return;
        }

        try {
            List<JugadorCampañaResponse> players = campañaService.obtenerJugadoresCampaña(campaignId, username);
            messagingTemplate.convertAndSend(
                    "/topic/campanas/" + campaignId + "/jugadores",
                    new WebSocketPlayersListDTO(players)
            );
        } catch (RuntimeException ignored) {
            // Si la sesión no tiene permisos o la campaña no existe, no se publica presencia.
        }
    }

    private Long coerceCampaignId(Object value) {
        if (value instanceof Number number) {
            long parsed = number.longValue();
            return parsed > 0 ? parsed : null;
        }

        if (value instanceof String text) {
            try {
                long parsed = Long.parseLong(text);
                return parsed > 0 ? parsed : null;
            } catch (NumberFormatException ignored) {
                return null;
            }
        }

        return null;
    }

    private String coerceUsername(Object value) {
        if (value == null) {
            return null;
        }

        String username = value.toString().trim();
        return username.isEmpty() ? null : username;
    }
}
