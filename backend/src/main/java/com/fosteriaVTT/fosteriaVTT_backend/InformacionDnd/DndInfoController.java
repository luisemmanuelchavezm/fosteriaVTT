package com.fosteriaVTT.fosteriaVTT_backend.InformacionDnd;

import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndSubclaseResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.DndCompetencyCatalogResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.SubrazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.TrasfondoDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.TrasfondoDndResumenResponse;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/api/informacion/dnd")
public class DndInfoController {

    private final DndInfoService dndInfoService;

    public DndInfoController(DndInfoService dndInfoService) {
        this.dndInfoService = dndInfoService;
    }

    @GetMapping("/clases")
    public List<ClaseDndResumenResponse> obtenerClases(Authentication authentication) {
        return dndInfoService.obtenerClases();
    }

    @GetMapping("/clases/{id}")
    public ClaseDndDetalleResponse obtenerClasePorId(@PathVariable String id, Authentication authentication) {
        return dndInfoService.obtenerClasePorId(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Clase DnD no encontrada"));
    }

    @GetMapping("/clases/{id}/subclases")
    public List<ClaseDndSubclaseResponse> obtenerSubclasesClase(@PathVariable String id, Authentication authentication) {
        List<ClaseDndSubclaseResponse> subclases = dndInfoService.obtenerSubclasesClase(id);
        if (subclases.isEmpty()) {
            throw new ResponseStatusException(NOT_FOUND, "Subclases DnD no encontradas para la clase indicada");
        }
        return subclases;
    }

    @GetMapping("/trasfondos")
    public List<TrasfondoDndResumenResponse> obtenerTrasfondos(Authentication authentication) {
        return dndInfoService.obtenerTrasfondos();
    }

    @GetMapping("/trasfondos/{id}")
    public TrasfondoDndDetalleResponse obtenerTrasfondoPorId(@PathVariable String id, Authentication authentication) {
        return dndInfoService.obtenerTrasfondoPorId(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Trasfondo DnD no encontrado"));
    }

    @GetMapping("/razas")
    public List<RazaDndResumenResponse> obtenerRazas(Authentication authentication) {
        return dndInfoService.obtenerRazas();
    }

    @GetMapping("/razas/{id}")
    public RazaDndDetalleResponse obtenerRazaPorId(@PathVariable String id, Authentication authentication) {
        return dndInfoService.obtenerRazaPorId(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Raza DnD no encontrada"));
    }

    @GetMapping("/razas/{id}/subrazas")
    public List<SubrazaDndDetalleResponse> obtenerSubrazasRaza(@PathVariable String id, Authentication authentication) {
        return dndInfoService.obtenerSubrazasRaza(id);
    }

    @GetMapping("/catalogos/competencias")
    public DndCompetencyCatalogResponse obtenerCatalogoCompetencias(Authentication authentication) {
        return dndInfoService.obtenerCatalogoCompetencias();
    }
}
