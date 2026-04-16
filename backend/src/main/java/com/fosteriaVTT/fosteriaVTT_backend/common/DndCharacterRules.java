package com.fosteriaVTT.fosteriaVTT_backend.common;

import com.fosteriaVTT.fosteriaVTT_backend.dto.CatalogoDndEleccion;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.SubrazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.TrasfondoDndDetalleResponse;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

public final class DndCharacterRules {

	private static final Pattern HIT_DIE_PATTERN = Pattern.compile("(?i)d(\\d+)");

	public static final Map<String, String> STAT_NAMES = Map.of(
			"strength", "Fuerza",
			"dexterity", "Destreza",
			"constitution", "Constitucion",
			"intelligence", "Inteligencia",
			"wisdom", "Sabiduria",
			"charisma", "Carisma"
	);

	public static final Map<String, String> ATTRIBUTE_BY_SKILL = Map.ofEntries(
			Map.entry("Acrobacias", "Destreza"),
			Map.entry("Atletismo", "Fuerza"),
			Map.entry("Arcano", "Inteligencia"),
			Map.entry("Engano", "Carisma"),
			Map.entry("Historia", "Inteligencia"),
			Map.entry("Interpretacion", "Carisma"),
			Map.entry("Intimidacion", "Carisma"),
			Map.entry("Investigacion", "Inteligencia"),
			Map.entry("Juego de manos", "Destreza"),
			Map.entry("Medicina", "Sabiduria"),
			Map.entry("Naturaleza", "Inteligencia"),
			Map.entry("Percepcion", "Sabiduria"),
			Map.entry("Perspicacia", "Sabiduria"),
			Map.entry("Persuasion", "Carisma"),
			Map.entry("Religion", "Inteligencia"),
			Map.entry("Sigilo", "Destreza"),
			Map.entry("Supervivencia", "Sabiduria"),
			Map.entry("Trato con Animales", "Sabiduria")
	);

	private static final Map<String, String> CANONICAL_SKILLS = buildCanonicalSkills();

	private DndCharacterRules() {}

	public static String requireText(String value, String errorMessage) {
		if (value == null || value.isBlank()) {
			throw new ResponseStatusException(BAD_REQUEST, errorMessage);
		}
		return value.trim();
	}

	public static Optional<String> normalizeCanonicalSkill(String value) {
		String cleaned = TagUtils.cleanValue(value);
		if (cleaned.isBlank()) {
			return Optional.empty();
		}
		return Optional.ofNullable(CANONICAL_SKILLS.get(TagUtils.normalizeText(cleaned)));
	}

	public static Optional<String> normalizeCanonicalAttribute(String value) {
		String cleaned = TagUtils.cleanValue(value);
		if (cleaned.isBlank()) {
			return Optional.empty();
		}
		String attributeName = STAT_NAMES.values().stream()
				.filter(item -> TagUtils.normalizeText(item).equals(TagUtils.normalizeText(cleaned)))
				.findFirst()
				.orElse(null);
		return Optional.ofNullable(attributeName);
	}

	public static Optional<String> normalizeLanguage(String value) {
		String cleaned = TagUtils.cleanValue(value);
		return cleaned.isBlank() ? Optional.empty() : Optional.of(cleaned);
	}

	public static Set<String> resolveSkillCompetencies(
			List<String> classSkills,
			TrasfondoDndDetalleResponse background,
			RazaDndDetalleResponse race,
			SubrazaDndDetalleResponse subrace,
			Map<String, List<String>> backgroundChoices,
			Map<String, List<String>> raceChoices
	) {
		Set<String> result = new LinkedHashSet<>();
		addCanonicalSkills(result, classSkills);
		addCanonicalSkills(result, background.competenciasHabilidades());
		addSkillCompetencies(result, race.competencias());
		if (subrace != null) {
			addSkillCompetencies(result, subrace.competencias());
		}
		addSelectedByCatalog(result, background.elecciones(), backgroundChoices, "skills", DndCharacterRules::normalizeCanonicalSkill);
		addSelectedByCatalog(result, race.elecciones(), raceChoices, "skills", DndCharacterRules::normalizeCanonicalSkill);
		if (subrace != null) {
			addSelectedByCatalog(result, subrace.elecciones(), raceChoices, "skills", DndCharacterRules::normalizeCanonicalSkill);
		}
		return result;
	}

