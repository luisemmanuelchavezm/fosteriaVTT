package com.fosteriaVTT.fosteriaVTT_backend.Chat;

import com.fosteriaVTT.fosteriaVTT_backend.dto.CrearMensajeChatRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.MensajeChatResponse;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api/campanas/{campañaId}/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping
    public List<MensajeChatResponse> obtenerMensajesCampania(
            @PathVariable Long campañaId,
            Authentication authentication
    ) {
return chatService.obtenerMensajesCampania(campañaId, authentication.getName());
    }

    @PostMapping
    public MensajeChatResponse enviarMensajeCampania(
            @PathVariable Long campañaId,
            @RequestBody CrearMensajeChatRequest request,
            Authentication authentication
    ) {
return chatService.enviarMensajeCampania(campañaId, request, authentication.getName());
    }
}



