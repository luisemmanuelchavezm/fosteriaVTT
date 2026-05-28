package com.fosteriaVTT.fosteriaVTT_backend.Personaje;

import com.fosteriaVTT.fosteriaVTT_backend.Cloudinary.CloudinaryService;
import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.EstadisticaService;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils.DndAbilityUtils;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils.DndCombatUtils;
import com.fosteriaVTT.fosteriaVTT_backend.Posicion.PosicionRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.UserRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario;
import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarArmaHabilidadNpcRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarNpcRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.AgregarHabilidadNpcRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CrearNpcRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PersonajeResumenResponse;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NpcServiceTest {

    @Mock private PersonajeRepository personajeRepository;
    @Mock private UserRepository userRepository;
    @Mock private EstadisticaService estadisticaService;
    @Mock private CloudinaryService cloudinaryService;
    @Mock private DndAbilityUtils dndAbilityUtils;
    @Mock private DndCombatUtils dndCombatUtils;
    @Mock private PosicionRepository posicionRepository;
    @Mock private SimpMessagingTemplate messagingTemplate;
    @Mock private PersonajeService personajeService;

    @InjectMocks
    private NpcService npcService;

    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────

    /** Credencial ficticia usada solo en tests — no es una contraseña real. */
    private static final String DUMMY_TEST_PASSWORD = "[TEST-PLACEHOLDER]";

    private Usuario buildUsuario(String username) {
        Usuario u = new Usuario();
        u.setUsername(username);
        u.setEmail(username + "@test.com");
        u.setPassword(DUMMY_TEST_PASSWORD);
        return u;
    }

    private Personaje buildPersonaje(Long id, String nombre, Usuario usuario, String tags) {
        Personaje p = Personaje.builder()
                .nombre(nombre)
                .sistemaDeJuego(SistemaDeJuego.DND)
                .usuario(usuario)
                .tags(tags)
                .build();
        p.setId(id);
        p.setUpdatedAt(LocalDateTime.now());
        return p;
    }

    private Habilidad buildHabilidad(Long id, String nombre, String tags) {
        Habilidad h = Habilidad.builder().nombre(nombre).tags(tags).build();
        h.setId(id);
        h.setUpdatedAt(LocalDateTime.now());
        return h;
    }

    // ─────────────────────────────────────────────
    // crearNpc
    // ─────────────────────────────────────────────

    @Test
    void crearNpc_creaNpcConEstadisticasYSincronizaAtaques() {
        Usuario usuario = buildUsuario("daria");
        Personaje saved = buildPersonaje(5L, "Goblin", usuario, "enemigo,vd;1/4");

        when(userRepository.findByUsername("daria")).thenReturn(Optional.of(usuario));
        when(personajeRepository.save(any())).thenReturn(saved);
        when(personajeService.toResumen(any())).thenReturn(
                new PersonajeResumenResponse(5L, "Goblin", null, "Dungeons and Dragons",
                        LocalDateTime.now(), "enemigo", false, false, false));

        CrearNpcRequest request = new CrearNpcRequest(
                "Goblin", "enemigo", "Dungeons and Dragons", "1/4",
                "Un goblin pequeño", false, Map.of("Puntos de vida", 7));

        PersonajeResumenResponse result = npcService.crearNpc(request, null, "daria");

        assertEquals(5L, result.id());
        verify(estadisticaService).guardarEstadisticasNpc(eq(saved), any());
        verify(dndCombatUtils).sincronizarAtaquesArma(eq(saved), eq(List.of()));
    }

    @Test
    void crearNpc_lanza400SiNombreEsNulo() {
        CrearNpcRequest request = new CrearNpcRequest(null, "enemigo", null, null, null, false, null);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> npcService.crearNpc(request, null, "daria"));

        assertEquals(400, ex.getStatusCode().value());
    }

    @Test
    void crearNpc_lanza400SiNombreEsBlanco() {
        CrearNpcRequest request = new CrearNpcRequest("  ", "enemigo", null, null, null, false, null);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> npcService.crearNpc(request, null, "daria"));

        assertEquals(400, ex.getStatusCode().value());
    }

    @Test
    void crearNpc_sinEstadisticasNoPersistirEstadisticas() {
        Usuario usuario = buildUsuario("daria");
        Personaje saved = buildPersonaje(6L, "Fantasma", usuario, "enemigo");

        when(userRepository.findByUsername("daria")).thenReturn(Optional.of(usuario));
        when(personajeRepository.save(any())).thenReturn(saved);
        when(personajeService.toResumen(any())).thenReturn(
                new PersonajeResumenResponse(6L, "Fantasma", null, "Dungeons and Dragons",
                        LocalDateTime.now(), "enemigo", false, false, false));

        CrearNpcRequest request = new CrearNpcRequest("Fantasma", "enemigo", null, null, null, false, null);
        npcService.crearNpc(request, null, "daria");

        verify(estadisticaService, never()).guardarEstadisticasNpc(any(), any());
    }

    // ─────────────────────────────────────────────
    // actualizarNpc
    // ─────────────────────────────────────────────

    @Test
    void actualizarNpc_lanza400SiRequestEsNulo() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> npcService.actualizarNpc(1L, null, "daria"));

        assertEquals(400, ex.getStatusCode().value());
    }

    @Test
    void actualizarNpc_actualizaNombreYBiografiaYDevuelveDetalle() {
        Usuario usuario = buildUsuario("daria");
        Personaje personaje = buildPersonaje(1L, "Viejo nombre", usuario, "enemigo");

        when(personajeRepository.findByIdAndUsuarioUsername(1L, "daria"))
                .thenReturn(Optional.of(personaje));
        when(personajeRepository.save(any())).thenReturn(personaje);
        when(posicionRepository.findByPersonajeId(1L)).thenReturn(Optional.empty());
        when(personajeService.obtenerDetallePersonaje(1L, "daria")).thenReturn(null);

        ActualizarNpcRequest request = new ActualizarNpcRequest("Nuevo nombre", "Nueva bio", null, null);
        npcService.actualizarNpc(1L, request, "daria");

        ArgumentCaptor<Personaje> captor = ArgumentCaptor.forClass(Personaje.class);
        verify(personajeRepository).save(captor.capture());
        assertEquals("Nuevo nombre", captor.getValue().getNombre());
        assertEquals("Nueva bio", captor.getValue().getBiografia());
    }

    @Test
    void actualizarNpc_sincronizaEstadisticasSiSeProporciona() {
        Usuario usuario = buildUsuario("daria");
        Personaje personaje = buildPersonaje(1L, "Goblin", usuario, "enemigo");

        when(personajeRepository.findByIdAndUsuarioUsername(1L, "daria"))
                .thenReturn(Optional.of(personaje));
        when(personajeRepository.save(any())).thenReturn(personaje);
        when(posicionRepository.findByPersonajeId(1L)).thenReturn(Optional.empty());
        when(estadisticaService.obtenerValoresPorPersonajeId(1L)).thenReturn(
                Map.of("Puntos de vida", 7, "Vida actual", 5));
        when(personajeService.obtenerDetallePersonaje(1L, "daria")).thenReturn(null);

        Map<String, Integer> nuevasStats = Map.of("Puntos de vida", 10, "Fuerza", 12);
        ActualizarNpcRequest request = new ActualizarNpcRequest(null, null, null, nuevasStats);
        npcService.actualizarNpc(1L, request, "daria");

        verify(estadisticaService).eliminarEstadisticasPersonaje(1L);
        verify(estadisticaService).guardarEstadisticasNpc(eq(personaje), any());
    }

    // ─────────────────────────────────────────────
    // agregarHabilidadNpc
    // ─────────────────────────────────────────────

    @Test
    void agregarHabilidadNpc_lanza400SiNombreEsNulo() {
        AgregarHabilidadNpcRequest request = new AgregarHabilidadNpcRequest(null, null, "NPC", null, null);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> npcService.agregarHabilidadNpc(1L, request, "daria"));

        assertEquals(400, ex.getStatusCode().value());
    }

    @Test
    void agregarHabilidadNpc_creaHabilidadArmaParaTagARMA() {
        Usuario usuario = buildUsuario("daria");
        Personaje personaje = buildPersonaje(1L, "Goblin", usuario, "enemigo");
        Habilidad arma = buildHabilidad(20L, "Espada corta", "ARMA,NPC,PROPIA;1");

        when(personajeRepository.findByIdAndUsuarioUsername(1L, "daria"))
                .thenReturn(Optional.of(personaje));
        when(dndAbilityUtils.crearHabilidadArmaExclusiva(anyString(), any(), any(), anyString()))
                .thenReturn(arma);
        when(dndAbilityUtils.agregarHabilidadSiNoExiste(any(), any())).thenReturn(true);
        when(personajeRepository.save(any())).thenReturn(personaje);

        AgregarHabilidadNpcRequest request = new AgregarHabilidadNpcRequest(
                "Espada corta", "Ataque básico", "NPC,ARMA", "1d6+2", 3);
        npcService.agregarHabilidadNpc(1L, request, "daria");

        verify(dndAbilityUtils).crearHabilidadArmaExclusiva(
                eq("Espada corta"), eq("Ataque básico"), eq("1d6+2"), anyString());
        verify(dndAbilityUtils, never()).resolverORegistrarHabilidad(anyString(), any(), any(), anyString());
    }

    @Test
    void agregarHabilidadNpc_resuelveHabilidadNormalParaTagNPC() {
        Usuario usuario = buildUsuario("daria");
        Personaje personaje = buildPersonaje(1L, "Goblin", usuario, "enemigo");
        Habilidad rasgo = buildHabilidad(21L, "Sigilo", "NPC");

        when(personajeRepository.findByIdAndUsuarioUsername(1L, "daria"))
                .thenReturn(Optional.of(personaje));
        when(dndAbilityUtils.resolverORegistrarHabilidad(anyString(), any(), any(), anyString()))
                .thenReturn(rasgo);
        when(dndAbilityUtils.agregarHabilidadSiNoExiste(any(), any())).thenReturn(true);
        when(personajeRepository.save(any())).thenReturn(personaje);

        AgregarHabilidadNpcRequest request = new AgregarHabilidadNpcRequest(
                "Sigilo", "Se mueve sigilosamente", "NPC", null, null);
        npcService.agregarHabilidadNpc(1L, request, "daria");

        verify(dndAbilityUtils).resolverORegistrarHabilidad(
                eq("Sigilo"), eq("Se mueve sigilosamente"), eq(null), anyString());
        verify(dndAbilityUtils, never()).crearHabilidadArmaExclusiva(anyString(), any(), any(), anyString());
    }

    // ─────────────────────────────────────────────
    // actualizarArmaHabilidadNpc
    // ─────────────────────────────────────────────

    @Test
    void actualizarArmaHabilidadNpc_lanza400SiRequestEsNulo() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> npcService.actualizarArmaHabilidadNpc(1L, 20L, null, "daria"));

        assertEquals(400, ex.getStatusCode().value());
    }

    @Test
    void actualizarArmaHabilidadNpc_lanza400SiArmaNoPertenece() {
        Usuario usuario = buildUsuario("daria");
        Personaje personaje = buildPersonaje(1L, "Goblin", usuario, "enemigo");
        // personaje has no habilidades

        when(personajeRepository.findByIdAndUsuarioUsername(1L, "daria"))
                .thenReturn(Optional.of(personaje));

        ActualizarArmaHabilidadNpcRequest request = new ActualizarArmaHabilidadNpcRequest("Espada", "1d6", 2);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> npcService.actualizarArmaHabilidadNpc(1L, 99L, request, "daria"));

        assertEquals(400, ex.getStatusCode().value());
    }

    @Test
    void actualizarArmaHabilidadNpc_actualizaArmaPropia() {
        Usuario usuario = buildUsuario("daria");
        Habilidad arma = buildHabilidad(20L, "Espada corta", "ARMA,NPC,PROPIA;1");
        Personaje personaje = buildPersonaje(1L, "Goblin", usuario, "enemigo");
        personaje.getHabilidades().add(arma);

        when(personajeRepository.findByIdAndUsuarioUsername(1L, "daria"))
                .thenReturn(Optional.of(personaje));
        when(dndAbilityUtils.obtenerHabilidadPorId(20L)).thenReturn(arma);
        when(dndAbilityUtils.actualizarHabilidadArma(eq(20L), anyString(), anyString(), anyString()))
                .thenReturn(arma);
        when(posicionRepository.findByPersonajeId(1L)).thenReturn(Optional.empty());
        when(personajeService.obtenerDetallePersonaje(1L, "daria")).thenReturn(null);

        ActualizarArmaHabilidadNpcRequest request = new ActualizarArmaHabilidadNpcRequest(
                "Espada mejorada", "1d8+2", 4);
        npcService.actualizarArmaHabilidadNpc(1L, 20L, request, "daria");

        verify(dndAbilityUtils).actualizarHabilidadArma(eq(20L), eq("Espada mejorada"), eq("1d8+2"), anyString());
        verify(dndAbilityUtils, never()).crearHabilidadArmaExclusiva(anyString(), any(), any(), anyString());
    }

    @Test
    void actualizarArmaHabilidadNpc_clonaArmaPlantillaParaNpc() {
        Usuario usuario = buildUsuario("daria");
        // Arma de plantilla: no tiene PROPIA;1
        Habilidad armaPlantilla = buildHabilidad(20L, "Daga", "ARMA,NPC");
        Personaje personaje = buildPersonaje(1L, "Goblin", usuario, "enemigo");
        personaje.getHabilidades().add(armaPlantilla);

        Habilidad armaClon = buildHabilidad(21L, "Daga Venenosa", "ARMA,NPC,PROPIA;1");

        when(personajeRepository.findByIdAndUsuarioUsername(1L, "daria"))
                .thenReturn(Optional.of(personaje));
        when(dndAbilityUtils.obtenerHabilidadPorId(20L)).thenReturn(armaPlantilla);
        when(dndAbilityUtils.crearHabilidadArmaExclusiva(anyString(), any(), any(), anyString()))
                .thenReturn(armaClon);
        when(personajeRepository.save(any())).thenReturn(personaje);
        when(posicionRepository.findByPersonajeId(1L)).thenReturn(Optional.empty());
        when(personajeService.obtenerDetallePersonaje(1L, "daria")).thenReturn(null);

        ActualizarArmaHabilidadNpcRequest request = new ActualizarArmaHabilidadNpcRequest(
                "Daga Venenosa", "1d4+1d6", 2);
        npcService.actualizarArmaHabilidadNpc(1L, 20L, request, "daria");

        verify(dndAbilityUtils).crearHabilidadArmaExclusiva(
                eq("Daga Venenosa"), any(), eq("1d4+1d6"), anyString());
        verify(dndAbilityUtils, never()).actualizarHabilidadArma(any(), any(), any(), any());
    }
}
