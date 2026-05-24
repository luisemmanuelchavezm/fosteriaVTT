package com.fosteriaVTT.fosteriaVTT_backend.Pestaña;

import com.fosteriaVTT.fosteriaVTT_backend.dto.PestañaCampañaResponse;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api/campanas/{campaniaId}")
public class PestañaController {

    private final PestañaService pestañaService;

    public PestañaController(PestañaService pestañaService) {
        this.pestañaService = pestañaService;
    }

    @PostMapping("/pestana/abrir")
    public PestañaCampañaResponse abrirOCrearUltimaPestaña(
            @PathVariable Long campaniaId,
            Authentication authentication
    ) {
        return pestañaService.abrirOCrearUltimaPestaña(campaniaId, authentication.getName());
    }

    @PostMapping("/pestanas")
    public PestañaCampañaResponse crearNuevaPestaña(
            @PathVariable Long campaniaId,
            Authentication authentication
    ) {
        return pestañaService.crearNuevaPestaña(campaniaId, authentication.getName());
    }

    @GetMapping("/pestanas")
    public List<PestañaCampañaResponse> listarPestañas(
            @PathVariable Long campaniaId,
            Authentication authentication
    ) {
        return pestañaService.listarPestañas(campaniaId, authentication.getName());
    }

    @PostMapping("/pestana/{pestanaId}/abrir")
    public PestañaCampañaResponse abrirPestañaEspecifica(
            @PathVariable Long campaniaId,
            @PathVariable Long pestanaId,
            Authentication authentication
    ) {
        return pestañaService.abrirPestañaEspecifica(campaniaId, pestanaId, authentication.getName());
    }

    @PatchMapping("/pestana/{pestanaId}/configuracion")
    public PestañaCampañaResponse actualizarConfiguracion(
            @PathVariable Long campaniaId,
            @PathVariable Long pestanaId,
            @RequestBody ConfiguracionCasillasRequest request,
            Authentication authentication
    ) {
        return pestañaService.actualizarConfiguracion(campaniaId, pestanaId, request, authentication.getName());
    }

    @DeleteMapping("/pestanas/{pestanaId}")
    public ResponseEntity<Void> eliminarPestaña(
            @PathVariable Long campaniaId,
            @PathVariable Long pestanaId,
            Authentication authentication
    ) {
        pestañaService.eliminarPestaña(campaniaId, pestanaId, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
