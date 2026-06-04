package com.fosteriaVTT.fosteriaVTT_backend.Niebla;

import com.fosteriaVTT.fosteriaVTT_backend.Pestaña.Pestaña;
import com.fosteriaVTT.fosteriaVTT_backend.Pestaña.PestañaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NieblaWebSocketControllerTest {

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private PestañaRepository pestañaRepository;

    private NieblaWebSocketController controller;

    @BeforeEach
    void setUp() {
        controller = new NieblaWebSocketController(messagingTemplate, pestañaRepository);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private Pestaña pestañaVacia(Long id) {
        Pestaña p = new Pestaña();
        p.setNieblaDeGuerra(null);
        return p;
    }

    // ── solicitar ─────────────────────────────────────────────────────────────

    @Test
    void solicitarConPestanaExistenteBroadcastaEstadoInicial() {
        when(pestañaRepository.findById(1L)).thenReturn(Optional.of(pestañaVacia(1L)));

        controller.solicitar(10L, Map.of("pestanaId", 1));

        ArgumentCaptor<NieblaEstado> captor = ArgumentCaptor.forClass(NieblaEstado.class);
        verify(messagingTemplate).convertAndSend(
                eq("/topic/campanas/10/niebla"),
                captor.capture()
        );
        NieblaEstado estado = captor.getValue();
        assertFalse(estado.activa());
        assertFalse(estado.zonasExploradas());
        assertFalse(estado.vistaJugador());
    }

    @Test
    void solicitarSinPestanaIdNoHaceNada() {
        controller.solicitar(10L, Map.of());
        verify(messagingTemplate, never()).convertAndSend(any(String.class), any(Object.class));
    }

    @Test
    void solicitarConPestanaNoEncontradaUsaEstadoVacio() {
        when(pestañaRepository.findById(99L)).thenReturn(Optional.empty());

        controller.solicitar(10L, Map.of("pestanaId", 99));

        ArgumentCaptor<NieblaEstado> captor = ArgumentCaptor.forClass(NieblaEstado.class);
        verify(messagingTemplate).convertAndSend(
                eq("/topic/campanas/10/niebla"),
                captor.capture()
        );
        assertFalse(captor.getValue().activa());
    }

    // ── configurar ────────────────────────────────────────────────────────────

    @Test
    void configurarActivaLaNiebla() {
        Pestaña pestaña = pestañaVacia(2L);
        when(pestañaRepository.findById(2L)).thenReturn(Optional.of(pestaña));
        when(pestañaRepository.save(any())).thenReturn(pestaña);

        Map<String, Object> payload = Map.of(
                "pestanaId", 2,
                "activa", true,
                "zonasExploradas", false,
                "vistaJugador", false
        );
        controller.configurar(5L, payload);

        ArgumentCaptor<NieblaEstado> captor = ArgumentCaptor.forClass(NieblaEstado.class);
        verify(messagingTemplate).convertAndSend(
                eq("/topic/campanas/5/niebla"),
                captor.capture()
        );
        assertTrue(captor.getValue().activa());
    }

    @Test
    void configurarSinPestanaIdNoHaceNada() {
        controller.configurar(5L, Map.of("activa", true));
        verify(messagingTemplate, never()).convertAndSend(any(String.class), any(Object.class));
    }

    @Test
    void configurarConZonasExploradasYVistaJugador() {
        Pestaña pestaña = pestañaVacia(3L);
        when(pestañaRepository.findById(3L)).thenReturn(Optional.of(pestaña));
        when(pestañaRepository.save(any())).thenReturn(pestaña);

        Map<String, Object> payload = Map.of(
                "pestanaId", 3,
                "activa", true,
                "zonasExploradas", true,
                "vistaJugador", true
        );
        controller.configurar(6L, payload);

        ArgumentCaptor<NieblaEstado> captor = ArgumentCaptor.forClass(NieblaEstado.class);
        verify(messagingTemplate).convertAndSend(eq("/topic/campanas/6/niebla"), captor.capture());

        NieblaEstado estado = captor.getValue();
        assertTrue(estado.activa());
        assertTrue(estado.zonasExploradas());
        assertTrue(estado.vistaJugador());
    }

    // ── configurarVision ──────────────────────────────────────────────────────

    @Test
    void configurarVisionAgregaEntradaDeVision() {
        Pestaña pestaña = pestañaVacia(4L);
        when(pestañaRepository.findById(4L)).thenReturn(Optional.of(pestaña));
        when(pestañaRepository.save(any())).thenReturn(pestaña);

        Map<String, Object> payload = new HashMap<>();
        payload.put("pestanaId", 4);
        payload.put("posicionId", 10);
        payload.put("revelaArea", true);
        payload.put("arcType", "circle");
        payload.put("radius", 6.0);
        payload.put("apertura", 360.0);
        payload.put("rotation", 0.0);
        payload.put("angle", 45.0);
        payload.put("length", 8.0);
        payload.put("width", 4.0);
        payload.put("height", 6.0);
        controller.configurarVision(7L, payload);

        ArgumentCaptor<NieblaEstado> captor = ArgumentCaptor.forClass(NieblaEstado.class);
        verify(messagingTemplate).convertAndSend(eq("/topic/campanas/7/niebla"), captor.capture());

        NieblaEstado estado = captor.getValue();
        assertEquals(1, estado.visionConfigs().size());
        VisionConfigEntry vision = estado.visionConfigs().get(0);
        assertEquals(10L, vision.posicionId());
        assertTrue(vision.revelaArea());
        assertEquals("circle", vision.arcType());
    }

    @Test
    void configurarVisionSinPestanaIdNoHaceNada() {
        controller.configurarVision(7L, Map.of("posicionId", 1));
        verify(messagingTemplate, never()).convertAndSend(any(String.class), any(Object.class));
    }

    @Test
    void configurarVisionSinPosicionIdNoHaceNada() {
        controller.configurarVision(7L, Map.of("pestanaId", 1));
        verify(messagingTemplate, never()).convertAndSend(any(String.class), any(Object.class));
    }

    @Test
    void configurarVisionReemplazaEntradaExistente() {
        Pestaña pestaña = pestañaVacia(5L);
        when(pestañaRepository.findById(5L)).thenReturn(Optional.of(pestaña));
        when(pestañaRepository.save(any())).thenReturn(pestaña);

        Map<String, Object> payload1 = new HashMap<>();
        payload1.put("pestanaId", 5); payload1.put("posicionId", 20);
        payload1.put("radius", 5.0); payload1.put("revelaArea", false);
        payload1.put("arcType", "circle"); payload1.put("apertura", 360.0);
        payload1.put("rotation", 0.0); payload1.put("angle", 45.0);
        payload1.put("length", 8.0); payload1.put("width", 4.0); payload1.put("height", 6.0);
        controller.configurarVision(8L, payload1);

        Map<String, Object> payload2 = new HashMap<>();
        payload2.put("pestanaId", 5); payload2.put("posicionId", 20);
        payload2.put("radius", 10.0); payload2.put("revelaArea", true);
        payload2.put("arcType", "cone"); payload2.put("apertura", 90.0);
        payload2.put("rotation", 45.0); payload2.put("angle", 60.0);
        payload2.put("length", 12.0); payload2.put("width", 6.0); payload2.put("height", 8.0);
        controller.configurarVision(8L, payload2);

        ArgumentCaptor<NieblaEstado> captor = ArgumentCaptor.forClass(NieblaEstado.class);
        verify(messagingTemplate, times(2)).convertAndSend(eq("/topic/campanas/8/niebla"), captor.capture());

        NieblaEstado ultimo = captor.getAllValues().get(1);
        assertEquals(1, ultimo.visionConfigs().size());
        assertEquals(10.0, ultimo.visionConfigs().get(0).radius());
    }

    // ── explorar ──────────────────────────────────────────────────────────────

    @Test
    void agregarAreaExploradaGuardaEnEstado() {
        Pestaña pestaña = pestañaVacia(6L);
        when(pestañaRepository.findById(6L)).thenReturn(Optional.of(pestaña));
        when(pestañaRepository.save(any())).thenReturn(pestaña);

        Map<String, Object> payload = new HashMap<>();
        payload.put("pestanaId", 6);
        payload.put("id", "area-001");
        payload.put("posicionX", 100.0);
        payload.put("posicionY", 200.0);
        payload.put("arcType", "semicircle");
        payload.put("radius", 6.0);
        payload.put("apertura", 180.0);
        payload.put("rotation", 0.0);
        payload.put("angle", 45.0);
        payload.put("length", 8.0);
        payload.put("width", 4.0);
        payload.put("height", 6.0);
        payload.put("tokenSize", 1.0);
        controller.agregarAreaExplorada(9L, payload);

        ArgumentCaptor<NieblaEstado> captor = ArgumentCaptor.forClass(NieblaEstado.class);
        verify(messagingTemplate).convertAndSend(eq("/topic/campanas/9/niebla"), captor.capture());

        NieblaEstado estado = captor.getValue();
        assertEquals(1, estado.exploredAreas().size());
        assertEquals("area-001", estado.exploredAreas().get(0).id());
    }

    @Test
    void agregarAreaExploradaSinPestanaIdNoHaceNada() {
        controller.agregarAreaExplorada(9L, Map.of("id", "area-001"));
        verify(messagingTemplate, never()).convertAndSend(any(String.class), any(Object.class));
    }

    @Test
    void agregarAreaExploradaSinIdNoHaceNada() {
        controller.agregarAreaExplorada(9L, Map.of("pestanaId", 1));
        verify(messagingTemplate, never()).convertAndSend(any(String.class), any(Object.class));
    }

    // ── explorar/batch ────────────────────────────────────────────────────────

    @Test
    void agregarAreasExploradasBatchProcesaVariasAreas() {
        Pestaña pestaña = pestañaVacia(7L);
        when(pestañaRepository.findById(7L)).thenReturn(Optional.of(pestaña));
        when(pestañaRepository.save(any())).thenReturn(pestaña);

        Map<String, Object> area1 = new HashMap<>();
        area1.put("id", "b1"); area1.put("posicionX", 0.0); area1.put("posicionY", 0.0);
        area1.put("arcType", "circle"); area1.put("radius", 5.0); area1.put("apertura", 360.0);
        area1.put("rotation", 0.0); area1.put("angle", 45.0); area1.put("length", 8.0);
        area1.put("width", 4.0); area1.put("height", 6.0); area1.put("tokenSize", 1.0);

        Map<String, Object> area2 = new HashMap<>();
        area2.put("id", "b2"); area2.put("posicionX", 10.0); area2.put("posicionY", 10.0);
        area2.put("arcType", "cone"); area2.put("radius", 6.0); area2.put("apertura", 90.0);
        area2.put("rotation", 30.0); area2.put("angle", 60.0); area2.put("length", 10.0);
        area2.put("width", 5.0); area2.put("height", 7.0); area2.put("tokenSize", 1.5);

        List<Map<String, Object>> areas = List.of(area1, area2);
        Map<String, Object> payload = new HashMap<>();
        payload.put("pestanaId", 7);
        payload.put("areas", areas);
        controller.agregarAreasExploradasBatch(11L, payload);

        ArgumentCaptor<NieblaEstado> captor = ArgumentCaptor.forClass(NieblaEstado.class);
        verify(messagingTemplate).convertAndSend(eq("/topic/campanas/11/niebla"), captor.capture());

        NieblaEstado estado = captor.getValue();
        assertEquals(2, estado.exploredAreas().size());
    }

    @Test
    void agregarAreasExploradasBatchSinPestanaIdNoHaceNada() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("areas", List.of());
        controller.agregarAreasExploradasBatch(11L, payload);
        verify(messagingTemplate, never()).convertAndSend(any(String.class), any(Object.class));
    }

    @Test
    void agregarAreasExploradasBatchConListaVaciaNoHaceNada() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("pestanaId", 1);
        payload.put("areas", List.of());
        controller.agregarAreasExploradasBatch(11L, payload);
        verify(messagingTemplate, never()).convertAndSend(any(String.class), any(Object.class));
    }

    // ── NieblaEstado record ───────────────────────────────────────────────────

    @Test
    void nieblaEstadoAlmacenaDatos() {
        VisionConfigEntry vision = new VisionConfigEntry(1L, true, "circle", 6.0, 360.0, 0.0, 45.0, 8.0, 4.0, 6.0);
        ExploredAreaEntry area = new ExploredAreaEntry("a1", 0.0, 0.0, "circle", 5.0, 360.0, 0.0, 45.0, 8.0, 4.0, 6.0, 1.0);
        NieblaEstado estado = new NieblaEstado(1L, true, true, false, List.of(vision), List.of(area));

        assertEquals(1L, estado.pestanaId());
        assertTrue(estado.activa());
        assertTrue(estado.zonasExploradas());
        assertFalse(estado.vistaJugador());
        assertEquals(1, estado.visionConfigs().size());
        assertEquals(1, estado.exploredAreas().size());
    }

    @Test
    void exploredAreaEntryAlmacenaDatos() {
        ExploredAreaEntry area = new ExploredAreaEntry("x1", 5.0, 10.0, "cone", 8.0, 90.0, 30.0, 60.0, 12.0, 6.0, 8.0, 2.0);
        assertEquals("x1", area.id());
        assertEquals(5.0, area.posicionX());
        assertEquals(10.0, area.posicionY());
        assertEquals("cone", area.arcType());
        assertEquals(8.0, area.radius());
        assertEquals(2.0, area.tokenSize());
    }

    @Test
    void visionConfigEntryAlmacenaDatos() {
        VisionConfigEntry vision = new VisionConfigEntry(42L, false, "square", 4.0, 180.0, 45.0, 90.0, 10.0, 3.0, 5.0);
        assertEquals(42L, vision.posicionId());
        assertFalse(vision.revelaArea());
        assertEquals("square", vision.arcType());
        assertEquals(4.0, vision.radius());
        assertEquals(180.0, vision.apertura());
        assertEquals(45.0, vision.rotation());
    }
}
