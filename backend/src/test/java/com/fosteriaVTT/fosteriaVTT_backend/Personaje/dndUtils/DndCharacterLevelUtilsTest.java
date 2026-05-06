package com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils;

import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.EstadisticaService;
import com.fosteriaVTT.fosteriaVTT_backend.InformacionDnd.DndInfoService;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.PersonajeRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Rol;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario;
import com.fosteriaVTT.fosteriaVTT_backend.dto.BajarNivelPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndPuntosGolpeResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndSubclaseResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.SubirNivelPersonajeRequest;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DndCharacterLevelUtilsTest {

    @Mock
    private PersonajeRepository personajeRepository;

    @Mock
    private DndInfoService dndInfoService;

    @Mock
    private EstadisticaService estadisticaService;

    @Mock
    private DndAbilityUtils dndAbilityUtils;

    @Mock
    private DndCharacterStatsUtils dndCharacterStatsUtils;

    @Mock
    private DndCharacterProgressionUtils dndCharacterProgressionUtils;

    @InjectMocks
    private DndCharacterLevelUtils dndCharacterLevelUtils;

    @Test
    void subirNivelAplicaCambiosYPersiste() {
        Personaje personaje = personajeBase(1L);
        ClaseDndDetalleResponse clase = clase("mago", "Mago", "d8");
        ClaseDndSubclaseResponse subclase = new ClaseDndSubclaseResponse("evocacion", "Evocacion", "", 2, List.of());
        SubirNivelPersonajeRequest request = new SubirNivelPersonajeRequest("mago", "evocacion", Map.of(), null, null, null, null);
        Map<String, Integer> estadisticas = new LinkedHashMap<>(Map.of("Constitucion", 14, "Fuerza", 10));

        when(personajeRepository.findByIdAndUsuarioUsername(1L, "daria")).thenReturn(Optional.of(personaje));
        when(dndCharacterStatsUtils.resolverNivelTotalPersonaje(personaje)).thenReturn(2);
        when(dndInfoService.obtenerClasePorId("mago")).thenReturn(Optional.of(clase));
        when(dndCharacterStatsUtils.resolverClasesPorId(personaje)).thenReturn(Map.of());
        when(dndCharacterProgressionUtils.resolverSubclaseParaProgresion(personaje, clase, "evocacion", 1, true)).thenReturn(subclase);
        when(estadisticaService.obtenerValoresPorPersonajeId(1L)).thenReturn(estadisticas);
        when(dndCharacterStatsUtils.resolverEspaciosDeConjuroTrasCambio(personaje, clase, 1, subclase)).thenReturn(Map.of(1, 2));
        when(dndCharacterStatsUtils.resolverRazaActual(personaje)).thenReturn(null);

        dndCharacterLevelUtils.subirNivel(1L, request, "daria");

        verify(dndCharacterStatsUtils).aplicarMejoraDeCaracteristicaSiCorresponde(personaje, "mago", 1, estadisticas, request);
        verify(dndAbilityUtils).agregarHabilidadesDeClasePorNivel(personaje, clase, subclase, 1, Map.of(), true);
        verify(dndAbilityUtils).sincronizarMagiaRacialPorNivel(personaje, null, 3);
        verify(personajeRepository).save(personaje);
        verify(estadisticaService).aplicarSubidaNivel(personaje, estadisticas, "d8", 7, Map.of(1, 2), 3, Set.of());
    }

    @Test
    void bajarNivelRevierteCambiosYPersiste() {
        Personaje personaje = personajeBase(2L);
        personaje.setTags("Clase;Mago:3,Subclase;Evocacion");
        ClaseDndDetalleResponse clase = clase("mago", "Mago", "d8");
        ClaseDndSubclaseResponse subclase = new ClaseDndSubclaseResponse("evocacion", "Evocacion", "", 2, List.of());
        Map<String, Integer> estadisticas = new LinkedHashMap<>(Map.of("Constitucion", 14));

        when(personajeRepository.findByIdAndUsuarioUsername(2L, "daria")).thenReturn(Optional.of(personaje));
        when(dndInfoService.obtenerClasePorId("mago")).thenReturn(Optional.of(clase));
        when(dndCharacterStatsUtils.resolverClasesPorId(personaje)).thenReturn(Map.of("mago", 3));
        when(estadisticaService.obtenerValoresPorPersonajeId(2L)).thenReturn(estadisticas);
        when(dndCharacterProgressionUtils.resolverSubclaseActual(personaje, clase)).thenReturn(subclase);
        when(dndCharacterStatsUtils.resolverEspaciosDeConjuroTrasCambio(personaje, clase, 2, subclase)).thenReturn(Map.of(1, 1));
        when(dndCharacterStatsUtils.resolverNivelTotalPersonaje(personaje)).thenReturn(4);
        when(dndCharacterStatsUtils.resolverRazaActual(personaje)).thenReturn(null);
        when(dndCharacterProgressionUtils.revertirProgresionRegistradaSiCorresponde(personaje, clase, 3, estadisticas))
            .thenReturn(new DndCharacterProgressionUtils.ProgressionReversionResult(Set.of()));

        dndCharacterLevelUtils.bajarNivel(2L, new BajarNivelPersonajeRequest("mago"), "daria");

        verify(dndCharacterProgressionUtils).revertirProgresionRegistradaSiCorresponde(personaje, clase, 3, estadisticas);
        verify(dndAbilityUtils).removerHabilidadesDeClasePorNivel(personaje, clase, subclase, 3);
        verify(dndAbilityUtils).sincronizarMagiaRacialPorNivel(personaje, null, 3);
        verify(personajeRepository).save(personaje);
        verify(estadisticaService).aplicarBajadaNivel(personaje, estadisticas, "d8", 4, Map.of(1, 1), 7, Set.of());
    }

    @Test
    void subirNivelRechazaNivelMaximo() {
        Personaje personaje = personajeBase(3L);
        when(personajeRepository.findByIdAndUsuarioUsername(3L, "daria")).thenReturn(Optional.of(personaje));
        when(dndCharacterStatsUtils.resolverNivelTotalPersonaje(personaje)).thenReturn(20);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> dndCharacterLevelUtils.subirNivel(3L, new SubirNivelPersonajeRequest("mago", null, Map.of(), null, null, null, null), "daria"));

        assertEquals(400, exception.getStatusCode().value());
        verify(personajeRepository, never()).save(any());
    }

    @Test
    void subirNivelRechazaClaseInexistente() {
        Personaje personaje = personajeBase(4L);
        when(personajeRepository.findByIdAndUsuarioUsername(4L, "daria")).thenReturn(Optional.of(personaje));
        when(dndCharacterStatsUtils.resolverNivelTotalPersonaje(personaje)).thenReturn(1);
        when(dndInfoService.obtenerClasePorId("mago")).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> dndCharacterLevelUtils.subirNivel(4L, new SubirNivelPersonajeRequest("mago", null, Map.of(), null, null, null, null), "daria"));

        assertEquals(400, exception.getStatusCode().value());
    }

    @Test
    void bajarNivelRechazaClaseSinNiveles() {
        Personaje personaje = personajeBase(5L);
        ClaseDndDetalleResponse clase = clase("mago", "Mago", "d8");
        when(personajeRepository.findByIdAndUsuarioUsername(5L, "daria")).thenReturn(Optional.of(personaje));
        when(dndInfoService.obtenerClasePorId("mago")).thenReturn(Optional.of(clase));
        when(dndCharacterStatsUtils.resolverClasesPorId(personaje)).thenReturn(Map.of());

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> dndCharacterLevelUtils.bajarNivel(5L, new BajarNivelPersonajeRequest("mago"), "daria"));

        assertEquals(400, exception.getStatusCode().value());
        verify(dndCharacterProgressionUtils, never()).revertirProgresionRegistradaSiCorresponde(any(), any(), eq(0), any());
    }

    private Personaje personajeBase(Long id) {
        return Personaje.builder()
                .id(id)
                .nombre("Aria")
                .usuario(Usuario.builder().username("daria").email("d@test.com").password("pw").role(Rol.USER).build())
                .build();
    }

    private ClaseDndDetalleResponse clase(String id, String nombre, String dadoGolpe) {
        return new ClaseDndDetalleResponse(
                id,
                nombre,
                null,
                null,
                new ClaseDndPuntosGolpeResponse(dadoGolpe, null, null),
            new com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndCompetenciasResponse(List.of(), List.of(), List.of(), List.of(), List.of()),
                null,
                List.of(),
                List.of(),
                null
        );
    }
}