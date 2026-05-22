package com.fosteriaVTT.fosteriaVTT_backend.Personaje;

import com.fosteriaVTT.fosteriaVTT_backend.Cloudinary.CloudinaryService;
import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.EstadisticaService;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Mochila.Mochila;
import com.fosteriaVTT.fosteriaVTT_backend.Mochila.MochilaService;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.TipoObjeto;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils.DndAbilityUtils;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils.DndCharacterAbilityManagementUtils;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils.DndCharacterCreationUtils;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils.DndCharacterLevelUtils;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils.DndCharacterStatsUtils;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils.DndCombatUtils;
import com.fosteriaVTT.fosteriaVTT_backend.Posicion.PosicionRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Rol;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.UserRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario;
import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarExperienciaPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarHojaPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarItemMochilaRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarRecursosPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.AgregarHabilidadPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.AgregarItemMochilaRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.BajarNivelPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CrearPersonajeDndRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.MochilaPersonajeResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PagedResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PersonajeDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PersonajeResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.SubirNivelPersonajeRequest;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PersonajeServiceTest {

    @Mock
    private PersonajeRepository personajeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EstadisticaService estadisticaService;

    @Mock
    private MochilaService mochilaService;

    @Mock
    private CloudinaryService cloudinaryService;

    @Mock
    private DndAbilityUtils dndAbilityUtils;

    @Mock
    private DndCharacterAbilityManagementUtils dndCharacterAbilityManagementUtils;

    @Mock
    private DndCombatUtils dndCombatUtils;

    @Mock
    private DndCharacterStatsUtils dndCharacterStatsUtils;

    @Mock
    private DndCharacterCreationUtils dndCharacterCreationUtils;

    @Mock
    private DndCharacterLevelUtils dndCharacterLevelUtils;

    @Mock
    private PosicionRepository posicionRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private PersonajeService personajeService;

    @Test
    void obtieneDetallePersonajeMapeandoRasgosHabilidadesYMochila() {
        Personaje personaje = personajeBase(1L, "Aria");
        personaje.setTags("Raza;Elfo alto,Subraza;Alto");
        Habilidad habilidad = Habilidad.builder().id(5L).nombre("Misil magico").formula("1d4+1").descripcion("impacta").tags("Hechizo;nivel-1").build();
        personaje.setHabilidades(List.of(habilidad));

        when(personajeRepository.findByIdAndUsuarioUsername(1L, "daria")).thenReturn(Optional.of(personaje));
        when(estadisticaService.obtenerValoresPorPersonajeId(1L)).thenReturn(Map.of("Fuerza", 10));
        when(dndCharacterStatsUtils.resolverClasesPersonaje(personaje)).thenReturn(List.of());
        when(dndCharacterStatsUtils.resolverCaracteristicaLanzamientoConjuros(personaje)).thenReturn("Inteligencia");
        when(dndCombatUtils.resolverBonificacionHabilidad(eq(personaje), eq(habilidad), eq(Map.of("Fuerza", 10)), any(), any())).thenReturn(7);
        when(mochilaService.obtenerItemsPersonaje(1L)).thenReturn(List.of(new MochilaPersonajeResponse(3L, "Pocion", null, "cura", 2, false, "", "consumible")));

        PersonajeDetalleResponse detalle = personajeService.obtenerDetallePersonaje(1L, "daria");

        assertEquals("Aria", detalle.nombre());
        assertEquals("Elfo Alto", detalle.raza());
        assertEquals("Alto", detalle.subraza());
        assertEquals(1, detalle.habilidades().size());
        assertEquals(7, detalle.habilidades().getFirst().bonificacion());
        assertEquals(1, detalle.mochila().size());
    }

    @Test
    void obtienePersonajesPaginadosYMapeados() {
        Usuario usuario = Usuario.builder().username("daria").email("d@test.com").password("pw").role(Rol.USER).build();
        Personaje personaje = Personaje.builder()
                .id(1L)
                .nombre("Aria")
                .retrato("img")
                .sistemaDeJuego(SistemaDeJuego.DND)
                .usado(LocalDateTime.of(2026, 4, 10, 12, 0))
                .usuario(usuario)
                .build();

        when(personajeRepository.buscarPorFiltros(eq("daria"), eq("aria"), eq(List.of(SistemaDeJuego.DND)), eq(false), eq(false), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(personaje)));

        PagedResponse<PersonajeResumenResponse> response = personajeService.obtenerPersonajesOrdenadosPorUso(
                "daria",
                " Aria ",
                List.of("Dungeons and Dragons"),
                false,
                0,
                15
        );

        assertEquals(1, response.items().size());
        assertEquals("Aria", response.items().getFirst().nombre());
        assertEquals("Dungeons and Dragons", response.items().getFirst().sistemaDeJuego());
        assertFalse(response.hasMore());
    }

    @Test
    void normalizaParametrosYAcotaPaginacion() {
        when(personajeRepository.buscarPorFiltros(eq("daria"), eq(""), eq(List.of()), eq(true), eq(false), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), org.springframework.data.domain.PageRequest.of(0, 1), 0));

        personajeService.obtenerPersonajesOrdenadosPorUso("daria", null, List.of("desconocido"), false, -5, 0);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(personajeRepository).buscarPorFiltros(eq("daria"), eq(""), eq(List.of()), eq(true), eq(false), pageableCaptor.capture());
        assertEquals(0, pageableCaptor.getValue().getPageNumber());
        assertEquals(1, pageableCaptor.getValue().getPageSize());
    }

    @Test
    void marcaComoUsadoYGuardaElPersonaje() {
        Personaje personaje = Personaje.builder().id(7L).nombre("Aria").sistemaDeJuego(SistemaDeJuego.DND).build();
        when(personajeRepository.findByIdAndUsuarioUsername(7L, "daria")).thenReturn(Optional.of(personaje));

        personajeService.marcarComoUsado(7L, "daria");

        assertTrue(personaje.getUsado() != null);
        verify(personajeRepository).save(personaje);
    }

    @Test
    void lanzaNotFoundCuandoNoExisteElPersonaje() {
        when(personajeRepository.findByIdAndUsuarioUsername(7L, "daria")).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> personajeService.marcarComoUsado(7L, "daria")
        );

        assertEquals(404, exception.getStatusCode().value());
    }

    @Test
    void creaPersonajeDndSubiendoRetratoYValidaErrores() throws IOException {
        MockMultipartFile portrait = new MockMultipartFile("portrait", "aria.png", "image/png", new byte[]{1});
        CrearPersonajeDndRequest request = new CrearPersonajeDndRequest(
            "Aria",
            "mago",
            null,
            "sabio",
            "elfo",
            null,
            "Legal bueno",
            "Historia",
            Map.of("Fuerza", 10),
            List.of(),
            Map.of(),
            Map.of(),
            Map.of(),
            Map.of(),
            Map.of()
        );
        PersonajeResumenResponse response = new PersonajeResumenResponse(1L, "Aria", "cloud", "Dungeons and Dragons", LocalDateTime.now(), "personaje");

        when(cloudinaryService.uploadFile(portrait)).thenReturn("cloud");
        when(dndCharacterCreationUtils.crearPersonajeDnd(request, "cloud", "daria")).thenReturn(response);

        assertEquals(response, personajeService.crearPersonajeDnd(request, portrait, "daria"));
        assertThrows(ResponseStatusException.class, () -> personajeService.crearPersonajeDnd(request, null, "daria"));

        when(cloudinaryService.uploadFile(portrait)).thenThrow(new IOException("boom"));
        assertThrows(ResponseStatusException.class, () -> personajeService.crearPersonajeDnd(request, portrait, "daria"));
    }

    @Test
    void actualizaRecursosYExperienciaConValidaciones() {
        Personaje personaje = personajeBase(2L, "Brom");
        when(personajeRepository.findByIdAndUsuarioUsername(2L, "daria")).thenReturn(Optional.of(personaje));
        when(dndCharacterStatsUtils.resolverNivelTotalPersonaje(personaje)).thenReturn(1);
        when(dndCharacterStatsUtils.experienciaMaximaParaNivel(1)).thenReturn(300);
        stubDetalleMinimo(2L, personaje);

        ActualizarRecursosPersonajeRequest recursos = new ActualizarRecursosPersonajeRequest(8, 3, Map.of(1, 2), Map.of(1, 1), Map.of("gp", 10));
        personajeService.actualizarRecursos(2L, recursos, "daria");
        verify(estadisticaService).actualizarRecursosPersonaje(personaje, 8, 3, Map.of(1, 2), Map.of(1, 1));
        verify(mochilaService).actualizarDineroPersonaje(personaje, Map.of("gp", 10));
        assertThrows(ResponseStatusException.class, () -> personajeService.actualizarRecursos(2L, null, "daria"));

        PersonajeDetalleResponse detalle = personajeService.actualizarExperiencia(2L, new ActualizarExperienciaPersonajeRequest(9999), "daria");
        assertEquals(2L, detalle.id());
        verify(estadisticaService).actualizarExperienciaPersonaje(personaje, 300);
        assertThrows(ResponseStatusException.class, () -> personajeService.actualizarExperiencia(2L, new ActualizarExperienciaPersonajeRequest(null), "daria"));
    }

    @Test
    void actualizaHojaYNormalizaDatosEditables() {
        Personaje personaje = personajeBase(3L, "Cora");
        when(personajeRepository.findByIdAndUsuarioUsername(3L, "daria")).thenReturn(Optional.of(personaje));
        when(estadisticaService.obtenerValoresPorPersonajeId(3L)).thenReturn(Map.of("Fuerza", 10, "Destreza", 12));
        when(dndCharacterStatsUtils.resolverNivelTotalPersonaje(personaje)).thenReturn(2);
        when(dndCharacterStatsUtils.resolverClasesPersonaje(personaje)).thenReturn(List.of());
        when(dndCharacterStatsUtils.resolverCaracteristicaLanzamientoConjuros(personaje)).thenReturn(null);
        when(mochilaService.obtenerItemsPersonaje(3L)).thenReturn(List.of());

        ActualizarHojaPersonajeRequest request = new ActualizarHojaPersonajeRequest(
                " Cora Nova ",
                "Legal bueno",
                "Tiene pasado",
                "Comun, Elfico",
                List.of("Armas simples"),
                List.of("Herramientas de ladron"),
                Map.of("Fuerza", 16),
                30,
                20,
                Map.of(1, 4),
                Map.of(1, 3),
                Map.of(1, 1),
                Map.of(1, 0),
                List.of("Fuerza"),
                List.of("Arcano"),
                List.of("Arcano")
        );

        PersonajeDetalleResponse detalle = personajeService.actualizarHojaPersonaje(3L, request, "daria");

        assertEquals("Cora Nova", personaje.getNombre());
        assertNotNull(personaje.getBiografia());
        verify(dndAbilityUtils).sincronizarIdiomasEditables(personaje, "Comun, Elfico");
        verify(dndAbilityUtils).sincronizarCompetenciasEditables(personaje, List.of("Armas simples"), List.of("Herramientas de ladron"));
        verify(estadisticaService).actualizarEdicionHoja(eq(personaje), eq(Map.of("Fuerza", 16, "Destreza", 12, "Constitucion", 10, "Inteligencia", 10, "Sabiduria", 10, "Carisma", 10)), eq(30), eq(20), eq(Map.of(1, 4)), eq(Map.of(1, 3)), eq(Map.of(1, 1)), eq(Map.of(1, 0)), eq(java.util.Set.of("fuerza")), eq(java.util.Set.of("arcano")), eq(java.util.Set.of("arcano")), eq(2));
        verify(personajeRepository).save(personaje);
        assertEquals(3L, detalle.id());
        assertThrows(ResponseStatusException.class, () -> personajeService.actualizarHojaPersonaje(3L, null, "daria"));
    }

    @Test
    void gestionaInventarioYHabilidadesManuales() {
        Personaje personaje = personajeBase(4L, "Dain");
        when(personajeRepository.findByIdAndUsuarioUsername(4L, "daria")).thenReturn(Optional.of(personaje));
        stubDetalleMinimo(4L, personaje);

        assertEquals(4L, personajeService.actualizarItemMochila(4L, 9L, new ActualizarItemMochilaRequest(true, 3), "daria").id());
        verify(mochilaService).actualizarItemPersonajeDnd(personaje, 9L, true, 3);
        assertEquals(4L, personajeService.agregarItemMochila(4L, new AgregarItemMochilaRequest(8L, "Antorcha", null, "", TipoObjeto.MISCELANEO, "torch", 2), "daria").id());
        verify(mochilaService).agregarItemPersonajeDnd(personaje, 8L, "Antorcha", null, "", TipoObjeto.MISCELANEO, "torch", "daria", 2);
        assertEquals(4L, personajeService.eliminarItemMochila(4L, 9L, "daria").id());
        verify(mochilaService).eliminarItemPersonajeDnd(personaje, 9L);

        assertEquals(4L, personajeService.agregarHabilidad(4L, new AgregarHabilidadPersonajeRequest(7L), "daria").id());
        verify(dndCharacterAbilityManagementUtils).agregarHabilidadManual(personaje, 7L);
        assertEquals(4L, personajeService.eliminarHabilidad(4L, 7L, "daria").id());
        verify(dndCharacterAbilityManagementUtils).eliminarHabilidadManual(personaje, 7L);

        assertThrows(ResponseStatusException.class, () -> personajeService.actualizarItemMochila(4L, 9L, null, "daria"));
        assertThrows(ResponseStatusException.class, () -> personajeService.agregarItemMochila(4L, null, "daria"));
        assertThrows(ResponseStatusException.class, () -> personajeService.agregarHabilidad(4L, null, "daria"));
    }

    @Test
    void eliminaPersonajeYDelegacionesDeNivel() {
        Personaje personaje = personajeBase(5L, "Eira");
        personaje.setHabilidades(new ArrayList<>(List.of(Habilidad.builder().id(11L).nombre("Misil").build())));
        when(personajeRepository.findByIdAndUsuarioUsername(5L, "daria")).thenReturn(Optional.of(personaje));
        when(mochilaService.obtenerMochilaPersonaje(5L)).thenReturn(List.of(Mochila.builder().id(6L).build()));
        stubDetalleMinimo(5L, personaje);

        personajeService.eliminarPersonaje(5L, "daria");
        verify(mochilaService).eliminarItemPersonaje(personaje, 6L);
        verify(personajeRepository, times(1)).delete(personaje);

        assertEquals(5L, personajeService.subirNivel(5L, new SubirNivelPersonajeRequest("mago", null, Map.of(), null, null, null, null), "daria").id());
        verify(dndCharacterLevelUtils).subirNivel(5L, new SubirNivelPersonajeRequest("mago", null, Map.of(), null, null, null, null), "daria");
        assertEquals(5L, personajeService.bajarNivel(5L, new BajarNivelPersonajeRequest("mago"), "daria").id());
        verify(dndCharacterLevelUtils).bajarNivel(5L, new BajarNivelPersonajeRequest("mago"), "daria");
    }

    private Personaje personajeBase(Long id, String nombre) {
        Usuario usuario = Usuario.builder().username("daria").email("d@test.com").password("pw").role(Rol.USER).build();
        return Personaje.builder()
                .id(id)
                .nombre(nombre)
                .retrato("img")
                .sistemaDeJuego(SistemaDeJuego.DND)
                .usado(LocalDateTime.of(2026, 4, 10, 12, 0))
                .usuario(usuario)
                .habilidades(new ArrayList<>())
                .build();
    }

    private void stubDetalleMinimo(Long personajeId, Personaje personaje) {
        when(estadisticaService.obtenerValoresPorPersonajeId(personajeId)).thenReturn(Map.of("Fuerza", 10));
        when(dndCharacterStatsUtils.resolverClasesPersonaje(personaje)).thenReturn(List.of());
        when(dndCharacterStatsUtils.resolverCaracteristicaLanzamientoConjuros(personaje)).thenReturn(null);
        when(mochilaService.obtenerItemsPersonaje(personajeId)).thenReturn(List.of());
    }
}