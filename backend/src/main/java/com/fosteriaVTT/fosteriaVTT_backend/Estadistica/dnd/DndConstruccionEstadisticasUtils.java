package com.fosteriaVTT.fosteriaVTT_backend.Estadistica.dnd;

import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.Estadistica;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Mochila.Mochila;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.common.dnd.DndCharacterRules;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.ToIntBiFunction;

public final class DndConstruccionEstadisticasUtils {

	private DndConstruccionEstadisticasUtils() {}

	public static void agregarEstadisticasBase(List<Estadistica> result, Personaje character, Map<String, Integer> baseStats) {
		for (Map.Entry<String, String> entry : DndCharacterRules.STAT_NAMES.entrySet()) {
			result.add(DndEstadisticaMutationUtils.buildStat(
					character,
					entry.getValue(),
					DndCaracteristicaUtils.resolverValor(baseStats, entry.getValue())
			));
		}
	}

	public static void agregarSalvaciones(List<Estadistica> result, Personaje character, List<String> savingThrows, int proficiencyBonus) {
		Set<String> normalizedSavingThrows = new LinkedHashSet<>();
		for (String savingThrow : savingThrows == null ? List.<String>of() : savingThrows) {
			DndCharacterRules.normalizeCanonicalAttribute(savingThrow).ifPresent(normalizedSavingThrows::add);
		}

		for (String attributeName : DndCharacterRules.STAT_NAMES.values()) {
			result.add(DndEstadisticaMutationUtils.buildStat(
					character,
					"Salvación de " + attributeName,
					normalizedSavingThrows.contains(attributeName) ? proficiencyBonus : 0
			));
		}
	}

	public static void agregarCompetenciasHabilidad(
			List<Estadistica> result,
			Personaje character,
			Set<String> skillCompetencies,
			Set<String> expertiseSkills,
			int proficiencyBonus
	) {
		for (String skillName : DndCharacterRules.ATTRIBUTE_BY_SKILL.keySet()) {
			int skillBonus = expertiseSkills.contains(skillName)
					? proficiencyBonus * 2
					: skillCompetencies.contains(skillName) ? proficiencyBonus : 0;
			result.add(DndEstadisticaMutationUtils.buildStat(character, skillName, skillBonus));
		}
	}

	public static void agregarEstadisticasVitales(
			List<Estadistica> result,
			Personaje character,
			Map<String, Integer> baseStats,
			int movement,
			String hitDie,
			int proficiencyBonus,
			List<Mochila> mochila,
			List<Habilidad> habilidades,
			int totalLevels,
			int featHitPointBonus,
			ToIntBiFunction<Map<String, Integer>, List<Habilidad>> initiativeCalculator,
			ToIntBiFunction<Map<String, Integer>, List<Mochila>> armorCalculator
	) {
		int maxHitPoints = Math.max(
				1,
				DndCharacterRules.extractHitDieMax(hitDie)
						+ DndCaracteristicaUtils.resolverModificador(baseStats, "Constitucion")
						+ featHitPointBonus
		);

		result.add(DndEstadisticaMutationUtils.buildStat(character, "Movimiento", movement));
		result.add(DndEstadisticaMutationUtils.buildStat(character, "Bonificador por competencia", proficiencyBonus));
		result.add(DndEstadisticaMutationUtils.buildStat(character, "Iniciativa", initiativeCalculator.applyAsInt(baseStats, habilidades)));
		result.add(DndEstadisticaMutationUtils.buildStat(character, "CA", armorCalculator.applyAsInt(baseStats, mochila)));
		result.add(DndEstadisticaMutationUtils.buildStat(character, "Experiencia", 0));
		result.add(DndEstadisticaMutationUtils.buildStat(character, "Puntos de vida", maxHitPoints));
		result.add(DndEstadisticaMutationUtils.buildStat(character, "Vida actual", maxHitPoints));
		result.add(DndEstadisticaMutationUtils.buildStat(character, "Vida temporal", 0));
		int dieMax = Math.max(1, DndCharacterRules.extractHitDieMax(hitDie));
		result.add(DndEstadisticaMutationUtils.buildStat(character, "Dados de golpe d" + dieMax, totalLevels));
	}

	public static void agregarRecursosExtraIniciales(List<Estadistica> result, Personaje character) {
		for (int index = 1; index <= 9; index++) {
			result.add(DndEstadisticaMutationUtils.buildStat(character, "Recurso custom dnd actual " + index, 0));
			result.add(DndEstadisticaMutationUtils.buildStat(character, "Recurso custom dnd maximo " + index, 0));
		}
	}
}