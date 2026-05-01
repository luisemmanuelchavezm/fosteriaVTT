package com.fosteriaVTT.fosteriaVTT_backend.ContenidoSistemaJson;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndSubclaseRasgoResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndSubclaseResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.SubrazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.TrasfondoDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.TrasfondoDndResumenResponse;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class ContenidoSistemaJsonService {

    public static final String DND_PACKAGE_CLASS_SUMMARIES = "clases:resumenes";
    public static final String DND_PACKAGE_BACKGROUND_SUMMARIES = "trasfondos:resumenes";
    public static final String DND_PACKAGE_RACE_SUMMARIES = "razas:resumenes";

    private final ContenidoSistemaJsonRepository contenidoSistemaJsonRepository;
    private final ObjectMapper objectMapper;

    public ContenidoSistemaJsonService(ContenidoSistemaJsonRepository contenidoSistemaJsonRepository, ObjectMapper objectMapper) {
        this.contenidoSistemaJsonRepository = contenidoSistemaJsonRepository;
        this.objectMapper = objectMapper;
    }

    public List<ClaseDndResumenResponse> obtenerClasesDnd() {
        return obtenerPaqueteTipadoOpcional(SistemaDeJuego.DND, DND_PACKAGE_CLASS_SUMMARIES, new TypeReference<List<ClaseDndResumenResponse>>() {})
                .orElse(List.of());
    }

    public Optional<ClaseDndDetalleResponse> obtenerClaseDndPorId(String claseId) {
        return obtenerPaqueteTipadoOpcional(SistemaDeJuego.DND, paqueteDetalleClase(claseId), new TypeReference<ClaseDndDetalleResponse>() {});
    }

    public List<ClaseDndSubclaseResponse> obtenerSubclasesClaseDnd(String claseId) {
        return obtenerPaqueteTipadoOpcional(SistemaDeJuego.DND, paqueteSubclasesClase(claseId), new TypeReference<List<ClaseDndSubclaseResponse>>() {})
                .orElse(List.of());
    }

    public List<ClaseDndSubclaseRasgoResponse> obtenerRasgosSubclaseClaseDnd(String claseId) {
        return obtenerPaqueteTipadoOpcional(SistemaDeJuego.DND, paqueteRasgosSubclaseClase(claseId), new TypeReference<List<ClaseDndSubclaseRasgoResponse>>() {})
                .orElse(List.of());
    }

    public List<TrasfondoDndResumenResponse> obtenerTrasfondosDnd() {
        return obtenerPaqueteTipadoOpcional(SistemaDeJuego.DND, DND_PACKAGE_BACKGROUND_SUMMARIES, new TypeReference<List<TrasfondoDndResumenResponse>>() {})
                .orElse(List.of());
    }

    public Optional<TrasfondoDndDetalleResponse> obtenerTrasfondoDndPorId(String trasfondoId) {
        return obtenerPaqueteTipadoOpcional(SistemaDeJuego.DND, paqueteDetalleTrasfondo(trasfondoId), new TypeReference<TrasfondoDndDetalleResponse>() {});
    }

    public List<RazaDndResumenResponse> obtenerRazasDnd() {
        return obtenerPaqueteTipadoOpcional(SistemaDeJuego.DND, DND_PACKAGE_RACE_SUMMARIES, new TypeReference<List<RazaDndResumenResponse>>() {})
                .orElse(List.of());
    }

    public Optional<RazaDndDetalleResponse> obtenerRazaDndPorId(String razaId) {
        return obtenerPaqueteTipadoOpcional(SistemaDeJuego.DND, paqueteDetalleRaza(razaId), new TypeReference<RazaDndDetalleResponse>() {});
    }

    public List<SubrazaDndDetalleResponse> obtenerSubrazasRazaDnd(String razaId) {
        return obtenerPaqueteTipadoOpcional(SistemaDeJuego.DND, paqueteSubrazasRaza(razaId), new TypeReference<List<SubrazaDndDetalleResponse>>() {})
                .orElse(List.of());
    }

    public List<String> obtenerCatalogoRazaDnd(String catalogoId) {
        return obtenerPaqueteTipadoOpcional(SistemaDeJuego.DND, paqueteCatalogoRaza(catalogoId), new TypeReference<List<String>>() {})
                .orElse(List.of());
    }

    public String obtenerPaqueteRaw(SistemaDeJuego sistema, String paquete) {
        return contenidoSistemaJsonRepository.findBySistemaAndPaquete(sistema, paquete)
                .map(ContenidoSistemaJson::getJsonB)
                .filter(json -> json != null && !json.isBlank())
                .orElseThrow(() -> new IllegalStateException("No existe contenido JSONB para " + sistema + " / " + paquete));
    }

    public <T> T obtenerPaqueteTipado(SistemaDeJuego sistema, String paquete, TypeReference<T> typeReference) {
        return obtenerPaqueteTipadoOpcional(sistema, paquete, typeReference)
                .orElseThrow(() -> new IllegalStateException("No existe contenido tipado para " + sistema + " / " + paquete));
    }

    public <T> Optional<T> obtenerPaqueteTipadoOpcional(SistemaDeJuego sistema, String paquete, TypeReference<T> typeReference) {
        return contenidoSistemaJsonRepository.findBySistemaAndPaquete(sistema, paquete)
                .map(ContenidoSistemaJson::getJsonB)
                .filter(json -> json != null && !json.isBlank())
                .map(json -> leerJson(json, typeReference));
    }

    public void guardarPaquete(SistemaDeJuego sistema, String paquete, String jsonB) {
        ContenidoSistemaJson contenido = contenidoSistemaJsonRepository.findBySistemaAndPaquete(sistema, paquete)
                .orElseGet(() -> ContenidoSistemaJson.builder()
                        .sistema(sistema)
                        .paquete(paquete)
                        .build());

        contenido.setSistema(sistema);
        contenido.setPaquete(paquete);
        contenido.setJsonB(jsonB);
        contenidoSistemaJsonRepository.save(contenido);
    }

    private <T> T leerJson(String json, TypeReference<T> typeReference) {
        try {
            return objectMapper.readValue(json, typeReference);
        } catch (IOException exception) {
            throw new IllegalStateException("No se pudo deserializar el contenido JSONB", exception);
        }
    }

    public static String paqueteDetalleClase(String claseId) {
        return "clases:detalle:" + normalizarSegmento(claseId);
    }

    public static String paqueteSubclasesClase(String claseId) {
        return "clases:subclases:" + normalizarSegmento(claseId);
    }

    public static String paqueteRasgosSubclaseClase(String claseId) {
        return "clases:rasgos-subclase:" + normalizarSegmento(claseId);
    }

    public static String paqueteDetalleTrasfondo(String trasfondoId) {
        return "trasfondos:detalle:" + normalizarSegmento(trasfondoId);
    }

    public static String paqueteDetalleRaza(String razaId) {
        return "razas:detalle:" + normalizarSegmento(razaId);
    }

    public static String paqueteSubrazasRaza(String razaId) {
        return "razas:subrazas:" + normalizarSegmento(razaId);
    }

    public static String paqueteCatalogoRaza(String catalogoId) {
        return "razas:catalogo:" + normalizarSegmento(catalogoId);
    }

    private static String normalizarSegmento(String value) {
        String cleaned = TagUtils.cleanValue(value);
        if (cleaned.isBlank()) {
            throw new IllegalArgumentException("El identificador del paquete no puede estar vacio");
        }
        return cleaned;
    }
}