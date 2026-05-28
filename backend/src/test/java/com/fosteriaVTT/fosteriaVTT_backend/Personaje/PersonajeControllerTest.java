package com.fosteriaVTT.fosteriaVTT_backend.Personaje;

import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarExperienciaPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarNpcRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarRecursosPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.AgregarHabilidadNpcRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.BajarNivelPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PagedResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PersonajeDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PersonajeResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.SubirNivelPersonajeRequest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PersonajeControllerTest {

    @Mock
    private PersonajeService personajeService;

    @Mock
    private NpcService npcService;

    @Mock
    private PersonajeMarketplaceService marketplaceService;

    @InjectMocks
    private PersonajeController personajeController;

    @Test
    void obtienePersonajesConFiltrosYpaginacion() {
        TestingAuthenticationToken authentication = new TestingAuthenticationToken("daria", null);
        authentication.setAuthenticated(true);
        PagedResponse<PersonajeResumenResponse> response = new PagedResponse<>(
                List.of(new PersonajeResumenResponse(1L, "Aria", "img", "Dungeons and Dragons", LocalDateTime.now(), "personaje", false, false, false)),
                false
        );

        when(personajeService.obtenerPersonajesOrdenadosPorUso("daria", "aria", List.of("Dungeons and Dragons"), false, 1, 15))
                .thenReturn(response);

        PagedResponse<PersonajeResumenResponse> result = personajeController.obtenerPersonajes(
                authentication,
                "aria",
                List.of("Dungeons and Dragons"),
                false,
                1,
                15
        );

        assertEquals(response, result);
        verify(personajeService).obtenerPersonajesOrdenadosPorUso("daria", "aria", List.of("Dungeons and Dragons"), false, 1, 15);
    }

    @Test
    void lanzaUnauthorizedSiNoHayAutenticacionEnListado() {
        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> personajeController.obtenerPersonajes(null, null, null, false, 0, 15)
        );

        assertEquals(401, exception.getStatusCode().value());
    }

    @Test
    void marcaPersonajeComoUsadoCuandoHayAutenticacion() {
        TestingAuthenticationToken authentication = new TestingAuthenticationToken("daria", null);
        authentication.setAuthenticated(true);

        personajeController.marcarPersonajeComoUsado(7L, authentication);

        verify(personajeService).marcarComoUsado(7L, "daria");
    }

    @Test
    void lanzaUnauthorizedSiNoHayAutenticacionAlMarcarUso() {
        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> personajeController.marcarPersonajeComoUsado(7L, null)
        );

        assertEquals(401, exception.getStatusCode().value());
    }

    // ─────────────────────────────────────────────
    // NPC endpoints → npcService
    // ─────────────────────────────────────────────

    @Test
    void actualizarNpc_delegaEnNpcService() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("daria", null);
        auth.setAuthenticated(true);
        ActualizarNpcRequest request = new ActualizarNpcRequest("Nuevo nombre", null, null, null);

        personajeController.actualizarNpc(5L, request, auth);

        verify(npcService).actualizarNpc(5L, request, "daria");
    }

    @Test
    void agregarHabilidadNpc_delegaEnNpcService() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("daria", null);
        auth.setAuthenticated(true);
        AgregarHabilidadNpcRequest request = new AgregarHabilidadNpcRequest("Sigilo", null, "NPC", null, null);

        personajeController.agregarHabilidadNpc(5L, request, auth);

        verify(npcService).agregarHabilidadNpc(5L, request, "daria");
    }

    // ─────────────────────────────────────────────
    // Marketplace endpoints → marketplaceService
    // ─────────────────────────────────────────────

    @Test
    void guardarPersonaje_delegaEnMarketplaceService() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("daria", null);
        auth.setAuthenticated(true);
        PersonajeResumenResponse resumen = new PersonajeResumenResponse(
                10L, "Aria", null, "Dungeons and Dragons", LocalDateTime.now(), "personaje", false, false, true);
        when(marketplaceService.guardarPersonaje(10L, "daria")).thenReturn(resumen);

        PersonajeResumenResponse result = personajeController.guardarPersonaje(10L, auth);

        assertEquals(resumen, result);
        verify(marketplaceService).guardarPersonaje(10L, "daria");
    }

    @Test
    void guardarPersonaje_lanza401SiNoHayAutenticacion() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> personajeController.guardarPersonaje(10L, null));

        assertEquals(401, ex.getStatusCode().value());
    }

    @Test
    void publicarPersonaje_delegaEnMarketplaceService() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("daria", null);
        auth.setAuthenticated(true);
        PersonajeResumenResponse resumen = new PersonajeResumenResponse(
                11L, "Aria Pública", null, "Dungeons and Dragons", LocalDateTime.now(), "personaje", true, false, false);
        when(marketplaceService.publicarPersonaje(10L, "daria")).thenReturn(resumen);

        PersonajeResumenResponse result = personajeController.publicarPersonaje(10L, auth);

        assertEquals(resumen, result);
        verify(marketplaceService).publicarPersonaje(10L, "daria");
    }

    @Test
    void publicarPersonaje_lanza401SiNoHayAutenticacion() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> personajeController.publicarPersonaje(10L, null));

        assertEquals(401, ex.getStatusCode().value());
    }

    @Test
    void instanciarPersonaje_delegaEnMarketplaceServiceConNombreOverride() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("daria", null);
        auth.setAuthenticated(true);
        PersonajeResumenResponse resumen = new PersonajeResumenResponse(
                12L, "Mi Aria", null, "Dungeons and Dragons", LocalDateTime.now(), "personaje", false, false, false);
        when(marketplaceService.instanciarPersonaje(10L, "daria", "Mi Aria")).thenReturn(resumen);

        PersonajeResumenResponse result = personajeController.instanciarPersonaje(
                10L, Map.of("nombre", "Mi Aria"), auth);

        assertEquals(resumen, result);
        verify(marketplaceService).instanciarPersonaje(10L, "daria", "Mi Aria");
    }

    @Test
    void instanciarPersonaje_delegaSinNombreOverrideSiBodyEsNulo() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("daria", null);
        auth.setAuthenticated(true);
        when(marketplaceService.instanciarPersonaje(10L, "daria", null)).thenReturn(null);

        personajeController.instanciarPersonaje(10L, null, auth);

        verify(marketplaceService).instanciarPersonaje(10L, "daria", null);
    }

    @Test
    void instanciarPersonaje_lanza401SiNoHayAutenticacion() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> personajeController.instanciarPersonaje(10L, null, null));

        assertEquals(401, ex.getStatusCode().value());
    }

    // ─────────────────────────────────────────────
    // obtenerPersonaje
    // ─────────────────────────────────────────────

    @Test
    void obtenerPersonaje_delegaEnPersonajeService() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("daria", null);
        auth.setAuthenticated(true);
        PersonajeDetalleResponse detalle = new PersonajeDetalleResponse(
                3L, "Aria", null, null, "Dungeons and Dragons",
                null, null, List.of(), null, Map.of(), List.of(), List.of(),
                LocalDateTime.now(), "personaje", null, "daria");
        when(personajeService.obtenerDetallePersonaje(3L, "daria")).thenReturn(detalle);

        PersonajeDetalleResponse result = personajeController.obtenerPersonaje(3L, auth);

        assertEquals(detalle, result);
        verify(personajeService).obtenerDetallePersonaje(3L, "daria");
    }

    // ─────────────────────────────────────────────
    // subirNivel / bajarNivel
    // ─────────────────────────────────────────────

    @Test
    void subirNivel_delegaEnPersonajeService() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("daria", null);
        auth.setAuthenticated(true);
        SubirNivelPersonajeRequest request = new SubirNivelPersonajeRequest(
                "barbaro", null, Map.of(), null, null, null, null);
        PersonajeDetalleResponse detalle = new PersonajeDetalleResponse(
                3L, "Aria", null, null, "Dungeons and Dragons",
                null, null, List.of(), null, Map.of(), List.of(), List.of(),
                LocalDateTime.now(), "personaje", null, "daria");
        when(personajeService.subirNivel(3L, request, "daria")).thenReturn(detalle);

        PersonajeDetalleResponse result = personajeController.subirNivel(3L, request, auth);

        assertEquals(detalle, result);
        verify(personajeService).subirNivel(3L, request, "daria");
    }

    @Test
    void bajarNivel_delegaEnPersonajeService() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("daria", null);
        auth.setAuthenticated(true);
        BajarNivelPersonajeRequest request = new BajarNivelPersonajeRequest("barbaro");
        PersonajeDetalleResponse detalle = new PersonajeDetalleResponse(
                3L, "Aria", null, null, "Dungeons and Dragons",
                null, null, List.of(), null, Map.of(), List.of(), List.of(),
                LocalDateTime.now(), "personaje", null, "daria");
        when(personajeService.bajarNivel(3L, request, "daria")).thenReturn(detalle);

        PersonajeDetalleResponse result = personajeController.bajarNivel(3L, request, auth);

        assertEquals(detalle, result);
        verify(personajeService).bajarNivel(3L, request, "daria");
    }

    // ─────────────────────────────────────────────
    // eliminarPersonaje
    // ─────────────────────────────────────────────

    @Test
    void eliminarPersonaje_delegaEnPersonajeService() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("daria", null);
        auth.setAuthenticated(true);
        doNothing().when(personajeService).eliminarPersonaje(3L, "daria");

        personajeController.eliminarPersonaje(3L, auth);

        verify(personajeService).eliminarPersonaje(3L, "daria");
    }

    // ─────────────────────────────────────────────
    // actualizarRecursosPersonaje / actualizarExperiencia
    // ─────────────────────────────────────────────

    @Test
    void actualizarRecursos_delegaEnPersonajeService() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("daria", null);
        auth.setAuthenticated(true);
        ActualizarRecursosPersonajeRequest request = new ActualizarRecursosPersonajeRequest(
                25, 0, Map.of(), Map.of(), Map.of());
        doNothing().when(personajeService).actualizarRecursos(3L, request, "daria");

        personajeController.actualizarRecursosPersonaje(3L, request, auth);

        verify(personajeService).actualizarRecursos(3L, request, "daria");
    }

    @Test
    void actualizarExperiencia_delegaEnPersonajeService() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("daria", null);
        auth.setAuthenticated(true);
        ActualizarExperienciaPersonajeRequest request = new ActualizarExperienciaPersonajeRequest(300);
        PersonajeDetalleResponse detalle = new PersonajeDetalleResponse(
                3L, "Aria", null, null, "Dungeons and Dragons",
                null, null, List.of(), null, Map.of(), List.of(), List.of(),
                LocalDateTime.now(), "personaje", null, "daria");
        when(personajeService.actualizarExperiencia(3L, request, "daria")).thenReturn(detalle);

        PersonajeDetalleResponse result = personajeController.actualizarExperienciaPersonaje(3L, request, auth);

        assertEquals(detalle, result);
        verify(personajeService).actualizarExperiencia(3L, request, "daria");
    }
}