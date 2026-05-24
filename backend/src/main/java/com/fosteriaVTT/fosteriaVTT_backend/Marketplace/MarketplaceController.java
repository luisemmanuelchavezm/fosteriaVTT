package com.fosteriaVTT.fosteriaVTT_backend.Marketplace;

import com.fosteriaVTT.fosteriaVTT_backend.Mapa.Mapa;
import com.fosteriaVTT.fosteriaVTT_backend.Mapa.MapaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.PersonajeRepository;
import com.fosteriaVTT.fosteriaVTT_backend.dto.MapaResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.MarketplacePersonajeResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PagedResponse;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/marketplace")
public class MarketplaceController {

    private final PersonajeRepository personajeRepository;
    private final MapaRepository mapaRepository;

    public MarketplaceController(PersonajeRepository personajeRepository, MapaRepository mapaRepository) {
        this.personajeRepository = personajeRepository;
        this.mapaRepository = mapaRepository;
    }

    @GetMapping("/personajes")
    @Transactional(readOnly = true)
    public PagedResponse<MarketplacePersonajeResponse> listarPersonajes(
            @RequestParam(defaultValue = "") String nombre,
            @RequestParam(defaultValue = "") String tipo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication
    ) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 50));
        Page<Personaje> result = personajeRepository.buscarMarketplace(nombre, tipo, pageable);
        String username = authentication != null ? authentication.getName() : null;

        List<MarketplacePersonajeResponse> items = result.getContent().stream()
                .map(p -> {
                    boolean yaTienesCopia = username != null &&
                            personajeRepository.existsByFuenteTagAndUsuarioUsername(String.valueOf(p.getId()), username);
                    return new MarketplacePersonajeResponse(
                            p.getId(),
                            p.getNombre(),
                            p.getRetrato(),
                            p.getSistemaDeJuego() != null ? p.getSistemaDeJuego().name() : "",
                            extractTipo(p.getTags()),
                            p.getUsuario() != null ? p.getUsuario().getUsername() : "Desconocido",
                            yaTienesCopia
                    );
                })
                .toList();

        return new PagedResponse<>(items, result.hasNext());
    }

    @GetMapping("/mapas")
    @Transactional(readOnly = true)
    public PagedResponse<MapaResumenResponse> listarMapas(
            @RequestParam(defaultValue = "") String nombre,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication
    ) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 50));
        Page<Mapa> result = mapaRepository.buscarMapasPublicos(nombre, pageable);
        String username = authentication != null ? authentication.getName() : null;

        List<MapaResumenResponse> items = result.getContent().stream()
                .map(m -> {
                    boolean yaTienesCopia = username != null &&
                            mapaRepository.existsByFuenteTagAndUsuarioUsername(String.valueOf(m.getId()), username);
                    return new MapaResumenResponse(
                            m.getId(),
                            m.getNombre(),
                            m.getMapa(),
                            true,
                            false,
                            m.getUsuario() != null ? m.getUsuario().getUsername() : "Desconocido",
                            yaTienesCopia,
                            true  // marketplace items siempre son copias (esGuardado=true)
                    );
                })
                .toList();

        return new PagedResponse<>(items, result.hasNext());
    }

    private String extractTipo(String tags) {
        if (tags == null) return "personaje";
        String lower = tags.toLowerCase();
        if (lower.contains("enemigo")) return "enemigo";
        if (lower.contains("pnj")) return "pnj";
        return "personaje";
    }
}
