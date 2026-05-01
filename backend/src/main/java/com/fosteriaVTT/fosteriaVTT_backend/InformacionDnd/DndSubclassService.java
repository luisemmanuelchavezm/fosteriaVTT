package com.fosteriaVTT.fosteriaVTT_backend.InformacionDnd;

import com.fosteriaVTT.fosteriaVTT_backend.ContenidoSistemaJson.ContenidoSistemaJsonService;
import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndSubclaseRasgoResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndSubclaseResponse;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class DndSubclassService {

    private final ContenidoSistemaJsonService contenidoSistemaJsonService;

    public DndSubclassService(ContenidoSistemaJsonService contenidoSistemaJsonService) {
        this.contenidoSistemaJsonService = contenidoSistemaJsonService;
    }

    public List<ClaseDndSubclaseResponse> obtenerSubclasesPorClase(String claseId) {
        if (claseId == null || claseId.isBlank()) {
            return List.of();
        }
        return contenidoSistemaJsonService.obtenerSubclasesClaseDnd(claseId);
    }

    public Optional<ClaseDndSubclaseResponse> buscarSubclase(String claseId, String subclaseIdONombre) {
        String normalized = TagUtils.normalizeText(subclaseIdONombre);
        if (normalized.isBlank()) {
            return Optional.empty();
        }

        return obtenerSubclasesPorClase(claseId).stream()
                .filter(item -> TagUtils.normalizeText(item.id()).equals(normalized)
                        || TagUtils.normalizeText(item.nombre()).equals(normalized))
                .findFirst();
    }

    public List<ClaseDndSubclaseRasgoResponse> obtenerRasgosSubclase(String claseId, String subclaseIdONombre) {
        Optional<ClaseDndSubclaseResponse> subclase = buscarSubclase(claseId, subclaseIdONombre);
        if (subclase.isEmpty()) {
            return List.of();
        }

        String normalizedId = TagUtils.normalizeText(subclase.get().id());
        return contenidoSistemaJsonService.obtenerRasgosSubclaseClaseDnd(claseId).stream()
                .filter(item -> TagUtils.normalizeText(item.subclaseId()).equals(normalizedId))
                .toList();
    }
}
