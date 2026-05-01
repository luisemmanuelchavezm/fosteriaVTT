package com.fosteriaVTT.fosteriaVTT_backend.common.dnd;

import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class DndSpellParsingRules {

	private DndSpellParsingRules() {}

	public static List<String> extractSpellNames(String description) {
		String text = TagUtils.cleanValue(description);
		if (text.isBlank()) {
			return List.of();
		}

		List<String> names = new ArrayList<>();
		addMatches(names, text, DndPatterns.KNOWN_CANTRIP_PATTERN);
		addMatches(names, text, DndPatterns.CAST_SPELL_PATTERN);
		return names;
	}

	public static List<String> extractSpellNamesFromFormula(String formula, String tags) {
		String text = TagUtils.cleanValue(formula);
		if (text.isBlank() || text.matches(".*\\d.*") || !isSpellOrCantripSummary(tags)) {
			return List.of();
		}

		String cantripWithoutPrefix = text.replaceFirst("(?i)^truco\\s+", "").trim();
		if (!cantripWithoutPrefix.isBlank() && !cantripWithoutPrefix.equals(text)) {
			return List.of(cantripWithoutPrefix);
		}

		return java.util.Arrays.stream(text.split(","))
				.map(TagUtils::cleanValue)
				.filter(name -> !name.isBlank())
				.toList();
	}

	public static boolean isSpellOrCantripSummary(String tags) {
		if (tags == null || tags.isBlank()) {
			return false;
		}

		return java.util.Arrays.stream(tags.split(","))
				.map(TagUtils::normalizeText)
				.anyMatch(token -> token.equals("conjuro") || token.equals("truco"));
	}

	private static void addMatches(List<String> names, String text, Pattern pattern) {
		Matcher matcher = pattern.matcher(text);
		while (matcher.find()) {
			String name = TagUtils.cleanValue(matcher.group(1));
			if (!name.isBlank()) {
				names.add(name);
			}
		}
	}
}