package com.fosteriaVTT.fosteriaVTT_backend.common;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public final class TagUtils {

	private TagUtils() {
	}

	public static Integer extractClassLevel(String tags, String className) {
		if (tags == null || tags.isBlank()) {
			return null;
		}

		String normalizedClassName = normalizeText(className);
		for (String rawTag : tags.split(",")) {
			String tag = rawTag.trim();
			if (tag.length() < 3 || Character.toUpperCase(tag.charAt(0)) != 'C') {
				continue;
			}

			String[] parts = tag.substring(1).split(";", 2);
			if (parts.length != 2 || !normalizeText(parts[0]).equals(normalizedClassName)) {
				continue;
			}

			try {
				return Integer.valueOf(parts[1].trim());
			} catch (NumberFormatException ignored) {
				return null;
			}
		}

		return null;
	}

	public static Map<String, Integer> extractClasses(String tags) {
		Map<String, Integer> classes = new LinkedHashMap<>();
		if (tags == null || tags.isBlank()) {
			return classes;
		}

		for (String rawTag : tags.split(",")) {
			String tag = rawTag.trim();
			if (tag.length() < 3 || Character.toUpperCase(tag.charAt(0)) != 'C') {
				continue;
			}

			String[] parts = tag.substring(1).split(";", 2);
			if (parts.length != 2) {
				continue;
			}

			try {
				String className = humanizeTagValue(parts[0]);
				int level = Integer.parseInt(parts[1].trim());
				classes.merge(className, level, Math::max);
			} catch (NumberFormatException ignored) {
				// Ignore malformed class tags.
			}
		}

		return classes;
	}

	public static String extractTagValue(String tags, String prefix) {
		if (tags == null || tags.isBlank()) {
			return null;
		}

		String normalizedPrefix = normalizeText(prefix);
		String extractedValue = null;
		String[] splitTags = tags.split(",");
		for (int index = 0; index < splitTags.length && extractedValue == null; index++) {
			String[] parts = splitTags[index].trim().split(";", 2);
			if (parts.length == 2 && normalizeText(parts[0]).equals(normalizedPrefix)) {
				extractedValue = humanizeTagValue(parts[1]);
			}
		}

		return extractedValue;
	}

	public static String normalizeTagValue(String value) {
		return cleanValue(value)
				.toLowerCase(Locale.ROOT)
				.replace(' ', '-')
				.replaceAll("[^a-z0-9-]", "");
	}

	public static String humanizeTagValue(String value) {
		String cleanValue = cleanValue(value);
		if (cleanValue.isBlank()) {
			return cleanValue;
		}

		String replaced = cleanValue.replace('-', ' ').trim();
		String[] words = replaced.split("\\s+");
		StringBuilder result = new StringBuilder();

		for (String word : words) {
			if (word.isBlank()) {
				continue;
			}

			if (!result.isEmpty()) {
				result.append(' ');
			}

			result.append(Character.toUpperCase(word.charAt(0)));
			if (word.length() > 1) {
				result.append(word.substring(1).toLowerCase(Locale.ROOT));
			}
		}

		return result.toString();
	}

	public static String normalizeText(String value) {
		String text = value == null ? "" : value;
		String withoutAccents = Normalizer.normalize(text, Normalizer.Form.NFD)
				.replaceAll("\\p{M}+", "");
		return withoutAccents.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
	}

	public static String cleanValue(String value) {
		if (value == null) {
			return "";
		}

		String result = value.trim();
		int separator = result.indexOf(':');
		if (separator >= 0 && separator < result.length() - 1) {
			return result.substring(separator + 1).trim();
		}

		return result;
	}

	public static String mergeTags(String... tagGroups) {
		LinkedHashSet<String> tags = new LinkedHashSet<>();
		for (String group : tagGroups) {
			if (group == null || group.isBlank()) {
				continue;
			}
			for (String rawTag : group.split(",")) {
				String tag = rawTag.trim();
				if (!tag.isBlank()) {
					tags.add(tag);
				}
			}
		}
		return String.join(",", tags);
	}

	public static String updateClassTags(String currentTags, String className, int targetLevel, String subclassName) {
		String updatedTags = updateClassLevelTag(currentTags, className, targetLevel);
		if (subclassName == null || subclassName.isBlank()) {
			return updatedTags;
		}
		return mergeTags(updatedTags, "Subclase;" + normalizeTagValue(subclassName));
	}

	public static String updateClassTagsAfterLevelDown(
			String currentTags,
			String className,
			int targetLevel,
			String subclassName,
			Integer subclassUnlockLevel
	) {
		List<String> tags = new ArrayList<>();
		for (String rawTag : (currentTags == null ? "" : currentTags).split(",")) {
			String tag = rawTag.trim();
			if (tag.isBlank()) {
				continue;
			}
			if (isClassTagFor(tag, className)) {
				if (targetLevel > 0) {
					tags.add(buildClassLevelTag(className, targetLevel));
				}
				continue;
			}
			if (subclassName != null
					&& !subclassName.isBlank()
					&& subclassUnlockLevel != null
					&& targetLevel < subclassUnlockLevel
					&& tag.equalsIgnoreCase("Subclase;" + normalizeTagValue(subclassName))) {
				continue;
			}
			tags.add(tag);
		}
		return mergeTags(String.join(",", tags));
	}

	private static String updateClassLevelTag(String currentTags, String className, int targetLevel) {
		List<String> tags = new ArrayList<>();
		boolean updatedClass = false;
		for (String rawTag : (currentTags == null ? "" : currentTags).split(",")) {
			String tag = rawTag.trim();
			if (tag.isBlank()) {
				continue;
			}
			if (isClassTagFor(tag, className)) {
				if (targetLevel > 0) {
					tags.add(buildClassLevelTag(className, targetLevel));
				}
				updatedClass = true;
				continue;
			}
			tags.add(tag);
		}
		if (!updatedClass && targetLevel > 0) {
			tags.add(buildClassLevelTag(className, targetLevel));
		}
		return mergeTags(String.join(",", tags));
	}

	private static boolean isClassTagFor(String tag, String className) {
		if (tag == null || tag.isBlank()) {
			return false;
		}
		String cleanClassName = cleanValue(className);
		if (cleanClassName.isBlank() || tag.length() < 3 || Character.toUpperCase(tag.charAt(0)) != 'C') {
			return false;
		}
		String[] parts = tag.substring(1).split(";", 2);
		return parts.length == 2 && normalizeText(parts[0]).equals(normalizeText(cleanClassName));
	}

	private static String buildClassLevelTag(String className, int targetLevel) {
		return "C" + cleanValue(className) + ";" + targetLevel;
	}
}