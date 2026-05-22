package com.fosteriaVTT.fosteriaVTT_backend.Niebla;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class NieblaWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ConcurrentHashMap<Long, NieblaEstado> estadoPorCampana = new ConcurrentHashMap<>();

    public NieblaWebSocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/campanas/{campañaId}/niebla/configurar")
    public void configurar(
            @DestinationVariable Long campañaId,
            @Payload Map<String, Object> payload
    ) {
        NieblaEstado anterior = estadoPorCampana.getOrDefault(campañaId,
                new NieblaEstado(false, false, false, new ArrayList<>(), new ArrayList<>()));

        boolean activa = toBoolean(payload.get("activa"), anterior.activa());
        boolean zonasExploradas = toBoolean(payload.get("zonasExploradas"), anterior.zonasExploradas());
        boolean vistaJugador = toBoolean(payload.get("vistaJugador"), anterior.vistaJugador());

        NieblaEstado nuevo = new NieblaEstado(activa, zonasExploradas, vistaJugador, anterior.visionConfigs(), anterior.exploredAreas());
        estadoPorCampana.put(campañaId, nuevo);
        broadcast(campañaId, nuevo);
    }

    @MessageMapping("/campanas/{campañaId}/niebla/vision")
    public void configurarVision(
            @DestinationVariable Long campañaId,
            @Payload Map<String, Object> payload
    ) {
        Long posicionId = toLong(payload.get("posicionId"));
        if (posicionId == null) return;

        NieblaEstado anterior = estadoPorCampana.getOrDefault(campañaId,
                new NieblaEstado(false, false, false, new ArrayList<>(), new ArrayList<>()));

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
                toDouble(payload.get("height"), 6.0)
        );

        List<VisionConfigEntry> configs = new ArrayList<>(anterior.visionConfigs());
        configs.removeIf(e -> e.posicionId().equals(posicionId));
        configs.add(entrada);

        NieblaEstado nuevo = new NieblaEstado(
                anterior.activa(), anterior.zonasExploradas(), anterior.vistaJugador(), configs, anterior.exploredAreas());
        estadoPorCampana.put(campañaId, nuevo);
        broadcast(campañaId, nuevo);
    }

    @MessageMapping("/campanas/{campañaId}/niebla/explorar")
    public void agregarAreaExplorada(
            @DestinationVariable Long campañaId,
            @Payload Map<String, Object> payload
    ) {
        String id = toString(payload.get("id"), "");
        if (id.isEmpty()) return;

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
                toDouble(payload.get("height"), 6.0)
        );

        NieblaEstado anterior = estadoPorCampana.getOrDefault(campañaId,
                new NieblaEstado(false, false, false, new ArrayList<>(), new ArrayList<>()));

        List<ExploredAreaEntry> areas = new ArrayList<>(anterior.exploredAreas());
        areas.removeIf(e -> e.id().equals(id));
        areas.add(area);

        NieblaEstado nuevo = new NieblaEstado(
                anterior.activa(), anterior.zonasExploradas(), anterior.vistaJugador(), anterior.visionConfigs(), areas);
        estadoPorCampana.put(campañaId, nuevo);
        broadcast(campañaId, nuevo);
    }

    @MessageMapping("/campanas/{campañaId}/niebla/solicitar")
    public void solicitar(@DestinationVariable Long campañaId) {
        NieblaEstado estado = estadoPorCampana.getOrDefault(campañaId,
                new NieblaEstado(false, false, false, List.of(), List.of()));
        broadcast(campañaId, estado);
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
