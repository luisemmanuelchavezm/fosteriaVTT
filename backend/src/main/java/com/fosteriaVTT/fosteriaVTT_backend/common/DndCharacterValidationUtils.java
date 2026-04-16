package com.fosteriaVTT.fosteriaVTT_backend.common;

import com.fosteriaVTT.fosteriaVTT_backend.dto.CatalogoDndEleccion;
import com.fosteriaVTT.fosteriaVTT_backend.dto.EquipamientoDndGrupoResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.EquipamientoDndOpcionResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.EquipamientoDndResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndEleccionResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.SubrazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.TrasfondoDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.TrasfondoDndEleccionResponse;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

public final class DndCharacterValidationUtils {

	private static final Pattern CLASS_SKILL_CHOICE_PATTERN = Pattern.compile("(?i)elige\\s+(\\d+|una|uno|dos|tres|cuatro|cinco|seis)\\s+entre\\s+(.+)");
	private static final Map<String, Integer> NUMBER_WORDS = Map.of(
			"uno", 1,
			"una", 1,
			"dos", 2,
			"tres", 3,
			"cuatro", 4,
			"cinco", 5,
			"seis", 6
	);

	private DndCharacterValidationUtils() {}

	public static SubrazaDndDetalleResponse resolveSubrace(RazaDndDetalleResponse race, String subraceId) {
		if (race.subrazas().isEmpty()) {
			return null;
		}
		if (subraceId == null || subraceId.isBlank()) {
			throw new ResponseStatusException(BAD_REQUEST, "Debes seleccionar una subraza");
		}
		return race.subrazas().stream()
				.filter(item -> item.id().equalsIgnoreCase(subraceId.trim()))
				.findFirst()
				.orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "La subraza seleccionada no existe"));
	}

	public static Map<String, Integer> validateStats(Map<String, Integer> stats) {
		Map<String, Integer> safeValues = DndCharacterRules.safeMap(stats);
		Map<String, Integer> normalized = new LinkedHashMap<>();
		for (String key : DndCharacterRules.STAT_NAMES.keySet()) {
			Integer value = safeValues.get(key);
			if (value == null) {
				throw new ResponseStatusException(BAD_REQUEST, "Falta la estadística " + DndCharacterRules.STAT_NAMES.get(key));
			}
			if (value < 1 || value > 30) {
				throw new ResponseStatusException(BAD_REQUEST, "La estadística " + DndCharacterRules.STAT_NAMES.get(key) + " es inválida");
			}
			normalized.put(key, value);
		}
		return normalized;
	}

	public static List<String> validateClassSkillChoices(List<String> descriptions, List<String> selectedClassSkills) {
		List<SkillChoiceGroup> choiceGroups = extractClassSkillChoices(descriptions);
		List<String> selected = selectedClassSkills == null
				? List.of()
				: selectedClassSkills.stream()
						.map(value -> value == null ? "" : value.trim())
						.filter(value -> !value.isBlank())
						.toList();
		if (choiceGroups.isEmpty()) {
			if (!selected.isEmpty()) {
				throw new ResponseStatusException(BAD_REQUEST, "La clase seleccionada no requiere elegir competencias en habilidades");
			}
			return List.of();
		}

		int expectedTotal = choiceGroups.stream().mapToInt(SkillChoiceGroup::amount).sum();
		if (selected.size() != expectedTotal) {
			throw new ResponseStatusException(BAD_REQUEST, "Debes completar las competencias en habilidades de la clase");
		}

		List<String> result = new ArrayList<>();
		Set<String> uniqueValues = new LinkedHashSet<>();
		int selectedIndex = 0;
		for (SkillChoiceGroup choiceGroup : choiceGroups) {
			for (int index = 0; index < choiceGroup.amount(); index++) {
				String value = selected.get(selectedIndex++);
				String canonicalSkill = DndCharacterRules.normalizeCanonicalSkill(value)
						.orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "La competencia de clase seleccionada no es válida"));
				String normalizedSkill = TagUtils.normalizeText(canonicalSkill);
				if (choiceGroup.normalizedOptions().stream().noneMatch(normalizedSkill::equals)) {
					throw new ResponseStatusException(BAD_REQUEST, "La competencia de clase seleccionada no es válida");
				}
				if (!uniqueValues.add(normalizedSkill)) {
					throw new ResponseStatusException(BAD_REQUEST, "No puedes repetir competencias en habilidades de clase");
				}
				result.add(canonicalSkill);
			}
		}
		return result;
	}

	public static Map<String, List<String>> validateBackgroundChoices(
			TrasfondoDndDetalleResponse background,
			Map<String, List<String>> choices
	) {
		return validateCatalogChoices(
				background.elecciones(),
				DndCharacterRules.safeMap(choices),
				"trasfondo",
				TrasfondoDndEleccionResponse::cantidad,
				TrasfondoDndEleccionResponse::opciones,
				eleccion -> List.of()
		);
	}

	public static Map<String, List<String>> validateRaceChoices(
			RazaDndDetalleResponse race,
			SubrazaDndDetalleResponse subrace,
			Map<String, List<String>> choices
	) {
		List<RazaDndEleccionResponse> allChoices = new ArrayList<>(race.elecciones());
		if (subrace != null) {
			allChoices.addAll(subrace.elecciones());
		}
		return validateCatalogChoices(
				allChoices,
				DndCharacterRules.safeMap(choices),
				"raza",
				RazaDndEleccionResponse::cantidad,
				RazaDndEleccionResponse::opciones,
				RazaDndEleccionResponse::excluirOpciones
		);
	}

	public static void validateEquipment(
			String origin,
			EquipamientoDndResponse equipment,
			Map<String, Integer> selectedGroups,
			Map<String, Long> selectedCatalogItems
	) {
		for (EquipamientoDndGrupoResponse group : equipment.gruposEleccion()) {
			String key = origin + ":" + group.id();
			Integer selectedIndex = selectedGroups.get(key);
			if (selectedIndex == null || selectedIndex < 0 || selectedIndex >= group.opciones().size()) {
				throw new ResponseStatusException(BAD_REQUEST, "Debes seleccionar una opción de equipamiento para " + group.etiqueta());
			}

			EquipamientoDndOpcionResponse option = group.opciones().get(selectedIndex);
			if (!option.opcionesCatalogo().isEmpty()) {
				Long objectId = selectedCatalogItems.get(key);
				if (objectId == null || option.opcionesCatalogo().stream().noneMatch(item -> Objects.equals(item.id(), objectId))) {
					throw new ResponseStatusException(BAD_REQUEST, "Debes elegir el objeto concreto para " + group.etiqueta());
				}
			}
		}
	}

	public record SkillChoiceGroup(int amount, List<String> normalizedOptions) {}

	private static List<SkillChoiceGroup> extractClassSkillChoices(List<String> descriptions) {
		List<SkillChoiceGroup> result = new ArrayList<>();
		for (String description : descriptions == null ? List.<String>of() : descriptions) {
			String value = description == null ? "" : description.trim();
			if (value.isBlank()) {
				continue;
			}

			Matcher matcher = CLASS_SKILL_CHOICE_PATTERN.matcher(value);
			if (matcher.matches()) {
				int amount = parseChoiceAmount(matcher.group(1));
				List<String> options = extractSkillChoiceOptions(matcher.group(2));
				result.add(new SkillChoiceGroup(amount, options.stream().map(TagUtils::normalizeText).toList()));
				continue;
			}

			List<String> fixedOptions = extractSkillChoiceOptions(value);
			if (!fixedOptions.isEmpty()) {
				result.add(new SkillChoiceGroup(fixedOptions.size(), fixedOptions.stream().map(TagUtils::normalizeText).toList()));
			}
		}
		return result;
	}

	private static int parseChoiceAmount(String value) {
		String key = TagUtils.normalizeText(value);
		Integer amount = NUMBER_WORDS.get(key);
		if (amount != null) {
			return amount;
		}
		try {
			return Integer.parseInt(value);
		} catch (NumberFormatException exception) {
			throw new ResponseStatusException(BAD_REQUEST, "No se pudo interpretar la cantidad de competencias en habilidades de la clase");
		}
	}

	private static List<String> extractSkillChoiceOptions(String value) {
		String list = value == null ? "" : value.trim();
		if (list.endsWith(".")) {
			list = list.substring(0, list.length() - 1);
		}
		return List.of(list.replaceAll("(?i)\\s+y\\s+", ", ").split(","))
				.stream()
				.map(TagUtils::cleanValue)
				.map(String::trim)
				.filter(item -> !item.isBlank())
				.map(item -> DndCharacterRules.normalizeCanonicalSkill(item).orElse(item))
				.toList();
	}

	private static <T extends CatalogoDndEleccion> Map<String, List<String>> validateCatalogChoices(
			List<T> choices,
			Map<String, List<String>> selectedChoices,
			String origin,
			Function<T, Integer> amountProvider,
			Function<T, List<String>> optionsProvider,
			Function<T, List<String>> excludedOptionsProvider
	) {
		Map<String, List<String>> result = new LinkedHashMap<>();
		for (T choice : choices) {
			List<String> values = validateChoiceValues(
					selectedChoices.get(choice.id()),
					amountProvider.apply(choice),
					"Debes completar la elección de " + origin + " " + choice.etiqueta()
			);
			for (String value : values) {
				validateAgainstOptions(optionsProvider.apply(choice), excludedOptionsProvider.apply(choice), value, choice.etiqueta());
			}
			result.put(choice.id(), values);
		}
		return result;
	}

	private static List<String> validateChoiceValues(List<String> values, int expectedAmount, String errorMessage) {
		if (values == null || values.size() != expectedAmount) {
			throw new ResponseStatusException(BAD_REQUEST, errorMessage);
		}
		List<String> result = values.stream()
				.map(value -> value == null ? "" : value.trim())
				.toList();
		if (result.stream().anyMatch(String::isBlank)) {
			throw new ResponseStatusException(BAD_REQUEST, errorMessage);
		}
		long distinctCount = result.stream().map(TagUtils::normalizeText).distinct().count();
		if (distinctCount != result.size()) {
			throw new ResponseStatusException(BAD_REQUEST, "No puedes repetir opciones dentro de la misma elección");
		}
		return result;
	}

	private static void validateAgainstOptions(List<String> options, List<String> excludedOptions, String value, String label) {
		if (!options.isEmpty() && options.stream().noneMatch(option -> option.equalsIgnoreCase(value))) {
			throw new ResponseStatusException(BAD_REQUEST, "La opción seleccionada no es válida para " + label);
		}
		if (excludedOptions.stream().anyMatch(option -> option.equalsIgnoreCase(value))) {
			throw new ResponseStatusException(BAD_REQUEST, "La opción seleccionada no está permitida para " + label);
		}
	}
}