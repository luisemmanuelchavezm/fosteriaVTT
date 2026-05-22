package com.fosteriaVTT.fosteriaVTT_backend.Estadistica;

import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.dnd.DndActualizacionRecursosUtils;
import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.dnd.DndBajadaNivelStatsUtils;
import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.dnd.DndCaracteristicaUtils;
import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.dnd.DndClaseArmaduraCalculator;
import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.dnd.DndConjurosRecursosSyncUtils;
import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.dnd.DndConstruccionEstadisticasUtils;
import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.dnd.DndEstadisticaMutationUtils;
import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.dnd.DndProficienciaStatsUtils;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Mochila.Mochila;
import com.fosteriaVTT.fosteriaVTT_backend.Mochila.MochilaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import com.fosteriaVTT.fosteriaVTT_backend.common.dnd.DndCharacterRules;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndLanzamientoConjurosResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndNivelLanzamientoConjurosResponse;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class EstadisticaService {

	private static final String CURRENT_HP_STAT = "Vida actual";
	private static final String MAX_HP_STAT = "Puntos de vida";
	private static final String PROFICIENCY_BONUS_STAT = "Bonificador por competencia";
	private static final String INITIATIVE_STAT = "Iniciativa";
	private static final String TOUGH_FEAT_NAME = "Duro";

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
		Map<String, Estadistica> statsByName = cargarEstadisticasRecursos(character, currentSpellSlots, currentExtraResources);
		DndActualizacionRecursosUtils.actualizarPuntosVida(statsByName, currentHp, tempHp);
		DndActualizacionRecursosUtils.actualizarRanurasConjuro(statsByName, currentSpellSlots);
		DndActualizacionRecursosUtils.actualizarRecursosExtra(statsByName, currentExtraResources);

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

		DndBajadaNivelStatsUtils.aplicarEstadisticasBaseExistentes(statsByName, updatedBaseStats);

		int adjustedHitPointIncrease = hitPointIncrease + resolverBonificadorPuntosGolpePorDotes(character.getHabilidades(), 1);
		DndEstadisticaMutationUtils.incrementarEstadistica(statsByName, character, "Puntos de vida", adjustedHitPointIncrease);
		DndEstadisticaMutationUtils.incrementarEstadistica(statsByName, character, "Vida actual", adjustedHitPointIncrease);
		actualizarExperienciaStat(statsByName, character, 0);
		DndProficienciaStatsUtils.actualizarBonificacionesCompetencia(statsByName, character, PROFICIENCY_BONUS_STAT, totalLevel);
		DndProficienciaStatsUtils.recalcularBonosPorCompetencia(
				statsByName,
				character,
				Math.max(1, totalLevel - 1),
				totalLevel,
				Set.of(),
				expertiseSkillsToApply
		);
		DndEstadisticaMutationUtils.upsertStat(statsByName, character, INITIATIVE_STAT, calcularIniciativaDesdeEstadisticas(statsByName, character.getHabilidades()));
		DndEstadisticaMutationUtils.upsertStat(statsByName, character, "CA", calcularClaseArmaduraDesdeEstadisticas(statsByName, character));

		int dieMax = Math.max(1, DndCharacterRules.extractHitDieMax(hitDie));
		DndEstadisticaMutationUtils.incrementarEstadistica(statsByName, character, "Dados de golpe d" + dieMax, 1);

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
			DndEstadisticaMutationUtils.upsertStat(statsByName, character, entry.getKey(), entry.getValue());
		}
		if (movement != null) {
			DndEstadisticaMutationUtils.upsertStat(statsByName, character, "Movimiento", Math.max(0, Math.min(1000, movement)));
		}
		if (maxHitPoints != null) {
			int clampedMaxHp = Math.max(1, Math.min(1000, maxHitPoints));
			DndEstadisticaMutationUtils.upsertStat(statsByName, character, MAX_HP_STAT, clampedMaxHp);
			int currentHp = Math.min(
					clampedMaxHp,
					DndEstadisticaMutationUtils.obtenerValor(statsByName, character, CURRENT_HP_STAT, clampedMaxHp)
			);
			DndEstadisticaMutationUtils.upsertStat(statsByName, character, CURRENT_HP_STAT, currentHp);
		}

		DndProficienciaStatsUtils.actualizarBonificacionesCompetencia(statsByName, character, PROFICIENCY_BONUS_STAT, totalLevel);
		DndProficienciaStatsUtils.aplicarCompetenciasSeleccionadas(statsByName, character, proficientSavingThrows, proficientSkills, expertiseSkills, totalLevel);
		DndEstadisticaMutationUtils.upsertStat(statsByName, character, INITIATIVE_STAT, calcularIniciativaDesdeEstadisticas(statsByName, character.getHabilidades()));
		DndEstadisticaMutationUtils.upsertStat(statsByName, character, "CA", calcularClaseArmaduraDesdeEstadisticas(statsByName, character));
		sincronizarEspaciosDeConjuroEditables(stats, statsByName, character, spellSlotsMax, spellSlotsCurrent);
		DndConjurosRecursosSyncUtils.sincronizarRecursosExtraEditables(statsByName, character, extraResourcesMax, extraResourcesCurrent);
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

		DndProficienciaStatsUtils.actualizarBonificacionesCompetencia(statsByName, character, PROFICIENCY_BONUS_STAT, totalLevel);
		DndProficienciaStatsUtils.recalcularBonosPorCompetencia(
				statsByName,
				character,
				Math.max(1, totalLevel + 1),
				totalLevel,
				expertiseSkillsToRemove,
				Set.of()
		);
		DndEstadisticaMutationUtils.upsertStat(statsByName, character, INITIATIVE_STAT, calcularIniciativaDesdeEstadisticas(statsByName, character.getHabilidades()));
		DndEstadisticaMutationUtils.upsertStat(statsByName, character, "CA", calcularClaseArmaduraDesdeEstadisticas(statsByName, character));
		int dieMax = Math.max(1, DndCharacterRules.extractHitDieMax(hitDie));
		DndEstadisticaMutationUtils.decrementarEstadistica(statsByName, "Dados de golpe d" + dieMax, 1, 0);
		int adjustedHitPointReduction = hitPointReduction + resolverBonificadorPuntosGolpePorDotes(character.getHabilidades(), 1);
		DndEstadisticaMutationUtils.decrementarEstadistica(statsByName, MAX_HP_STAT, adjustedHitPointReduction, 1);
		int maxHitPoints = DndEstadisticaMutationUtils.obtenerValor(statsByName, character, MAX_HP_STAT, 1);
		int currentHp = Math.min(
				maxHitPoints,
				Math.max(1, DndEstadisticaMutationUtils.obtenerValor(statsByName, character, CURRENT_HP_STAT, 1) - adjustedHitPointReduction)
		);
		DndEstadisticaMutationUtils.upsertStat(statsByName, character, CURRENT_HP_STAT, currentHp);
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

	public void guardarEstadisticasNpc(Personaje personaje, Map<String, Integer> estadisticas) {
		List<Estadistica> stats = new java.util.ArrayList<>();
		for (Map.Entry<String, Integer> entry : estadisticas.entrySet()) {
			Estadistica stat = Estadistica.builder()
					.nombre(entry.getKey())
					.valor(entry.getValue())
					.personaje(personaje)
					.build();
			stats.add(stat);
		}
		estadisticaRepository.saveAll(stats);
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
		int totalLevels = Math.max(1, TagUtils.extractClasses(character.getTags()).values().stream().mapToInt(Integer::intValue).sum());
		int proficiencyBonus = DndCharacterRules.calculateProficiencyBonus(totalLevels);
		DndConstruccionEstadisticasUtils.agregarEstadisticasBase(result, character, baseStats);
		DndConstruccionEstadisticasUtils.agregarSalvaciones(result, character, savingThrows, proficiencyBonus);
		DndConstruccionEstadisticasUtils.agregarCompetenciasHabilidad(result, character, skillCompetencies, expertiseSkills, proficiencyBonus);
		DndConstruccionEstadisticasUtils.agregarEstadisticasVitales(
				result,
				character,
				baseStats,
				movement,
				hitDie,
				proficiencyBonus,
				mochila,
				habilidades,
				totalLevels,
				resolverBonificadorPuntosGolpePorDotes(habilidades, totalLevels),
				this::calcularIniciativa,
				(stats, equippedItems) -> calcularClaseArmadura(stats, equippedItems, habilidades)
		);
		agregarEstadisticasHuecosDeConjuro(result, character, spellcasting);
		DndConstruccionEstadisticasUtils.agregarRecursosExtraIniciales(result, character);

		return result;
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

		result.add(DndEstadisticaMutationUtils.buildStat(character, "Hechizos nivel " + spellLevel, amount));
		result.add(DndEstadisticaMutationUtils.buildStat(character, "Hechizos nivel " + spellLevel + " gastados", amount));
	}

	private void actualizarExperienciaStat(
			Map<String, Estadistica> statsByName,
			Personaje character,
			int value
	) {
		Estadistica experienceStat = statsByName.get("Experiencia");
		if (experienceStat == null) {
			experienceStat = DndEstadisticaMutationUtils.buildStat(character, "Experiencia", value);
			statsByName.put("Experiencia", experienceStat);
			return;
		}
		experienceStat.setValor(Math.max(0, value));
	}

	private Map<String, Estadistica> cargarEstadisticasRecursos(
			Personaje character,
			Map<Integer, Integer> currentSpellSlots,
			Map<Integer, Integer> currentExtraResources
	) {
		List<String> statNames = DndActualizacionRecursosUtils.construirNombresEstadistica(currentSpellSlots, currentExtraResources);
		return DndActualizacionRecursosUtils.mapearPorNombre(
				estadisticaRepository.findByPersonajeIdAndNombreIn(character.getId(), statNames)
		);
	}

	private void sincronizarEspaciosDeConjuroEditables(
			List<Estadistica> existingStats,
			Map<String, Estadistica> statsByName,
			Personaje character,
			Map<Integer, Integer> spellSlotsMax,
			Map<Integer, Integer> spellSlotsCurrent
	) {
		List<Estadistica> removableStats = DndConjurosRecursosSyncUtils.extraerEstadisticasRanurasConjuro(existingStats);
		if (!removableStats.isEmpty()) {
			estadisticaRepository.deleteAll(removableStats);
			DndConjurosRecursosSyncUtils.removerDeMapa(statsByName, removableStats);
		}
		DndConjurosRecursosSyncUtils.sincronizarEspaciosDeConjuroEditables(statsByName, character, spellSlotsMax, spellSlotsCurrent);
	}

	private void sincronizarEspaciosDeConjuro(
			List<Estadistica> existingStats,
			Map<String, Estadistica> statsByName,
			Personaje character,
			Map<Integer, Integer> spellSlots
	) {
		List<Estadistica> removableStats = DndConjurosRecursosSyncUtils.extraerEstadisticasRanurasConjuro(existingStats);
		if (!removableStats.isEmpty()) {
			estadisticaRepository.deleteAll(removableStats);
			DndConjurosRecursosSyncUtils.removerDeMapa(statsByName, removableStats);
		}
		DndConjurosRecursosSyncUtils.sincronizarEspaciosDeConjuro(statsByName, character, spellSlots);
	}

	private int calcularIniciativa(Map<String, Integer> baseStats, List<Habilidad> habilidades) {
		int dexterityModifier = DndCaracteristicaUtils.resolverModificador(baseStats, "Destreza");
		return dexterityModifier + resolverBonificadorIniciativaPorDotes(habilidades);
	}

	private int calcularIniciativaDesdeEstadisticas(Map<String, Estadistica> statsByName, List<Habilidad> habilidades) {
		int dexterityScore = DndEstadisticaMutationUtils.obtenerValor(statsByName, null, "Destreza", 10);
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
		return DndClaseArmaduraCalculator.calcular(baseStats, mochila, habilidades);
	}

	private int calcularClaseArmaduraDesdeEstadisticas(Map<String, Estadistica> statsByName, Personaje character) {
		Map<String, Integer> baseStats = new LinkedHashMap<>();
		for (String attributeName : DndCharacterRules.STAT_NAMES.values()) {
			baseStats.put(
					attributeName,
					DndEstadisticaMutationUtils.obtenerValor(statsByName, character, attributeName, 10)
			);
		}
		return calcularClaseArmadura(
				baseStats,
				mochilaRepository.findByPersonajeIdOrderByIdAsc(character.getId()),
				character.getHabilidades()
		);
	}

	private boolean tieneHabilidad(List<Habilidad> habilidades, String nombre) {
		String normalizedName = TagUtils.normalizeText(nombre);
		return (habilidades == null ? List.<Habilidad>of() : habilidades).stream()
				.anyMatch(habilidad -> TagUtils.normalizeText(habilidad.getNombre()).equals(normalizedName));
	}
}