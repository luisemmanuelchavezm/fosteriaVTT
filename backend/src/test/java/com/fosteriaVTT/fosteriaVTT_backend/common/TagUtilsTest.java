package com.fosteriaVTT.fosteriaVTT_backend.common;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Map;
import org.junit.jupiter.api.Test;

class TagUtilsTest {

    @Test
    void extraeNivelDeClaseIgnorandoFormatoYCaracteres() {
        assertEquals(5, TagUtils.extractClassLevel("Cmago;5,Subclase;escuela-de-evocacion", "Mágó"));
        assertNull(TagUtils.extractClassLevel("Cmago;no-numero", "mago"));
        assertNull(TagUtils.extractClassLevel("", "mago"));
    }

    @Test
    void extraeClasesYValoresHumanizados() {
        Map<String, Integer> classes = TagUtils.extractClasses("Cmago;2,Cguerrero;1,Cmago;5,otra-cosa");

        assertEquals(Map.of("Mago", 5, "Guerrero", 1), classes);
        assertEquals("Escuela De Evocacion", TagUtils.extractTagValue("Subclase;escuela-de-evocacion", "subclase"));
        assertNull(TagUtils.extractTagValue("Subclase;escuela-de-evocacion", "trasfondo"));
    }

    @Test
    void normalizaYFusionaTagsSinDuplicados() {
        assertEquals("escuela-de-evocacin", TagUtils.normalizeTagValue(" prefijo:Escuela de Evocación! "));
        assertEquals("Escuela De Evocacion", TagUtils.humanizeTagValue("escuela-de-evocacion"));
        assertEquals("valor", TagUtils.cleanValue("prefijo: valor"));
        assertEquals("Cguerrero;2,Subclase;campeon", TagUtils.mergeTags("Cguerrero;2", "Subclase;campeon", "Cguerrero;2"));
        assertEquals("guerrerocampeon", TagUtils.normalizeText("Guerrero: Campeón"));
    }

    @Test
    void actualizaTagsDeClaseYEliminaSubclaseAlBajarNivel() {
        String updated = TagUtils.updateClassTags("Trasfondo;sabio", "mago", 3, "Escuela de evocacion");

        assertTrue(updated.contains("Cmago;3"));
        assertTrue(updated.contains("Subclase;escuela-de-evocacion"));

        String leveledDown = TagUtils.updateClassTagsAfterLevelDown(
                updated,
                "mago",
                1,
                "Escuela de evocacion",
                2
        );

        assertEquals("Trasfondo;sabio,Cmago;1", leveledDown);
        assertEquals("Trasfondo;sabio", TagUtils.updateClassTagsAfterLevelDown(leveledDown, "mago", 0, null, null));
    }
}