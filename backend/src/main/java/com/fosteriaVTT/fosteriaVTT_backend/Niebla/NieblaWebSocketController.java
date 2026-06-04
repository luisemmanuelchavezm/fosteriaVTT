package com.fosteriaVTT.fosteriaVTT_backend.Niebla;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fosteriaVTT.fosteriaVTT_backend.Pestaña.PestañaRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;

@Controller
public class NieblaWebSocketController {

    private static final Logger log = LoggerFactory.getLogger(NieblaWebSocketController.class);

    private final SimpMessagingTemplate messagingTemplate;
    private final PestañaRepository pestañaRepository;
    private final ObjectMapper objectMapper;

    // Clave: pestanaId — cada pestaña tiene su propio estado de niebla en memoria
    private final ConcurrentHashMap<Long, NieblaEstado> estadoPorPestana = new ConcurrentHashMap<>();

    public NieblaWebSocketController(
            SimpMessagingTemplate messagingTemplate,
            PestañaRepository pestañaRepository) {
        this.messagingTemplate = messagingTemplate;
        this.pestañaRepository = pestañaRepository;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);
    }

    @MessageMapping("/campanas/{campañaId}/niebla/configurar")
    @Transactional
    public void configurar(
            @DestinationVariable Long campañaId,
            @Payload Map<String, Object> payload) {
        Long pestanaId = toLong(payload.get("pestanaId"));
        if (pestanaId == null) return;

        NieblaEstado anterior = cargarEstado(pestanaId);

        boolean activa = toBoolean(payload.get("activa"), anterior.activa());
        boolean zonasExploradas = toBoolean(payload.get("zonasExploradas"), anterior.zonasExploradas());
        boolean vistaJugador = toBoolean(payload.get("vistaJugador"), anterior.vistaJugador());

        NieblaEstado nuevo = new NieblaEstado(
                pestanaId, activa, zonasExploradas, vistaJugador,
                anterior.visionConfigs(), anterior.exploredAreas());
        estadoPorPestana.put(pestanaId, nuevo);
        persistirEstado(pestanaId, nuevo);
        broadcast(campañaId, nuevo);
    }

    @MessageMapping("/campanas/{campañaId}/niebla/vision")
    @Transactional
    public void configurarVision(
            @DestinationVariable Long campañaId,
            @Payload Map<String, Object> payload) {
        Long pestanaId = toLong(payload.get("pestanaId"));
        Long posicionId = toLong(payload.get("posicionId"));
        if (pestanaId == null || posicionId == null) return;

        NieblaEstado anterior = cargarEstado(pestanaId);

        VisionConfigEntry entrada = new VisionConfigEntry(
                posicionId,
                toBoolean(payload.get("revelaArea"), false),
                toString(payload.get("arcType"), "semicircle"),
                toDouble(payload.get("radius"), 6.0),
                toDouble(payload.get("apertura"), 360.0),
                toDouble(payload.get("rotation"), 0.0),
                toDouble(payload.get("angle"), 45.0),
                toDouble(payload.get("length"), 8.0),
                toDouble(payload.get("width"), 4.0),
                toDouble(payload.get("height"), 6.0));

        List<VisionConfigEntry> configs = new ArrayList<>(anterior.visionConfigs());
        configs.removeIf(e -> e.posicionId().equals(posicionId));
        configs.add(entrada);

        NieblaEstado nuevo = new NieblaEstado(
                pestanaId, anterior.activa(), anterior.zonasExploradas(),
                anterior.vistaJugador(), configs, anterior.exploredAreas());
        estadoPorPestana.put(pestanaId, nuevo);
        persistirEstado(pestanaId, nuevo);
        broadcast(campañaId, nuevo);
    }

    @MessageMapping("/campanas/{campañaId}/niebla/explorar")
    @Transactional
    public void agregarAreaExplorada(
            @DestinationVariable Long campañaId,
            @Payload Map<String, Object> payload) {
        Long pestanaId = toLong(payload.get("pestanaId"));
        String id = toString(payload.get("id"), "");
        if (pestanaId == null || id.isEmpty()) return;

        ExploredAreaEntry area = new ExploredAreaEntry(
                id,
                toDouble(payload.get("posicionX"), 0.0),
                toDouble(payload.get("posicionY"), 0.0),
                toString(payload.get("arcType"), "semicircle"),
                toDouble(payload.get("radius"), 6.0),
                toDouble(payload.get("apertura"), 360.0),
                toDouble(payload.get("rotation"), 0.0),
                toDouble(payload.get("angle"), 45.0),
                toDouble(payload.get("length"), 8.0),
                toDouble(payload.get("width"), 4.0),
                toDouble(payload.get("height"), 6.0),
                toDouble(payload.get("tokenSize"), 1.0));

        NieblaEstado anterior = cargarEstado(pestanaId);

        List<ExploredAreaEntry> areas = new ArrayList<>(anterior.exploredAreas());
        areas.removeIf(e -> e.id().equals(id));
        areas.add(area);

        NieblaEstado nuevo = new NieblaEstado(
                pestanaId, anterior.activa(), anterior.zonasExploradas(),
                anterior.vistaJugador(), anterior.visionConfigs(), areas);
        estadoPorPestana.put(pestanaId, nuevo);
        persistirEstado(pestanaId, nuevo);
        broadcast(campañaId, nuevo);
    }

    /**
     * Versión batch de agregarAreaExplorada: recibe un array de áreas y las procesa
     * en una sola operación atómica. Elimina la race condition que ocurre cuando
     * el cliente envía N mensajes separados (uno por área) de forma casi simultánea.
     */
    @MessageMapping("/campanas/{campañaId}/niebla/explorar/batch")
    @Transactional
    public synchronized void agregarAreasExploradasBatch(
            @DestinationVariable Long campañaId,
            @Payload Map<String, Object> payload) {
        Long pestanaId = toLong(payload.get("pestanaId"));
        if (pestanaId == null) return;

        Object rawAreas = payload.get("areas");
        if (!(rawAreas instanceof java.util.List<?> rawList) || rawList.isEmpty()) return;

        NieblaEstado anterior = cargarEstado(pestanaId);
        List<ExploredAreaEntry> areas = new ArrayList<>(anterior.exploredAreas());

        for (Object rawArea : rawList) {
            if (!(rawArea instanceof Map<?, ?> areaMap)) continue;
            String id = toString(areaMap.get("id"), "");
            if (id.isEmpty()) continue;

            ExploredAreaEntry area = new ExploredAreaEntry(
                    id,
                    toDouble(areaMap.get("posicionX"), 0.0),
                    toDouble(areaMap.get("posicionY"), 0.0),
                    toString(areaMap.get("arcType"), "semicircle"),
                    toDouble(areaMap.get("radius"), 6.0),
                    toDouble(areaMap.get("apertura"), 360.0),
                    toDouble(areaMap.get("rotation"), 0.0),
                    toDouble(areaMap.get("angle"), 45.0),
                    toDouble(areaMap.get("length"), 8.0),
                    toDouble(areaMap.get("width"), 4.0),
                    toDouble(areaMap.get("height"), 6.0),
                    toDouble(areaMap.get("tokenSize"), 1.0));

            areas.removeIf(e -> e.id().equals(id));
            areas.add(area);
        }

        NieblaEstado nuevo = new NieblaEstado(
                pestanaId, anterior.activa(), anterior.zonasExploradas(),
                anterior.vistaJugador(), anterior.visionConfigs(), areas);
        estadoPorPestana.put(pestanaId, nuevo);
        persistirEstado(pestanaId, nuevo);
        broadcast(campañaId, nuevo);
    }

    @MessageMapping("/campanas/{campañaId}/niebla/solicitar")
    public void solicitar(
            @DestinationVariable Long campañaId,
            @Payload Map<String, Object> payload) {
        Long pestanaId = toLong(payload.get("pestanaId"));
        if (pestanaId == null) return;
        NieblaEstado estado = cargarEstado(pestanaId);
        broadcast(campañaId, estado);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    /** Carga el estado desde memoria; si no existe, lo inicializa desde la BD. */
    private NieblaEstado cargarEstado(Long pestanaId) {
        NieblaEstado cached = estadoPorPestana.get(pestanaId);
        if (cached != null) return cached;

        return pestañaRepository.findById(pestanaId)
                .map(p -> {
                    String json = p.getNieblaDeGuerra();
                    if (json != null && !json.isBlank()) {
                        try {
                            NieblaEstado saved = objectMapper.readValue(json, NieblaEstado.class);
                            estadoPorPestana.put(pestanaId, saved);
                            return saved;
                        } catch (Exception e) {
                            log.warn("No se pudo deserializar nieblaDeGuerra para pestaña {}: {}", pestanaId, e.getMessage());
                        }
                    }
                    NieblaEstado vacío = new NieblaEstado(pestanaId, false, false, false, List.of(), List.of());
                    estadoPorPestana.put(pestanaId, vacío);
                    return vacío;
                })
                .orElse(new NieblaEstado(pestanaId, false, false, false, List.of(), List.of()));
    }

    /** Guarda el estado en la BD de forma asíncrona (best-effort). */
    private void persistirEstado(Long pestanaId, NieblaEstado estado) {
        pestañaRepository.findById(pestanaId).ifPresent(p -> {
            try {
                p.setNieblaDeGuerra(objectMapper.writeValueAsString(estado));
                pestañaRepository.save(p);
            } catch (Exception e) {
                log.error("Error persistiendo niebla de pestaña {}: {}", pestanaId, e.getMessage());
            }
        });
    }

    private void broadcast(Long campañaId, NieblaEstado estado) {
        messagingTemplate.convertAndSend("/topic/campanas/" + campañaId + "/niebla", estado);
    }

    private boolean toBoolean(Object val, boolean def) {
        if (val instanceof Boolean b) return b;
        return def;
    }

    private Long toLong(Object val) {
        if (val instanceof Number n) return n.longValue();
        return null;
    }

    private double toDouble(Object val, double def) {
        if (val instanceof Number n) return n.doubleValue();
        return def;
    }

    private String toString(Object val, String def) {
        if (val instanceof String s) return s;
        return def;
    }
}
