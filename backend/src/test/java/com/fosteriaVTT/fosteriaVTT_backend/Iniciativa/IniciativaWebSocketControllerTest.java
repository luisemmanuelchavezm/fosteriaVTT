package com.fosteriaVTT.fosteriaVTT_backend.Iniciativa;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IniciativaWebSocketControllerTest {

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    private IniciativaWebSocketController controller;

    @BeforeEach
    void setUp() {
        controller = new IniciativaWebSocketController(messagingTemplate);
    }

    // ── activar ──────────────────────────────────────────────────────────────

    @Test
    void activarConTrueInicializaEstadoYBroadcast() {
        Map<String, Object> payload = Map.of("activa", true);

        controller.activar(1L, payload);

        ArgumentCaptor<IniciativaEstado> captor = ArgumentCaptor.forClass(IniciativaEstado.class);
        verify(messagingTemplate).convertAndSend(
                eq("/topic/campanas/1/iniciativa"),
                captor.capture()
        );
        assertTrue(captor.getValue().activa());
        assertTrue(captor.getValue().entradas().isEmpty());
    }

    @Test
    void activarConFalseEliminaEstadoYBroadcastInactivo() {
        // Primero activar
        controller.activar(2L, Map.of("activa", true));
        reset(messagingTemplate);

        // Luego desactivar
        controller.activar(2L, Map.of("activa", false));

        ArgumentCaptor<IniciativaEstado> captor = ArgumentCaptor.forClass(IniciativaEstado.class);
        verify(messagingTemplate).convertAndSend(
                eq("/topic/campanas/2/iniciativa"),
                captor.capture()
        );
        assertFalse(captor.getValue().activa());
        assertTrue(captor.getValue().entradas().isEmpty());
    }

    @Test
    void activarSinCampoActivaUsaFalse() {
        // payload sin clave "activa" → Boolean.TRUE.equals(null) = false → elimina estado
        controller.activar(3L, Map.of());

        ArgumentCaptor<IniciativaEstado> captor = ArgumentCaptor.forClass(IniciativaEstado.class);
        verify(messagingTemplate).convertAndSend(
                eq("/topic/campanas/3/iniciativa"),
                captor.capture()
        );
        assertFalse(captor.getValue().activa());
    }

    // ── tirar ─────────────────────────────────────────────────────────────────

    @Test
    void tirarAgregaEntradaYOrdenaPorTotalDescendente() {
        controller.activar(10L, Map.of("activa", true));
        reset(messagingTemplate);

        TirarIniciativaRequest req1 = new TirarIniciativaRequest(1L, "Aragorn", null, 15, 3);
        TirarIniciativaRequest req2 = new TirarIniciativaRequest(2L, "Gandalf", null, 10, 5);

        controller.tirar(10L, req1);
        controller.tirar(10L, req2);

        ArgumentCaptor<IniciativaEstado> captor = ArgumentCaptor.forClass(IniciativaEstado.class);
        verify(messagingTemplate, times(2)).convertAndSend(
                eq("/topic/campanas/10/iniciativa"),
                captor.capture()
        );

        IniciativaEstado ultimo = captor.getAllValues().get(1);
        assertEquals(2, ultimo.entradas().size());
        // Aragorn: 15+3=18, Gandalf: 10+5=15 → Aragorn primero
        assertEquals("Aragorn", ultimo.entradas().get(0).nombre());
        assertEquals(18, ultimo.entradas().get(0).total());
    }

    @Test
    void tirarReemplazaEntradaExistenteDeMismoPersonaje() {
        controller.activar(11L, Map.of("activa", true));
        controller.tirar(11L, new TirarIniciativaRequest(5L, "Legolas", null, 12, 4));
        reset(messagingTemplate);

        // Segunda tirada del mismo personaje
        controller.tirar(11L, new TirarIniciativaRequest(5L, "Legolas", null, 20, 4));

        ArgumentCaptor<IniciativaEstado> captor = ArgumentCaptor.forClass(IniciativaEstado.class);
        verify(messagingTemplate).convertAndSend(
                eq("/topic/campanas/11/iniciativa"),
                captor.capture()
        );

        IniciativaEstado estado = captor.getValue();
        assertEquals(1, estado.entradas().size());
        assertEquals(24, estado.entradas().get(0).total());
    }

    @Test
    void tirarEnCampañaSinEstadoPrevioInicializaLaLista() {
        // Sin llamar a activar primero
        controller.tirar(99L, new TirarIniciativaRequest(7L, "Gimli", null, 8, 2));

        ArgumentCaptor<IniciativaEstado> captor = ArgumentCaptor.forClass(IniciativaEstado.class);
        verify(messagingTemplate).convertAndSend(
                eq("/topic/campanas/99/iniciativa"),
                captor.capture()
        );

        assertEquals(1, captor.getValue().entradas().size());
        assertEquals("Gimli", captor.getValue().entradas().get(0).nombre());
    }

    // ── reordenar ─────────────────────────────────────────────────────────────

    @Test
    void reordenarCambiaNuevoOrdenDeEntradas() {
        controller.activar(20L, Map.of("activa", true));
        controller.tirar(20L, new TirarIniciativaRequest(1L, "Frodo", null, 5, 0));
        controller.tirar(20L, new TirarIniciativaRequest(2L, "Sam", null, 3, 0));
        reset(messagingTemplate);

        // Reordenar: primero Sam (2), luego Frodo (1)
        ReordenarIniciativaRequest reordenar = new ReordenarIniciativaRequest(List.of(2L, 1L));
        controller.reordenar(20L, reordenar);

        ArgumentCaptor<IniciativaEstado> captor = ArgumentCaptor.forClass(IniciativaEstado.class);
        verify(messagingTemplate).convertAndSend(
                eq("/topic/campanas/20/iniciativa"),
                captor.capture()
        );

        IniciativaEstado estado = captor.getValue();
        assertEquals(2, estado.entradas().size());
        assertEquals("Sam", estado.entradas().get(0).nombre());
        assertEquals("Frodo", estado.entradas().get(1).nombre());
    }

    @Test
    void reordenarConOrdenNuloNoHaceNada() {
        controller.activar(21L, Map.of("activa", true));
        reset(messagingTemplate);

        controller.reordenar(21L, new ReordenarIniciativaRequest(null));

        verify(messagingTemplate, never()).convertAndSend(any(String.class), any(Object.class));
    }

    @Test
    void reordenarSinEstadoPrevioNoHaceNada() {
        // La campaña 30 nunca fue activada
        controller.reordenar(30L, new ReordenarIniciativaRequest(List.of(1L, 2L)));

        verify(messagingTemplate, never()).convertAndSend(any(String.class), any(Object.class));
    }

    @Test
    void reordenarIgnoraIdsDesconocidos() {
        controller.activar(22L, Map.of("activa", true));
        controller.tirar(22L, new TirarIniciativaRequest(1L, "Bilbo", null, 10, 0));
        reset(messagingTemplate);

        // ID 999 no existe
        controller.reordenar(22L, new ReordenarIniciativaRequest(List.of(1L, 999L)));

        ArgumentCaptor<IniciativaEstado> captor = ArgumentCaptor.forClass(IniciativaEstado.class);
        verify(messagingTemplate).convertAndSend(
                eq("/topic/campanas/22/iniciativa"),
                captor.capture()
        );

        assertEquals(1, captor.getValue().entradas().size());
        assertEquals("Bilbo", captor.getValue().entradas().get(0).nombre());
    }

    // ── records ───────────────────────────────────────────────────────────────

    @Test
    void iniciativaEntradaCalculaTotal() {
        IniciativaEntrada entrada = new IniciativaEntrada(1L, "Thorin", "img.png", 14, 4, 18);
        assertEquals(1L, entrada.personajeId());
        assertEquals("Thorin", entrada.nombre());
        assertEquals(14, entrada.tirada());
        assertEquals(4, entrada.bonificacion());
        assertEquals(18, entrada.total());
    }

    @Test
    void tirarIniciativaRequestAlmacenaDatos() {
        TirarIniciativaRequest req = new TirarIniciativaRequest(5L, "Eowyn", "retrato.png", 20, 3);
        assertEquals(5L, req.personajeId());
        assertEquals("Eowyn", req.nombre());
        assertEquals(20, req.tirada());
        assertEquals(3, req.bonificacion());
    }

    @Test
    void reordenarIniciativaRequestAlmacenaLista() {
        ReordenarIniciativaRequest req = new ReordenarIniciativaRequest(List.of(3L, 1L, 2L));
        assertEquals(List.of(3L, 1L, 2L), req.orden());
    }

    @Test
    void iniciativaEstadoAlmacenaDatos() {
        List<IniciativaEntrada> entradas = List.of(
                new IniciativaEntrada(1L, "Faramir", null, 12, 2, 14)
        );
        IniciativaEstado estado = new IniciativaEstado(true, entradas);
        assertTrue(estado.activa());
        assertEquals(1, estado.entradas().size());
    }
}
