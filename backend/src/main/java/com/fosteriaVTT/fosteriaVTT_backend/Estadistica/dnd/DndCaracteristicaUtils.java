package com.fosteriaVTT.fosteriaVTT_backend.Estadistica.dnd;

import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import com.fosteriaVTT.fosteriaVTT_backend.common.dnd.DndCharacterRules;
import java.util.Map;

public final class DndCaracteristicaUtils {

	private static final Map<String, String> CODIGO_A_NOMBRE = Map.of(
			"fue", "Fuerza",
			"des", "Destreza",
			"con", "Constitucion",
			"int", "Inteligencia",
			"sab", "Sabiduria",
			"car", "Carisma"
	);

	private DndCaracteristicaUtils() {}

	public static int resolverValor(Map<String, Integer> baseStats, String nombreCaracteristica) {
		if (baseStats == null || nombreCaracteristica == null || nombreCaracteristica.isBlank()) {
			return 10;
		}

		Integer valorEnEspanol = baseStats.get(nombreCaracteristica);
		if (valorEnEspanol != null) {
			return valorEnEspanol;
		}

		String claveTecnica = resolverClaveTecnica(nombreCaracteristica);
		if (claveTecnica == null) {
			return 10;
		}

		return baseStats.getOrDefault(claveTecnica, 10);
	}

	public static int resolverModificador(Map<String, Integer> baseStats, String nombreCaracteristica) {
		return DndCharacterRules.calculateModifier(resolverValor(baseStats, nombreCaracteristica));
	}

	public static int resolverModificadorPorCodigo(Map<String, Integer> baseStats, String codigoCaracteristica) {
		String nombreCaracteristica = resolverNombrePorCodigo(codigoCaracteristica);
		if (nombreCaracteristica == null) {
			return 0;
		}

		return resolverModificador(baseStats, nombreCaracteristica);
	}

	public static String resolverNombrePorCodigo(String codigoCaracteristica) {
		String normalizedCode = TagUtils.normalizeText(codigoCaracteristica);
		return CODIGO_A_NOMBRE.get(normalizedCode);
	}

	private static String resolverClaveTecnica(String nombreCaracteristica) {
		String nombreNormalizado = TagUtils.normalizeText(nombreCaracteristica);
		return DndCharacterRules.STAT_NAMES.entrySet().stream()
				.filter(entry -> TagUtils.normalizeText(entry.getValue()).equals(nombreNormalizado))
				.map(Map.Entry::getKey)
				.findFirst()
				.orElse(null);
	}
}