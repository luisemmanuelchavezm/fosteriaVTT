package com.fosteriaVTT.fosteriaVTT_backend.Pestaña;

import com.fosteriaVTT.fosteriaVTT_backend.dto.PestañaCampañaResponse;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RestController
@RequestMapping("/api/campanas/{campaniaId}/pestana")
public class PestañaController {

    private final PestañaService pestañaService;

    public PestañaController(PestañaService pestañaService) {
        this.pestañaService = pestañaService;
    }

    @PostMapping("/abrir")
    public PestañaCampañaResponse abrirOCrearUltimaPestaña(
            @PathVariable Long campaniaId,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(UNAUTHORIZED, "Usuario no autenticado");
        }

        return pestañaService.abrirOCrearUltimaPestaña(campaniaId, authentication.getName());
    }
}
