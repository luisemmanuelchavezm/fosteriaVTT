package com.fosteriaVTT.fosteriaVTT_backend.Estadistica.dnd;

import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.Estadistica;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

public final class DndActualizacionRecursosUtils {

	private static final String VIDA_MAXIMA = "Puntos de vida";
	private static final String VIDA_ACTUAL = "Vida actual";
	private static final String VIDA_TEMPORAL = "Vida temporal";

	private DndActualizacionRecursosUtils() {}

	public static List<String> construirNombresEstadistica(
			Map<Integer, Integer> currentSpellSlots,
			Map<Integer, Integer> currentExtraResources
	) {
		// "Vida maxima" is the MB-enemy equivalent of "Puntos de vida" — include it
		// so the HP save endpoint works for both DnD characters and MB enemies.
		List<String> statNames = new ArrayList<>(List.of(VIDA_MAXIMA, VIDA_ACTUAL, VIDA_TEMPORAL, "Vida maxima"));
		agregarNombresRanuras(statNames, currentSpellSlots);
		agregarNombresRecursosExtra(statNames, currentExtraResources);
		return statNames;
	}

	public static Map<String, Estadistica> mapearPorNombre(Iterable<Estadistica> stats) {
		Map<String, Estadistica> statsByName = new HashMap<>();
		for (Estadistica stat : stats) {
			statsByName.put(stat.getNombre(), stat);
		}
		return statsByName;
	}

	public static void actualizarPuntosVida(Map<String, Estadistica> statsByName, Integer currentHp, Integer tempHp) {
		actualizarVidaActual(statsByName, currentHp);
		actualizarVidaTemporal(statsByName, tempHp);
	}

	public static void actualizarRanurasConjuro(Map<String, Estadistica> statsByName, Map<Integer, Integer> currentSpellSlots) {
		if (currentSpellSlots == null) {
			return;
		}

		for (Map.Entry<Integer, Integer> entry : currentSpellSlots.entrySet()) {
			Integer level = entry.getKey();
			Integer currentSlots = entry.getValue();
			if (currentSlots == null || currentSlots < 0) {
				throw new ResponseStatusException(BAD_REQUEST, "Las ranuras actuales no son válidas");
			}

			Estadistica totalSlotsStat = statsByName.get("Hechizos nivel " + level);
			Estadistica currentSlotsStat = statsByName.get("Hechizos nivel " + level + " gastados");
			if (totalSlotsStat == null || currentSlotsStat == null) {
				throw new ResponseStatusException(BAD_REQUEST, "El personaje no tiene ranuras para ese nivel");
			}
			if (currentSlots > totalSlotsStat.getValor()) {
				throw new ResponseStatusException(BAD_REQUEST, "Las ranuras actuales no pueden superar el máximo");
			}
			currentSlotsStat.setValor(currentSlots);
		}
	}

	public static void actualizarRecursosExtra(Map<String, Estadistica> statsByName, Map<Integer, Integer> currentExtraResources) {
		if (currentExtraResources == null) {
			return;
		}

		for (Map.Entry<Integer, Integer> entry : currentExtraResources.entrySet()) {
			Integer index = entry.getKey();
			Integer currentValue = entry.getValue();
			if (currentValue == null || currentValue < 0) {
				throw new ResponseStatusException(BAD_REQUEST, "Los recursos extra actuales no son válidos");
			}

			Estadistica maxStat = statsByName.get("Recurso custom dnd maximo " + index);
			Estadistica currentStat = statsByName.get("Recurso custom dnd actual " + index);
			if (maxStat == null || currentStat == null) {
				throw new ResponseStatusException(BAD_REQUEST, "El personaje no tiene ese recurso extra registrado");
			}
			if (currentValue > maxStat.getValor()) {
				throw new ResponseStatusException(BAD_REQUEST, "Los recursos extra actuales no pueden superar el máximo");
			}
			currentStat.setValor(currentValue);
		}
	}

	private static void agregarNombresRanuras(List<String> statNames, Map<Integer, Integer> currentSpellSlots) {
		for (Integer level : currentSpellSlots == null ? List.<Integer>of() : currentSpellSlots.keySet()) {
			if (level == null || level < 1 || level > 9) {
				throw new ResponseStatusException(BAD_REQUEST, "Nivel de conjuro inválido");
			}
			statNames.add("Hechizos nivel " + level);
			statNames.add("Hechizos nivel " + level + " gastados");
		}
	}

	private static void agregarNombresRecursosExtra(List<String> statNames, Map<Integer, Integer> currentExtraResources) {
		for (Integer index : currentExtraResources == null ? List.<Integer>of() : currentExtraResources.keySet()) {
			if (index == null || index < 1 || index > 9) {
				throw new ResponseStatusException(BAD_REQUEST, "Recurso extra inválido");
			}
			statNames.add("Recurso custom dnd actual " + index);
			statNames.add("Recurso custom dnd maximo " + index);
		}
	}

	private static void actualizarVidaActual(Map<String, Estadistica> statsByName, Integer currentHp) {
		if (currentHp == null) {
			return;
		}

		// DnD uses "Puntos de vida"; MB enemies use "Vida maxima" — accept either.
		Estadistica maxHpStat = statsByName.get(VIDA_MAXIMA);
		if (maxHpStat == null) maxHpStat = statsByName.get("Vida maxima");

		Estadistica currentHpStat = statsByName.get(VIDA_ACTUAL);
		if (currentHp < 0 || maxHpStat == null || currentHp > maxHpStat.getValor()) {
			throw new ResponseStatusException(BAD_REQUEST, "La vida actual no es válida");
		}
		if (currentHpStat == null) {
			throw new ResponseStatusException(BAD_REQUEST, "El personaje no tiene vida actual registrada");
		}
		currentHpStat.setValor(currentHp);
	}

	private static void actualizarVidaTemporal(Map<String, Estadistica> statsByName, Integer tempHp) {
		if (tempHp == null) {
			return;
		}
		if (tempHp < 0) {
			throw new ResponseStatusException(BAD_REQUEST, "La vida temporal no es válida");
		}

		Estadistica tempHpStat = statsByName.get(VIDA_TEMPORAL);
		if (tempHpStat == null) {
			return;
		}
		tempHpStat.setValor(tempHp);
	}
}