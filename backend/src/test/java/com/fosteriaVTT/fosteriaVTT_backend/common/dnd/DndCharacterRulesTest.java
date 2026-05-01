package com.fosteriaVTT.fosteriaVTT_backend.common.dnd;

import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndCompetenciasResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndSubclaseResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.EquipamientoDndResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndEleccionResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.SubrazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.TrasfondoDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.TrasfondoDndEleccionResponse;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class DndCharacterRulesTest {

	@Test
	void normalizaHabilidadesAtributosYCatalogosConValoresCanonicos() {
		assertEquals(
				"religion",
				com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils.normalizeText(
						DndCharacterRules.normalizeCanonicalSkill("religion").orElseThrow()
				)
		);
		assertEquals("Sabiduria", DndCharacterRules.normalizeCanonicalAttribute("sabiduría").orElseThrow());
		assertEquals("classCantrips:mago", DndCharacterRules.normalizeChoiceCatalogId("trucosdemago"));
		assertEquals("brujo", DndCharacterRules.normalizeChoiceCatalogId("classCantrips:brujo"));
	}

	@Test
	void resuelveCompetenciasEIdiomasYConstruyeTagsDelPersonaje() {
		RazaDndEleccionResponse raceSkillChoice = new RazaDndEleccionResponse(
				"race-skill",
				"Habilidad",
				"1 habilidad",
				"habilidades",
				1,
				null,
				List.of("Sigilo"),
				List.of()
		);
		RazaDndEleccionResponse raceLanguageChoice = new RazaDndEleccionResponse(
				"race-language",
				"Idioma",
				"1 idioma",
				"idiomas",
				1,
				null,
				List.of("Draconico", "Gnomico"),
				List.of()
		);
		SubrazaDndDetalleResponse subrace = new SubrazaDndDetalleResponse(
				"high-elf",
				"Alto elfo",
				"",
				List.of("+1 Inteligencia"),
				List.of(),
				List.of(),
				List.of(new RazaDndEleccionResponse(
						"subrace-language",
						"Idioma",
						"1 idioma",
						"idiomas",
						1,
						null,
						List.of("Celestial"),
						List.of()
				))
		);
		RazaDndDetalleResponse race = new RazaDndDetalleResponse(
				"elf",
				"Elfo",
				"",
				List.of("+2 Destreza"),
				"",
				"Mediano",
				30,
				List.of("Comun", "Elfico"),
				List.of("Habilidad: Percepcion"),
				List.of(),
				List.of(raceSkillChoice, raceLanguageChoice),
				List.of(subrace)
		);
		TrasfondoDndDetalleResponse background = new TrasfondoDndDetalleResponse(
				"sabio",
				"Sabio",
				"",
				List.of("Historia"),
				List.of(),
				List.of("2 idiomas"),
				"Investigador",
				"",
				List.of(new TrasfondoDndEleccionResponse(
						"background-language",
						"Idiomas",
						"1 idioma",
						"idiomas",
						1,
						List.of("Infernal", "Enano")
				)),
				new EquipamientoDndResponse(List.of(), List.of())
		);
		ClaseDndDetalleResponse characterClass = new ClaseDndDetalleResponse(
				"mago",
				"Mago",
				"Ma",
				"",
				null,
				new ClaseDndCompetenciasResponse(List.of(), List.of(), List.of(), List.of(), List.of()),
				null,
				List.of(),
				List.of(),
				new EquipamientoDndResponse(List.of(), List.of())
		);
		ClaseDndSubclaseResponse subclass = new ClaseDndSubclaseResponse("evocacion", "Escuela de evocacion", "", 2, List.of());

		Set<String> skills = DndCharacterRules.resolveSkillCompetencies(
				List.of("Arcano"),
				background,
				race,
				subrace,
				Map.of("background-language", List.of("Enano")),
				Map.of("race-skill", List.of("Sigilo"), "race-language", List.of("Draconico"), "subrace-language", List.of("Celestial"))
		);

		assertEquals(Set.of("Arcano", "Historia", "Percepcion", "Sigilo"), skills);
		assertEquals(
				Set.of("Comun", "Elfico", "Draconico", "Celestial", "Enano"),
				DndCharacterRules.resolveLanguages(
						race,
						subrace,
						background,
						Map.of("race-language", List.of("Draconico"), "subrace-language", List.of("Celestial")),
						Map.of("background-language", List.of("Enano"))
				)
		);
		assertEquals(
				"CMago;1,Subclase;escuela-de-evocacion,Raza;elfo,Subraza;alto-elfo,Idioma;comun,Idioma;elfico,Idioma;draconico,Idioma;celestial,Idioma;enano",
				DndCharacterRules.buildCharacterTags(
						characterClass,
						subclass,
						race,
						subrace,
						background,
						Map.of("race-language", List.of("Draconico"), "subrace-language", List.of("Celestial")),
						Map.of("background-language", List.of("Enano"))
				)
		);
	}

	@Test
	void calculaDadosGolpeModificadoresYBonificadorCompetencia() {
		assertEquals(8, DndCharacterRules.extractHitDieMax("1d8 por nivel de mago"));
		assertEquals(-1, DndCharacterRules.calculateModifier(9));
		assertEquals(4, DndCharacterRules.calculateModifier(18));
		assertEquals(2, DndCharacterRules.calculateProficiencyBonus(1));
		assertEquals(3, DndCharacterRules.calculateProficiencyBonus(5));
		assertEquals(6, DndCharacterRules.calculateProficiencyBonus(20));
		assertEquals(Map.of(), DndCharacterRules.safeMap(null));

		assertThrows(ResponseStatusException.class, () -> DndCharacterRules.extractHitDieMax("sin dado"));
	}
}