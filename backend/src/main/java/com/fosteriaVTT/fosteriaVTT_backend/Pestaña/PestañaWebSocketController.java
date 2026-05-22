package com.fosteriaVTT.fosteriaVTT_backend.Pestaña;

import com.fosteriaVTT.fosteriaVTT_backend.Campaña.Campaña;
import com.fosteriaVTT.fosteriaVTT_backend.Campaña.CampañaRepository;
import java.util.List;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.transaction.annotation.Transactional;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Controller
public class PestañaWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final CampañaRepository campañaRepository;

    public PestañaWebSocketController(SimpMessagingTemplate messagingTemplate, CampañaRepository campañaRepository) {
        this.messagingTemplate = messagingTemplate;
        this.campañaRepository = campañaRepository;
    }

    public record CambioPestañaPayload(Long pestanaId, List<String> jugadores) {}

    @Transactional(readOnly = true)
    @MessageMapping("/campanas/{campañaId}/pestana/cambio")
    public void forzarCambioPestana(
            @DestinationVariable("campañaId") Long campañaId,
            @Payload CambioPestañaPayload payload,
            Authentication authentication
    ) {
        String username = authentication == null ? null : authentication.getName();

        Campaña campaña = campañaRepository.findById(campañaId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "La campaña no existe"));

        if (campaña.getDm() == null || !campaña.getDm().getUsername().equals(username)) {
            throw new ResponseStatusException(FORBIDDEN, "Solo el DM puede forzar el cambio de pestaña");
        }

        messagingTemplate.convertAndSend(
                "/topic/campanas/" + campañaId + "/pestana/cambio",
                payload
        );
    }
}
