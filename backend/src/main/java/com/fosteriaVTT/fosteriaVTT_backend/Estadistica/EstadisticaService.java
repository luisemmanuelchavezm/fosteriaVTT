package com.fosteriaVTT.fosteriaVTT_backend.Estadistica;

import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.common.DndCharacterRules;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndLanzamientoConjurosResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndNivelLanzamientoConjurosResponse;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class EstadisticaService {

	private final EstadisticaRepository estadisticaRepository;

	public EstadisticaService(EstadisticaRepository estadisticaRepository) {
		this.estadisticaRepository = estadisticaRepository;
	}

	public Map<String, Integer> obtenerValoresPorPersonajeId(Long personajeId) {
		Map<String, Integer> values = new LinkedHashMap<>();
		for (Estadistica stat : estadisticaRepository.findByPersonajeIdOrderByIdAsc(personajeId)) {
			values.put(stat.getNombre(), stat.getValor());
		}
		return values;
	}

	public void guardarEstadisticasIniciales(
			Personaje character,
			Map<String, Integer> baseStats,
			int movement,
			String hitDie,
			ClaseDndLanzamientoConjurosResponse spellcasting,
			List<String> savingThrows,
			Set<String> skillCompetencies
	) {
		estadisticaRepository.saveAll(construirEstadisticas(
				character,
				baseStats,
				movement,
				hitDie,
				spellcasting,
				savingThrows,
				skillCompetencies
		));
	}

	public List<Estadistica> construirEstadisticas(
			Personaje character,
			Map<String, Integer> baseStats,
			int movement,
			String hitDie,
			ClaseDndLanzamientoConjurosResponse spellcasting,
			List<String> savingThrows,
			Set<String> skillCompetencies
	) {
		List<Estadistica> result = new ArrayList<>();
		Set<String> normalizedSavingThrows = new LinkedHashSet<>();
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
					normalizedSavingThrows.contains(attributeName) ? 2 : 0
			));
		}

		for (String skillName : DndCharacterRules.ATTRIBUTE_BY_SKILL.keySet()) {
			result.add(buildStat(character, skillName, skillCompetencies.contains(skillName) ? 2 : 0));
		}

		int maxHitPoints = Math.max(1, DndCharacterRules.extractHitDieMax(hitDie) + DndCharacterRules.calculateModifier(baseStats.get("constitution")));

		result.add(buildStat(character, "Movimiento", movement));
		result.add(buildStat(character, "Puntos de vida", maxHitPoints));
		result.add(buildStat(character, "Vida actual", maxHitPoints));
		result.add(buildStat(character, "Vida temporal", 0));
		agregarEstadisticasHuecosDeConjuro(result, character, spellcasting);

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

		result.add(buildStat(character, "Hechizos nivel " + spellLevel, amount));
		result.add(buildStat(character, "Hechizos nivel " + spellLevel + " gastados", amount));
	}

	private Estadistica buildStat(Personaje character, String name, Integer value) {
		return Estadistica.builder()
				.nombre(name)
				.valor(value)
				.personaje(character)
				.build();
	}
}