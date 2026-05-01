package com.fosteriaVTT.fosteriaVTT_backend.common.dnd;

import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import java.util.Map;

public final class DndWeaponRules {

	private static final Map<String, String> WEAPON_COMPETENCY_ALIASES = Map.ofEntries(
			Map.entry("dagas", "daga"),
			Map.entry("dardos", "dardo"),
			Map.entry("jabalinas", "jabalina"),
			Map.entry("hondas", "honda"),
			Map.entry("bastones", "baston"),
			Map.entry("hoces", "hoz"),
			Map.entry("cimitarras", "cimitarra"),
			Map.entry("espadascortas", "espadacorta"),
			Map.entry("espadaslargas", "espadalarga"),
			Map.entry("ballestasdemano", "ballestademano"),
			Map.entry("ballestasligeras", "ballestaligera"),
			Map.entry("rapier", "estoque"),
			Map.entry("rapiers", "estoque")
	);

	private DndWeaponRules() {}

	public static String normalizeWeaponCompetency(String value) {
		String sinPrefijo = TagUtils.cleanValue(value)
				.replaceFirst("(?i)^Competencia(?: dote)?\\s*:\\s*", "")
				.trim();
		String normalizado = TagUtils.normalizeText(sinPrefijo);
		if (normalizado.isBlank()) {
			return "";
		}
		if (normalizado.contains(TagUtils.normalizeText("armassimples"))
				|| normalizado.contains(TagUtils.normalizeText("armasmarciales"))) {
			return "";
		}
		return WEAPON_COMPETENCY_ALIASES.getOrDefault(normalizado, normalizado);
	}
}