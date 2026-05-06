package com.fosteriaVTT.fosteriaVTT_backend.Estadistica.dnd;

import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.Estadistica;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import java.util.Map;

public final class DndEstadisticaMutationUtils {

	private DndEstadisticaMutationUtils() {}

	public static Estadistica buildStat(Personaje character, String name, Integer value) {
		return Estadistica.builder()
				.nombre(name)
				.valor(value)
				.personaje(character)
				.build();
	}

	public static void incrementarEstadistica(
			Map<String, Estadistica> statsByName,
			Personaje character,
			String statName,
			int amount
	) {
		Estadistica stat = statsByName.get(statName);
		if (stat == null) {
			statsByName.put(statName, buildStat(character, statName, amount));
			return;
		}
		stat.setValor(Math.max(0, stat.getValor() + amount));
	}

	public static void upsertStat(
			Map<String, Estadistica> statsByName,
			Personaje character,
			String statName,
			int value
	) {
		Estadistica stat = statsByName.get(statName);
		if (stat == null) {
			statsByName.put(statName, buildStat(character, statName, value));
			return;
		}
		stat.setValor(value);
	}

	public static void decrementarEstadistica(Map<String, Estadistica> statsByName, String statName, int amount, int minimum) {
		Estadistica stat = statsByName.get(statName);
		if (stat == null) {
			return;
		}
		stat.setValor(Math.max(minimum, stat.getValor() - Math.max(0, amount)));
	}

	public static int obtenerValor(Map<String, Estadistica> statsByName, Personaje character, String statName, int defaultValue) {
		return statsByName.getOrDefault(statName, buildStat(character, statName, defaultValue)).getValor();
	}
}