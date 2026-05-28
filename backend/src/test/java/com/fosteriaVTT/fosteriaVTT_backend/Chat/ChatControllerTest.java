package com.fosteriaVTT.fosteriaVTT_backend.Chat;

import com.fosteriaVTT.fosteriaVTT_backend.dto.CrearMensajeChatRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.MensajeChatResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ChatControllerTest {

    private static final LocalDateTime TIMESTAMP = LocalDateTime.of(2026, 5, 1, 12, 0);

    @Mock
    private ChatService chatService;

    @InjectMocks
    private ChatController chatController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(chatController).build();
    }

    @Test
    void obtenerMensajesDevuelveLaListaDelServicio() {
        List<MensajeChatResponse> mensajes = List.of(
                new MensajeChatResponse(1L, "usuario1", "Hola aventureros", TIMESTAMP),
                new MensajeChatResponse(2L, "usuario2", "¡Al ataque!", TIMESTAMP.plusMinutes(1))
        );
        TestingAuthenticationToken auth = new TestingAuthenticationToken("maestrodungeon", null);
        auth.setAuthenticated(true);

        when(chatService.obtenerMensajesCampania(42L, "maestrodungeon")).thenReturn(mensajes);

        List<MensajeChatResponse> resultado = chatController.obtenerMensajesCampania(42L, auth);

        assertEquals(2, resultado.size());
        assertEquals("Hola aventureros", resultado.get(0).mensaje());
        verify(chatService).obtenerMensajesCampania(42L, "maestrodungeon");
    }

    @Test
    void obtenerMensajesViaHttpDevuelveJson() throws Exception {
        List<MensajeChatResponse> mensajes = List.of(
                new MensajeChatResponse(10L, "elena", "Preparad los hechizos", TIMESTAMP)
        );

        when(chatService.obtenerMensajesCampania(eq(7L), any())).thenReturn(mensajes);

        mockMvc.perform(get("/api/campanas/7/chat")
                        .principal(new TestingAuthenticationToken("elena", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("elena"))
                .andExpect(jsonPath("$[0].mensaje").value("Preparad los hechizos"));
    }

    @Test
    void enviarMensajeDevuelveElMensajeCreado() {
        CrearMensajeChatRequest request = new CrearMensajeChatRequest("¡Victoria!");
        MensajeChatResponse respuesta = new MensajeChatResponse(5L, "jugador1", "¡Victoria!", TIMESTAMP);
        TestingAuthenticationToken auth = new TestingAuthenticationToken("jugador1", null);
        auth.setAuthenticated(true);

        when(chatService.enviarMensajeCampania(eq(3L), eq(request), eq("jugador1"))).thenReturn(respuesta);

        MensajeChatResponse resultado = chatController.enviarMensajeCampania(3L, request, auth);

        assertEquals("¡Victoria!", resultado.mensaje());
        assertEquals("jugador1", resultado.username());
        verify(chatService).enviarMensajeCampania(3L, request, "jugador1");
    }

    @Test
    void enviarMensajeViaHttpDevuelveJson() throws Exception {
        MensajeChatResponse respuesta = new MensajeChatResponse(8L, "rogue", "Me escondo", TIMESTAMP);

        when(chatService.enviarMensajeCampania(eq(15L), any(), any())).thenReturn(respuesta);

        mockMvc.perform(post("/api/campanas/15/chat")
                        .principal(new TestingAuthenticationToken("rogue", null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"mensaje\":\"Me escondo\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(8))
                .andExpect(jsonPath("$.username").value("rogue"))
                .andExpect(jsonPath("$.mensaje").value("Me escondo"));
    }

    @Test
    void obtenerMensajesConListaVaciaDevuelveArrayVacio() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("dm", null);
        when(chatService.obtenerMensajesCampania(99L, "dm")).thenReturn(List.of());

        List<MensajeChatResponse> resultado = chatController.obtenerMensajesCampania(99L, auth);

        assertEquals(0, resultado.size());
    }
}
