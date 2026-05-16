package com.fosteriaVTT.fosteriaVTT_backend.Iniciativa;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class IniciativaWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ConcurrentHashMap<Long, List<IniciativaEntrada>> estadoPorCampana = new ConcurrentHashMap<>();

    public IniciativaWebSocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/campanas/{campañaId}/iniciativa/activar")
    public void activar(
            @DestinationVariable Long campañaId,
            @Payload Map<String, Object> payload
    ) {
        boolean activa = Boolean.TRUE.equals(payload.get("activa"));
        if (activa) {
            estadoPorCampana.putIfAbsent(campañaId, new ArrayList<>());
        } else {
            estadoPorCampana.remove(campañaId);
        }
        broadcast(campañaId, activa);
    }

    @MessageMapping("/campanas/{campañaId}/iniciativa/tirar")
    public void tirar(
            @DestinationVariable Long campañaId,
            @Payload TirarIniciativaRequest request
    ) {
        List<IniciativaEntrada> entradas = estadoPorCampana.computeIfAbsent(campañaId, k -> new ArrayList<>());
        synchronized (entradas) {
            entradas.removeIf(e -> e.personajeId().equals(request.personajeId()));
            entradas.add(new IniciativaEntrada(
                    request.personajeId(),
                    request.nombre(),
                    request.retrato(),
                    request.tirada(),
                    request.bonificacion(),
                    request.tirada() + request.bonificacion()
            ));
            entradas.sort(Comparator.comparingInt(IniciativaEntrada::total).reversed());
        }
        broadcast(campañaId, true);
    }

    @MessageMapping("/campanas/{campañaId}/iniciativa/reordenar")
    public void reordenar(
            @DestinationVariable Long campañaId,
            @Payload ReordenarIniciativaRequest request
    ) {
        if (request.orden() == null) return;
        List<IniciativaEntrada> entradas = estadoPorCampana.get(campañaId);
        if (entradas == null) return;

        synchronized (entradas) {
            Map<Long, IniciativaEntrada> porId = entradas.stream()
                    .collect(Collectors.toMap(IniciativaEntrada::personajeId, e -> e));
            List<IniciativaEntrada> reordenadas = request.orden().stream()
                    .map(porId::get)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
            entradas.clear();
            entradas.addAll(reordenadas);
        }
        broadcast(campañaId, true);
    }

    private void broadcast(Long campañaId, boolean activa) {
        List<IniciativaEntrada> entradas = estadoPorCampana.get(campañaId);
        List<IniciativaEntrada> snapshot;
        if (entradas == null) {
            snapshot = List.of();
        } else {
            synchronized (entradas) {
                snapshot = List.copyOf(entradas);
            }
        }
        messagingTemplate.convertAndSend(
                "/topic/campanas/" + campañaId + "/iniciativa",
                new IniciativaEstado(activa, snapshot)
        );
    }
}
