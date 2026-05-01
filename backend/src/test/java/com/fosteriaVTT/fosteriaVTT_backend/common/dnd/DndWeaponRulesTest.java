package com.fosteriaVTT.fosteriaVTT_backend.common.dnd;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DndWeaponRulesTest {

	@Test
	void normalizaCompetenciasIndividualesYAlias() {
		assertEquals("daga", DndWeaponRules.normalizeWeaponCompetency("Competencia: Dagas"));
		assertEquals("estoque", DndWeaponRules.normalizeWeaponCompetency("Competencia dote: rapiers"));
		assertEquals("ballestaligera", DndWeaponRules.normalizeWeaponCompetency("Ballestas ligeras"));
	}

	@Test
	void ignoraCompetenciasGenericasYValoresVacios() {
		assertEquals("", DndWeaponRules.normalizeWeaponCompetency("Armas simples"));
		assertEquals("", DndWeaponRules.normalizeWeaponCompetency("Armas marciales"));
		assertEquals("", DndWeaponRules.normalizeWeaponCompetency("  "));
	}
}