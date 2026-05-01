package com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils;

import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import com.fosteriaVTT.fosteriaVTT_backend.common.dnd.DndCharacterRules;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public final class DndCharacterNormalizers {

	private DndCharacterNormalizers() {}

	public static String normalizarFiltroTexto(String valor) {
		return valor == null ? "" : valor.trim().toLowerCase(java.util.Locale.ROOT);
	}

	public static String construirBiografia(String alineamiento, String historiaPersonal) {
		String aligned = TagUtils.cleanValue(alineamiento);
		String history = historiaPersonal == null ? "" : historiaPersonal.trim();
		if (aligned.isBlank() && history.isBlank()) {
			return null;
		}

		List<String> blocks = new ArrayList<>();
		if (!aligned.isBlank()) {
			blocks.add("Alineamiento: " + aligned);
		}
		if (!history.isBlank()) {
			blocks.add("Historia personal:\n" + history);
		}
		return String.join("\n\n", blocks);
	}

	public static Map<String, Integer> resolverEstadisticasEditables(Map<String, Integer> currentStats, Map<String, Integer> requestedStats) {
		Map<String, Integer> updated = new LinkedHashMap<>();
		for (String statName : DndCharacterRules.STAT_NAMES.values()) {
			int currentValue = currentStats.getOrDefault(statName, 10);
			int nextValue = DndCharacterRules.safeMap(requestedStats).getOrDefault(statName, currentValue);
			updated.put(statName, Math.max(8, Math.min(30, nextValue)));
		}
		return updated;
	}

	public static Set<String> combinarCompetenciasEditables(List<String> competenciasArmasArmaduras, List<String> competenciasHerramientas) {
		Map<String, String> competencias = new LinkedHashMap<>();
		for (String valor : competenciasArmasArmaduras == null ? List.<String>of() : competenciasArmasArmaduras) {
			agregarCompetenciaGeneralNormalizada(competencias, valor);
		}
		for (String valor : competenciasHerramientas == null ? List.<String>of() : competenciasHerramientas) {
			agregarCompetenciaGeneralNormalizada(competencias, valor);
		}
		return new LinkedHashSet<>(competencias.values());
	}

	public static String normalizarCompetenciaGeneral(String valor) {
		String cleaned = TagUtils.cleanValue(valor);
		if (cleaned.isBlank()) {
			return null;
		}
		if (DndCharacterRules.normalizeCanonicalSkill(cleaned).isPresent()) {
			return null;
		}
		return cleaned;
	}

	public static Set<String> normalizarSalvaciones(List<String> savingThrows) {
		Set<String> normalized = new LinkedHashSet<>();
		for (String value : savingThrows == null ? List.<String>of() : savingThrows) {
			DndCharacterRules.normalizeCanonicalAttribute(value).ifPresent(item -> normalized.add(TagUtils.normalizeText(item)));
		}
		return normalized;
	}

	public static Set<String> normalizarHabilidades(List<String> skills) {
		Set<String> normalized = new LinkedHashSet<>();
		for (String value : skills == null ? List.<String>of() : skills) {
			DndCharacterRules.normalizeCanonicalSkill(value).ifPresent(item -> normalized.add(TagUtils.normalizeText(item)));
		}
		return normalized;
	}

	public static String nombreHabilidadDesdeEleccion(String catalogo, String etiqueta, String valor) {
		String catalogoNormalizado = DndCharacterRules.normalizeChoiceCatalogId(catalogo);
		if (catalogoNormalizado == null || catalogoNormalizado.isBlank()) {
			return etiqueta + ": " + valor;
		}

		return switch (catalogoNormalizado) {
			case "idiomas" -> "Idioma: " + valor;
			case "habilidades", "herramientasArtesano", "juegos", "instrumentos" -> "Competencia: " + valor;
			default -> etiqueta + ": " + valor;
		};
	}

	public static Map<String, List<String>> deserializarEleccionesClase(String rawValue) {
		Map<String, List<String>> result = new LinkedHashMap<>();
		if (rawValue == null || rawValue.isBlank()) {
			return result;
		}

		for (String rawEntry : rawValue.split(",")) {
			String entry = rawEntry.trim();
			if (entry.isBlank()) {
				continue;
			}

			String[] keyAndValues = entry.split(":", 2);
			if (keyAndValues.length != 2) {
				continue;
			}

			String choiceId = URLDecoder.decode(keyAndValues[0], StandardCharsets.UTF_8);
			List<String> values = Arrays.stream(keyAndValues[1].split(";"))
					.map(String::trim)
					.filter(value -> !value.isBlank())
					.map(value -> URLDecoder.decode(value, StandardCharsets.UTF_8))
					.toList();
			result.put(choiceId, values);
		}

		return result;
	}

	public static List<String> deserializarLista(String rawValue) {
		if (rawValue == null || rawValue.isBlank()) {
			return List.of();
		}

		return Arrays.stream(rawValue.split(","))
				.map(String::trim)
				.filter(value -> !value.isBlank())
				.map(value -> URLDecoder.decode(value, StandardCharsets.UTF_8))
				.toList();
	}

	private static void agregarCompetenciaGeneralNormalizada(Map<String, String> competencias, String valor) {
		String competenciaNormalizada = normalizarCompetenciaGeneral(valor);
		if (competenciaNormalizada == null) {
			return;
		}
		competencias.putIfAbsent(TagUtils.normalizeText(competenciaNormalizada), competenciaNormalizada);
	}
}