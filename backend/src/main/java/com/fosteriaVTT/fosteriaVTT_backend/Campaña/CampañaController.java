package com.fosteriaVTT.fosteriaVTT_backend.Campaña;

import com.fosteriaVTT.fosteriaVTT_backend.dto.CampañaResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CrearCampañaRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.JugadorCampañaResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PagedResponse;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;


@RestController
@RequestMapping("/api/campanas")
public class CampañaController {

    private final CampañaService campañaService;

    public CampañaController(CampañaService campañaService) {
        this.campañaService = campañaService;
    }

    @GetMapping("/ultimas")
    public List<CampañaResumenResponse> obtenerUltimasCampañas(Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no autenticado");
        }
        return campañaService.obtenerUltimasCampañas(authentication.getName());
    }

    @GetMapping("/{campaniaId}/jugadores")
    public List<JugadorCampañaResponse> obtenerJugadoresCampaña(
            @PathVariable Long campaniaId,
            Authentication authentication
    ) {
return campañaService.obtenerJugadoresCampaña(campaniaId, authentication.getName());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public CampañaResumenResponse crearCampaña(
            @RequestPart("payload") CrearCampañaRequest payload,
            @RequestPart(value = "cover", required = false) MultipartFile cover,
            Authentication authentication
    ) {
return campañaService.crearCampaña(payload, cover, authentication.getName());
    }

    /** Añade al usuario autenticado como jugador de la campaña (idempotente). */
    @PostMapping("/{campaniaId}/unirse")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unirseCampaña(
            @PathVariable Long campaniaId,
            Authentication authentication
    ) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autenticado");
        }
        campañaService.unirseCampaña(campaniaId, authentication.getName());
    }

    @PatchMapping("/{campaniaId}/acceder")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void registrarAcceso(
            @PathVariable Long campaniaId,
            Authentication authentication
    ) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autenticado");
        }
        campañaService.registrarAcceso(campaniaId, authentication.getName());
    }

    @DeleteMapping("/{campaniaId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarCampaña(
            @PathVariable Long campaniaId,
            Authentication authentication
    ) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autenticado");
        }
        campañaService.eliminarCampaña(campaniaId, authentication.getName());
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
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no autenticado");
        }
        return campañaService.obtenerCampañasOrdenadasPorUltimoAcceso(authentication.getName(), nombre, sistemas, dm, page, size);
    }
}
