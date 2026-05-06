package com.fosteriaVTT.fosteriaVTT_backend.Estadistica;

import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Mochila.Mochila;
import com.fosteriaVTT.fosteriaVTT_backend.Mochila.MochilaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.Objeto;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.TipoObjeto;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import com.fosteriaVTT.fosteriaVTT_backend.common.dnd.DndCharacterRules;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndLanzamientoConjurosResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndNivelLanzamientoConjurosResponse;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class EstadisticaService {

	private static final String CURRENT_HP_STAT = "Vida actual";
	private static final String TEMP_HP_STAT = "Vida temporal";
	private static final String MAX_HP_STAT = "Puntos de vida";
	private static final String PROFICIENCY_BONUS_STAT = "Bonificador por competencia";
	private static final String INITIATIVE_STAT = "Iniciativa";
	private static final String TOUGH_FEAT_NAME = "Duro";
	private static final Pattern ARMOR_CLASS_PATTERN = Pattern.compile("(?<![A-Z_])CA=(\\d+)(?:\\+([A-Z]{3})(?:\\(max:(\\d+)\\))?)?", Pattern.CASE_INSENSITIVE);
	private static final Pattern ARMOR_BONUS_PATTERN = Pattern.compile("BONO_CA=(\\d+)", Pattern.CASE_INSENSITIVE);

	private final EstadisticaRepository estadisticaRepository;
	private final MochilaRepository mochilaRepository;

	public EstadisticaService(EstadisticaRepository estadisticaRepository, MochilaRepository mochilaRepository) {
		this.estadisticaRepository = estadisticaRepository;
		this.mochilaRepository = mochilaRepository;
	}

	public Map<String, Integer> obtenerValoresPorPersonajeId(Long personajeId) {
		Map<String, Integer> values = new LinkedHashMap<>();
		for (Estadistica stat : estadisticaRepository.findByPersonajeIdOrderByIdAsc(personajeId)) {
			values.put(stat.getNombre(), stat.getValor());
		}
		return values;
	}

	public void actualizarRecursosPersonaje(
			Personaje character,
			Integer currentHp,
			Integer tempHp,
			Map<Integer, Integer> currentSpellSlots,
			Map<Integer, Integer> currentExtraResources
	) {
		List<String> statNames = new ArrayList<>(List.of(MAX_HP_STAT, CURRENT_HP_STAT, TEMP_HP_STAT));
		for (Integer level : currentSpellSlots == null ? List.<Integer>of() : currentSpellSlots.keySet()) {
			if (level == null || level < 1 || level > 9) {
				throw new ResponseStatusException(BAD_REQUEST, "Nivel de conjuro inválido");
			}
			statNames.add("Hechizos nivel " + level);
			statNames.add("Hechizos nivel " + level + " gastados");
		}
		for (Integer index : currentExtraResources == null ? List.<Integer>of() : currentExtraResources.keySet()) {
			if (index == null || index < 1 || index > 9) {
				throw new ResponseStatusException(BAD_REQUEST, "Recurso extra inválido");
			}
			statNames.add("Recurso custom dnd actual " + index);
			statNames.add("Recurso custom dnd maximo " + index);
		}

		Map<String, Estadistica> statsByName = new HashMap<>();
		for (Estadistica stat : estadisticaRepository.findByPersonajeIdAndNombreIn(character.getId(), statNames)) {
			statsByName.put(stat.getNombre(), stat);
		}

		Estadistica maxHpStat = statsByName.get(MAX_HP_STAT);
		Estadistica currentHpStat = statsByName.get(CURRENT_HP_STAT);
		Estadistica tempHpStat = statsByName.get(TEMP_HP_STAT);
		if (currentHp != null) {
			if (currentHp < 0 || maxHpStat == null || currentHp > maxHpStat.getValor()) {
				throw new ResponseStatusException(BAD_REQUEST, "La vida actual no es válida");
			}
			if (currentHpStat == null) {
				throw new ResponseStatusException(BAD_REQUEST, "El personaje no tiene vida actual registrada");
			}
			currentHpStat.setValor(currentHp);
		}

		if (tempHp != null) {
			if (tempHp < 0) {
				throw new ResponseStatusException(BAD_REQUEST, "La vida temporal no es válida");
			}
			if (tempHpStat == null) {
				throw new ResponseStatusException(BAD_REQUEST, "El personaje no tiene vida temporal registrada");
			}
			tempHpStat.setValor(tempHp);
		}

		if (currentSpellSlots != null) {
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

		if (currentExtraResources != null) {
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

		estadisticaRepository.saveAll(statsByName.values());
	}

	public void actualizarExperienciaPersonaje(Personaje character, int experience) {
		Estadistica experienceStat = estadisticaRepository.findByPersonajeIdAndNombreIn(
				character.getId(),
				List.of("Experiencia")
		).stream().findFirst().orElse(null);
		if (experienceStat == null) {
			experienceStat = Estadistica.builder()
					.personaje(character)
					.nombre("Experiencia")
					.valor(Math.max(0, experience))
					.build();
		} else {
			experienceStat.setValor(Math.max(0, experience));
		}
		estadisticaRepository.save(experienceStat);
	}

	public void aplicarSubidaNivel(
			Personaje character,
			Map<String, Integer> updatedBaseStats,
			String hitDie,
			int hitPointIncrease,
			Map<Integer, Integer> spellSlots,
			int totalLevel,
			Set<String> expertiseSkillsToApply
	) {
		List<Estadistica> stats = new ArrayList<>(estadisticaRepository.findByPersonajeIdOrderByIdAsc(character.getId()));
		Map<String, Estadistica> statsByName = new LinkedHashMap<>();
		for (Estadistica stat : stats) {
			statsByName.put(stat.getNombre(), stat);
		}

		for (Map.Entry<String, Integer> entry : updatedBaseStats.entrySet()) {
			Estadistica stat = statsByName.get(entry.getKey());
			if (stat != null) {
				stat.setValor(entry.getValue());
			}
		}

		int adjustedHitPointIncrease = hitPointIncrease + resolverBonificadorPuntosGolpePorDotes(character.getHabilidades(), 1);
		incrementarEstadistica(statsByName, character, "Puntos de vida", adjustedHitPointIncrease);
		incrementarEstadistica(statsByName, character, "Vida actual", adjustedHitPointIncrease);
		actualizarExperienciaStat(statsByName, character, 0);
		actualizarBonificacionesCompetencia(statsByName, character, totalLevel);
		recalcularBonosPorCompetencia(
				statsByName,
				character,
				Math.max(1, totalLevel - 1),
				totalLevel,
				Set.of(),
				expertiseSkillsToApply
		);
		upsertStat(statsByName, character, INITIATIVE_STAT, calcularIniciativaDesdeEstadisticas(statsByName, character.getHabilidades()));
		upsertStat(statsByName, character, "CA", calcularClaseArmaduraDesdeEstadisticas(statsByName, character));

		int dieMax = Math.max(1, DndCharacterRules.extractHitDieMax(hitDie));
		incrementarEstadistica(statsByName, character, "Dados de golpe d" + dieMax, 1);

		sincronizarEspaciosDeConjuro(stats, statsByName, character, spellSlots);
		estadisticaRepository.saveAll(statsByName.values());
	}

	public void actualizarEdicionHoja(
			Personaje character,
			Map<String, Integer> updatedBaseStats,
			Integer movement,
			Integer maxHitPoints,
			Map<Integer, Integer> spellSlotsMax,
			Map<Integer, Integer> spellSlotsCurrent,
			Map<Integer, Integer> extraResourcesMax,
			Map<Integer, Integer> extraResourcesCurrent,
			Set<String> proficientSavingThrows,
			Set<String> proficientSkills,
			Set<String> expertiseSkills,
			int totalLevel
	) {
		List<Estadistica> stats = new ArrayList<>(estadisticaRepository.findByPersonajeIdOrderByIdAsc(character.getId()));
		Map<String, Estadistica> statsByName = new LinkedHashMap<>();
		for (Estadistica stat : stats) {
			statsByName.put(stat.getNombre(), stat);
		}

		for (Map.Entry<String, Integer> entry : updatedBaseStats.entrySet()) {
			upsertStat(statsByName, character, entry.getKey(), entry.getValue());
		}
		if (movement != null) {
			upsertStat(statsByName, character, "Movimiento", Math.max(0, Math.min(1000, movement)));
		}
		if (maxHitPoints != null) {
			int clampedMaxHp = Math.max(1, Math.min(1000, maxHitPoints));
			upsertStat(statsByName, character, MAX_HP_STAT, clampedMaxHp);
			int currentHp = Math.min(clampedMaxHp, statsByName.getOrDefault(CURRENT_HP_STAT, buildStat(character, CURRENT_HP_STAT, clampedMaxHp)).getValor());
			upsertStat(statsByName, character, CURRENT_HP_STAT, currentHp);
		}

		actualizarBonificacionesCompetencia(statsByName, character, totalLevel);
		aplicarCompetenciasSeleccionadas(statsByName, character, proficientSavingThrows, proficientSkills, expertiseSkills, totalLevel);
		upsertStat(statsByName, character, INITIATIVE_STAT, calcularIniciativaDesdeEstadisticas(statsByName, character.getHabilidades()));
		upsertStat(statsByName, character, "CA", calcularClaseArmaduraDesdeEstadisticas(statsByName, character));
		sincronizarEspaciosDeConjuroEditables(stats, statsByName, character, spellSlotsMax, spellSlotsCurrent);
		sincronizarRecursosExtraEditables(statsByName, character, extraResourcesMax, extraResourcesCurrent);
		estadisticaRepository.saveAll(statsByName.values());
	}

	public void aplicarBajadaNivel(
			Personaje character,
			Map<String, Integer> updatedBaseStats,
			String hitDie,
			int totalLevel,
			Map<Integer, Integer> spellSlots,
			int hitPointReduction,
			Set<String> expertiseSkillsToRemove
	) {
		List<Estadistica> stats = new ArrayList<>(estadisticaRepository.findByPersonajeIdOrderByIdAsc(character.getId()));
		Map<String, Estadistica> statsByName = new LinkedHashMap<>();
		for (Estadistica stat : stats) {
			statsByName.put(stat.getNombre(), stat);
		}

		for (Map.Entry<String, Integer> entry : updatedBaseStats.entrySet()) {
			Estadistica stat = statsByName.get(entry.getKey());
			if (stat != null) {
				stat.setValor(entry.getValue());
			}
		}

		actualizarBonificacionesCompetencia(statsByName, character, totalLevel);
		recalcularBonosPorCompetencia(
				statsByName,
				character,
				Math.max(1, totalLevel + 1),
				totalLevel,
				expertiseSkillsToRemove,
				Set.of()
		);
		upsertStat(statsByName, character, INITIATIVE_STAT, calcularIniciativaDesdeEstadisticas(statsByName, character.getHabilidades()));
		upsertStat(statsByName, character, "CA", calcularClaseArmaduraDesdeEstadisticas(statsByName, character));
		int dieMax = Math.max(1, DndCharacterRules.extractHitDieMax(hitDie));
		decrementarEstadistica(statsByName, "Dados de golpe d" + dieMax, 1, 0);
		int adjustedHitPointReduction = hitPointReduction + resolverBonificadorPuntosGolpePorDotes(character.getHabilidades(), 1);
		decrementarEstadistica(statsByName, MAX_HP_STAT, adjustedHitPointReduction, 1);
		int maxHitPoints = statsByName.getOrDefault(MAX_HP_STAT, buildStat(character, MAX_HP_STAT, 1)).getValor();
		int currentHp = Math.min(maxHitPoints, Math.max(1, statsByName.getOrDefault(CURRENT_HP_STAT, buildStat(character, CURRENT_HP_STAT, 1)).getValor() - adjustedHitPointReduction));
		upsertStat(statsByName, character, CURRENT_HP_STAT, currentHp);
		sincronizarEspaciosDeConjuro(stats, statsByName, character, spellSlots);
		estadisticaRepository.saveAll(statsByName.values());
	}

	public void actualizarClaseArmadura(
			Personaje character,
			Map<String, Integer> persistedStats,
			List<Mochila> mochila,
			List<Habilidad> habilidades
	) {
		Estadistica armorClassStat = estadisticaRepository.findByPersonajeIdAndNombreIn(
				character.getId(),
				List.of("CA")
		).stream().findFirst().orElse(null);
		if (armorClassStat == null) {
			return;
		}

		armorClassStat.setValor(calcularClaseArmadura(persistedStats, mochila, habilidades));
		estadisticaRepository.save(armorClassStat);
	}

	public void guardarEstadisticasIniciales(
			Personaje character,
			Map<String, Integer> baseStats,
			int movement,
			String hitDie,
			ClaseDndLanzamientoConjurosResponse spellcasting,
			List<String> savingThrows,
			Set<String> skillCompetencies,
			Set<String> expertiseSkills,
			List<Mochila> mochila,
			List<Habilidad> habilidades
	) {
		estadisticaRepository.saveAll(construirEstadisticas(
				character,
				baseStats,
				movement,
				hitDie,
				spellcasting,
				savingThrows,
				skillCompetencies,
				expertiseSkills,
				mochila,
				habilidades
		));
	}

	public List<Estadistica> construirEstadisticas(
			Personaje character,
			Map<String, Integer> baseStats,
			int movement,
			String hitDie,
			ClaseDndLanzamientoConjurosResponse spellcasting,
			List<String> savingThrows,
			Set<String> skillCompetencies,
			Set<String> expertiseSkills,
			List<Mochila> mochila,
			List<Habilidad> habilidades
	) {
		List<Estadistica> result = new ArrayList<>();
		Set<String> normalizedSavingThrows = new LinkedHashSet<>();
		int totalLevels = Math.max(1, TagUtils.extractClasses(character.getTags()).values().stream().mapToInt(Integer::intValue).sum());
		int proficiencyBonus = DndCharacterRules.calculateProficiencyBonus(totalLevels);
		for (String savingThrow : savingThrows == null ? List.<String>of() : savingThrows) {
			DndCharacterRules.normalizeCanonicalAttribute(savingThrow).ifPresent(normalizedSavingThrows::add);
		}

		for (Map.Entry<String, String> entry : DndCharacterRules.STAT_NAMES.entrySet()) {
			result.add(buildStat(character, entry.getValue(), baseStats.get(entry.getKey())));
		}

		for (String attributeName : DndCharacterRules.STAT_NAMES.values()) {
			result.add(buildStat(
					character,
					"Salvación de " + attributeName,
					normalizedSavingThrows.contains(attributeName) ? proficiencyBonus : 0
			));
		}

		for (String skillName : DndCharacterRules.ATTRIBUTE_BY_SKILL.keySet()) {
			int skillBonus = expertiseSkills.contains(skillName)
					? proficiencyBonus * 2
					: skillCompetencies.contains(skillName)
						? proficiencyBonus
						: 0;
			result.add(buildStat(character, skillName, skillBonus));
		}

		int maxHitPoints = Math.max(
				1,
				DndCharacterRules.extractHitDieMax(hitDie)
						+ DndCharacterRules.calculateModifier(baseStats.get("constitution"))
						+ resolverBonificadorPuntosGolpePorDotes(habilidades, totalLevels)
		);

		result.add(buildStat(character, "Movimiento", movement));
		result.add(buildStat(character, PROFICIENCY_BONUS_STAT, proficiencyBonus));
		result.add(buildStat(character, INITIATIVE_STAT, calcularIniciativa(baseStats, habilidades)));
		result.add(buildStat(character, "CA", calcularClaseArmadura(baseStats, mochila, habilidades)));
		result.add(buildStat(character, "Experiencia", 0));
		result.add(buildStat(character, "Puntos de vida", maxHitPoints));
		result.add(buildStat(character, "Vida actual", maxHitPoints));
		result.add(buildStat(character, "Vida temporal", 0));
		agregarEstadisticasDadosGolpe(result, character, hitDie, totalLevels);
		agregarEstadisticasHuecosDeConjuro(result, character, spellcasting);
		agregarEstadisticasRecursosExtra(result, character);

		return result;
	}

	private void agregarEstadisticasDadosGolpe(List<Estadistica> result, Personaje character, String hitDie, int totalLevels) {
		int dieMax = Math.max(1, DndCharacterRules.extractHitDieMax(hitDie));
		result.add(buildStat(character, "Dados de golpe d" + dieMax, totalLevels));
	}

	private void agregarEstadisticasHuecosDeConjuro(
			List<Estadistica> result,
			Personaje character,
			ClaseDndLanzamientoConjurosResponse spellcasting
	) {
		if (spellcasting == null || spellcasting.niveles() == null || spellcasting.niveles().isEmpty()) {
			return;
		}

		ClaseDndNivelLanzamientoConjurosResponse firstLevel = spellcasting.niveles().stream()
				.filter(item -> item.nivel() == 1)
				.findFirst()
				.orElse(null);

		if (firstLevel == null) {
			return;
		}

		List<Integer> spellSlots = firstLevel.espaciosConjuro();
		if (spellSlots != null) {
			for (int index = 0; index < spellSlots.size(); index++) {
				agregarEstadisticasHechizo(result, character, index + 1, spellSlots.get(index));
			}
		}

		if (firstLevel.ranurasPacto() != null && firstLevel.nivelRanuraPacto() != null) {
			agregarEstadisticasHechizo(result, character, firstLevel.nivelRanuraPacto(), firstLevel.ranurasPacto());
		}
	}

	private void agregarEstadisticasHechizo(List<Estadistica> result, Personaje character, int spellLevel, Integer amount) {
		if (spellLevel < 1 || spellLevel > 9 || amount == null || amount <= 0) {
			return;
		}

		result.add(buildStat(character, "Hechizos nivel " + spellLevel, amount));
		result.add(buildStat(character, "Hechizos nivel " + spellLevel + " gastados", amount));
	}

	private void agregarEstadisticasRecursosExtra(List<Estadistica> result, Personaje character) {
		for (int index = 1; index <= 9; index++) {
			result.add(buildStat(character, "Recurso custom dnd actual " + index, 0));
			result.add(buildStat(character, "Recurso custom dnd maximo " + index, 0));
		}
	}

	private Estadistica buildStat(Personaje character, String name, Integer value) {
		return Estadistica.builder()
				.nombre(name)
				.valor(value)
				.personaje(character)
				.build();
	}

	private void incrementarEstadistica(
			Map<String, Estadistica> statsByName,
			Personaje character,
			String statName,
			int amount
	) {
		Estadistica stat = statsByName.get(statName);
		if (stat == null) {
			stat = buildStat(character, statName, amount);
			statsByName.put(statName, stat);
			return;
		}
		stat.setValor(Math.max(0, stat.getValor() + amount));
	}

	private void actualizarExperienciaStat(
			Map<String, Estadistica> statsByName,
			Personaje character,
			int value
	) {
		Estadistica experienceStat = statsByName.get("Experiencia");
		if (experienceStat == null) {
			experienceStat = buildStat(character, "Experiencia", value);
			statsByName.put("Experiencia", experienceStat);
			return;
		}
		experienceStat.setValor(Math.max(0, value));
	}

	private void upsertStat(Map<String, Estadistica> statsByName, Personaje character, String statName, int value) {
		Estadistica stat = statsByName.get(statName);
		if (stat == null) {
			stat = buildStat(character, statName, value);
			statsByName.put(statName, stat);
			return;
		}
		stat.setValor(value);
	}

	private void decrementarEstadistica(Map<String, Estadistica> statsByName, String statName, int amount, int minimum) {
		Estadistica stat = statsByName.get(statName);
		if (stat == null) {
			return;
		}
		stat.setValor(Math.max(minimum, stat.getValor() - Math.max(0, amount)));
	}

	private void actualizarBonificacionesCompetencia(Map<String, Estadistica> statsByName, Personaje character, int totalLevel) {
		int proficiencyBonus = DndCharacterRules.calculateProficiencyBonus(totalLevel);
		upsertStat(statsByName, character, PROFICIENCY_BONUS_STAT, proficiencyBonus);
		for (String attributeName : DndCharacterRules.STAT_NAMES.values()) {
			String saveName = "Salvación de " + attributeName;
			Estadistica saveStat = statsByName.get(saveName);
			if (saveStat != null && saveStat.getValor() > 0) {
				saveStat.setValor(proficiencyBonus);
			}
		}
	}

	private void aplicarCompetenciasSeleccionadas(
			Map<String, Estadistica> statsByName,
			Personaje character,
			Set<String> proficientSavingThrows,
			Set<String> proficientSkills,
			Set<String> expertiseSkills,
			int totalLevel
	) {
		int proficiencyBonus = DndCharacterRules.calculateProficiencyBonus(totalLevel);
		for (String attributeName : DndCharacterRules.STAT_NAMES.values()) {
			upsertStat(
					statsByName,
					character,
					"Salvación de " + attributeName,
					proficientSavingThrows.contains(TagUtils.normalizeText(attributeName)) ? proficiencyBonus : 0
			);
		}
		for (String skillName : DndCharacterRules.ATTRIBUTE_BY_SKILL.keySet()) {
			String normalizedSkillName = TagUtils.normalizeText(skillName);
			int multiplier = expertiseSkills.contains(normalizedSkillName)
					? 2
					: proficientSkills.contains(normalizedSkillName) ? 1 : 0;
			upsertStat(
					statsByName,
					character,
					skillName,
					multiplier * proficiencyBonus
			);
		}
	}

	private void recalcularBonosPorCompetencia(
			Map<String, Estadistica> statsByName,
			Personaje character,
			int previousTotalLevel,
			int nextTotalLevel,
			Set<String> expertiseSkillsToRemove,
			Set<String> expertiseSkillsToApply
	) {
		int previousProficiencyBonus = DndCharacterRules.calculateProficiencyBonus(Math.max(1, previousTotalLevel));
		int nextProficiencyBonus = DndCharacterRules.calculateProficiencyBonus(Math.max(1, nextTotalLevel));

		for (String attributeName : DndCharacterRules.STAT_NAMES.values()) {
			String saveName = "Salvación de " + attributeName;
			int currentValue = statsByName.getOrDefault(saveName, buildStat(character, saveName, 0)).getValor();
			int level = currentValue > 0 && previousProficiencyBonus > 0 ? 1 : 0;
			upsertStat(statsByName, character, saveName, level * nextProficiencyBonus);
		}

		for (String skillName : DndCharacterRules.ATTRIBUTE_BY_SKILL.keySet()) {
			int currentValue = statsByName.getOrDefault(skillName, buildStat(character, skillName, 0)).getValor();
			int level = resolverNivelCompetencia(currentValue, previousProficiencyBonus);
			String normalizedSkillName = TagUtils.normalizeText(skillName);
			if (expertiseSkillsToRemove.contains(normalizedSkillName) && level >= 2) {
				level = 1;
			}
			if (expertiseSkillsToApply.contains(normalizedSkillName) && level >= 1) {
				level = 2;
			}
			int nextValue = switch (level) {
				case 2 -> nextProficiencyBonus * 2;
				case 1 -> nextProficiencyBonus;
				default -> 0;
			};
			upsertStat(statsByName, character, skillName, nextValue);
		}
	}

	private int resolverNivelCompetencia(int storedValue, int proficiencyBonus) {
		if (storedValue <= 0 || proficiencyBonus <= 0) {
			return 0;
		}
		if (storedValue >= proficiencyBonus * 2) {
			return 2;
		}
		return 1;
	}

	private void sincronizarEspaciosDeConjuroEditables(
			List<Estadistica> existingStats,
			Map<String, Estadistica> statsByName,
			Personaje character,
			Map<Integer, Integer> spellSlotsMax,
			Map<Integer, Integer> spellSlotsCurrent
	) {
		Map<Integer, Integer> safeMax = spellSlotsMax == null ? Map.of() : spellSlotsMax;
		Map<Integer, Integer> safeCurrent = spellSlotsCurrent == null ? Map.of() : spellSlotsCurrent;
		List<Estadistica> removableStats = existingStats.stream()
				.filter(stat -> stat.getNombre().startsWith("Hechizos nivel "))
				.toList();
		if (!removableStats.isEmpty()) {
			estadisticaRepository.deleteAll(removableStats);
			for (Estadistica stat : removableStats) {
				statsByName.remove(stat.getNombre());
			}
		}
		for (int level = 1; level <= 9; level++) {
			int maxValue = Math.max(0, Math.min(30, safeMax.getOrDefault(level, 0)));
			if (maxValue <= 0) {
				continue;
			}
			int currentValue = Math.max(0, Math.min(maxValue, safeCurrent.getOrDefault(level, maxValue)));
			statsByName.put("Hechizos nivel " + level, buildStat(character, "Hechizos nivel " + level, maxValue));
			statsByName.put("Hechizos nivel " + level + " gastados", buildStat(character, "Hechizos nivel " + level + " gastados", currentValue));
		}
	}

	private void sincronizarRecursosExtraEditables(
			Map<String, Estadistica> statsByName,
			Personaje character,
			Map<Integer, Integer> extraResourcesMax,
			Map<Integer, Integer> extraResourcesCurrent
	) {
		Map<Integer, Integer> safeMax = extraResourcesMax == null ? Map.of() : extraResourcesMax;
		Map<Integer, Integer> safeCurrent = extraResourcesCurrent == null ? Map.of() : extraResourcesCurrent;
		for (int index = 1; index <= 9; index++) {
			int maxValue = Math.max(0, Math.min(30, safeMax.getOrDefault(index, 0)));
			int currentValue = Math.max(0, Math.min(maxValue, safeCurrent.getOrDefault(index, maxValue)));
			upsertStat(statsByName, character, "Recurso custom dnd maximo " + index, maxValue);
			upsertStat(statsByName, character, "Recurso custom dnd actual " + index, currentValue);
		}
	}

	private void sincronizarEspaciosDeConjuro(
			List<Estadistica> existingStats,
			Map<String, Estadistica> statsByName,
			Personaje character,
			Map<Integer, Integer> spellSlots
	) {
		List<Estadistica> removableStats = existingStats.stream()
				.filter(stat -> stat.getNombre().startsWith("Hechizos nivel "))
				.toList();
		if (!removableStats.isEmpty()) {
			estadisticaRepository.deleteAll(removableStats);
			for (Estadistica stat : removableStats) {
				statsByName.remove(stat.getNombre());
			}
		}

		for (Map.Entry<Integer, Integer> entry : spellSlots.entrySet()) {
			int level = entry.getKey();
			int amount = entry.getValue();
			if (amount <= 0) {
				continue;
			}
			statsByName.put("Hechizos nivel " + level, buildStat(character, "Hechizos nivel " + level, amount));
			statsByName.put("Hechizos nivel " + level + " gastados", buildStat(character, "Hechizos nivel " + level + " gastados", amount));
		}
	}

	private int calcularIniciativa(Map<String, Integer> baseStats, List<Habilidad> habilidades) {
		int dexterityModifier = DndCharacterRules.calculateModifier(resolverValorCaracteristica(baseStats, "dexterity", "Destreza"));
		return dexterityModifier + resolverBonificadorIniciativaPorDotes(habilidades);
	}

	private int calcularIniciativaDesdeEstadisticas(Map<String, Estadistica> statsByName, List<Habilidad> habilidades) {
		int dexterityScore = statsByName.getOrDefault("Destreza", buildStat(null, "Destreza", 10)).getValor();
		int dexterityModifier = DndCharacterRules.calculateModifier(dexterityScore);
		return dexterityModifier + resolverBonificadorIniciativaPorDotes(habilidades);
	}

	private int resolverBonificadorIniciativaPorDotes(List<Habilidad> habilidades) {
		return (habilidades == null ? List.<Habilidad>of() : habilidades).stream()
				.map(Habilidad::getNombre)
				.filter(nombre -> TagUtils.normalizeText(nombre).equals(TagUtils.normalizeText("Alerta")))
				.mapToInt(ignored -> 5)
				.sum();
	}

	private int resolverBonificadorPuntosGolpePorDotes(List<Habilidad> habilidades, int levelsAffected) {
		if (levelsAffected <= 0 || !tieneHabilidad(habilidades, TOUGH_FEAT_NAME)) {
			return 0;
		}

		return levelsAffected * 2;
	}

	private int calcularClaseArmadura(
			Map<String, Integer> baseStats,
			List<Mochila> mochila,
			List<Habilidad> habilidades
	) {
		int dexterityModifier = DndCharacterRules.calculateModifier(resolverValorCaracteristica(baseStats, "dexterity", "Destreza"));
		int constitutionModifier = DndCharacterRules.calculateModifier(resolverValorCaracteristica(baseStats, "constitution", "Constitucion"));
		int wisdomModifier = DndCharacterRules.calculateModifier(resolverValorCaracteristica(baseStats, "wisdom", "Sabiduria"));
		int armorClass = 10 + dexterityModifier;
		int shieldBonus = 0;
		boolean hasArmorEquipped = false;
		boolean hasShieldEquipped = false;

		for (Mochila item : mochila == null ? List.<Mochila>of() : mochila) {
			if (!item.isEquipado()) {
				continue;
			}

			Objeto objeto = item.getObjeto();
			if (objeto == null || objeto.getTipoObjeto() != TipoObjeto.ARMADURA) {
				continue;
			}

			Integer parsedArmorClass = extraerClaseArmaduraDesdeFormula(objeto.getFormula(), baseStats);
			if (parsedArmorClass != null) {
				armorClass = parsedArmorClass;
				hasArmorEquipped = true;
			} else {
				Integer parsedShieldBonus = extraerBonoArmaduraDesdeFormula(objeto.getFormula());
				if (parsedShieldBonus != null) {
					shieldBonus += parsedShieldBonus;
					hasShieldEquipped = true;
				}
			}
		}

		if (!hasArmorEquipped) {
			if (tieneHabilidadDeClase(habilidades, "Defensa sin armadura", "monje") && !hasShieldEquipped) {
				armorClass = 10 + dexterityModifier + wisdomModifier;
			} else if (tieneHabilidadDeClase(habilidades, "Defensa sin armadura", "barbaro")) {
				armorClass = 10 + dexterityModifier + constitutionModifier;
			}

			if (tieneHabilidad(habilidades, "Resiliencia draconica")) {
				armorClass = Math.max(armorClass, 13 + dexterityModifier);
			}
		}

		if (hasArmorEquipped && tieneHabilidad(habilidades, "Estilo de combate: Defensa")) {
			armorClass += 1;
		}

		return armorClass + shieldBonus;
	}

	private int calcularClaseArmaduraDesdeEstadisticas(Map<String, Estadistica> statsByName, Personaje character) {
		Map<String, Integer> baseStats = new LinkedHashMap<>();
		for (String attributeName : DndCharacterRules.STAT_NAMES.values()) {
			baseStats.put(
					attributeName,
					statsByName.getOrDefault(attributeName, buildStat(character, attributeName, 10)).getValor()
			);
		}
		return calcularClaseArmadura(
				baseStats,
				mochilaRepository.findByPersonajeIdOrderByIdAsc(character.getId()),
				character.getHabilidades()
		);
	}

	private int resolverValorCaracteristica(Map<String, Integer> baseStats, String rawKey, String displayKey) {
		return baseStats.getOrDefault(rawKey, baseStats.getOrDefault(displayKey, 10));
	}

	private Integer extraerClaseArmaduraDesdeFormula(String formula, Map<String, Integer> baseStats) {
		String cleanedFormula = formula == null ? "" : formula.trim();
		if (cleanedFormula.isBlank()) {
			return null;
		}

		Matcher matcher = ARMOR_CLASS_PATTERN.matcher(cleanedFormula);
		if (!matcher.find()) {
			return null;
		}

		int armorClass = Integer.parseInt(matcher.group(1));
		String modifierCode = matcher.group(2);
		String modifierCap = matcher.group(3);
		if (modifierCode != null && !modifierCode.isBlank()) {
			int abilityModifier = resolverModificadorCaracteristicaPorCodigo(baseStats, modifierCode);
			if (modifierCap != null && !modifierCap.isBlank()) {
				int maxCap = Integer.parseInt(modifierCap);
				abilityModifier = Math.min(abilityModifier, maxCap);
			}
			armorClass += abilityModifier;
		}

		return armorClass;
	}

	private int resolverModificadorCaracteristicaPorCodigo(Map<String, Integer> baseStats, String modifierCode) {
		String normalizedCode = TagUtils.normalizeText(modifierCode);
		String rawKey = switch (normalizedCode) {
			case "fue" -> "strength";
			case "des" -> "dexterity";
			case "con" -> "constitution";
			case "int" -> "intelligence";
			case "sab" -> "wisdom";
			case "car" -> "charisma";
			default -> null;
		};
		String displayKey = switch (normalizedCode) {
			case "fue" -> "Fuerza";
			case "des" -> "Destreza";
			case "con" -> "Constitucion";
			case "int" -> "Inteligencia";
			case "sab" -> "Sabiduria";
			case "car" -> "Carisma";
			default -> null;
		};

		if (rawKey == null) {
			return 0;
		}

		return DndCharacterRules.calculateModifier(resolverValorCaracteristica(baseStats, rawKey, displayKey));
	}

	private Integer extraerBonoArmaduraDesdeFormula(String formula) {
		String cleanedFormula = formula == null ? "" : formula.trim();
		if (cleanedFormula.isBlank()) {
			return null;
		}

		Matcher matcher = ARMOR_BONUS_PATTERN.matcher(cleanedFormula);
		if (!matcher.find()) {
			return null;
		}

		return Integer.parseInt(matcher.group(1));
	}

	private boolean tieneHabilidad(List<Habilidad> habilidades, String nombre) {
		String normalizedName = TagUtils.normalizeText(nombre);
		return (habilidades == null ? List.<Habilidad>of() : habilidades).stream()
				.anyMatch(habilidad -> TagUtils.normalizeText(habilidad.getNombre()).equals(normalizedName));
	}

	private boolean tieneHabilidadDeClase(List<Habilidad> habilidades, String nombre, String clase) {
		String normalizedName = TagUtils.normalizeText(nombre);
		String normalizedClassTag = TagUtils.normalizeText("C" + clase);
		return (habilidades == null ? List.<Habilidad>of() : habilidades).stream()
				.anyMatch(habilidad -> TagUtils.normalizeText(habilidad.getNombre()).equals(normalizedName)
						&& TagUtils.normalizeText(habilidad.getTags()).contains(normalizedClassTag));
	}
}