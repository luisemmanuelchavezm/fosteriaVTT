package com.fosteriaVTT.fosteriaVTT_backend.Chat;

import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndSubclaseResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CrearMensajeChatRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.SeleccionDoteRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.SubirNivelPersonajeRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock
    private ChatRepository chatRepository;

    @InjectMocks
    private ChatService chatService;

    @Test
    void registraUnaEleccionDeProgresionConMetadatosSerializados() {
        Personaje personaje = Personaje.builder()
                .id(9L)
                .nombre("Iria")
                .sistemaDeJuego(SistemaDeJuego.DND)
                .build();
        SubirNivelPersonajeRequest request = new SubirNivelPersonajeRequest(
                "mago",
                "evocacion",
                Map.of("class-skill-0", List.of("Arcano", "Historia")),
                "asi",
                "Inteligencia",
                "Sabiduria",
                new SeleccionDoteRequest(
                        "Iniciado en la magia",
                        "Aprendes conjuros adicionales",
                        null,
                        Map.of("Inteligencia", 1),
                        List.of("Espada larga"),
                        List.of("Arcano"),
                        List.of("Élfico"),
                        List.of("Luz"),
                        "mago"
                )
        );

        chatService.registrarEleccionProgresion(
                personaje,
                "mago",
                4,
                request,
                new ClaseDndSubclaseResponse("evocacion", "Escuela de evocacion", "", 2, List.of())
        );

        ArgumentCaptor<Chat> captor = ArgumentCaptor.forClass(Chat.class);
        verify(chatRepository).save(captor.capture());

        Chat saved = captor.getValue();
        assertTrue(saved.isMensajeLog());
        assertEquals(personaje, saved.getPersonaje());
        assertTrue(saved.getMensaje().startsWith("LEVEL_UP|classId=mago|level=4|"));
        assertTrue(saved.getMensaje().contains("subclaseNombre=Escuela+de+evocacion"));
                assertTrue(saved.getMensaje().contains("eleccionesClase="));
                assertTrue(saved.getMensaje().contains("class-skill-0"));
        assertTrue(saved.getMensaje().contains("doteNombre=Iniciado+en+la+magia"));
    }

    @Test
    void recuperaElUltimoRegistroInternoCoincidenteYOmiteEntradasInvalidas() {
        Personaje personaje = Personaje.builder()
                .id(9L)
                .nombre("Iria")
                .sistemaDeJuego(SistemaDeJuego.DND)
                .build();
        when(chatRepository.findByPersonajeIdAndMensajeLogTrueOrderByIdDesc(9L)).thenReturn(List.of(
                Chat.builder().mensaje("LEVEL_UP|classId=guerrero|level=4").mensajeLog(true).personaje(personaje).build(),
                Chat.builder().mensaje("LEVEL_UP|classId=mago|level=4|subclaseNombre=Escuela+de+evocacion").mensajeLog(true).personaje(personaje).build(),
                Chat.builder().mensaje("mensaje plano").mensajeLog(true).personaje(personaje).build()
        ));

        Map<String, String> evento = chatService.obtenerUltimoRegistroInterno(personaje, "mago", 4).orElseThrow();

        assertEquals("LEVEL_UP", evento.get("tipo"));
        assertEquals("mago", evento.get("classId"));
        assertEquals("4", evento.get("level"));
        assertEquals("Escuela de evocacion", evento.get("subclaseNombre"));
        assertTrue(chatService.obtenerUltimoRegistroInterno(personaje, "mago", 0).isEmpty());
    }

    @Test
    void noGuardaNadaSiFaltanDatosBasicos() {
        chatService.registrarEleccionProgresion(null, "mago", 4, null, null);

        verify(chatRepository, never()).save(any());
    }

    // ── enviarMensajeCampania validaciones tempranas ──────────────────────────

    @Test
    void enviarMensajeCampania_lanzaBadRequestSiRequestEsNulo() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> chatService.enviarMensajeCampania(5L, null, "daria")
        );

        assertEquals(400, ex.getStatusCode().value());
    }

    @Test
    void enviarMensajeCampania_lanzaBadRequestSiMensajeEsBlanco() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> chatService.enviarMensajeCampania(5L, new CrearMensajeChatRequest("   "), "daria")
        );

        assertEquals(400, ex.getStatusCode().value());
    }

    @Test
    void enviarMensajeCampania_lanzaBadRequestSiMensajeEsDemasiadoLargo() {
        String mensajeLargo = "a".repeat(501);

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> chatService.enviarMensajeCampania(5L, new CrearMensajeChatRequest(mensajeLargo), "daria")
        );

        assertEquals(400, ex.getStatusCode().value());
    }

    // ── obtenerUltimoRegistroInterno guardias iniciales ───────────────────────

    @Test
    void obtenerUltimoRegistroInterno_retornaVacioSiPersonajeEsNulo() {
        assertTrue(chatService.obtenerUltimoRegistroInterno(null, "mago", 1).isEmpty());
    }

    @Test
    void obtenerUltimoRegistroInterno_retornaVacioSiClassIdEsBlanco() {
        Personaje personaje = Personaje.builder()
                .id(9L)
                .nombre("Iria")
                .sistemaDeJuego(SistemaDeJuego.DND)
                .build();

        assertTrue(chatService.obtenerUltimoRegistroInterno(personaje, "  ", 1).isEmpty());
    }

    @Test
    void obtenerUltimoRegistroInterno_retornaVacioSiClassIdEsNulo() {
        Personaje personaje = Personaje.builder()
                .id(9L)
                .nombre("Iria")
                .sistemaDeJuego(SistemaDeJuego.DND)
                .build();

        assertTrue(chatService.obtenerUltimoRegistroInterno(personaje, null, 1).isEmpty());
    }

    // ── registrarEleccionProgresion sin dote ─────────────────────────────────

    @Test
    void registrarEleccionProgresionSinDoteNoLanzaExcepcion() {
        Personaje personaje = Personaje.builder()
                .id(9L)
                .nombre("Iria")
                .sistemaDeJuego(SistemaDeJuego.DND)
                .build();
        SubirNivelPersonajeRequest request = new SubirNivelPersonajeRequest(
                "guerrero", null, Map.of(), null, null, null, null
        );

        chatService.registrarEleccionProgresion(personaje, "guerrero", 2, request, null);

        ArgumentCaptor<Chat> captor = ArgumentCaptor.forClass(Chat.class);
        verify(chatRepository).save(captor.capture());
        assertTrue(captor.getValue().getMensaje().startsWith("LEVEL_UP|classId=guerrero|level=2|"));
        assertTrue(captor.getValue().getMensaje().contains("subclaseNombre="));
    }
}