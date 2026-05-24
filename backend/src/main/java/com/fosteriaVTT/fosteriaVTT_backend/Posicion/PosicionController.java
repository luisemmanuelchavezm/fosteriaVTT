package com.fosteriaVTT.fosteriaVTT_backend.Posicion;

import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarTamanoRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CrearPosicionRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PosicionResponse;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/campanas/{campaniaId}/posiciones")
public class PosicionController {

    private final PosicionService posicionService;

    public PosicionController(PosicionService posicionService) {
        this.posicionService = posicionService;
    }

    @GetMapping
    public List<PosicionResponse> obtenerPosiciones(
            @PathVariable("campaniaId") Long campañaId,
            @RequestParam("pestanaId") Long pestañaId,
            Authentication authentication
    ) {
        String username = authentication == null ? null : authentication.getName();
        return posicionService.obtenerPosiciones(campañaId, pestañaId, username);
    }

    @PostMapping
    public PosicionResponse crearPosicion(
            @PathVariable("campaniaId") Long campañaId,
            @RequestBody CrearPosicionRequest request,
            Authentication authentication
    ) {
        String username = authentication == null ? null : authentication.getName();
        return posicionService.crearOActualizarPosicion(campañaId, request, username);
    }

    @PatchMapping("/{posicionId}/tamano")
    public PosicionResponse actualizarTamano(
            @PathVariable("campaniaId") Long campañaId,
            @PathVariable Long posicionId,
            @RequestBody ActualizarTamanoRequest request,
            Authentication authentication
    ) {
        String username = authentication == null ? null : authentication.getName();
        return posicionService.actualizarTamano(campañaId, posicionId, request.largo(), request.ancho(), username);
    }
}