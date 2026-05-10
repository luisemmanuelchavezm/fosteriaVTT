package com.fosteriaVTT.fosteriaVTT_backend.Chat;

import com.fosteriaVTT.fosteriaVTT_backend.dto.CrearMensajeChatRequest;
import java.security.Principal;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Controller
public class ChatWebSocketController {

    private final ChatService chatService;

    public ChatWebSocketController(ChatService chatService) {
        this.chatService = chatService;
    }

    @MessageMapping("/campanas/{campañaId}/chat/enviar")
    public void enviarMensajeCampania(
            @DestinationVariable Long campañaId,
            CrearMensajeChatRequest request,
            Principal principal
    ) {
        String username = principal == null ? null : principal.getName();
        if (username == null || username.isBlank()) {
            throw new ResponseStatusException(UNAUTHORIZED, "Usuario no autenticado");
        }

        chatService.enviarMensajeCampania(campañaId, request, username);
    }
}
