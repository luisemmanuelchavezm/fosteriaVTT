package com.fosteriaVTT.fosteriaVTT_backend.Estadistica.dnd;

import java.util.Map;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class DndArmaduraFormulaUtilsTest {

    // ── extraerClaseArmadura ──────────────────────────────────────────────────

    @Test
    void extraerClaseArmadura_retornaNullConFormulaNull() {
        assertNull(DndArmaduraFormulaUtils.extraerClaseArmadura(null, Map.of()));
    }

    @Test
    void extraerClaseArmadura_retornaNullConFormulaBlank() {
        assertNull(DndArmaduraFormulaUtils.extraerClaseArmadura("   ", Map.of()));
    }

    @Test
    void extraerClaseArmadura_retornaNullSinPatron() {
        assertNull(DndArmaduraFormulaUtils.extraerClaseArmadura("BONO_CA=2", Map.of()));
    }

    @Test
    void extraerClaseArmadura_retornaValorBase() {
        assertEquals(15, DndArmaduraFormulaUtils.extraerClaseArmadura("CA=15", Map.of()));
    }

    @Test
    void extraerClaseArmadura_retornaValorConCeroBase() {
        assertEquals(10, DndArmaduraFormulaUtils.extraerClaseArmadura("CA=10", Map.of()));
    }

    @Test
    void extraerClaseArmadura_sumaModificadorDestreza() {
        // Destreza 14 → modifier = (14-10)/2 = 2 → CA = 12 + 2 = 14
        Map<String, Integer> stats = Map.of("Destreza", 14);
        assertEquals(14, DndArmaduraFormulaUtils.extraerClaseArmadura("CA=12+DES", stats));
    }

    @Test
    void extraerClaseArmadura_respetaTopeDeModificador() {
        // Destreza 18 → modifier = 4, pero tope max:2 → CA = 12 + 2 = 14
        Map<String, Integer> stats = Map.of("Destreza", 18);
        assertEquals(14, DndArmaduraFormulaUtils.extraerClaseArmadura("CA=12+DES(max:2)", stats));
    }

    @Test
    void extraerClaseArmadura_sinTopeAplicaModificadorCompleto() {
        // Destreza 18 → modifier = 4 → CA = 10 + 4 = 14
        Map<String, Integer> stats = Map.of("Destreza", 18);
        assertEquals(14, DndArmaduraFormulaUtils.extraerClaseArmadura("CA=10+DES", stats));
    }

    // ── extraerBonoEscudo ─────────────────────────────────────────────────────

    @Test
    void extraerBonoEscudo_retornaNullConFormulaNull() {
        assertNull(DndArmaduraFormulaUtils.extraerBonoEscudo(null));
    }

    @Test
    void extraerBonoEscudo_retornaNullConFormulaBlank() {
        assertNull(DndArmaduraFormulaUtils.extraerBonoEscudo("  "));
    }

    @Test
    void extraerBonoEscudo_retornaNullSinPatron() {
        assertNull(DndArmaduraFormulaUtils.extraerBonoEscudo("CA=15"));
    }

    @Test
    void extraerBonoEscudo_retornaValor() {
        assertEquals(2, DndArmaduraFormulaUtils.extraerBonoEscudo("BONO_CA=2"));
    }

    @Test
    void extraerBonoEscudo_retornaValorCombinado() {
        assertEquals(3, DndArmaduraFormulaUtils.extraerBonoEscudo("CA=14|BONO_CA=3"));
    }
}
