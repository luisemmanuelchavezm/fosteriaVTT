package com.fosteriaVTT.fosteriaVTT_backend.common.dnd;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DndSpellParsingRulesTest {

	@Test
	void extraeNombresDeConjurosDesdeDescripcion() {
		String description = "Conoces el truco taumaturgia. Cuando alcanzas nivel superior, puedes lanzar oscuridad una vez por descanso.";

		assertEquals(List.of("taumaturgia", "oscuridad"), DndSpellParsingRules.extractSpellNames(description));
	}

	@Test
	void extraeResumenesDeFormulaSoloCuandoSonConjurosOTrucos() {
		assertEquals(List.of("Prestidigitación"), DndSpellParsingRules.extractSpellNamesFromFormula("Truco Prestidigitación", "Truco"));
		assertEquals(List.of("Bendición", "Curar heridas"), DndSpellParsingRules.extractSpellNamesFromFormula("Bendición, Curar heridas", "Conjuro"));
		assertEquals(List.of(), DndSpellParsingRules.extractSpellNamesFromFormula("2d8 radiante", "Conjuro"));
		assertEquals(List.of(), DndSpellParsingRules.extractSpellNamesFromFormula("Luz", "Ataque"));
	}

	@Test
	void detectaSiUnResumenCorrespondeAMagia() {
		assertTrue(DndSpellParsingRules.isSpellOrCantripSummary("DND,Conjuro,Nivel1"));
		assertTrue(DndSpellParsingRules.isSpellOrCantripSummary("Truco"));
		assertFalse(DndSpellParsingRules.isSpellOrCantripSummary("DND,ACCION"));
		assertFalse(DndSpellParsingRules.isSpellOrCantripSummary(null));
	}
}