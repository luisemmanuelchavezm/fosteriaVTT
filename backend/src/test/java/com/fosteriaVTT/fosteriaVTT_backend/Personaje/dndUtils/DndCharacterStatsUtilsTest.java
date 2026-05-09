package com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.InformacionDnd.DndInfoService;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndLanzamientoConjurosResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndNivelLanzamientoConjurosResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.SeleccionDoteRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.SubirNivelPersonajeRequest;
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
class DndCharacterStatsUtilsTest {

    @Mock
    private DndInfoService dndInfoService;

    @Mock
    private DndCharacterAbilityManagementUtils dndCharacterAbilityManagementUtils;

    @InjectMocks
    private DndCharacterStatsUtils dndCharacterStatsUtils;

    private Personaje personaje;

    @BeforeEach
    void setUp() {
        personaje = Personaje.builder()
                .nombre("Iria")
                .sistemaDeJuego(SistemaDeJuego.DND)
                .tags("Cmago;3,Raza;Elfo alto")
                .habilidades(List.of(habilidad("Cguerrero;2")))
                .build();
    }

    @Test
    void resuelveClasesDelPersonajeYNivelTotal() {
        assertEquals(3, dndCharacterStatsUtils.resolverNivelTotalPersonaje(personaje));
        assertEquals(1, dndCharacterStatsUtils.resolverClasesPersonaje(personaje).size());

        Personaje sinTagsDeClase = Personaje.builder()
                .nombre("Brom")
                .sistemaDeJuego(SistemaDeJuego.DND)
                .tags("Raza;Humano")
                .habilidades(List.of(habilidad("Cguerrero;2"), habilidad("Cguerrero;4")))
                .build();

        assertEquals(4, dndCharacterStatsUtils.resolverNivelTotalPersonaje(sinTagsDeClase));
        assertEquals("Guerrero", dndCharacterStatsUtils.resolverClasesPersonaje(sinTagsDeClase).getFirst().nombre());
        assertEquals(4, dndCharacterStatsUtils.resolverClasesPersonaje(sinTagsDeClase).getFirst().nivel());
    }

    @Test
    void mapeaClasesPorIdYRazaActual() {
        when(dndInfoService.obtenerClases()).thenReturn(List.of(
                new ClaseDndResumenResponse("wizard", "Mago", ""),
                new ClaseDndResumenResponse("fighter", "Guerrero", "")
        ));
        when(dndInfoService.obtenerRazas()).thenReturn(List.of(new RazaDndResumenResponse("high-elf", "Elfo alto")));
        when(dndInfoService.obtenerRazaPorId("high-elf")).thenReturn(Optional.of(new RazaDndDetalleResponse(
                "high-elf", "Elfo alto", "", List.of(), "", "", 30, List.of(), List.of(), List.of(), List.of(), List.of()
        )));

        assertEquals(Map.of("wizard", 3), dndCharacterStatsUtils.resolverClasesPorId(personaje));
        assertEquals("high-elf", dndCharacterStatsUtils.resolverRazaActual(personaje).id());
    }

    @Test
    void resuelveCaracteristicaDeLanzamientoYEspaciosDeConjuroTrasCambio() {
        ClaseDndResumenResponse wizardSummary = new ClaseDndResumenResponse("mago", "Mago", "");
        ClaseDndResumenResponse paladinSummary = new ClaseDndResumenResponse("paladin", "Paladin", "");
        ClaseDndResumenResponse warlockSummary = new ClaseDndResumenResponse("brujo", "Brujo", "");

        Personaje multiclase = Personaje.builder()
                .nombre("Lyra")
                .sistemaDeJuego(SistemaDeJuego.DND)
                .tags("Cmago;3,CPaladin;4,CBrujo;2")
                .build();

        when(dndInfoService.obtenerClases()).thenReturn(List.of(wizardSummary, paladinSummary, warlockSummary));
        when(dndInfoService.obtenerClasePorId("mago")).thenReturn(Optional.of(clase("mago", "Mago", "Inteligencia", null)));
        when(dndInfoService.obtenerClasePorId("paladin")).thenReturn(Optional.of(clase("paladin", "Paladin", "Carisma", null)));
        when(dndInfoService.obtenerClasePorId("brujo")).thenReturn(Optional.of(clase(
                "brujo",
                "Brujo",
                "Carisma",
                List.of(new ClaseDndNivelLanzamientoConjurosResponse(2, null, null, null, null, 2, 1, null, null))
        )));

        assertEquals("Inteligencia", dndCharacterStatsUtils.resolverCaracteristicaLanzamientoConjuros(multiclase));
        assertEquals(Map.of(1, 6, 2, 3, 3, 2), dndCharacterStatsUtils.resolverEspaciosDeConjuroTrasCambio(
                multiclase,
                clase("mago", "Mago", "Inteligencia", null),
                3,
                null
        ));
    }

