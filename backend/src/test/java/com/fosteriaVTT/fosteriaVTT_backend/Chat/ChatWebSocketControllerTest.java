package com.fosteriaVTT.fosteriaVTT_backend.Chat;

import com.fosteriaVTT.fosteriaVTT_backend.dto.CrearMensajeChatRequest;
import java.security.Principal;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ChatWebSocketControllerTest {

    @Mock
    private ChatService chatService;

    @InjectMocks
    private ChatWebSocketController controller;

    @Test
    void enviarMensaje_delegaEnChatService() {
        Principal principal = () -> "daria";
        CrearMensajeChatRequest request = new CrearMensajeChatRequest("Hola!");

        controller.enviarMensajeCampania(5L, request, principal);

        verify(chatService).enviarMensajeCampania(5L, request, "daria");
    }

    @Test
    void enviarMensaje_usaNullComoPrincipalCuandoEsNulo() {
        CrearMensajeChatRequest request = new CrearMensajeChatRequest("Hola!");

        controller.enviarMensajeCampania(5L, request, null);

        verify(chatService).enviarMensajeCampania(5L, request, null);
    }
}
