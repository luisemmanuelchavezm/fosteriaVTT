package com.fosteriaVTT.fosteriaVTT_backend.Estadistica.dnd;

import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.Estadistica;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import java.util.List;
import java.util.Map;

public final class DndConjurosRecursosSyncUtils {

	private DndConjurosRecursosSyncUtils() {}

	public static List<Estadistica> extraerEstadisticasRanurasConjuro(List<Estadistica> existingStats) {
		return existingStats.stream()
				.filter(stat -> stat.getNombre().startsWith("Hechizos nivel "))
				.toList();
	}

	public static void removerDeMapa(Map<String, Estadistica> statsByName, List<Estadistica> removableStats) {
		for (Estadistica stat : removableStats) {
			statsByName.remove(stat.getNombre());
		}
	}

	public static void sincronizarEspaciosDeConjuroEditables(
			Map<String, Estadistica> statsByName,
			Personaje character,
			Map<Integer, Integer> spellSlotsMax,
			Map<Integer, Integer> spellSlotsCurrent
	) {
		Map<Integer, Integer> safeMax = spellSlotsMax == null ? Map.of() : spellSlotsMax;
		Map<Integer, Integer> safeCurrent = spellSlotsCurrent == null ? Map.of() : spellSlotsCurrent;
		for (int level = 1; level <= 9; level++) {
			int maxValue = Math.max(0, Math.min(30, safeMax.getOrDefault(level, 0)));
			if (maxValue <= 0) {
				continue;
			}
			int currentValue = Math.max(0, Math.min(maxValue, safeCurrent.getOrDefault(level, maxValue)));
			statsByName.put("Hechizos nivel " + level, DndEstadisticaMutationUtils.buildStat(character, "Hechizos nivel " + level, maxValue));
			statsByName.put("Hechizos nivel " + level + " gastados", DndEstadisticaMutationUtils.buildStat(character, "Hechizos nivel " + level + " gastados", currentValue));
		}
	}

	public static void sincronizarRecursosExtraEditables(
			Map<String, Estadistica> statsByName,
			Personaje character,
			Map<Integer, Integer> extraResourcesMax,
			Map<Integer, Integer> extraResourcesCurrent
	) {
		Map<Integer, Integer> safeMax = extraResourcesMax == null ? Map.of() : extraResourcesMax;
		Map<Integer, Integer> safeCurrent = extraResourcesCurrent == null ? Map.of() : extraResourcesCurrent;
		for (int index = 1; index <= 9; index++) {
			int maxValue = Math.max(0, Math.min(30, safeMax.getOrDefault(index, 0)));
			int currentValue = Math.max(0, Math.min(maxValue, safeCurrent.getOrDefault(index, maxValue)));
			DndEstadisticaMutationUtils.upsertStat(statsByName, character, "Recurso custom dnd maximo " + index, maxValue);
			DndEstadisticaMutationUtils.upsertStat(statsByName, character, "Recurso custom dnd actual " + index, currentValue);
		}
	}

	public static void sincronizarEspaciosDeConjuro(
			Map<String, Estadistica> statsByName,
			Personaje character,
			Map<Integer, Integer> spellSlots
	) {
		for (Map.Entry<Integer, Integer> entry : spellSlots.entrySet()) {
			int level = entry.getKey();
			int amount = entry.getValue();
			if (amount <= 0) {
				continue;
			}
			statsByName.put("Hechizos nivel " + level, DndEstadisticaMutationUtils.buildStat(character, "Hechizos nivel " + level, amount));
			statsByName.put("Hechizos nivel " + level + " gastados", DndEstadisticaMutationUtils.buildStat(character, "Hechizos nivel " + level + " gastados", amount));
		}
	}
}