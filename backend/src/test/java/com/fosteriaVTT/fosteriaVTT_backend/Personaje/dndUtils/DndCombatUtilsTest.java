package com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils;

import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.InformacionDnd.DndInfoService;
import com.fosteriaVTT.fosteriaVTT_backend.Mochila.Mochila;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.Objeto;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.ObjetoRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.TipoObjeto;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.PersonajeRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Rol;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndCompetenciasResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClasePersonajeResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndEleccionResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndRasgoResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DndCombatUtilsTest {

    @Mock
    private PersonajeRepository personajeRepository;

    @Mock
    private ObjetoRepository objetoRepository;

    @Mock
    private DndInfoService dndInfoService;

    @Mock
    private DndAbilityUtils dndAbilityUtils;

    @Mock
    private DndCharacterStatsUtils dndCharacterStatsUtils;

    @InjectMocks
    private DndCombatUtils dndCombatUtils;

    @Test
    void agregaHabilidadesDeCombateIncluyendoArmaSinArmasYAliento() {
        Personaje personaje = personajeBase();
        Objeto espada = objeto(10L, "Espada larga", "AMCuerpo", TipoObjeto.ARMA);
        Habilidad habilidadArma = habilidad(1L, "Espada larga", "DND,ARMA,OBJETO,10");
        Habilidad ataqueSinArmas = habilidad(2L, "Ataque sin armas", "DND,ACCION,ATAQUE,ATAQUESINARMAS");
        Habilidad aliento = habilidad(3L, "Arma de aliento dracónica (Fuego)", "DND,ACCION,ATAQUE,ALIENTODRACONICO");
        RazaDndDetalleResponse raza = new RazaDndDetalleResponse(
                "dragonborn",
                "Draconido",
                "",
                List.of(),
                "",
                "Mediano",
                30,
                List.of(),
                List.of(),
                List.of(new RazaDndRasgoResponse("Arma de aliento", "")),
                List.of(new RazaDndEleccionResponse("dragonborn-ancestor", "Linaje draconico", "", "ancestrosDraconicos", 1, null, List.of(), List.of())),
                List.of()
        );

        when(dndAbilityUtils.resolverORegistrarHabilidad("Espada larga", espada.getDescripcion(), espada.getFormula(), "DND,ARMA,OBJETO,10")).thenReturn(habilidadArma);
        when(dndAbilityUtils.resolverORegistrarHabilidad(
                "Ataque sin armas",
                "Golpe basico cuerpo a cuerpo. Los monjes pueden usar Fuerza o Destreza y aumentan el daño con artes marciales.",
                "1 contundente",
                "DND,ACCION,ATAQUE,ATAQUESINARMAS"
        )).thenReturn(ataqueSinArmas);
        when(dndAbilityUtils.resolverORegistrarHabilidad(
                "Arma de aliento dracónica (Fuego)",
                "Exhalas energía fuego en Cono de 15 pies (Salv. Des). CD = 8 + modificador de Constitución + competencia. Se recarga tras descanso corto o largo.",
                "2d6 fuego",
                "DND,ACCION,ATAQUE,ALIENTODRACONICO"
        )).thenReturn(aliento);
        when(dndAbilityUtils.agregarHabilidadSiNoExiste(personaje, habilidadArma)).thenReturn(true);
        when(dndAbilityUtils.agregarHabilidadSiNoExiste(personaje, ataqueSinArmas)).thenReturn(true);
        when(dndAbilityUtils.agregarHabilidadSiNoExiste(personaje, aliento)).thenReturn(true);

        dndCombatUtils.agregarHabilidadesDeCombate(
                personaje,
                List.of(Mochila.builder().cantidad(1).equipado(true).personaje(personaje).objeto(espada).build()),
                raza,
                null,
                Map.of("dragonborn-ancestor", List.of("Rojo | Fuego | Cono de 15 pies (Salv. Des)"))
        );

        verify(personajeRepository).save(personaje);
    }

    @Test
    void sincronizarAtaquesArmaEliminaObsoletosYConservaActivos() {
        Personaje personaje = personajeBase();
        personaje.setHabilidades(new ArrayList<>(List.of(
                habilidad(11L, "Arma vieja", "DND,ARMA,OBJETO,99"),
                habilidad(12L, "Rasgo", "DND,RAZA")
        )));
        Objeto arco = objeto(20L, "Arco largo", "AMRango", TipoObjeto.ARMA);
        Habilidad habilidadArco = habilidad(13L, "Arco largo", "DND,ARMA,OBJETO,20");
        Habilidad ataqueSinArmas = habilidad(14L, "Ataque sin armas", "DND,ACCION,ATAQUE,ATAQUESINARMAS");

        when(dndAbilityUtils.resolverORegistrarHabilidad("Arco largo", arco.getDescripcion(), arco.getFormula(), "DND,ARMA,OBJETO,20")).thenReturn(habilidadArco);
        when(dndAbilityUtils.resolverORegistrarHabilidad(
                "Ataque sin armas",
                "Golpe basico cuerpo a cuerpo. Los monjes pueden usar Fuerza o Destreza y aumentan el daño con artes marciales.",
                "1 contundente",
                "DND,ACCION,ATAQUE,ATAQUESINARMAS"
        )).thenReturn(ataqueSinArmas);
        when(dndAbilityUtils.agregarHabilidadSiNoExiste(personaje, habilidadArco)).thenReturn(true);
        when(dndAbilityUtils.agregarHabilidadSiNoExiste(personaje, ataqueSinArmas)).thenReturn(true);

        dndCombatUtils.sincronizarAtaquesArma(
                personaje,
                List.of(Mochila.builder().cantidad(1).equipado(true).personaje(personaje).objeto(arco).build())
        );

        assertTrue(personaje.getHabilidades().stream().noneMatch(h -> "Arma vieja".equals(h.getNombre())));
        verify(personajeRepository).save(personaje);
    }

    @Test
    void resolverCompetenciasArmaCombinaClaseYCompetenciasPersistidas() {
        Personaje personaje = personajeBase();
        ClaseDndDetalleResponse guerrero = new ClaseDndDetalleResponse(
                "guerrero",
                "Guerrero",
                null,
                null,
                null,
                new ClaseDndCompetenciasResponse(List.of(), List.of("Armas marciales"), List.of(), List.of(), List.of()),
                null,
                List.of(),
                List.of(),
                null
        );

        when(dndCharacterStatsUtils.resolverClasesPersonaje(personaje)).thenReturn(List.of(new ClasePersonajeResponse("Guerrero", 3)));
        when(dndInfoService.obtenerClases()).thenReturn(List.of(new ClaseDndResumenResponse("guerrero", "Guerrero", "Gu")));
        when(dndInfoService.obtenerClasePorId("guerrero")).thenReturn(Optional.of(guerrero));

        DndWeaponProficiencies proficiencies = dndCombatUtils.resolverCompetenciasArma(personaje);

        assertTrue(proficiencies.aplicaA(objeto(30L, "Alabarda", "AMCuerpo", TipoObjeto.ARMA)));
    }

    @Test
    void resolverBonificacionHabilidadCalculaAtaqueSinArmasDeMonje() {
        Personaje personaje = personajeBase();
        Habilidad ataqueSinArmas = habilidad(40L, "Ataque sin armas", "DND,ACCION,ATAQUE,ATAQUESINARMAS");

        when(dndCharacterStatsUtils.resolverNivelTotalPersonaje(personaje)).thenReturn(5);
        when(dndCharacterStatsUtils.resolverClasesPersonaje(personaje)).thenReturn(List.of(new ClasePersonajeResponse("Monje", 5)));

        Integer bonificacion = dndCombatUtils.resolverBonificacionHabilidad(
                personaje,
                ataqueSinArmas,
                Map.of("Fuerza", 12, "Destreza", 16)
        );

        assertEquals(6, bonificacion);
    }

    @Test
    void resolverBonificacionHabilidadCalculaArmaADistanciaConEstiloYDevuelveNullSiNoEncuentraObjeto() {
        Personaje personaje = personajeBase();
        personaje.setHabilidades(new ArrayList<>(List.of(habilidad(50L, "Estilo de combate: Tiro con arco", "DND"))));
        Habilidad ataqueArco = habilidad(51L, "Arco largo", "DND,ARMA,OBJETO,20");
        ClaseDndDetalleResponse guerrero = new ClaseDndDetalleResponse(
                "guerrero",
                "Guerrero",
                null,
                null,
                null,
                new ClaseDndCompetenciasResponse(List.of(), List.of("Armas marciales"), List.of(), List.of(), List.of()),
                null,
                List.of(),
                List.of(),
                null
        );
        Objeto arco = objeto(20L, "Arco largo", "AMRango", TipoObjeto.ARMA);

        when(dndCharacterStatsUtils.resolverNivelTotalPersonaje(personaje)).thenReturn(5);
        when(dndCharacterStatsUtils.resolverClasesPersonaje(personaje)).thenReturn(List.of(new ClasePersonajeResponse("Guerrero", 5)));
        when(dndInfoService.obtenerClases()).thenReturn(List.of(new ClaseDndResumenResponse("guerrero", "Guerrero", "Gu")));
        when(dndInfoService.obtenerClasePorId("guerrero")).thenReturn(Optional.of(guerrero));
        when(objetoRepository.findById(20L)).thenReturn(Optional.of(arco));
        when(objetoRepository.findById(99L)).thenReturn(Optional.empty());

        Integer bonificacion = dndCombatUtils.resolverBonificacionHabilidad(
                personaje,
                ataqueArco,
                Map.of("Fuerza", 10, "Destreza", 18)
        );

        assertEquals(9, bonificacion);
        assertNull(dndCombatUtils.resolverBonificacionHabilidad(personaje, habilidad(52L, "Desconocida", "DND,ARMA,OBJETO,99"), Map.of("Fuerza", 10, "Destreza", 18)));
    }

    private Personaje personajeBase() {
        return Personaje.builder()
                .nombre("Iria")
                .usuario(Usuario.builder().username("daria").email("d@test.com").password("pw").role(Rol.USER).build())
                .habilidades(new ArrayList<>())
                .build();
    }

    private Habilidad habilidad(Long id, String nombre, String tags) {
        return Habilidad.builder().id(id).nombre(nombre).descripcion("").formula(null).tags(tags).build();
    }

    private Objeto objeto(Long id, String nombre, String indice, TipoObjeto tipo) {
        return Objeto.builder().id(id).nombre(nombre).indice(indice).descripcion("desc").formula(null).tipoObjeto(tipo).build();
    }
}