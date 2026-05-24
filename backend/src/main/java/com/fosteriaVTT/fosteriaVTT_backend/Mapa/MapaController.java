package com.fosteriaVTT.fosteriaVTT_backend.Mapa;

import com.fosteriaVTT.fosteriaVTT_backend.dto.MapaResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PagedResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;


@RestController
@RequestMapping("/api/mapas")
public class MapaController {

    private final MapaService mapaService;

    public MapaController(MapaService mapaService) {
        this.mapaService = mapaService;
    }

    @GetMapping
    public PagedResponse<MapaResumenResponse> obtenerMapas(
            Authentication authentication,
            @RequestParam(required = false) String nombre,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
return mapaService.obtenerMapasDeUsuario(authentication.getName(), nombre, page, size);
    }

    @PostMapping("/{id}/guardar")
    public MapaResumenResponse guardarMapa(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return mapaService.guardarMapa(id, authentication.getName());
    }

    @PostMapping("/{id}/publicar")
    public MapaResumenResponse publicarMapa(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return mapaService.publicarMapa(id, authentication.getName());
    }

    @DeleteMapping("/{id}")
    public void eliminarMapa(
            @PathVariable Long id,
            Authentication authentication
    ) {
        mapaService.eliminarMapa(id, authentication.getName());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public MapaResumenResponse crearMapa(
            Authentication authentication,
            @RequestPart("mapImage") MultipartFile mapImage,
            @RequestPart("nombre") String nombre,
            @RequestPart("esPublico") String esPublicoStr,
            @RequestPart(value = "tags", required = false) String tags
    ) {
        boolean esPublico = Boolean.parseBoolean(esPublicoStr);
        return mapaService.crearMapa(authentication.getName(), mapImage, nombre, esPublico, tags);
    }
}

