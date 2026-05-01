package com.fosteriaVTT.fosteriaVTT_backend.common.dnd;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DndProgressionRulesTest {

	@Test
	void detectaNivelesDeMejoraDeCaracteristicaSegunClase() {
		assertTrue(DndProgressionRules.isAbilityScoreImprovementLevel("guerrero", 6));
		assertFalse(DndProgressionRules.isAbilityScoreImprovementLevel("guerrero", 5));
		assertTrue(DndProgressionRules.isAbilityScoreImprovementLevel("picaro", 10));
		assertFalse(DndProgressionRules.isAbilityScoreImprovementLevel("picaro", 6));
		assertTrue(DndProgressionRules.isAbilityScoreImprovementLevel("mago", 8));
		assertFalse(DndProgressionRules.isAbilityScoreImprovementLevel("mago", 10));
	}

	@Test
	void devuelveLasRanurasMulticlaseEsperadasYProtegeLaCopia() {
		assertArrayEquals(new int[]{4, 3, 3, 3, 1}, DndProgressionRules.getMulticlassSpellSlots(9));
		assertArrayEquals(new int[0], DndProgressionRules.getMulticlassSpellSlots(0));
		assertArrayEquals(new int[]{4, 3, 3, 3, 3, 2, 2, 1, 1}, DndProgressionRules.getMulticlassSpellSlots(25));

		int[] slots = DndProgressionRules.getMulticlassSpellSlots(3);
		slots[0] = 99;

		assertArrayEquals(new int[]{4, 2}, DndProgressionRules.getMulticlassSpellSlots(3));
	}
}