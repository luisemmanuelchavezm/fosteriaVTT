package com.fosteriaVTT.fosteriaVTT_backend.Personaje;

import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarArmaHabilidadNpcRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarNpcRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarRecursosPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarHojaPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarExperienciaPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.AgregarHabilidadNpcRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.AgregarHabilidadPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.AgregarItemMochilaRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarItemMochilaRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.BajarNivelPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CrearNpcRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CrearPersonajeDndRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PagedResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PersonajeDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PersonajeResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.SubirNivelPersonajeRequest;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;


@RestController
@RequestMapping("/api/personajes")
public class PersonajeController {

    private final PersonajeService personajeService;
    private final NpcService npcService;
    private final PersonajeMarketplaceService marketplaceService;

    public PersonajeController(
            PersonajeService personajeService,
            NpcService npcService,
            PersonajeMarketplaceService marketplaceService
    ) {
        this.personajeService = personajeService;
        this.npcService = npcService;
        this.marketplaceService = marketplaceService;
    }

    // ─────────────────────────────────────────────
    // Consulta
    // ─────────────────────────────────────────────

    @GetMapping("/{id}")
    public PersonajeDetalleResponse obtenerPersonaje(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return personajeService.obtenerDetallePersonaje(id, authentication.getName());
    }

    @GetMapping
    public PagedResponse<PersonajeResumenResponse> obtenerPersonajes(
            Authentication authentication,
            @RequestParam(required = false) String nombre,
            @RequestParam(required = false) List<String> sistemas,
            @RequestParam(defaultValue = "false") boolean incluirTodos,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autenticado");
        }
        return personajeService.obtenerPersonajesOrdenadosPorUso(authentication.getName(), nombre, sistemas, incluirTodos, page, size);
    }

    // ─────────────────────────────────────────────
    // Creación
    // ─────────────────────────────────────────────

    @PostMapping(path = "/npc", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PersonajeResumenResponse crearNpc(
            @RequestPart("payload") CrearNpcRequest payload,
            @RequestPart(value = "portrait", required = false) MultipartFile portrait,
            Authentication authentication
    ) {
        return npcService.crearNpc(payload, portrait, authentication.getName());
    }

    @PostMapping(path = "/dnd", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PersonajeResumenResponse crearPersonajeDnd(
            @RequestPart("payload") CrearPersonajeDndRequest payload,
            @RequestPart("portrait") MultipartFile portrait,
            Authentication authentication
    ) {
        return personajeService.crearPersonajeDnd(payload, portrait, authentication.getName());
    }

    // ─────────────────────────────────────────────
    // Uso y recursos
    // ─────────────────────────────────────────────

    @PostMapping("/{id}/usar")
    public void marcarPersonajeComoUsado(
            @PathVariable Long id,
            Authentication authentication
    ) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autenticado");
        }
        personajeService.marcarComoUsado(id, authentication.getName());
    }

    @PatchMapping("/{id}/recursos")
    public void actualizarRecursosPersonaje(
            @PathVariable Long id,
            @RequestBody ActualizarRecursosPersonajeRequest request,
            Authentication authentication
    ) {
        personajeService.actualizarRecursos(id, request, authentication.getName());
    }

    // ─────────────────────────────────────────────
    // Edición de hoja
    // ─────────────────────────────────────────────

    @PatchMapping("/{id}/experiencia")
    public PersonajeDetalleResponse actualizarExperienciaPersonaje(
            @PathVariable Long id,
            @RequestBody ActualizarExperienciaPersonajeRequest request,
            Authentication authentication
    ) {
        return personajeService.actualizarExperiencia(id, request, authentication.getName());
    }

    @PatchMapping("/{id}/edicion")
    public PersonajeDetalleResponse actualizarHojaPersonaje(
            @PathVariable Long id,
            @RequestBody ActualizarHojaPersonajeRequest request,
            Authentication authentication
    ) {
        return personajeService.actualizarHojaPersonaje(id, request, authentication.getName());
    }

    // ─────────────────────────────────────────────
    // NPC
    // ─────────────────────────────────────────────

    @PatchMapping("/{id}/npc")
    public PersonajeDetalleResponse actualizarNpc(
            @PathVariable Long id,
            @RequestBody ActualizarNpcRequest request,
            Authentication authentication
    ) {
        return npcService.actualizarNpc(id, request, authentication.getName());
    }

    @PostMapping("/{id}/habilidades/npc")
    public void agregarHabilidadNpc(
            @PathVariable Long id,
            @RequestBody AgregarHabilidadNpcRequest request,
            Authentication authentication
    ) {
        npcService.agregarHabilidadNpc(id, request, authentication.getName());
    }

    @PatchMapping("/{id}/habilidades/npc/{habilidadId}")
    public PersonajeDetalleResponse actualizarArmaHabilidadNpc(
            @PathVariable Long id,
            @PathVariable Long habilidadId,
            @RequestBody ActualizarArmaHabilidadNpcRequest request,
            Authentication authentication
    ) {
        return npcService.actualizarArmaHabilidadNpc(id, habilidadId, request, authentication.getName());
    }

    // ─────────────────────────────────────────────
    // Mochila
    // ─────────────────────────────────────────────

    @PatchMapping("/{id}/mochila/{itemId}")
    public PersonajeDetalleResponse actualizarItemMochila(
            @PathVariable Long id,
            @PathVariable Long itemId,
            @RequestBody ActualizarItemMochilaRequest request,
            Authentication authentication
    ) {
        return personajeService.actualizarItemMochila(id, itemId, request, authentication.getName());
    }

    @PostMapping("/{id}/mochila")
    public PersonajeDetalleResponse agregarItemMochila(
            @PathVariable Long id,
            @RequestBody AgregarItemMochilaRequest request,
            Authentication authentication
    ) {
        return personajeService.agregarItemMochila(id, request, authentication.getName());
    }

    @DeleteMapping("/{id}/mochila/{itemId}")
    public PersonajeDetalleResponse eliminarItemMochila(
            @PathVariable Long id,
            @PathVariable Long itemId,
            Authentication authentication
    ) {
        return personajeService.eliminarItemMochila(id, itemId, authentication.getName());
    }

    // ─────────────────────────────────────────────
    // Habilidades (personaje jugador)
    // ─────────────────────────────────────────────

    @PostMapping("/{id}/habilidades")
    public PersonajeDetalleResponse agregarHabilidad(
            @PathVariable Long id,
            @RequestBody AgregarHabilidadPersonajeRequest request,
            Authentication authentication
    ) {
        return personajeService.agregarHabilidad(id, request, authentication.getName());
    }

    @DeleteMapping("/{id}/habilidades/{habilidadId}")
    public PersonajeDetalleResponse eliminarHabilidad(
            @PathVariable Long id,
            @PathVariable Long habilidadId,
            Authentication authentication
    ) {
        return personajeService.eliminarHabilidad(id, habilidadId, authentication.getName());
    }

    // ─────────────────────────────────────────────
    // Nivel
    // ─────────────────────────────────────────────

    @PostMapping("/{id}/subir-nivel")
    public PersonajeDetalleResponse subirNivel(
            @PathVariable Long id,
            @RequestBody SubirNivelPersonajeRequest request,
            Authentication authentication
    ) {
        return personajeService.subirNivel(id, request, authentication.getName());
    }

    @PostMapping("/{id}/bajar-nivel")
    public PersonajeDetalleResponse bajarNivel(
            @PathVariable Long id,
            @RequestBody BajarNivelPersonajeRequest request,
            Authentication authentication
    ) {
        return personajeService.bajarNivel(id, request, authentication.getName());
    }

    // ─────────────────────────────────────────────
    // Retrato
    // ─────────────────────────────────────────────

    @PatchMapping(value = "/{id}/retrato", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PersonajeDetalleResponse actualizarRetrato(
            @PathVariable Long id,
            @RequestPart("portrait") MultipartFile portrait,
            Authentication authentication
    ) {
        return personajeService.actualizarRetratoPersonaje(id, portrait, authentication.getName());
    }

    // ─────────────────────────────────────────────
    // Marketplace
    // ─────────────────────────────────────────────

    @PostMapping("/{id}/guardar")
    public PersonajeResumenResponse guardarPersonaje(
            @PathVariable Long id,
            Authentication authentication
    ) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autenticado");
        }
        return marketplaceService.guardarPersonaje(id, authentication.getName());
    }

    @PostMapping("/{id}/publicar")
    public PersonajeResumenResponse publicarPersonaje(
            @PathVariable Long id,
            Authentication authentication
    ) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autenticado");
        }
        return marketplaceService.publicarPersonaje(id, authentication.getName());
    }

    @PostMapping("/{id}/instanciar")
    public PersonajeResumenResponse instanciarPersonaje(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication
    ) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autenticado");
        }
        String nombreOverride = (body != null) ? body.get("nombre") : null;
        return marketplaceService.instanciarPersonaje(id, authentication.getName(), nombreOverride);
    }

    // ─────────────────────────────────────────────
    // Eliminación
    // ─────────────────────────────────────────────

    @DeleteMapping("/{id}")
    public void eliminarPersonaje(
            @PathVariable Long id,
            Authentication authentication
    ) {
        personajeService.eliminarPersonaje(id, authentication.getName());
    }
}
