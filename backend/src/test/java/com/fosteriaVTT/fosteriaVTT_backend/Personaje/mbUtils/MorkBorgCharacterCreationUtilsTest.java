package com.fosteriaVTT.fosteriaVTT_backend.Personaje.mbUtils;

import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.Estadistica;
import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.EstadisticaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.HabilidadRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Mochila.Mochila;
import com.fosteriaVTT.fosteriaVTT_backend.Mochila.MochilaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.Objeto;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.ObjetoRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.TipoObjeto;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.PersonajeRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Rol;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.UserRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario;
import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PersonajeResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.morkborg.CrearPersonajeMorkBorgRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class MorkBorgCharacterCreationUtilsTest {

    @Mock private UserRepository userRepository;
    @Mock private PersonajeRepository personajeRepository;
    @Mock private EstadisticaRepository estadisticaRepository;
    @Mock private MochilaRepository mochilaRepository;
    @Mock private ObjetoRepository objetoRepository;
    @Mock private HabilidadRepository habilidadRepository;

    @InjectMocks
    private MorkBorgCharacterCreationUtils utils;

    private Usuario usuario;
    private Personaje personajeSaved;

    @BeforeEach
    void setUp() {
        usuario = Usuario.builder()
                .username("testUser")
                .email("test@test.com")
                .password("pw")
                .role(Rol.USER)
                .build();

        personajeSaved = Personaje.builder()
                .id(1L)
                .nombre("Kragor")
                .sistemaDeJuego(SistemaDeJuego.MORK_BORG)
                .usuario(usuario)
                .build();
    }

    // ─── Helper para crear request base mínimo ───────────────────────────────

    private CrearPersonajeMorkBorgRequest reqBase(String claseId) {
        return req(claseId, null,
                10, 0, 10, 0, 10, 0, 10, 0,
                8, 3, 3, 10, 2,
                1, 1,
                1, 1, 1,
                false, null, null, null, null,
                1, 2, 1, 1, 1);
    }

    /** Construye un request con todos los tipos correctamente boxeados como Integer. */
    private CrearPersonajeMorkBorgRequest req(
            String claseId,
            java.util.List<Integer> claseOpciones,
            Integer fuerza, Integer modFuerza,
            Integer agilidad, Integer modAgilidad,
            Integer presencia, Integer modPresencia,
            Integer resistencia, Integer modResistencia,
            Integer vida, Integer presagios, Integer carga,
            Integer plata, Integer comida,
            Integer armaIdx, Integer armaduraNivel,
            Integer contenedorResult, Integer item1Result, Integer item2Result,
            Boolean wantsScroll, Integer perScrollTipo, Integer perScrollIdx,
            Integer esotScrollTipo, Integer esotScrollIdx,
            Integer rasgoTerrible1, Integer rasgoTerrible2,
            Integer cuerpoRoto, Integer habito, Integer historiaperturbadora
    ) {
        return new CrearPersonajeMorkBorgRequest(
                "Kragor", claseId, claseOpciones,
                fuerza, modFuerza,
                agilidad, modAgilidad,
                presencia, modPresencia,
                resistencia, modResistencia,
                vida, presagios, carga,
                plata, comida,
                armaIdx, armaduraNivel,
                contenedorResult, item1Result, item2Result,
                wantsScroll, perScrollTipo, perScrollIdx,
                esotScrollTipo, esotScrollIdx,
                rasgoTerrible1, rasgoTerrible2, cuerpoRoto, habito, historiaperturbadora
        );
    }

    // ─── Prueba básica: personaje base sin opciones de clase ─────────────────

    @Test
    void creaPersonajeMorkBorgBasicoYDevuelveResumen() {
        when(userRepository.findByUsername("testUser")).thenReturn(Optional.of(usuario));
        when(personajeRepository.save(any(Personaje.class))).thenReturn(personajeSaved);
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc(anyString()))
                .thenReturn(List.of());
        when(estadisticaRepository.saveAll(anyList())).thenReturn(List.of());

        CrearPersonajeMorkBorgRequest req = reqBase("escoria-callejera");
        PersonajeResumenResponse result = utils.crearPersonajeMorkBorg(req, "retrato.jpg", "testUser");

        assertNotNull(result);
        assertEquals("Kragor", result.nombre());
        assertEquals("Mork Borg", result.sistemaDeJuego());
        verify(personajeRepository).save(any(Personaje.class));
        verify(estadisticaRepository).saveAll(anyList());
    }

    @Test
    void lanzaNotFoundCuandoUsuarioNoExiste() {
        when(userRepository.findByUsername("noExiste")).thenReturn(Optional.empty());

        CrearPersonajeMorkBorgRequest req = reqBase("escoria-callejera");
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> utils.crearPersonajeMorkBorg(req, "retrato.jpg", "noExiste")
        );

        assertEquals(404, ex.getStatusCode().value());
    }

    // ─── Tags ────────────────────────────────────────────────────────────────

    @Test
    void construyeTagsConRasgosYClase() {
        when(userRepository.findByUsername("testUser")).thenReturn(Optional.of(usuario));
        when(personajeRepository.save(any(Personaje.class))).thenAnswer(inv -> {
            Personaje p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc(anyString()))
                .thenReturn(List.of());
        when(estadisticaRepository.saveAll(anyList())).thenReturn(List.of());

        CrearPersonajeMorkBorgRequest req = reqBase("escoria-callejera");

        ArgumentCaptor<Personaje> captor = ArgumentCaptor.forClass(Personaje.class);
        utils.crearPersonajeMorkBorg(req, null, "testUser");

        verify(personajeRepository).save(captor.capture());
        String tags = captor.getValue().getTags();
        assertNotNull(tags);
        assertTrue(tags.contains("MORK_BORG"));
        assertTrue(tags.contains("clase;escoria-callejera"));
        assertTrue(tags.contains("rasgoTerrible1;1"));
        assertTrue(tags.contains("rasgoTerrible2;2"));
    }

    @Test
    void construyeTagsConOpcionesDeClase() {
        when(userRepository.findByUsername("testUser")).thenReturn(Optional.of(usuario));
        when(personajeRepository.save(any(Personaje.class))).thenAnswer(inv -> {
            Personaje p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc(anyString()))
                .thenReturn(List.of());
        when(estadisticaRepository.saveAll(anyList())).thenReturn(List.of());
        when(habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc(anyString()))
                .thenReturn(List.of());

        CrearPersonajeMorkBorgRequest req = req(
                "escoria-alcantarillas", List.of(0, 2),
                10, 0, 10, 0, 10, 0, 10, 0,
                8, 3, 3, 10, 2, 1, 1,
                1, 1, 1,
                false, null, null, null, null,
                1, 2, 1, 1, 1
        );

        ArgumentCaptor<Personaje> captor = ArgumentCaptor.forClass(Personaje.class);
        utils.crearPersonajeMorkBorg(req, null, "testUser");

        verify(personajeRepository).save(captor.capture());
        String tags = captor.getValue().getTags();
        assertTrue(tags.contains("claseOpciones;0-2"));
    }

    // ─── Clases con habilidades ───────────────────────────────────────────────

    @Test
    void escoriaAlcantarillasAgregaHabilidadesClase() {
        when(userRepository.findByUsername("testUser")).thenReturn(Optional.of(usuario));
        when(personajeRepository.save(any(Personaje.class))).thenAnswer(inv -> {
            Personaje p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc(anyString()))
                .thenReturn(List.of());
        when(estadisticaRepository.saveAll(anyList())).thenReturn(List.of());

        Habilidad habilidad = Habilidad.builder().id(10L).nombre("Especialidad").build();
        when(habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc("EscEspecialidadIdx;1"))
                .thenReturn(List.of(habilidad));
        when(habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc(argThat(s -> s != null && !s.equals("EscEspecialidadIdx;1"))))
                .thenReturn(List.of());

        CrearPersonajeMorkBorgRequest req = req(
                "escoria-alcantarillas", List.of(0),
                10, 0, 10, 0, 10, 0, 10, 0,
                8, 3, 3, 10, 2, 1, 1,
                1, 1, 1,
                false, null, null, null, null,
                null, null, null, null, null
        );

        utils.crearPersonajeMorkBorg(req, null, "testUser");

        ArgumentCaptor<Personaje> captor = ArgumentCaptor.forClass(Personaje.class);
        verify(personajeRepository).save(captor.capture());
        assertTrue(captor.getValue().getHabilidades().contains(habilidad));
    }

    @Test
    void herborista_ocultistaSiempreObtieneSuHabilidad() {
        when(userRepository.findByUsername("testUser")).thenReturn(Optional.of(usuario));
        when(personajeRepository.save(any(Personaje.class))).thenAnswer(inv -> {
            Personaje p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc(anyString()))
                .thenReturn(List.of());
        when(estadisticaRepository.saveAll(anyList())).thenReturn(List.of());

        Habilidad habilidadHerb = Habilidad.builder().id(20L).nombre("Creación de decocciones").build();
        when(habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc("HerboristaHabilidadIdx;1"))
                .thenReturn(List.of(habilidadHerb));
        when(habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc(argThat(s -> s != null && !s.equals("HerboristaHabilidadIdx;1"))))
                .thenReturn(List.of());

        CrearPersonajeMorkBorgRequest req = reqBase("herborista-ocultista");
        utils.crearPersonajeMorkBorg(req, null, "testUser");

        ArgumentCaptor<Personaje> captor = ArgumentCaptor.forClass(Personaje.class);
        verify(personajeRepository).save(captor.capture());
        assertTrue(captor.getValue().getHabilidades().contains(habilidadHerb));
    }

    // ─── Pergaminos ──────────────────────────────────────────────────────────

    @Test
    void agregaPergaminoOpcionalCuandoWantsScrollEsTrue() {
        when(userRepository.findByUsername("testUser")).thenReturn(Optional.of(usuario));
        when(personajeRepository.save(any(Personaje.class))).thenAnswer(inv -> {
            Personaje p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc(anyString()))
                .thenReturn(List.of());
        when(estadisticaRepository.saveAll(anyList())).thenReturn(List.of());

        Habilidad pergamino = Habilidad.builder().id(30L).nombre("Pergamino Sagrado 3").build();
        when(habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc("PergaminoSagradoIdx;3"))
                .thenReturn(List.of(pergamino));
        when(habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc(argThat(s -> s != null && !s.equals("PergaminoSagradoIdx;3"))))
                .thenReturn(List.of());

        CrearPersonajeMorkBorgRequest req = req(
                "escoria-callejera", null,
                10, 0, 10, 0, 10, 0, 10, 0,
                8, 3, 3, 10, 2, 1, 1,
                1, 1, 1,
                true, 1, 3,   // wantsScroll=true, tipo=sagrado, idx=3
                null, null,
                null, null, null, null, null
        );

        utils.crearPersonajeMorkBorg(req, null, "testUser");

        ArgumentCaptor<Personaje> captor = ArgumentCaptor.forClass(Personaje.class);
        verify(personajeRepository).save(captor.capture());
        assertTrue(captor.getValue().getHabilidades().contains(pergamino));
    }

    @Test
    void agregaPergaminoEsotericoCuandoEsotScrollIdxPresente() {
        when(userRepository.findByUsername("testUser")).thenReturn(Optional.of(usuario));
        when(personajeRepository.save(any(Personaje.class))).thenAnswer(inv -> {
            Personaje p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc(anyString()))
                .thenReturn(List.of());
        when(estadisticaRepository.saveAll(anyList())).thenReturn(List.of());

        Habilidad pergaminoImpuro = Habilidad.builder().id(31L).nombre("Pergamino Impuro 5").build();
        when(habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc("PergaminoImpuroIdx;5"))
                .thenReturn(List.of(pergaminoImpuro));
        when(habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc(argThat(s -> s != null && !s.equals("PergaminoImpuroIdx;5"))))
                .thenReturn(List.of());

        CrearPersonajeMorkBorgRequest req = req(
                "ermitano-esoterico", null,
                10, 0, 10, 0, 10, 0, 10, 0,
                8, 3, 3, 10, 2, 1, 1,
                1, 1, 1,
                false, null, null,
                2, 5,   // esotScrollTipo=impuro, esotScrollIdx=5
                null, null, null, null, null
        );

        utils.crearPersonajeMorkBorg(req, null, "testUser");

        ArgumentCaptor<Personaje> captor = ArgumentCaptor.forClass(Personaje.class);
        verify(personajeRepository).save(captor.capture());
        assertTrue(captor.getValue().getHabilidades().contains(pergaminoImpuro));
    }

    // ─── Equipo base ─────────────────────────────────────────────────────────

    @Test
    void guardaArmaYArmaduraCuandoEstanPresentes() {
        when(userRepository.findByUsername("testUser")).thenReturn(Optional.of(usuario));
        when(personajeRepository.save(any(Personaje.class))).thenAnswer(inv -> {
            Personaje p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });
        when(estadisticaRepository.saveAll(anyList())).thenReturn(List.of());

        Objeto arma = objetoConNombre("Espada");
        Objeto armadura = objetoConNombre("Cota de malla");
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc("ArmaIdx;2"))
                .thenReturn(List.of(arma));
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc("ArmaduraNivel;2"))
                .thenReturn(List.of(armadura));
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc(argThat(s ->
                s != null && !s.equals("ArmaIdx;2") && !s.equals("ArmaduraNivel;2"))))
                .thenReturn(List.of());

        CrearPersonajeMorkBorgRequest req = req(
                "escoria-callejera", null,
                10, 0, 10, 0, 10, 0, 10, 0,
                8, 3, 3, 10, 2,
                2,   // armaIdx
                2,   // armaduraNivel
                1, 1, 1,
                false, null, null, null, null,
                null, null, null, null, null
        );

        utils.crearPersonajeMorkBorg(req, null, "testUser");

        ArgumentCaptor<Mochila> mochilaCaptor = ArgumentCaptor.forClass(Mochila.class);
        verify(mochilaRepository, atLeast(2)).save(mochilaCaptor.capture());
        List<Mochila> items = mochilaCaptor.getAllValues();
        assertTrue(items.stream().anyMatch(m -> m.getObjeto().equals(arma) && m.isEquipado()));
        assertTrue(items.stream().anyMatch(m -> m.getObjeto().equals(armadura) && m.isEquipado()));
    }

    @Test
    void guardaContenedorCuandoResultadoMayorDeDos() {
        when(userRepository.findByUsername("testUser")).thenReturn(Optional.of(usuario));
        when(personajeRepository.save(any(Personaje.class))).thenAnswer(inv -> {
            Personaje p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });
        when(estadisticaRepository.saveAll(anyList())).thenReturn(List.of());

        Objeto contenedor = objetoConNombre("Mochila de cuero");
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc("ContenedorSinClase;3"))
                .thenReturn(List.of(contenedor));
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc(argThat(s ->
                s != null && !s.equals("ContenedorSinClase;3"))))
                .thenReturn(List.of());

        CrearPersonajeMorkBorgRequest req = req(
                "escoria-callejera", null,
                10, 0, 10, 0, 10, 0, 10, 0,
                8, 3, 3, 10, 2,
                null, null,
                3, 1, 1,  // contenedorResult=3 → objeto
                false, null, null, null, null,
                null, null, null, null, null
        );

        utils.crearPersonajeMorkBorg(req, null, "testUser");

        ArgumentCaptor<Mochila> captor = ArgumentCaptor.forClass(Mochila.class);
        verify(mochilaRepository, atLeast(1)).save(captor.capture());
        assertTrue(captor.getAllValues().stream().anyMatch(m -> m.getObjeto().equals(contenedor)));
    }

    @Test
    void guardaBurroComoHabilidadCuandoContenedorResultadoEs6() {
        when(userRepository.findByUsername("testUser")).thenReturn(Optional.of(usuario));
        when(personajeRepository.save(any(Personaje.class))).thenAnswer(inv -> {
            Personaje p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });
        when(estadisticaRepository.saveAll(anyList())).thenReturn(List.of());
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc(anyString()))
                .thenReturn(List.of());

        Habilidad burro = Habilidad.builder().id(50L).nombre("Burro").build();
        when(habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc("ContenedorSinClase;6"))
                .thenReturn(List.of(burro));
        when(habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc(argThat(s -> s != null && !s.equals("ContenedorSinClase;6"))))
                .thenReturn(List.of());

        CrearPersonajeMorkBorgRequest req = req(
                "escoria-callejera", null,
                10, 0, 10, 0, 10, 0, 10, 0,
                8, 3, 3, 10, 2,
                null, null,
                6, null, null,  // contenedorResult=6 → burro (habilidad)
                false, null, null, null, null,
                null, null, null, null, null
        );

        utils.crearPersonajeMorkBorg(req, null, "testUser");

        ArgumentCaptor<Personaje> captor = ArgumentCaptor.forClass(Personaje.class);
        verify(personajeRepository).save(captor.capture());
        assertTrue(captor.getValue().getHabilidades().contains(burro));
    }

    @Test
    void item2EsPerroGuardaComoHabilidad() {
        when(userRepository.findByUsername("testUser")).thenReturn(Optional.of(usuario));
        when(personajeRepository.save(any(Personaje.class))).thenAnswer(inv -> {
            Personaje p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });
        when(estadisticaRepository.saveAll(anyList())).thenReturn(List.of());
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc(anyString()))
                .thenReturn(List.of());

        Habilidad perro = Habilidad.builder().id(51L).nombre("Perro leal").build();
        when(habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc("ItemSinClase2;3"))
                .thenReturn(List.of(perro));
        when(habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc(argThat(s -> s != null && !s.equals("ItemSinClase2;3"))))
                .thenReturn(List.of());

        CrearPersonajeMorkBorgRequest req = req(
                "escoria-callejera", null,
                10, 0, 10, 0, 10, 0, 10, 0,
                8, 3, 3, 10, 2,
                null, null,
                1, null, 3,  // item2Result=3 → perro
                false, null, null, null, null,
                null, null, null, null, null
        );

        utils.crearPersonajeMorkBorg(req, null, "testUser");

        ArgumentCaptor<Personaje> captor = ArgumentCaptor.forClass(Personaje.class);
        verify(personajeRepository).save(captor.capture());
        assertTrue(captor.getValue().getHabilidades().contains(perro));
    }

    @Test
    void item1AntorchaCalculaCantidadConModPresencia() {
        when(userRepository.findByUsername("testUser")).thenReturn(Optional.of(usuario));
        when(personajeRepository.save(any(Personaje.class))).thenAnswer(inv -> {
            Personaje p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });
        when(estadisticaRepository.saveAll(anyList())).thenReturn(List.of());

        Objeto antorcha = objetoConNombre("Antorcha");
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc("ItemSinClase1;2"))
                .thenReturn(List.of(antorcha));
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc(argThat(s -> s != null && !s.equals("ItemSinClase1;2"))))
                .thenReturn(List.of());

        CrearPersonajeMorkBorgRequest req = req(
                "escoria-callejera", null,
                10, 0, 10, 0,
                12, 1,  // presencia=12, modPresencia=1
                10, 0,
                8, 3, 3, 10, 2,
                null, null,
                1, 2, null,  // item1Result=2 → antorchas con cantidad modPresencia+4=5
                false, null, null, null, null,
                null, null, null, null, null
        );

        utils.crearPersonajeMorkBorg(req, null, "testUser");

        ArgumentCaptor<Mochila> captor = ArgumentCaptor.forClass(Mochila.class);
        verify(mochilaRepository, atLeast(1)).save(captor.capture());
        assertTrue(captor.getAllValues().stream()
                .anyMatch(m -> m.getObjeto().equals(antorcha) && m.getCantidad() == 5));
    }

    // ─── Estadísticas ────────────────────────────────────────────────────────

    @Test
    void guardaEstadisticasConTodosLosValores() {
        when(userRepository.findByUsername("testUser")).thenReturn(Optional.of(usuario));
        when(personajeRepository.save(any(Personaje.class))).thenAnswer(inv -> {
            Personaje p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc(anyString()))
                .thenReturn(List.of());

        CrearPersonajeMorkBorgRequest req = reqBase("escoria-callejera");
        utils.crearPersonajeMorkBorg(req, null, "testUser");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Estadistica>> statsCaptor = ArgumentCaptor.forClass(List.class);
        verify(estadisticaRepository).saveAll(statsCaptor.capture());

        List<Estadistica> stats = statsCaptor.getValue();
        assertTrue(stats.size() >= 10);
        assertTrue(stats.stream().anyMatch(s -> "MB_Fuerza".equals(s.getNombre())));
        assertTrue(stats.stream().anyMatch(s -> "MB_VidaMaxima".equals(s.getNombre())));
        assertTrue(stats.stream().anyMatch(s -> "MB_VidaActual".equals(s.getNombre())));
        assertTrue(stats.stream().anyMatch(s -> "MB_Plata".equals(s.getNombre())));
        assertTrue(stats.stream().anyMatch(s -> "MB_Comida".equals(s.getNombre())));
    }

    @Test
    void ignoraEstadisticasNulas() {
        when(userRepository.findByUsername("testUser")).thenReturn(Optional.of(usuario));
        when(personajeRepository.save(any(Personaje.class))).thenAnswer(inv -> {
            Personaje p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc(anyString()))
                .thenReturn(List.of());

        // Request con varios campos nulos
        CrearPersonajeMorkBorgRequest req = req(
                "escoria-callejera", null,
                null, null, null, null, null, null, null, null,
                null, null, null, null, null,
                null, null,
                null, null, null,
                false, null, null, null, null,
                null, null, null, null, null
        );

        utils.crearPersonajeMorkBorg(req, null, "testUser");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Estadistica>> statsCaptor = ArgumentCaptor.forClass(List.class);
        verify(estadisticaRepository).saveAll(statsCaptor.capture());
        assertTrue(statsCaptor.getValue().isEmpty());
    }

    // ─── Clases específicas ───────────────────────────────────────────────────

    @Test
    void ermitanoEsotericoOpcion2AgregaLibroEnMochila() {
        when(userRepository.findByUsername("testUser")).thenReturn(Optional.of(usuario));
        when(personajeRepository.save(any(Personaje.class))).thenAnswer(inv -> {
            Personaje p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });
        when(estadisticaRepository.saveAll(anyList())).thenReturn(List.of());

        Objeto libro = objetoConNombre("Un libro de sangre hirviendo");
        when(objetoRepository.findByNombreIgnoreCaseOrderByIdAsc("Un libro de sangre hirviendo"))
                .thenReturn(List.of(libro));
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc(anyString()))
                .thenReturn(List.of());
        when(habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc(anyString()))
                .thenReturn(List.of());

        CrearPersonajeMorkBorgRequest req = req(
                "ermitano-esoterico", List.of(1), // idx=1 → n=2 → libro
                10, 0, 10, 0, 10, 0, 10, 0,
                8, 3, 3, 10, 2, null, null,
                1, null, null,
                false, null, null, null, null,
                null, null, null, null, null
        );

        utils.crearPersonajeMorkBorg(req, null, "testUser");

        ArgumentCaptor<Mochila> captor = ArgumentCaptor.forClass(Mochila.class);
        verify(mochilaRepository, atLeast(1)).save(captor.capture());
        assertTrue(captor.getAllValues().stream().anyMatch(m -> m.getObjeto().equals(libro)));
    }

    @Test
    void sacerdoteHerejeAgregaObjetoEnMochila() {
        when(userRepository.findByUsername("testUser")).thenReturn(Optional.of(usuario));
        when(personajeRepository.save(any(Personaje.class))).thenAnswer(inv -> {
            Personaje p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });
        when(estadisticaRepository.saveAll(anyList())).thenReturn(List.of());

        Objeto reliquia = objetoConNombre("Reliquia sagrada");
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc("SacerdoteItemIdx;1"))
                .thenReturn(List.of(reliquia));
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc(argThat(s -> s != null && !s.equals("SacerdoteItemIdx;1"))))
                .thenReturn(List.of());

        CrearPersonajeMorkBorgRequest req = req(
                "sacerdote-hereje", List.of(0), // idx=0 → n=1
                10, 0, 10, 0, 10, 0, 10, 0,
                8, 3, 3, 10, 2, null, null,
                1, null, null,
                false, null, null, null, null,
                null, null, null, null, null
        );

        utils.crearPersonajeMorkBorg(req, null, "testUser");

        ArgumentCaptor<Mochila> captor = ArgumentCaptor.forClass(Mochila.class);
        verify(mochilaRepository, atLeast(1)).save(captor.capture());
        assertTrue(captor.getAllValues().stream()
                .anyMatch(m -> m.getObjeto().equals(reliquia) && m.isEquipado()));
    }

    @Test
    void desertorColmilludoOpcion5AgregaHabilidadViejoSabueso() {
        when(userRepository.findByUsername("testUser")).thenReturn(Optional.of(usuario));
        when(personajeRepository.save(any(Personaje.class))).thenAnswer(inv -> {
            Personaje p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });
        when(estadisticaRepository.saveAll(anyList())).thenReturn(List.of());
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc(anyString()))
                .thenReturn(List.of());

        Habilidad sabueso = Habilidad.builder().id(60L).nombre("Viejo sabueso").build();
        when(habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc("DesertorItemIdx;5"))
                .thenReturn(List.of(sabueso));
        when(habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc(argThat(s -> s != null && !s.equals("DesertorItemIdx;5"))))
                .thenReturn(List.of());

        CrearPersonajeMorkBorgRequest req = req(
                "desertor-colmilludo", List.of(4), // idx=4 → n=5 → habilidad
                10, 0, 10, 0, 10, 0, 10, 0,
                8, 3, 3, 10, 2, null, null,
                1, null, null,
                false, null, null, null, null,
                null, null, null, null, null
        );

        utils.crearPersonajeMorkBorg(req, null, "testUser");

        ArgumentCaptor<Personaje> captor = ArgumentCaptor.forClass(Personaje.class);
        verify(personajeRepository).save(captor.capture());
        assertTrue(captor.getValue().getHabilidades().contains(sabueso));
    }

    @Test
    void desertorColmilludoOpcion2AgregaObjetoEquipado() {
        when(userRepository.findByUsername("testUser")).thenReturn(Optional.of(usuario));
        when(personajeRepository.save(any(Personaje.class))).thenAnswer(inv -> {
            Personaje p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });
        when(estadisticaRepository.saveAll(anyList())).thenReturn(List.of());

        Objeto cimitarra = objetoConNombre("La cimitarra marrón de Galgenbeck");
        when(objetoRepository.findByNombreIgnoreCaseOrderByIdAsc("La cimitarra marrón de Galgenbeck"))
                .thenReturn(List.of(cimitarra));
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc(anyString()))
                .thenReturn(List.of());
        when(habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc(anyString()))
                .thenReturn(List.of());

        CrearPersonajeMorkBorgRequest req = req(
                "desertor-colmilludo", List.of(1), // idx=1 → n=2 → cimitarra equipada
                10, 0, 10, 0, 10, 0, 10, 0,
                8, 3, 3, 10, 2, null, null,
                1, null, null,
                false, null, null, null, null,
                null, null, null, null, null
        );

        utils.crearPersonajeMorkBorg(req, null, "testUser");

        ArgumentCaptor<Mochila> captor = ArgumentCaptor.forClass(Mochila.class);
        verify(mochilaRepository, atLeast(1)).save(captor.capture());
        assertTrue(captor.getAllValues().stream()
                .anyMatch(m -> m.getObjeto().equals(cimitarra) && m.isEquipado()));
    }

    @Test
    void realezaDesgraciaAgregaObjetoEquipado() {
        when(userRepository.findByUsername("testUser")).thenReturn(Optional.of(usuario));
        when(personajeRepository.save(any(Personaje.class))).thenAnswer(inv -> {
            Personaje p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });
        when(estadisticaRepository.saveAll(anyList())).thenReturn(List.of());

        Objeto armaRealeza = objetoConNombre("Espada nobiliar");
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc("RealezaItemIdx;1"))
                .thenReturn(List.of(armaRealeza));
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc(argThat(s -> s != null && !s.equals("RealezaItemIdx;1"))))
                .thenReturn(List.of());
        when(habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc(anyString()))
                .thenReturn(List.of());

        CrearPersonajeMorkBorgRequest req = req(
                "realeza-desgracia", List.of(0), // idx=0 → n=1 → objeto equipado
                10, 0, 10, 0, 10, 0, 10, 0,
                8, 3, 3, 10, 2, null, null,
                1, null, null,
                false, null, null, null, null,
                null, null, null, null, null
        );

        utils.crearPersonajeMorkBorg(req, null, "testUser");

        ArgumentCaptor<Mochila> captor = ArgumentCaptor.forClass(Mochila.class);
        verify(mochilaRepository, atLeast(1)).save(captor.capture());
        assertTrue(captor.getAllValues().stream()
                .anyMatch(m -> m.getObjeto().equals(armaRealeza) && m.isEquipado()));
    }

    @Test
    void realezaDesgraciaOpcion2AgregaHabilidadAcompanante() {
        when(userRepository.findByUsername("testUser")).thenReturn(Optional.of(usuario));
        when(personajeRepository.save(any(Personaje.class))).thenAnswer(inv -> {
            Personaje p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });
        when(estadisticaRepository.saveAll(anyList())).thenReturn(List.of());
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc(anyString()))
                .thenReturn(List.of());

        Habilidad acompanante = Habilidad.builder().id(70L).nombre("Sirviente leal").build();
        when(habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc("RealezaItemIdx;2"))
                .thenReturn(List.of(acompanante));
        when(habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc(argThat(s -> s != null && !s.equals("RealezaItemIdx;2"))))
                .thenReturn(List.of());

        CrearPersonajeMorkBorgRequest req = req(
                "realeza-desgracia", List.of(1), // idx=1 → n=2 → acompañante habilidad
                10, 0, 10, 0, 10, 0, 10, 0,
                8, 3, 3, 10, 2, null, null,
                1, null, null,
                false, null, null, null, null,
                null, null, null, null, null
        );

        utils.crearPersonajeMorkBorg(req, null, "testUser");

        ArgumentCaptor<Personaje> captor = ArgumentCaptor.forClass(Personaje.class);
        verify(personajeRepository).save(captor.capture());
        assertTrue(captor.getValue().getHabilidades().contains(acompanante));
    }

    @Test
    void noAgregaEquipoCuandoOpcionesEsNull() {
        when(userRepository.findByUsername("testUser")).thenReturn(Optional.of(usuario));
        when(personajeRepository.save(any(Personaje.class))).thenAnswer(inv -> {
            Personaje p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc(anyString()))
                .thenReturn(List.of());
        when(estadisticaRepository.saveAll(anyList())).thenReturn(List.of());

        CrearPersonajeMorkBorgRequest req = req(
                "sacerdote-hereje", null, // opciones = null
                10, 0, 10, 0, 10, 0, 10, 0,
                8, 3, 3, 10, 2, null, null,
                1, null, null,
                false, null, null, null, null,
                null, null, null, null, null
        );

        utils.crearPersonajeMorkBorg(req, null, "testUser");

        // Solo se llama si hay equipo de arma/armadura, con opciones nulas no debería haber calls de clase
        verify(mochilaRepository, never()).save(any());
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private Objeto objetoConNombre(String nombre) {
        return Objeto.builder()
                .id((long) nombre.hashCode())
                .nombre(nombre)
                .descripcion("desc")
                .tipoObjeto(TipoObjeto.MISCELANEO)
                .build();
    }
}
