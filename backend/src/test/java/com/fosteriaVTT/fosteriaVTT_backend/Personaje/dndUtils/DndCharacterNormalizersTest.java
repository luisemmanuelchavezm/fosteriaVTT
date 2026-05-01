package com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;

class DndCharacterNormalizersTest {

    @Test
    void normalizaTextoYConstruyeBiografiaSoloConBloquesDisponibles() {
        assertEquals("caotico neutral", DndCharacterNormalizers.normalizarFiltroTexto("  Caotico Neutral  "));
        assertEquals(
                "Alineamiento: Legal bueno\n\nHistoria personal:\nCrecio en el bosque",
                DndCharacterNormalizers.construirBiografia("etiqueta:Legal bueno", "  Crecio en el bosque  ")
        );
        assertEquals("Historia personal:\nTexto", DndCharacterNormalizers.construirBiografia(null, "Texto"));
        assertNull(DndCharacterNormalizers.construirBiografia("   ", null));
    }

    @Test
    void resuelveEstadisticasEditablesConValoresPorDefectoYLimites() {
        Map<String, Integer> currentStats = new LinkedHashMap<>();
        currentStats.put("Fuerza", 14);
        currentStats.put("Destreza", 12);

        Map<String, Integer> requestedStats = new LinkedHashMap<>();
        requestedStats.put("Fuerza", 40);
        requestedStats.put("Constitucion", 6);

        Map<String, Integer> updated = DndCharacterNormalizers.resolverEstadisticasEditables(currentStats, requestedStats);

        assertEquals(30, updated.get("Fuerza"));
        assertEquals(12, updated.get("Destreza"));
        assertEquals(8, updated.get("Constitucion"));
        assertEquals(10, updated.get("Carisma"));
    }

    @Test
    void combinaCompetenciasYDescartaHabilidadesCanonicas() {
        Set<String> competencias = DndCharacterNormalizers.combinarCompetenciasEditables(
                List.of("Armas marciales", "Atletismo", "armas marciales"),
                List.of("Herramientas de ladron", "  ", "herramientas de ladron")
        );

        assertEquals(Set.of("Armas marciales", "Herramientas de ladron"), competencias);
        assertEquals("Instrumentos musicales", DndCharacterNormalizers.normalizarCompetenciaGeneral(" prefijo:Instrumentos musicales "));
        assertNull(DndCharacterNormalizers.normalizarCompetenciaGeneral("Historia"));
        assertNull(DndCharacterNormalizers.normalizarCompetenciaGeneral("   "));
    }

    @Test
    void normalizaSalvacionesYHabilidadesUsandoValoresCanonicos() {
        assertEquals(
                Set.of("fuerza", "sabiduria"),
                DndCharacterNormalizers.normalizarSalvaciones(List.of("Fuerza", "sabiduría", "fuerza", "invalida"))
        );
        assertEquals(
                Set.of("arcano", "persuasion"),
                DndCharacterNormalizers.normalizarHabilidades(List.of("Arcano", "Persuasión", "arcano", "nada"))
        );
    }

    @Test
    void generaNombreDesdeEleccionYDeserializaDatosCodificados() {
        assertEquals("Idioma: Elfico", DndCharacterNormalizers.nombreHabilidadDesdeEleccion("idiomas", "Etiqueta", "Elfico"));
        assertEquals("Competencia: Laúd", DndCharacterNormalizers.nombreHabilidadDesdeEleccion("instrumentos", "Etiqueta", "Laúd"));
        assertEquals("Etiqueta: Valor", DndCharacterNormalizers.nombreHabilidadDesdeEleccion("desconocido", "Etiqueta", "Valor"));
        assertEquals("Etiqueta: Valor", DndCharacterNormalizers.nombreHabilidadDesdeEleccion(null, "Etiqueta", "Valor"));

        Map<String, List<String>> elecciones = DndCharacterNormalizers.deserializarEleccionesClase(
                "class-skill-0:Arcano;Historia,idioma%20extra:Elfico%20antiguo"
        );
        assertEquals(List.of("Arcano", "Historia"), elecciones.get("class-skill-0"));
        assertEquals(List.of("Elfico antiguo"), elecciones.get("idioma extra"));
        assertTrue(DndCharacterNormalizers.deserializarEleccionesClase("sin-separador").isEmpty());

        assertEquals(List.of("uno", "dos libres", "tres"), DndCharacterNormalizers.deserializarLista("uno,dos%20libres, tres "));
        assertEquals(List.of(), DndCharacterNormalizers.deserializarLista("  "));
    }
}