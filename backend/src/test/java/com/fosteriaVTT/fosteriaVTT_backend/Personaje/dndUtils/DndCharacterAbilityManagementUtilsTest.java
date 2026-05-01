package com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.HabilidadRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.PersonajeRepository;
import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import com.fosteriaVTT.fosteriaVTT_backend.dto.SeleccionDoteRequest;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class DndCharacterAbilityManagementUtilsTest {

    @Mock
    private HabilidadRepository habilidadRepository;

    @Mock
    private PersonajeRepository personajeRepository;

    @Mock
    private DndAbilityUtils dndAbilityUtils;

    @InjectMocks
    private DndCharacterAbilityManagementUtils dndCharacterAbilityManagementUtils;

    private Personaje personaje;

    @BeforeEach
    void setUp() {
        personaje = Personaje.builder()
                .nombre("Iria")
                .sistemaDeJuego(SistemaDeJuego.DND)
                .habilidades(new ArrayList<>())
                .build();
    }

    @Test
    void agregaYEliminaHabilidadManualValidandoElTipo() {
        Habilidad hechizo = habilidad(10L, "Misil magico", "Hechizo;nivel-1");
        when(habilidadRepository.findById(10L)).thenReturn(Optional.of(hechizo));

        dndCharacterAbilityManagementUtils.agregarHabilidadManual(personaje, 10L);

        assertEquals(1, personaje.getHabilidades().size());
        verify(personajeRepository).save(personaje);

        dndCharacterAbilityManagementUtils.eliminarHabilidadManual(personaje, 10L);
        assertEquals(0, personaje.getHabilidades().size());
        verify(personajeRepository, org.mockito.Mockito.times(2)).save(personaje);

        Habilidad rasgo = habilidad(20L, "Rasgo", "DND,RAZA");
        when(habilidadRepository.findById(20L)).thenReturn(Optional.of(rasgo));

        assertThrows(ResponseStatusException.class, () -> dndCharacterAbilityManagementUtils.agregarHabilidadManual(personaje, 20L));
        assertThrows(ResponseStatusException.class, () -> dndCharacterAbilityManagementUtils.eliminarHabilidadManual(personaje, 999L));
    }

    @Test
    void noGuardaDosVecesSiLaHabilidadYaExiste() {
        Habilidad hechizo = habilidad(10L, "Misil magico", "Hechizo;nivel-1");
        personaje.getHabilidades().add(hechizo);
        when(habilidadRepository.findById(10L)).thenReturn(Optional.of(hechizo));

        dndCharacterAbilityManagementUtils.agregarHabilidadManual(personaje, 10L);

        assertEquals(1, personaje.getHabilidades().size());
        verify(personajeRepository, never()).save(personaje);
    }

    @Test
    void aplicaDoteSeleccionadaYGeneraCompetenciasIdiomasYConjuros() {
        Map<String, Integer> baseStats = new LinkedHashMap<>();
        baseStats.put("Fuerza", 10);

        Habilidad feat = habilidad(1L, "Alerta", "DND,DOTE");
        Habilidad competencia = habilidad(2L, "Competencia: Herramientas de ladron", "DND,DOTE,COMPETENCIA");
        Habilidad habilidadDote = habilidad(6L, "Competencia: Historia", "DND,DOTE,COMPETENCIA");
        Habilidad idioma = habilidad(3L, "Idioma: Elfico", "DND,DOTE,IDIOMA");
        Habilidad conjuroBase = habilidad(4L, "Disfrazarse", "Hechizo;nivel-1");
        Habilidad conjuroDote = habilidad(5L, "Disfrazarse", "DND,DOTE,CONJURO");

        when(habilidadRepository.findByNombreIgnoreCaseOrderByIdAsc("Alerta")).thenReturn(List.of());
        when(habilidadRepository.findByNombreIgnoreCaseOrderByIdAsc("Disfrazarse")).thenReturn(List.of(conjuroDote));
        when(habilidadRepository.save(any(Habilidad.class))).thenReturn(feat);
        when(dndAbilityUtils.resolverORegistrarHabilidad(any(), any(), any(), any()))
                .thenReturn(competencia)
                .thenReturn(habilidadDote)
                .thenReturn(idioma);
        when(dndAbilityUtils.resolverHechizoPorNombre("Disfrazarse")).thenReturn(Optional.of(conjuroBase));

        SeleccionDoteRequest seleccion = new SeleccionDoteRequest(
                "Alerta",
                "Siempre atento",
                null,
                Map.of("Fuerza", 1),
                List.of("Herramientas de ladron"),
                List.of("Historia"),
                List.of("Elfico"),
                List.of("Disfrazarse"),
                null
        );

        dndCharacterAbilityManagementUtils.aplicarDoteSeleccionada(personaje, baseStats, seleccion);

        assertEquals(5, personaje.getHabilidades().size());
        assertEquals(11, baseStats.get("Fuerza"));
    }

    @Test
    void validaSeleccionDeDoteYDeserializaBonificaciones() {
        assertThrows(ResponseStatusException.class,
                () -> dndCharacterAbilityManagementUtils.aplicarDoteSeleccionada(personaje, new LinkedHashMap<>(), null));

        Habilidad feat = habilidad(1L, "Alerta", "DND,DOTE");
        when(habilidadRepository.findByNombreIgnoreCaseOrderByIdAsc("Alerta")).thenReturn(List.of(feat));
        when(dndAbilityUtils.resolverHechizoPorNombre("Inexistente")).thenReturn(Optional.empty());

        SeleccionDoteRequest seleccion = new SeleccionDoteRequest(
                "Alerta",
                "",
                null,
                Map.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of("Inexistente"),
                null
        );

        assertThrows(ResponseStatusException.class,
                () -> dndCharacterAbilityManagementUtils.aplicarDoteSeleccionada(personaje, new LinkedHashMap<>(), seleccion));

        assertEquals(Map.of("Fuerza", 2, "Destreza", 1), dndCharacterAbilityManagementUtils.deserializarBonificacionesDote(
                "Fuerza:2,Destreza:1,invalida,no-numero:x"
        ));
        assertEquals(Map.of(), dndCharacterAbilityManagementUtils.deserializarBonificacionesDote("  "));
    }

    private static Habilidad habilidad(Long id, String nombre, String tags) {
        return Habilidad.builder()
                .id(id)
                .nombre(nombre)
                .descripcion("")
                .tags(tags)
                .build();
    }
}