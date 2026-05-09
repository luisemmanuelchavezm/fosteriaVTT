package com.fosteriaVTT.fosteriaVTT_backend.Estadistica.dnd;

import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.Estadistica;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import com.fosteriaVTT.fosteriaVTT_backend.common.dnd.DndCharacterRules;
import java.util.Map;
import java.util.Set;

public final class DndProficienciaStatsUtils {

	private DndProficienciaStatsUtils() {}

	public static void actualizarBonificacionesCompetencia(
			Map<String, Estadistica> statsByName,
			Personaje character,
			String statName,
			int totalLevel
	) {
		int proficiencyBonus = DndCharacterRules.calculateProficiencyBonus(totalLevel);
		DndEstadisticaMutationUtils.upsertStat(statsByName, character, statName, proficiencyBonus);
		for (String attributeName : DndCharacterRules.STAT_NAMES.values()) {
			String saveName = "Salvación de " + attributeName;
			Estadistica saveStat = statsByName.get(saveName);
			if (saveStat != null && saveStat.getValor() > 0) {
				saveStat.setValor(proficiencyBonus);
			}
		}
	}

	public static void aplicarCompetenciasSeleccionadas(
			Map<String, Estadistica> statsByName,
			Personaje character,
			Set<String> proficientSavingThrows,
			Set<String> proficientSkills,
			Set<String> expertiseSkills,
			int totalLevel
	) {
		int proficiencyBonus = DndCharacterRules.calculateProficiencyBonus(totalLevel);
		for (String attributeName : DndCharacterRules.STAT_NAMES.values()) {
			DndEstadisticaMutationUtils.upsertStat(
					statsByName,
					character,
					"Salvación de " + attributeName,
					proficientSavingThrows.contains(TagUtils.normalizeText(attributeName)) ? proficiencyBonus : 0
			);
		}
		for (String skillName : DndCharacterRules.ATTRIBUTE_BY_SKILL.keySet()) {
			String normalizedSkillName = TagUtils.normalizeText(skillName);
			int multiplier = expertiseSkills.contains(normalizedSkillName)
					? 2
					: proficientSkills.contains(normalizedSkillName) ? 1 : 0;
			DndEstadisticaMutationUtils.upsertStat(statsByName, character, skillName, multiplier * proficiencyBonus);
		}
	}

	public static void recalcularBonosPorCompetencia(
			Map<String, Estadistica> statsByName,
			Personaje character,
			int previousTotalLevel,
			int nextTotalLevel,
			Set<String> expertiseSkillsToRemove,
			Set<String> expertiseSkillsToApply
	) {
		int previousProficiencyBonus = DndCharacterRules.calculateProficiencyBonus(Math.max(1, previousTotalLevel));
		int nextProficiencyBonus = DndCharacterRules.calculateProficiencyBonus(Math.max(1, nextTotalLevel));

		for (String attributeName : DndCharacterRules.STAT_NAMES.values()) {
			String saveName = "Salvación de " + attributeName;
			int currentValue = DndEstadisticaMutationUtils.obtenerValor(statsByName, character, saveName, 0);
			int level = currentValue > 0 && previousProficiencyBonus > 0 ? 1 : 0;
			DndEstadisticaMutationUtils.upsertStat(statsByName, character, saveName, level * nextProficiencyBonus);
		}

		for (String skillName : DndCharacterRules.ATTRIBUTE_BY_SKILL.keySet()) {
			int currentValue = DndEstadisticaMutationUtils.obtenerValor(statsByName, character, skillName, 0);
			int level = resolverNivelCompetencia(currentValue, previousProficiencyBonus);
			String normalizedSkillName = TagUtils.normalizeText(skillName);
			if (expertiseSkillsToRemove.contains(normalizedSkillName) && level >= 2) {
				level = 1;
			}
			if (expertiseSkillsToApply.contains(normalizedSkillName) && level >= 1) {
				level = 2;
			}
			int nextValue = switch (level) {
				case 2 -> nextProficiencyBonus * 2;
				case 1 -> nextProficiencyBonus;
				default -> 0;
			};
			DndEstadisticaMutationUtils.upsertStat(statsByName, character, skillName, nextValue);
		}
	}

	private static int resolverNivelCompetencia(int storedValue, int proficiencyBonus) {
		if (storedValue <= 0 || proficiencyBonus <= 0) {
			return 0;
		}
		if (storedValue >= proficiencyBonus * 2) {
			return 2;
		}
		return 1;
	}
}