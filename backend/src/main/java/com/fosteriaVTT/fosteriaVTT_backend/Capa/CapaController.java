package com.fosteriaVTT.fosteriaVTT_backend.Capa;

import com.fosteriaVTT.fosteriaVTT_backend.dto.AsignarMapaCapaRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CapaMapaResponse;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/campanas/{campaniaId}/capas")
public class CapaController {

    private final CapaService capaService;

    public CapaController(CapaService capaService) {
        this.capaService = capaService;
    }

    @PostMapping("/mapa")
    public CapaMapaResponse asignarMapa(
            @PathVariable("campaniaId") Long campañaId,
            @RequestBody AsignarMapaCapaRequest request,
            Authentication authentication
    ) {
        String username = authentication == null ? null : authentication.getName();
        return capaService.asignarMapaACapaYEmitir(campañaId, request, username);
    }
}
