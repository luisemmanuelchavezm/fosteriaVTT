package com.fosteriaVTT.fosteriaVTT_backend.Chat;

import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndSubclaseResponse;
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
}