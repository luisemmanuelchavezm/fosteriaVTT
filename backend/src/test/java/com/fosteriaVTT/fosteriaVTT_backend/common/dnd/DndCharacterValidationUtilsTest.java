package com.fosteriaVTT.fosteriaVTT_backend.common.dnd;

import com.fosteriaVTT.fosteriaVTT_backend.Objeto.TipoObjeto;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndCompetenciasResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.EquipamientoDndGrupoResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.EquipamientoDndOpcionResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.EquipamientoDndResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ObjetoInicialResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndEleccionResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.SubrazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.TrasfondoDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.TrasfondoDndEleccionResponse;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class DndCharacterValidationUtilsTest {

	@Test
	void validaEstadisticasYEleccionesDeClase() {
		ClaseDndDetalleResponse clase = new ClaseDndDetalleResponse(
				"mago",
				"Mago",
				"Ma",
				"",
				null,
				new ClaseDndCompetenciasResponse(
						List.of(),
						List.of(),
						List.of(),
						List.of(),
						List.of()
				),
				null,
				List.of(),
				List.of(new com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndEleccionResponse(
						"class-skill-0",
						"Competencias de clase",
						"Elige dos",
						"habilidades",
						2,
						List.of("Arcano", "Historia", "Investigacion")
				)),
				new EquipamientoDndResponse(List.of(), List.of())
		);

		assertEquals(
				Map.of(
						"strength", 8,
						"dexterity", 14,
						"constitution", 13,
						"intelligence", 17,
						"wisdom", 12,
						"charisma", 10
				),
				DndCharacterValidationUtils.validateStats(Map.of(
						"strength", 8,
						"dexterity", 14,
						"constitution", 13,
						"intelligence", 17,
						"wisdom", 12,
						"charisma", 10
				))
		);

		DndCharacterValidationUtils.ValidatedClassChoices choices = DndCharacterValidationUtils.validateClassChoices(
				clase,
				Map.of("class-skill-0", List.of("Arcano", "Investigacion")),
				List.of()
		);

		assertEquals(List.of("Arcano", "Investigacion"), choices.selectedSkills());
		assertEquals(Map.of("class-skill-0", List.of("Arcano", "Investigacion")), choices.selectedChoices());
	}

	@Test
	void rechazaEstadisticasYCompetenciasInvalidas() {
		ClaseDndDetalleResponse clase = new ClaseDndDetalleResponse(
				"mago",
				"Mago",
				"Ma",
				"",
				null,
				new ClaseDndCompetenciasResponse(List.of(), List.of(), List.of(), List.of(), List.of()),
				null,
				List.of(),
				List.of(new com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndEleccionResponse(
						"class-skill-0",
						"Competencias de clase",
						"Elige dos",
						"habilidades",
						2,
						List.of("Arcano", "Historia", "Investigacion")
				)),
				new EquipamientoDndResponse(List.of(), List.of())
		);

		assertThrows(ResponseStatusException.class, () -> DndCharacterValidationUtils.validateStats(Map.of("strength", 8)));
		assertThrows(ResponseStatusException.class, () -> DndCharacterValidationUtils.validateClassChoices(
				clase,
				Map.of("class-skill-0", List.of("Arcano", "Arcano")),
				List.of()
		));
	}

	@Test
	void validaEleccionesDeRazaTrasfondoEquipamientoYSubraza() {
		TrasfondoDndDetalleResponse background = new TrasfondoDndDetalleResponse(
				"sabio",
				"Sabio",
				"",
				List.of("Historia"),
				List.of(),
				List.of(),
				"",
				"",
				List.of(new TrasfondoDndEleccionResponse(
						"background-language",
						"Idioma",
						"1 idioma",
						"idiomas",
						1,
						List.of("Enano", "Gnomico")
				)),
				new EquipamientoDndResponse(List.of(), List.of())
		);
		SubrazaDndDetalleResponse subrace = new SubrazaDndDetalleResponse(
				"high-elf",
				"Alto elfo",
				"",
				List.of(),
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
				List.of(),
				"",
				"Mediano",
				30,
				List.of("Comun", "Elfico"),
				List.of(),
				List.of(),
				List.of(new RazaDndEleccionResponse(
						"race-skill",
						"Habilidad",
						"1 habilidad",
						"habilidades",
						1,
						null,
						List.of("Sigilo", "Arcano"),
						List.of("Arcano")
				)),
				List.of(subrace)
		);
		EquipamientoDndResponse equipment = new EquipamientoDndResponse(
				List.of(),
				List.of(new EquipamientoDndGrupoResponse(
						"weapon",
						"Arma principal",
						List.of(
								new EquipamientoDndOpcionResponse(
										"dagger",
										"Daga",
										1,
										new ObjetoInicialResponse(1L, "Daga", null, null, TipoObjeto.ARMA, null, 1),
										null,
										List.of()
								),
								new EquipamientoDndOpcionResponse(
										"simple",
										"Arma simple",
										1,
										null,
										"ASimple",
										List.of(new ObjetoInicialResponse(2L, "Maza", null, null, TipoObjeto.ARMA, null, 1))
								)
						)
				))
		);

		assertEquals(
				Map.of("background-language", List.of("Enano")),
				DndCharacterValidationUtils.validateBackgroundChoices(background, Map.of("background-language", List.of("Enano")))
		);
		assertEquals(
				Map.of("race-skill", List.of("Sigilo"), "subrace-language", List.of("Celestial")),
				DndCharacterValidationUtils.validateRaceChoices(
						race,
						subrace,
						Map.of("race-skill", List.of("Sigilo"), "subrace-language", List.of("Celestial"))
				)
		);
		DndCharacterValidationUtils.validateEquipment(
				"class",
				equipment,
				Map.of("class:weapon", 1),
				Map.of("class:weapon", 2L)
		);
		assertEquals(subrace, DndCharacterValidationUtils.resolveSubrace(race, "high-elf"));

		assertThrows(ResponseStatusException.class, () -> DndCharacterValidationUtils.validateRaceChoices(
				race,
				subrace,
				Map.of("race-skill", List.of("Arcano"), "subrace-language", List.of("Celestial"))
		));
		assertThrows(ResponseStatusException.class, () -> DndCharacterValidationUtils.validateEquipment(
				"class",
				equipment,
				Map.of("class:weapon", 1),
				Map.of()
		));
		assertThrows(ResponseStatusException.class, () -> DndCharacterValidationUtils.resolveSubrace(race, null));
	}
}