package com.fosteriaVTT.fosteriaVTT_backend.Estadistica.dnd;

import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.Estadistica;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;

class DndActualizacionRecursosUtilsTest {

    private static Estadistica stat(String nombre, int valor) {
        Estadistica e = new Estadistica();
        e.setNombre(nombre);
        e.setValor(valor);
        return e;
    }

    // ── construirNombresEstadistica ───────────────────────────────────────────

    @Test
    void construirNombres_conNulos_retornaBaseDeNombres() {
        List<String> nombres = DndActualizacionRecursosUtils.construirNombresEstadistica(null, null);
        assertTrue(nombres.contains("Puntos de vida"));
        assertTrue(nombres.contains("Vida actual"));
        assertTrue(nombres.contains("Vida temporal"));
        assertTrue(nombres.contains("Vida maxima"));
    }

    @Test
    void construirNombres_conRanurasConjuro_incluyeNombresDeRanuras() {
        List<String> nombres = DndActualizacionRecursosUtils.construirNombresEstadistica(
                Map.of(1, 2), null);
        assertTrue(nombres.contains("Hechizos nivel 1"));
        assertTrue(nombres.contains("Hechizos nivel 1 gastados"));
    }

    @Test
    void construirNombres_conRecursosExtra_incluyeNombresDeRecursos() {
        List<String> nombres = DndActualizacionRecursosUtils.construirNombresEstadistica(
                null, Map.of(1, 5));
        assertTrue(nombres.contains("Recurso custom dnd actual 1"));
        assertTrue(nombres.contains("Recurso custom dnd maximo 1"));
    }

    @Test
    void construirNombres_nivelInvalidoLanzaExcepcion() {
        assertThrows(ResponseStatusException.class, () ->
                DndActualizacionRecursosUtils.construirNombresEstadistica(Map.of(0, 1), null));
    }

    @Test
    void construirNombres_indiceRecursoInvalidoLanzaExcepcion() {
        assertThrows(ResponseStatusException.class, () ->
                DndActualizacionRecursosUtils.construirNombresEstadistica(null, Map.of(10, 1)));
    }

    // ── mapearPorNombre ───────────────────────────────────────────────────────

    @Test
    void mapearPorNombre_retornaMapeoCorrecto() {
        Estadistica hp = stat("Puntos de vida", 20);
        Estadistica mp = stat("Mana", 10);
        Map<String, Estadistica> mapa = DndActualizacionRecursosUtils.mapearPorNombre(List.of(hp, mp));
        assertSame(hp, mapa.get("Puntos de vida"));
        assertSame(mp, mapa.get("Mana"));
    }

    // ── actualizarPuntosVida ──────────────────────────────────────────────────

    @Test
    void actualizarPuntosVida_conNulos_noHaceNada() {
        Map<String, Estadistica> stats = new HashMap<>();
        assertDoesNotThrow(() ->
                DndActualizacionRecursosUtils.actualizarPuntosVida(stats, null, null));
    }

    @Test
    void actualizarPuntosVida_actualizaVidaActual() {
        Estadistica maxHp = stat("Puntos de vida", 20);
        Estadistica currentHp = stat("Vida actual", 10);
        Map<String, Estadistica> stats = new HashMap<>();
        stats.put("Puntos de vida", maxHp);
        stats.put("Vida actual", currentHp);

        DndActualizacionRecursosUtils.actualizarPuntosVida(stats, 15, null);

        assertEquals(15, currentHp.getValor());
    }

    @Test
    void actualizarPuntosVida_vidaSuperiorAlMaximoLanzaExcepcion() {
        Estadistica maxHp = stat("Puntos de vida", 20);
        Estadistica currentHp = stat("Vida actual", 10);
        Map<String, Estadistica> stats = new HashMap<>();
        stats.put("Puntos de vida", maxHp);
        stats.put("Vida actual", currentHp);

        assertThrows(ResponseStatusException.class, () ->
                DndActualizacionRecursosUtils.actualizarPuntosVida(stats, 25, null));
    }

    @Test
    void actualizarPuntosVida_actualizaVidaTemporal() {
        Estadistica tempHp = stat("Vida temporal", 0);
        Map<String, Estadistica> stats = new HashMap<>();
        stats.put("Vida temporal", tempHp);

        DndActualizacionRecursosUtils.actualizarPuntosVida(stats, null, 5);

        assertEquals(5, tempHp.getValor());
    }

    // ── actualizarRanurasConjuro ──────────────────────────────────────────────

    @Test
    void actualizarRanurasConjuro_conNull_noHaceNada() {
        assertDoesNotThrow(() ->
                DndActualizacionRecursosUtils.actualizarRanurasConjuro(new HashMap<>(), null));
    }

    @Test
    void actualizarRanurasConjuro_actualizaRanuras() {
        Estadistica total = stat("Hechizos nivel 1", 4);
        Estadistica usados = stat("Hechizos nivel 1 gastados", 4);
        Map<String, Estadistica> stats = new HashMap<>();
        stats.put("Hechizos nivel 1", total);
        stats.put("Hechizos nivel 1 gastados", usados);

        DndActualizacionRecursosUtils.actualizarRanurasConjuro(stats, Map.of(1, 2));

        assertEquals(2, usados.getValor());
    }

    @Test
    void actualizarRanurasConjuro_valorNegativoLanzaExcepcion() {
        Map<String, Estadistica> stats = new HashMap<>();
        assertThrows(ResponseStatusException.class, () ->
                DndActualizacionRecursosUtils.actualizarRanurasConjuro(stats, Map.of(1, -1)));
    }

    @Test
    void actualizarRanurasConjuro_superaMaximoLanzaExcepcion() {
        Estadistica total = stat("Hechizos nivel 1", 2);
        Estadistica usados = stat("Hechizos nivel 1 gastados", 0);
        Map<String, Estadistica> stats = new HashMap<>();
        stats.put("Hechizos nivel 1", total);
        stats.put("Hechizos nivel 1 gastados", usados);

        assertThrows(ResponseStatusException.class, () ->
                DndActualizacionRecursosUtils.actualizarRanurasConjuro(stats, Map.of(1, 5)));
    }

    // ── actualizarRecursosExtra ───────────────────────────────────────────────

    @Test
    void actualizarRecursosExtra_conNull_noHaceNada() {
        assertDoesNotThrow(() ->
                DndActualizacionRecursosUtils.actualizarRecursosExtra(new HashMap<>(), null));
    }

    @Test
    void actualizarRecursosExtra_actualizaRecurso() {
        Estadistica maxRec = stat("Recurso custom dnd maximo 1", 10);
        Estadistica actRec = stat("Recurso custom dnd actual 1", 10);
        Map<String, Estadistica> stats = new HashMap<>();
        stats.put("Recurso custom dnd maximo 1", maxRec);
        stats.put("Recurso custom dnd actual 1", actRec);

        DndActualizacionRecursosUtils.actualizarRecursosExtra(stats, Map.of(1, 7));

        assertEquals(7, actRec.getValor());
    }

    @Test
    void actualizarRecursosExtra_superaMaximoLanzaExcepcion() {
        Estadistica maxRec = stat("Recurso custom dnd maximo 1", 5);
        Estadistica actRec = stat("Recurso custom dnd actual 1", 5);
        Map<String, Estadistica> stats = new HashMap<>();
        stats.put("Recurso custom dnd maximo 1", maxRec);
        stats.put("Recurso custom dnd actual 1", actRec);

        assertThrows(ResponseStatusException.class, () ->
                DndActualizacionRecursosUtils.actualizarRecursosExtra(stats, Map.of(1, 8)));
    }
}