	public static Set<String> resolveLanguages(
			RazaDndDetalleResponse race,
			SubrazaDndDetalleResponse subrace,
			TrasfondoDndDetalleResponse background,
			Map<String, List<String>> raceChoices,
			Map<String, List<String>> backgroundChoices
	) {
		Set<String> languages = new LinkedHashSet<>();
		for (String language : race.idiomas()) {
			String cleaned = TagUtils.cleanValue(language);
			if (!cleaned.isBlank()) {
				languages.add(cleaned);
			}
		}
		addSelectedByCatalog(languages, race.elecciones(), raceChoices, "languages", DndCharacterRules::normalizeLanguage);
		if (subrace != null) {
			addSelectedByCatalog(languages, subrace.elecciones(), raceChoices, "languages", DndCharacterRules::normalizeLanguage);
		}
		addSelectedByCatalog(languages, background.elecciones(), backgroundChoices, "languages", DndCharacterRules::normalizeLanguage);
		return languages;
	}

	public static String buildCharacterTags(
			ClaseDndDetalleResponse characterClass,
			RazaDndDetalleResponse race,
			SubrazaDndDetalleResponse subrace,
			TrasfondoDndDetalleResponse background,
			Map<String, List<String>> raceChoices,
			Map<String, List<String>> backgroundChoices
	) {
		Set<String> tags = new LinkedHashSet<>();
		tags.add("C" + TagUtils.cleanValue(characterClass.nombre()) + ";1");
		tags.add("Raza;" + TagUtils.normalizeTagValue(race.nombre()));
		if (subrace != null) {
			tags.add("Subraza;" + TagUtils.normalizeTagValue(subrace.nombre()));
		}
		for (String language : resolveLanguages(race, subrace, background, raceChoices, backgroundChoices)) {
			tags.add("Idioma;" + TagUtils.normalizeTagValue(language));
		}
		return String.join(",", tags);
	}

	public static int extractHitDieMax(String hitDie) {
		Matcher matcher = HIT_DIE_PATTERN.matcher(hitDie == null ? "" : hitDie);
		if (matcher.find()) {
			return Integer.parseInt(matcher.group(1));
		}
		throw new ResponseStatusException(BAD_REQUEST, "No se pudo interpretar el dado de golpe de la clase");
	}

	public static int calculateModifier(int value) {
		return Math.floorDiv(value - 10, 2);
	}

	public static <T> Map<String, T> safeMap(Map<String, T> values) {
		return values == null ? Map.of() : values;
	}

	private static Map<String, String> buildCanonicalSkills() {
		return ATTRIBUTE_BY_SKILL.keySet().stream()
				.collect(Collectors.toMap(
						TagUtils::normalizeText,
						Function.identity(),
						(first, ignored) -> first,
						LinkedHashMap::new
				));
	}

	private static void addCanonicalSkills(Set<String> accumulated, Collection<String> values) {
		for (String value : values == null ? List.<String>of() : values) {
			normalizeCanonicalSkill(value).ifPresent(accumulated::add);
		}
	}

	private static void addSkillCompetencies(Set<String> accumulated, Collection<String> competencies) {
		for (String competency : competencies == null ? List.<String>of() : competencies) {
			normalizeCanonicalSkill(TagUtils.cleanValue(competency)).ifPresent(accumulated::add);
		}
	}

	private static <T extends CatalogoDndEleccion> void addSelectedByCatalog(
			Set<String> accumulated,
			List<T> choices,
			Map<String, List<String>> selectedChoices,
			String catalog,
			Function<String, Optional<String>> normalizer
	) {
		for (T choice : choices) {
			if (!catalog.equalsIgnoreCase(choice.catalogo())) {
				continue;
			}
			for (String value : selectedChoices.getOrDefault(choice.id(), List.of())) {
				normalizer.apply(value).ifPresent(accumulated::add);
			}
		}
	}
}