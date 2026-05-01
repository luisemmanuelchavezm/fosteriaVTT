package com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndSubclaseResponse;
import java.util.List;
import org.junit.jupiter.api.Test;

class DndCharacterCheckersTest {

    @Test
    void detectaRasgosGenericosYDeSubclaseEnNivelUno() {
        ClaseDndSubclaseResponse evocacion = new ClaseDndSubclaseResponse(
                "evocacion",
                "Escuela de evocacion",
                "",
                2,
                List.of()
        );

        Habilidad rasgoClase = habilidad("DND,Cmago;1");
        Habilidad rasgoSubclase = habilidad("DND,Cmago;1,Escuela de evocacion");

        assertTrue(DndCharacterCheckers.esRasgoGenericoDeClaseNivelUno(rasgoClase, "mago", List.of(evocacion)));
        assertFalse(DndCharacterCheckers.esRasgoGenericoDeClaseNivelUno(rasgoSubclase, "mago", List.of(evocacion)));
        assertTrue(DndCharacterCheckers.esRasgoInicialDeSubclase(rasgoSubclase, "mago", "mago", evocacion));
        assertFalse(DndCharacterCheckers.esRasgoInicialDeSubclase(rasgoClase, "mago", "mago", evocacion));
    }

    @Test
    void detectaSubclasesPorIdONombreYCasosVacios() {
        ClaseDndSubclaseResponse campeon = new ClaseDndSubclaseResponse("champion", "Campeon", "", 3, List.of());

        assertTrue(DndCharacterCheckers.esRasgoDeAlgunaSubclase("DND,champion", List.of(campeon)));
        assertTrue(DndCharacterCheckers.contieneSubclase("DND,Campeón", campeon));
        assertFalse(DndCharacterCheckers.esRasgoDeAlgunaSubclase(" ", List.of(campeon)));
        assertFalse(DndCharacterCheckers.contieneSubclase("DND,otra", campeon));
    }

    @Test
    void detectaCompetenciasYHabilidadesElegidasPorUsuario() {
        assertTrue(DndCharacterCheckers.esCompetenciaGeneralEditable("Competencia: Herramientas de ladron"));
        assertFalse(DndCharacterCheckers.esCompetenciaGeneralEditable("Historia"));

        assertTrue(DndCharacterCheckers.esHabilidadElegidaUsuario(habilidad("DND,CLASE,editable")));
        assertTrue(DndCharacterCheckers.esHabilidadElegidaUsuario(habilidad("DND,IDIOMA,EDITABLE")));
        assertFalse(DndCharacterCheckers.esHabilidadElegidaUsuario(habilidad("DND,RAZA")));
    }

    @Test
    void detectaRasgosDeConjuroYAtaquesEspeciales() {
        assertTrue(DndCharacterCheckers.esConjuroRacialDeRaza(habilidad("DND,RAZA,CONJURO RACIAL,elfo-alto"), "elfo alto"));
        assertFalse(DndCharacterCheckers.esConjuroRacialDeRaza(habilidad("DND,RAZA,elfo-alto"), "elfo alto"));

        assertTrue(DndCharacterCheckers.esHechizoOTruco(habilidad("Truco,DND")));
        assertTrue(DndCharacterCheckers.esHechizoOTruco(habilidad("Hechizo;nivel-1")));
        assertFalse(DndCharacterCheckers.esHechizoOTruco(habilidad("DND,RAZA")));

        assertTrue(DndCharacterCheckers.esAtaqueSinArmas(habilidad("DND,ATAQUESINARMAS")));
        assertFalse(DndCharacterCheckers.esAtaqueSinArmas(habilidad("DND,arma")));
    }

    @Test
    void detectaLegadoInfernalSoloParaTieflingConNombreExactoNormalizado() {
        assertTrue(DndCharacterCheckers.esLegadoInfernal("DND,RAZA,tiefling", "Legado infernal"));
        assertFalse(DndCharacterCheckers.esLegadoInfernal("DND,RAZA,humano", "Legado infernal"));
        assertFalse(DndCharacterCheckers.esLegadoInfernal("DND,RAZA,tiefling", "Otro rasgo"));
    }

    private static Habilidad habilidad(String tags) {
        return Habilidad.builder()
                .tags(tags)
                .build();
    }
}