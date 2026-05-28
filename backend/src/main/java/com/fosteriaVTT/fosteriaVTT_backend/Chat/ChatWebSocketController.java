package com.fosteriaVTT.fosteriaVTT_backend.Chat;

import com.fosteriaVTT.fosteriaVTT_backend.dto.CrearMensajeChatRequest;
import java.security.Principal;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

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
        chatService.enviarMensajeCampania(campañaId, request, username);
    }
}
