package com.fosteriaVTT.fosteriaVTT_backend.Personaje;

import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarArmaHabilidadNpcRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarExperienciaPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarHojaPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarItemMochilaRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarNpcRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarRecursosPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.AgregarHabilidadNpcRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.AgregarHabilidadPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.AgregarItemMochilaRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.BajarNivelPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PagedResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PersonajeDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PersonajeResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.SubirNivelPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.morkborg.ActualizarHPMBRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.morkborg.ActualizarSuministrosMBRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.morkborg.AgregarRasgoCustomMBRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.morkborg.EscoriaEspecialidadRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.morkborg.MejorarPersonajeMBRequest;
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
    private PersonajeMBService personajeMBService;

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
                LocalDateTime.now(), "personaje", null, "daria", null);
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
                LocalDateTime.now(), "personaje", null, "daria", null);
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
                LocalDateTime.now(), "personaje", null, "daria", null);
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
    // actualizarHojaPersonaje
    // ─────────────────────────────────────────────

    @Test
    void actualizarHoja_delegaEnPersonajeService() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("daria", null);
        auth.setAuthenticated(true);
        ActualizarHojaPersonajeRequest request = new ActualizarHojaPersonajeRequest(
                "Nuevo Nombre", null, null, null, null, null, null, null, null,
                null, null, null, null, null, null, null);
        PersonajeDetalleResponse detalle = new PersonajeDetalleResponse(
                3L, "Nuevo Nombre", null, null, "Dungeons and Dragons",
                null, null, List.of(), null, Map.of(), List.of(), List.of(),
                LocalDateTime.now(), "personaje", null, "daria", null);
        when(personajeService.actualizarHojaPersonaje(3L, request, "daria")).thenReturn(detalle);

        PersonajeDetalleResponse result = personajeController.actualizarHojaPersonaje(3L, request, auth);

        assertEquals(detalle, result);
        verify(personajeService).actualizarHojaPersonaje(3L, request, "daria");
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
                LocalDateTime.now(), "personaje", null, "daria", null);
        when(personajeService.actualizarExperiencia(3L, request, "daria")).thenReturn(detalle);

        PersonajeDetalleResponse result = personajeController.actualizarExperienciaPersonaje(3L, request, auth);

        assertEquals(detalle, result);
        verify(personajeService).actualizarExperiencia(3L, request, "daria");
    }

    // ─────────────────────────────────────────────
    // Mochila
    // ─────────────────────────────────────────────

    @Test
    void agregarItemMochila_delegaEnPersonajeService() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("daria", null);
        auth.setAuthenticated(true);
        AgregarItemMochilaRequest request = new AgregarItemMochilaRequest(1L, null, null, null, null, null, 1);
        PersonajeDetalleResponse detalle = new PersonajeDetalleResponse(
                3L, "Aria", null, null, "Dungeons and Dragons",
                null, null, List.of(), null, Map.of(), List.of(), List.of(),
                LocalDateTime.now(), "personaje", null, "daria", null);
        when(personajeService.agregarItemMochila(3L, request, "daria")).thenReturn(detalle);

        PersonajeDetalleResponse result = personajeController.agregarItemMochila(3L, request, auth);

        assertEquals(detalle, result);
        verify(personajeService).agregarItemMochila(3L, request, "daria");
    }

    @Test
    void actualizarItemMochila_delegaEnPersonajeService() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("daria", null);
        auth.setAuthenticated(true);
        ActualizarItemMochilaRequest request = new ActualizarItemMochilaRequest(true, 2);
        PersonajeDetalleResponse detalle = new PersonajeDetalleResponse(
                3L, "Aria", null, null, "Dungeons and Dragons",
                null, null, List.of(), null, Map.of(), List.of(), List.of(),
                LocalDateTime.now(), "personaje", null, "daria", null);
        when(personajeService.actualizarItemMochila(3L, 10L, request, "daria")).thenReturn(detalle);

        PersonajeDetalleResponse result = personajeController.actualizarItemMochila(3L, 10L, request, auth);

        assertEquals(detalle, result);
        verify(personajeService).actualizarItemMochila(3L, 10L, request, "daria");
    }

    @Test
    void eliminarItemMochila_delegaEnPersonajeService() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("daria", null);
        auth.setAuthenticated(true);
        PersonajeDetalleResponse detalle = new PersonajeDetalleResponse(
                3L, "Aria", null, null, "Dungeons and Dragons",
                null, null, List.of(), null, Map.of(), List.of(), List.of(),
                LocalDateTime.now(), "personaje", null, "daria", null);
        when(personajeService.eliminarItemMochila(3L, 10L, "daria")).thenReturn(detalle);

        PersonajeDetalleResponse result = personajeController.eliminarItemMochila(3L, 10L, auth);

        assertEquals(detalle, result);
        verify(personajeService).eliminarItemMochila(3L, 10L, "daria");
    }

    // ─────────────────────────────────────────────
    // Habilidades
    // ─────────────────────────────────────────────

    @Test
    void agregarHabilidad_delegaEnPersonajeService() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("daria", null);
        auth.setAuthenticated(true);
        AgregarHabilidadPersonajeRequest request = new AgregarHabilidadPersonajeRequest(5L);
        PersonajeDetalleResponse detalle = new PersonajeDetalleResponse(
                3L, "Aria", null, null, "Dungeons and Dragons",
                null, null, List.of(), null, Map.of(), List.of(), List.of(),
                LocalDateTime.now(), "personaje", null, "daria", null);
        when(personajeService.agregarHabilidad(3L, request, "daria")).thenReturn(detalle);

        PersonajeDetalleResponse result = personajeController.agregarHabilidad(3L, request, auth);

        assertEquals(detalle, result);
        verify(personajeService).agregarHabilidad(3L, request, "daria");
    }

    @Test
    void eliminarHabilidad_delegaEnPersonajeService() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("daria", null);
        auth.setAuthenticated(true);
        PersonajeDetalleResponse detalle = new PersonajeDetalleResponse(
                3L, "Aria", null, null, "Dungeons and Dragons",
                null, null, List.of(), null, Map.of(), List.of(), List.of(),
                LocalDateTime.now(), "personaje", null, "daria", null);
        when(personajeService.eliminarHabilidad(3L, 5L, "daria")).thenReturn(detalle);

        PersonajeDetalleResponse result = personajeController.eliminarHabilidad(3L, 5L, auth);

        assertEquals(detalle, result);
        verify(personajeService).eliminarHabilidad(3L, 5L, "daria");
    }

    // ─────────────────────────────────────────────
    // NPC habilidad arma
    // ─────────────────────────────────────────────

    @Test
    void actualizarArmaHabilidadNpc_delegaEnNpcService() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("daria", null);
        auth.setAuthenticated(true);
        ActualizarArmaHabilidadNpcRequest request = new ActualizarArmaHabilidadNpcRequest("Espada", "1d8+3", 3);
        PersonajeDetalleResponse detalle = new PersonajeDetalleResponse(
                3L, "Aria", null, null, "Dungeons and Dragons",
                null, null, List.of(), null, Map.of(), List.of(), List.of(),
                LocalDateTime.now(), "personaje", null, "daria", null);
        when(npcService.actualizarArmaHabilidadNpc(3L, 7L, request, "daria")).thenReturn(detalle);

        PersonajeDetalleResponse result = personajeController.actualizarArmaHabilidadNpc(3L, 7L, request, auth);

        assertEquals(detalle, result);
        verify(npcService).actualizarArmaHabilidadNpc(3L, 7L, request, "daria");
    }

    // ─────────────────────────────────────────────
    // MB enemy traits / moral
    // ─────────────────────────────────────────────

    @Test
    void guardarMBEnemyTraits_sinTagsNoLlamaAlServicio() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("daria", null);
        auth.setAuthenticated(true);

        personajeController.guardarMBEnemyTraits(3L, Map.of("tagsToAdd", "  "), auth);

        verify(npcService, org.mockito.Mockito.never()).appendTagsToEnemy(
                org.mockito.ArgumentMatchers.anyLong(),
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void guardarMBEnemyTraits_conTagsLlamaAlServicio() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("daria", null);
        auth.setAuthenticated(true);
        doNothing().when(npcService).appendTagsToEnemy(3L, "TagNuevo", "daria");

        personajeController.guardarMBEnemyTraits(3L, Map.of("tagsToAdd", "TagNuevo"), auth);

        verify(npcService).appendTagsToEnemy(3L, "TagNuevo", "daria");
    }

    @Test
    void guardarMBEnemyTraits_lanza401SiNoHayAutenticacion() {
        org.junit.jupiter.api.Assertions.assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> personajeController.guardarMBEnemyTraits(3L, Map.of(), null));
    }

    @Test
    void actualizarMBEnemyMoral_conMoralLlamaAlServicio() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("daria", null);
        auth.setAuthenticated(true);
        doNothing().when(npcService).actualizarMoralMBEnemy(3L, 8, "daria");

        personajeController.actualizarMBEnemyMoral(3L, Map.of("moralActual", 8), auth);

        verify(npcService).actualizarMoralMBEnemy(3L, 8, "daria");
    }

    @Test
    void actualizarMBEnemyMoral_lanza401SiNoHayAutenticacion() {
        org.junit.jupiter.api.Assertions.assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> personajeController.actualizarMBEnemyMoral(3L, Map.of("moralActual", 5), null));
    }

    // ─────────────────────────────────────────────
    // MB service endpoints
    // ─────────────────────────────────────────────

    @Test
    void actualizarHPMB_delegaEnPersonajeMBService() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("daria", null);
        auth.setAuthenticated(true);
        ActualizarHPMBRequest request = new ActualizarHPMBRequest(10);
        doNothing().when(personajeMBService).actualizarHPMB(3L, request, "daria");

        personajeController.actualizarHPMB(3L, request, auth);

        verify(personajeMBService).actualizarHPMB(3L, request, "daria");
    }

    @Test
    void agregarRasgoClaseMB_delegaEnPersonajeMBService() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("daria", null);
        auth.setAuthenticated(true);
        AgregarHabilidadPersonajeRequest request = new AgregarHabilidadPersonajeRequest(5L);
        PersonajeDetalleResponse detalle = new PersonajeDetalleResponse(
                3L, "Aria", null, null, "Mork Borg",
                null, null, List.of(), null, Map.of(), List.of(), List.of(),
                LocalDateTime.now(), "personaje", null, "daria", null);
        when(personajeMBService.agregarRasgoClaseMB(3L, 5L, "daria")).thenReturn(detalle);

        PersonajeDetalleResponse result = personajeController.agregarRasgoClaseMB(3L, request, auth);

        assertEquals(detalle, result);
        verify(personajeMBService).agregarRasgoClaseMB(3L, 5L, "daria");
    }

    @Test
    void crearRasgoCustomMB_delegaEnPersonajeMBService() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("daria", null);
        auth.setAuthenticated(true);
        AgregarRasgoCustomMBRequest request = new AgregarRasgoCustomMBRequest("Rasgo Especial", "Un rasgo cool");
        PersonajeDetalleResponse detalle = new PersonajeDetalleResponse(
                3L, "Aria", null, null, "Mork Borg",
                null, null, List.of(), null, Map.of(), List.of(), List.of(),
                LocalDateTime.now(), "personaje", null, "daria", null);
        when(personajeMBService.crearRasgoCustomMB(3L, request, "daria")).thenReturn(detalle);

        PersonajeDetalleResponse result = personajeController.crearRasgoCustomMB(3L, request, auth);

        assertEquals(detalle, result);
        verify(personajeMBService).crearRasgoCustomMB(3L, request, "daria");
    }

    @Test
    void intercambiarEscoriaEspecialidad_delegaEnPersonajeMBService() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("daria", null);
        auth.setAuthenticated(true);
        EscoriaEspecialidadRequest request = new EscoriaEspecialidadRequest(List.of(1L), List.of(2));
        PersonajeDetalleResponse detalle = new PersonajeDetalleResponse(
                3L, "Aria", null, null, "Mork Borg",
                null, null, List.of(), null, Map.of(), List.of(), List.of(),
                LocalDateTime.now(), "personaje", null, "daria", null);
        when(personajeMBService.intercambiarEscoriaEspecialidad(3L, request, "daria")).thenReturn(detalle);

        PersonajeDetalleResponse result = personajeController.intercambiarEscoriaEspecialidad(3L, request, auth);

        assertEquals(detalle, result);
        verify(personajeMBService).intercambiarEscoriaEspecialidad(3L, request, "daria");
    }

    @Test
    void mejorarPersonajeMB_delegaEnPersonajeMBService() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("daria", null);
        auth.setAuthenticated(true);
        MejorarPersonajeMBRequest request = new MejorarPersonajeMBRequest(1, 0, 0, 0, 12, 5);
        PersonajeDetalleResponse detalle = new PersonajeDetalleResponse(
                3L, "Aria", null, null, "Mork Borg",
                null, null, List.of(), null, Map.of(), List.of(), List.of(),
                LocalDateTime.now(), "personaje", null, "daria", null);
        when(personajeMBService.mejorarPersonajeMB(3L, request, "daria")).thenReturn(detalle);

        PersonajeDetalleResponse result = personajeController.mejorarPersonajeMB(3L, request, auth);

        assertEquals(detalle, result);
        verify(personajeMBService).mejorarPersonajeMB(3L, request, "daria");
    }

    @Test
    void actualizarSuministrosMB_delegaEnPersonajeMBService() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("daria", null);
        auth.setAuthenticated(true);
        ActualizarSuministrosMBRequest request = new ActualizarSuministrosMBRequest(10, 3, Map.of());
        doNothing().when(personajeMBService).actualizarSuministrosMB(3L, request, "daria");

        personajeController.actualizarSuministrosMB(3L, request, auth);

        verify(personajeMBService).actualizarSuministrosMB(3L, request, "daria");
    }
}