    @Test
    void resuelveCaballeroArcanoComoLanzadorDeInteligenciaYConRanurasPropias() {
        ClaseDndResumenResponse fighterSummary = new ClaseDndResumenResponse("guerrero", "Guerrero", "");
        Personaje fighter = Personaje.builder()
                .nombre("Aster")
                .sistemaDeJuego(SistemaDeJuego.DND)
                .tags("Cguerrero;7,Subclase;Caballero arcano")
                .build();

        when(dndInfoService.obtenerClases()).thenReturn(List.of(fighterSummary));
        when(dndInfoService.obtenerClasePorId("guerrero")).thenReturn(Optional.of(clase("guerrero", "Guerrero", null, null)));
        when(dndInfoService.obtenerSubclasesClase("guerrero")).thenReturn(List.of(
                new com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndSubclaseResponse(
                        "caballeroarcano",
                        "Caballero arcano",
                        "",
                        3,
                        List.of(new com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndTablaResponse(
                                "Lanzamiento de conjuros del Caballero Arcano",
                                List.of("Nivel", "Trucos", "Conjuros", "1", "2", "3", "4"),
                                List.of(
                                        List.of("3", "2", "3", "2", "-", "-", "-"),
                                        List.of("7", "2", "5", "4", "2", "-", "-")
                                )
                        ))
                )
        ));

        assertEquals("Inteligencia", dndCharacterStatsUtils.resolverCaracteristicaLanzamientoConjuros(fighter));
        assertEquals(Map.of(1, 4, 2, 2), dndCharacterStatsUtils.resolverEspaciosDeConjuroTrasCambio(
                fighter,
                clase("guerrero", "Guerrero", null, null),
                7,
                new com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndSubclaseResponse("caballeroarcano", "Caballero arcano", "", 3, List.of())
        ));
    }

    @Test
    void aplicaMejorasDeCaracteristicaYDelegaDotes() {
        Map<String, Integer> baseStats = new LinkedHashMap<>();
        baseStats.put("Fuerza", 10);
        baseStats.put("Destreza", 12);
        baseStats.put("Constitucion", 19);

        dndCharacterStatsUtils.aplicarMejoraDeCaracteristicaSiCorresponde(
                personaje,
                "guerrero",
                4,
                baseStats,
                new SubirNivelPersonajeRequest("guerrero", null, Map.of(), "dos", "Fuerza", "Destreza", null)
        );
        assertEquals(11, baseStats.get("Fuerza"));
        assertEquals(13, baseStats.get("Destreza"));

        dndCharacterStatsUtils.aplicarMejoraDeCaracteristicaSiCorresponde(
                personaje,
                "guerrero",
                6,
                baseStats,
                new SubirNivelPersonajeRequest("guerrero", null, Map.of(), "una", "Constitucion", null, null)
        );
        assertEquals(20, baseStats.get("Constitucion"));

        SeleccionDoteRequest dote = new SeleccionDoteRequest(
                "alerta",
                "Alerta",
                null,
                Map.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                null
        );
        dndCharacterStatsUtils.aplicarMejoraDeCaracteristicaSiCorresponde(
                personaje,
                "guerrero",
                8,
                baseStats,
                new SubirNivelPersonajeRequest("guerrero", null, Map.of(), "dote", null, null, dote)
        );
        verify(dndCharacterAbilityManagementUtils).aplicarDoteSeleccionada(personaje, baseStats, dote);
    }

    @Test
    void validaErroresDeMejoraYDecrementoDeCaracteristicas() {
        Map<String, Integer> baseStats = new LinkedHashMap<>();
        baseStats.put("Fuerza", 10);
        baseStats.put("Destreza", 10);

        assertThrows(ResponseStatusException.class, () -> dndCharacterStatsUtils.aplicarMejoraDeCaracteristicaSiCorresponde(
                personaje,
                "mago",
                4,
                baseStats,
                new SubirNivelPersonajeRequest("mago", null, Map.of(), "dos", "Fuerza", "Fuerza", null)
        ));

        assertThrows(ResponseStatusException.class, () -> dndCharacterStatsUtils.aplicarMejoraDeCaracteristicaSiCorresponde(
                personaje,
                "mago",
                4,
                baseStats,
                new SubirNivelPersonajeRequest("mago", null, Map.of(), "", null, null, null)
        ));

        DndCharacterStatsUtils.decrementarCaracteristica(baseStats, "Fuerza", 20);
        DndCharacterStatsUtils.decrementarCaracteristica(baseStats, null, 2);
        assertEquals(1, baseStats.get("Fuerza"));
        assertEquals(10, baseStats.get("Destreza"));
        assertEquals(15000, dndCharacterStatsUtils.experienciaMaximaParaNivel(11));
        assertNull(dndCharacterStatsUtils.experienciaMaximaParaNivel(20));
    }

    private static Habilidad habilidad(String tags) {
        return Habilidad.builder().tags(tags).build();
    }

    private static ClaseDndDetalleResponse clase(
            String id,
            String nombre,
            String caracteristica,
            List<ClaseDndNivelLanzamientoConjurosResponse> niveles
    ) {
        return new ClaseDndDetalleResponse(
                id,
                nombre,
                "",
                "",
                null,
                null,
                caracteristica == null ? null : new ClaseDndLanzamientoConjurosResponse("prepared", caracteristica, "", niveles),
                List.of(),
                List.of(),
                null
        );
    }
}