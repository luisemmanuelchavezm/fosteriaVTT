package com.fosteriaVTT.fosteriaVTT_backend.Estadistica.dnd;

import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.Estadistica;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.common.dnd.DndCharacterRules;
import java.util.Map;

public final class DndBajadaNivelStatsUtils {

	private DndBajadaNivelStatsUtils() {}

	public static void aplicarEstadisticasBaseExistentes(Map<String, Estadistica> statsByName, Map<String, Integer> updatedBaseStats) {
		for (Map.Entry<String, Integer> entry : updatedBaseStats.entrySet()) {
			Estadistica stat = statsByName.get(entry.getKey());
			if (stat != null) {
				stat.setValor(entry.getValue());
			}
		}
	}

	public static void aplicarReduccionPrincipal(
			Map<String, Estadistica> statsByName,
			Personaje character,
			String hitDie,
			int adjustedHitPointReduction,
			String maxHpStatName,
			String currentHpStatName
	) {
		int dieMax = Math.max(1, DndCharacterRules.extractHitDieMax(hitDie));
		DndEstadisticaMutationUtils.decrementarEstadistica(statsByName, "Dados de golpe d" + dieMax, 1, 0);
		DndEstadisticaMutationUtils.decrementarEstadistica(statsByName, maxHpStatName, adjustedHitPointReduction, 1);
		int maxHitPoints = DndEstadisticaMutationUtils.obtenerValor(statsByName, character, maxHpStatName, 1);
		int currentHp = Math.min(
				maxHitPoints,
				Math.max(1, DndEstadisticaMutationUtils.obtenerValor(statsByName, character, currentHpStatName, 1) - adjustedHitPointReduction)
		);
		DndEstadisticaMutationUtils.upsertStat(statsByName, character, currentHpStatName, currentHp);
	}
}