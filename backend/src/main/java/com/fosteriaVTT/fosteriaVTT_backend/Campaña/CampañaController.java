package com.fosteriaVTT.fosteriaVTT_backend.Campaña;

import com.fosteriaVTT.fosteriaVTT_backend.dto.CampañaResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CrearCampañaRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.JugadorCampañaResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PagedResponse;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;


@RestController
@RequestMapping("/api/campanas")
public class CampañaController {

    private final CampañaService campañaService;

    public CampañaController(CampañaService campañaService) {
        this.campañaService = campañaService;
    }

    @GetMapping("/ultimas")
    public List<CampañaResumenResponse> obtenerUltimasCampañas(Authentication authentication) {
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

    @GetMapping
        public PagedResponse<CampañaResumenResponse> obtenerCampañas(
            Authentication authentication,
            @RequestParam(required = false) String nombre,
            @RequestParam(required = false) List<String> sistemas,
            @RequestParam(required = false) String dm,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
return campañaService.obtenerCampañasOrdenadasPorUltimoAcceso(authentication.getName(), nombre, sistemas, dm, page, size);
    }
}
