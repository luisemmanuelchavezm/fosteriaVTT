package com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils;

import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import com.fosteriaVTT.fosteriaVTT_backend.common.dnd.DndPatterns;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndSubclaseResponse;
import java.util.List;

public final class DndCharacterCheckers {

	private DndCharacterCheckers() {}

	public static boolean esRasgoGenericoDeClaseNivelUno(Habilidad habilidad, String nombreClase, List<ClaseDndSubclaseResponse> subclases) {
		if (!Integer.valueOf(1).equals(TagUtils.extractClassLevel(habilidad.getTags(), nombreClase))) {
			return false;
		}
		return !esRasgoDeAlgunaSubclase(habilidad.getTags(), subclases);
	}

	public static boolean esRasgoInicialDeSubclase(
			Habilidad habilidad,
			String claseId,
			String nombreClase,
			ClaseDndSubclaseResponse subclase
	) {
		if (!Integer.valueOf(1).equals(TagUtils.extractClassLevel(habilidad.getTags(), nombreClase))) {
			return false;
		}
		return contieneSubclase(habilidad.getTags(), subclase);
	}

	public static boolean esRasgoDeAlgunaSubclase(String tags, List<ClaseDndSubclaseResponse> subclases) {
		if (tags == null || tags.isBlank() || subclases == null || subclases.isEmpty()) {
			return false;
		}

		List<String> tokens = normalizarTokens(tags);
		return subclases.stream()
				.anyMatch(subclase -> coincideSubclase(tokens, subclase));
	}

	public static boolean contieneSubclase(String tags, ClaseDndSubclaseResponse subclase) {
		if (tags == null || tags.isBlank() || subclase == null) {
			return false;
		}
		return coincideSubclase(normalizarTokens(tags), subclase);
	}

	public static boolean esCompetenciaGeneralEditable(String nombreHabilidad) {
		String competencia = DndCharacterNormalizers.normalizarCompetenciaGeneral(nombreHabilidad);
		if (competencia == null) {
			return false;
		}
		return TagUtils.normalizeText(nombreHabilidad).startsWith(TagUtils.normalizeText("Competencia: "));
	}

	public static boolean esHabilidadElegidaUsuario(Habilidad habilidad) {
		String normalizedTags = TagUtils.normalizeText(habilidad.getTags());
		return normalizedTags.contains(TagUtils.normalizeText("DND,CLASE"))
				|| normalizedTags.contains(TagUtils.normalizeText("DND,IDIOMA,EDITABLE"));
	}

	public static boolean esConjuroRacialDeRaza(Habilidad habilidad, String razaId) {
		String tagsNormalizados = TagUtils.normalizeText(habilidad.getTags());
		return tagsNormalizados.contains(TagUtils.normalizeText(DndPatterns.RACIAL_SPELL_TAG))
				&& tagsNormalizados.contains(TagUtils.normalizeText(razaId));
	}

	public static boolean esHechizoOTruco(Habilidad habilidad) {
		String tags = habilidad.getTags() == null ? "" : habilidad.getTags().toLowerCase(java.util.Locale.ROOT);
		return tags.contains("truco") || tags.contains("hechizo;");
	}

	public static boolean esAtaqueSinArmas(Habilidad habilidad) {
		return TagUtils.normalizeText(habilidad.getTags()).contains(TagUtils.normalizeText("ATAQUESINARMAS"));
	}

	public static boolean esLegadoInfernal(String tags, String nombreRasgo) {
		String tagsNormalizados = TagUtils.normalizeText(tags);
		return tagsNormalizados.contains(TagUtils.normalizeText("DND,RAZA,tiefling"))
				&& TagUtils.normalizeText(nombreRasgo).equals(TagUtils.normalizeText("Legado infernal"));
	}

	private static List<String> normalizarTokens(String tags) {
		return java.util.Arrays.stream(tags.split(","))
				.map(String::trim)
				.filter(token -> !token.isBlank())
				.map(TagUtils::normalizeText)
				.toList();
	}

	private static boolean coincideSubclase(List<String> tokens, ClaseDndSubclaseResponse subclase) {
		String normalizedId = TagUtils.normalizeText(subclase.id());
		String normalizedName = TagUtils.normalizeText(subclase.nombre());
		return tokens.stream().anyMatch(token -> token.equals(normalizedId) || token.equals(normalizedName));
	}
}