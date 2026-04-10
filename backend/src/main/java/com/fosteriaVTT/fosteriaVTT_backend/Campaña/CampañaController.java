package com.fosteriaVTT.fosteriaVTT_backend.Campaña;

import com.fosteriaVTT.fosteriaVTT_backend.dto.CampañaResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PagedResponse;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RestController
@RequestMapping("/api/campanas")
public class CampañaController {

    private final CampañaService campañaService;

    public CampañaController(CampañaService campañaService) {
        this.campañaService = campañaService;
    }

    @GetMapping("/ultimas")
    public List<CampañaResumenResponse> obtenerUltimasCampañas(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(UNAUTHORIZED, "Usuario no autenticado");
        }

        return campañaService.obtenerUltimasCampañas(authentication.getName());
    }

    @GetMapping
        public PagedResponse<CampañaResumenResponse> obtenerCampañas(
            Authentication authentication,
            @RequestParam(required = false) String nombre,
            @RequestParam(required = false) List<String> sistemas,
            @RequestParam(required = false) String dm,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(UNAUTHORIZED, "Usuario no autenticado");
        }

        return campañaService.obtenerCampañasOrdenadasPorUltimoAcceso(authentication.getName(), nombre, sistemas, dm, page, size);
    }
}