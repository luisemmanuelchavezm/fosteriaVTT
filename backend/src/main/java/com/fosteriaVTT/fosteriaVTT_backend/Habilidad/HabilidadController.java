package com.fosteriaVTT.fosteriaVTT_backend.Habilidad;

import com.fosteriaVTT.fosteriaVTT_backend.dto.HabilidadNivelResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.HabilidadResponse;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RestController
@RequestMapping("/api/habilidades")
public class HabilidadController {

    private final HabilidadService habilidadService;

    public HabilidadController(HabilidadService habilidadService) {
        this.habilidadService = habilidadService;
    }

    @GetMapping("/{clase}")
    public List<HabilidadNivelResponse> obtenerHabilidadesPorClase(
            @PathVariable String clase,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(UNAUTHORIZED, "Usuario no autenticado");
        }

        return habilidadService.obtenerHabilidadesPorClase(clase);
    }

    @GetMapping("/conjuros/detalle")
    public HabilidadResponse obtenerDetalleDeHechizoOTruco(
            @RequestParam("nombre") String nombre,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(UNAUTHORIZED, "Usuario no autenticado");
        }

        return habilidadService.buscarDetalleDeHechizoOTruco(nombre)
                .orElseThrow(() -> new ResponseStatusException(
                        NOT_FOUND,
                        "No se encontro el conjuro o truco solicitado"
                ));
    }

    @GetMapping("/conjuros")
    public List<HabilidadResponse> buscarConjurosYTrucos(
            @RequestParam(required = false) String nombre,
            @RequestParam(required = false) Integer nivel,
            @RequestParam(required = false) String clase,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(UNAUTHORIZED, "Usuario no autenticado");
        }

        return habilidadService.buscarConjurosYTrucos(nombre, nivel, clase);
    }

    @GetMapping("/{clase}/subclases/{subclase}")
    public List<HabilidadNivelResponse> obtenerHabilidadesPorSubclase(
            @PathVariable String clase,
            @PathVariable String subclase,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(UNAUTHORIZED, "Usuario no autenticado");
        }

        return habilidadService.obtenerHabilidadesPorSubclase(clase, subclase);
    }
}