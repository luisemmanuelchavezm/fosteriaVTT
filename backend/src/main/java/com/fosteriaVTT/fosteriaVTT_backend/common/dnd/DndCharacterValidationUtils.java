package com.fosteriaVTT.fosteriaVTT_backend.common.dnd;

import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CatalogoDndEleccion;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndEleccionResponse;
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
	private static final Pattern CLASS_ANY_SKILL_CHOICE_PATTERN = Pattern.compile("(?i)elige\\s+(\\d+|una|uno|dos|tres|cuatro|cinco|seis)\\s+habilidades?\\s+cualesquiera");
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

	public static ValidatedClassChoices validateClassChoices(
			ClaseDndDetalleResponse clase,
			Map<String, List<String>> selectedChoices,
			List<String> legacySelectedSkills
	) {
		List<ClassChoiceGroup> choiceGroups = extractClassChoices(clase);
		Map<String, List<String>> normalizedSelections = new LinkedHashMap<>();
		Map<String, List<String>> safeSelections = DndCharacterRules.safeMap(selectedChoices);
		List<String> selectedSkills = new ArrayList<>();
		Set<String> uniqueSkills = new LinkedHashSet<>();
		List<String> remainingLegacySkills = legacySelectedSkills == null
				? List.of()
				: legacySelectedSkills.stream().map(value -> value == null ? "" : value.trim()).filter(value -> !value.isBlank()).toList();

		for (ClassChoiceGroup choiceGroup : choiceGroups) {
			List<String> rawValues = safeSelections.get(choiceGroup.id());
			if (rawValues == null && esCatalogo(choiceGroup.catalog(), "habilidades") && !remainingLegacySkills.isEmpty()) {
				rawValues = remainingLegacySkills.stream().limit(choiceGroup.amount()).toList();
				remainingLegacySkills = remainingLegacySkills.stream().skip(choiceGroup.amount()).toList();
			}

			List<String> values = validateChoiceValues(
					rawValues,
					choiceGroup.amount(),
					"Debes completar la elección de clase " + choiceGroup.label()
			);

			List<String> normalizedValues = new ArrayList<>();
			for (String value : values) {
				String normalizedValue = normalizeClassChoiceValue(choiceGroup, value);
				if (choiceGroup.normalizedOptions().stream().noneMatch(normalizedValue::equals)) {
					throw new ResponseStatusException(BAD_REQUEST, "La opción seleccionada no es válida para " + choiceGroup.label());
				}
				String displayValue = resolveDisplayValue(choiceGroup, normalizedValue);
				normalizedValues.add(displayValue);
				if (esCatalogo(choiceGroup.catalog(), "habilidades")) {
					if (!uniqueSkills.add(normalizedValue)) {
						throw new ResponseStatusException(BAD_REQUEST, "No puedes repetir competencias en habilidades de clase");
					}
					selectedSkills.add(displayValue);
				}
			}

			normalizedSelections.put(choiceGroup.id(), normalizedValues);
		}

		return new ValidatedClassChoices(selectedSkills, normalizedSelections);
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
				for (String catalogSelectionKey : buildCatalogSelectionKeys(key, option.cantidad())) {
					Long objectId = selectedCatalogItems.get(catalogSelectionKey);
					if (objectId == null || option.opcionesCatalogo().stream().noneMatch(item -> Objects.equals(item.id(), objectId))) {
						throw new ResponseStatusException(BAD_REQUEST, "Debes elegir el objeto concreto para " + group.etiqueta());
					}
				}
			}
		}
	}

	private static List<String> buildCatalogSelectionKeys(String baseKey, Integer amount) {
		int selectionCount = Math.max(1, amount == null ? 1 : amount);
		if (selectionCount == 1) {
			return List.of(baseKey);
		}

		List<String> keys = new ArrayList<>(selectionCount);
		for (int index = 0; index < selectionCount; index++) {
			keys.add(baseKey + ":" + index);
		}
		return keys;
	}

	public record SkillChoiceGroup(int amount, List<String> normalizedOptions) {}
	public record ValidatedClassChoices(List<String> selectedSkills, Map<String, List<String>> selectedChoices) {}

	private record ClassChoiceGroup(
			String id,
			String label,
			String catalog,
			int amount,
			Map<String, String> displayByNormalizedOption
	) {
		List<String> normalizedOptions() {
			return new ArrayList<>(displayByNormalizedOption.keySet());
		}
	}

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

	private static List<ClassChoiceGroup> extractClassChoices(ClaseDndDetalleResponse clase) {
		if (clase != null && clase.elecciones() != null && !clase.elecciones().isEmpty()) {
			return clase.elecciones().stream()
					.map(DndCharacterValidationUtils::toClassChoiceGroup)
					.toList();
		}

		List<ClassChoiceGroup> result = new ArrayList<>();
		List<String> skillDescriptions = clase == null ? List.of() : clase.competencias().habilidades();

		for (int index = 0; index < (skillDescriptions == null ? 0 : skillDescriptions.size()); index++) {
			ClassChoiceGroup choice = extractClassSkillChoice(skillDescriptions.get(index), index);
			if (choice != null) {
				result.add(choice);
			}
		}

		return result;
	}

	private static ClassChoiceGroup extractClassSkillChoice(String description, int index) {
		String value = description == null ? "" : description.trim();
		if (value.isBlank()) {
			return null;
		}

		Matcher anySkillMatcher = CLASS_ANY_SKILL_CHOICE_PATTERN.matcher(value);
		if (anySkillMatcher.matches()) {
			return new ClassChoiceGroup(
					"class-skill-" + index,
					"Competencias de clase",
					"habilidades",
					parseChoiceAmount(anySkillMatcher.group(1)),
					buildOptionMap(new ArrayList<>(DndCharacterRules.ATTRIBUTE_BY_SKILL.keySet()))
			);
		}

		Matcher matcher = CLASS_SKILL_CHOICE_PATTERN.matcher(value);
		if (!matcher.matches()) {
			return null;
		}

		return new ClassChoiceGroup(
				"class-skill-" + index,
				"Competencias de clase",
				"habilidades",
				parseChoiceAmount(matcher.group(1)),
				buildOptionMap(extractSkillChoiceOptions(matcher.group(2)))
		);
	}

	public static int parseChoiceAmount(String value) {
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

	private static Map<String, String> buildOptionMap(List<String> values) {
		Map<String, String> options = new LinkedHashMap<>();
		for (String value : values) {
			String normalized = TagUtils.normalizeText(value);
			if (!normalized.isBlank()) {
				options.putIfAbsent(normalized, value);
			}
		}
		return options;
	}

	private static String normalizeClassChoiceValue(ClassChoiceGroup choiceGroup, String rawValue) {
		if (esCatalogo(choiceGroup.catalog(), "habilidades")) {
			return DndCharacterRules.normalizeCanonicalSkill(rawValue)
					.map(TagUtils::normalizeText)
					.orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "La competencia de clase seleccionada no es válida"));
		}

		return TagUtils.normalizeText(rawValue);
	}

	private static String resolveDisplayValue(ClassChoiceGroup choiceGroup, String normalizedValue) {
		String displayValue = choiceGroup.displayByNormalizedOption().get(normalizedValue);
		if (displayValue == null) {
			throw new ResponseStatusException(BAD_REQUEST, "La opción seleccionada no es válida para " + choiceGroup.label());
		}
		return displayValue;
	}

	private static ClassChoiceGroup toClassChoiceGroup(ClaseDndEleccionResponse choice) {
		return new ClassChoiceGroup(
				choice.id(),
				choice.etiqueta(),
				DndCharacterRules.normalizeChoiceCatalogId(choice.catalogo()),
				choice.cantidad(),
				buildOptionMap(choice.opciones())
		);
	}

	private static boolean esCatalogo(String catalogo, String esperado) {
		return DndCharacterRules.normalizeChoiceCatalogId(catalogo)
				.equalsIgnoreCase(DndCharacterRules.normalizeChoiceCatalogId(esperado));
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