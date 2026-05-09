package com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils;

import com.fosteriaVTT.fosteriaVTT_backend.InformacionDnd.DndInfoService;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import com.fosteriaVTT.fosteriaVTT_backend.common.dnd.DndCharacterRules;
import com.fosteriaVTT.fosteriaVTT_backend.common.dnd.DndProgressionRules;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndLanzamientoConjurosResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndSubclaseResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClasePersonajeResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.SubirNivelPersonajeRequest;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class DndCharacterStatsUtils {

	private final DndInfoService dndInfoService;
	private final DndCharacterAbilityManagementUtils dndCharacterAbilityManagementUtils;

	public DndCharacterStatsUtils(DndInfoService dndInfoService, DndCharacterAbilityManagementUtils dndCharacterAbilityManagementUtils) {
		this.dndInfoService = dndInfoService;
		this.dndCharacterAbilityManagementUtils = dndCharacterAbilityManagementUtils;
	}

	public int resolverNivelTotalPersonaje(Personaje personaje) {
		return resolverClasesPersonaje(personaje).stream().mapToInt(ClasePersonajeResponse::nivel).sum();
	}

	public List<ClasePersonajeResponse> resolverClasesPersonaje(Personaje personaje) {
		Map<String, Integer> clases = new LinkedHashMap<>();
		TagUtils.extractClasses(personaje.getTags()).forEach((name, level) -> clases.merge(name, level, Math::max));

		if (clases.isEmpty()) {
			personaje.getHabilidades().forEach(habilidad -> TagUtils.extractClasses(habilidad.getTags()).forEach((name, level) -> clases.merge(name, level, Math::max)));
		}

		return clases.entrySet().stream().map(entry -> new ClasePersonajeResponse(entry.getKey(), entry.getValue())).toList();
	}

	public Map<String, Integer> resolverClasesPorId(Personaje personaje) {
		Map<String, Integer> byId = new LinkedHashMap<>();
		Map<String, String> classIdByName = dndInfoService.obtenerClases().stream()
				.collect(java.util.stream.Collectors.toMap(
						item -> TagUtils.normalizeText(item.nombre()),
						ClaseDndResumenResponse::id,
						(first, ignored) -> first,
						LinkedHashMap::new
				));

		for (ClasePersonajeResponse characterClass : resolverClasesPersonaje(personaje)) {
			String classId = classIdByName.get(TagUtils.normalizeText(characterClass.nombre()));
			if (classId != null) {
				byId.put(TagUtils.normalizeText(classId), characterClass.nivel());
			}
		}

		return byId;
	}

	public Integer experienciaMaximaParaNivel(int level) {
		return switch (Math.max(1, level)) {
			case 1 -> 300;
			case 2 -> 600;
			case 3 -> 1800;
			case 4 -> 3800;
			case 5 -> 7500;
			case 6 -> 9000;
			case 7 -> 11000;
			case 8 -> 14000;
			case 9 -> 16000;
			case 10 -> 21000;
			case 11 -> 15000;
			case 12 -> 20000;
			case 13 -> 20000;
			case 14 -> 25000;
			case 15 -> 30000;
			case 16 -> 30000;
			case 17 -> 40000;
			case 18 -> 40000;
			case 19 -> 50000;
			default -> null;
		};
	}

	public Map<Integer, Integer> resolverEspaciosDeConjuroTrasCambio(
			Personaje personaje,
			ClaseDndDetalleResponse targetClass,
			int targetClassLevel,
			ClaseDndSubclaseResponse activeSubclass
	) {
		Map<String, Integer> classLevelsById = resolverClasesPorId(personaje);
		classLevelsById.put(TagUtils.normalizeText(targetClass.id()), targetClassLevel);

		int casterLevel = 0;
		Map<Integer, Integer> slots = new LinkedHashMap<>();
		for (Map.Entry<String, Integer> entry : classLevelsById.entrySet()) {
			ClaseDndDetalleResponse detail = dndInfoService.obtenerClasePorId(entry.getKey()).orElse(null);
			if (detail != null && TagUtils.normalizeText(detail.id()).equals("picaro")) {
				boolean esEA = (activeSubclass != null && TagUtils.normalizeText(activeSubclass.id()).equals("embaucadorarcano"))
						|| tieneEmbaucadorArcano(personaje);
				if (esEA) {
					acumularEspaciosEmbaucadorArcano(slots, entry.getValue());
				}
				continue;
			}
			if (detail != null && TagUtils.normalizeText(detail.id()).equals("guerrero")) {
				boolean esEK = (activeSubclass != null && TagUtils.normalizeText(activeSubclass.id()).equals("caballeroarcano"))
						|| tieneCaballeroArcano(personaje);
				if (esEK) {
					acumularEspaciosCaballeroArcano(slots, entry.getValue());
				}
				continue;
			}
			if (detail == null || detail.lanzamientoConjuros() == null) {
				continue;
			}

			int classLevel = entry.getValue();
			String classId = TagUtils.normalizeText(detail.id());
			if (classId.equals(TagUtils.normalizeText("paladin")) || classId.equals(TagUtils.normalizeText("explorador"))) {
				casterLevel += Math.floorDiv(classLevel, 2);
				continue;
			}
			if (classId.equals(TagUtils.normalizeText("brujo"))) {
				acumularRanurasDePacto(slots, detail.lanzamientoConjuros(), classLevel);
				continue;
			}
			casterLevel += classLevel;
		}

		acumularRanurasMulticlase(slots, casterLevel);
		return slots;
	}

	public String resolverCaracteristicaLanzamientoConjuros(Personaje personaje) {
		for (ClasePersonajeResponse clase : resolverClasesPersonaje(personaje)) {
			String spellcastingStat = dndInfoService.obtenerClases().stream()
					.filter(item -> TagUtils.normalizeText(item.nombre()).equals(TagUtils.normalizeText(clase.nombre())))
					.findFirst()
					.flatMap(resumen -> dndInfoService.obtenerClasePorId(resumen.id()))
					.map(ClaseDndDetalleResponse::lanzamientoConjuros)
					.map(ClaseDndLanzamientoConjurosResponse::caracteristica)
					.orElse(null);
			if (spellcastingStat != null && !spellcastingStat.isBlank()) {
				return spellcastingStat;
			}
		}
		if (resolverClasesPorId(personaje).containsKey("picaro") && tieneEmbaucadorArcano(personaje)) {
			return "Inteligencia";
		}
		if (resolverClasesPorId(personaje).containsKey("guerrero") && tieneCaballeroArcano(personaje)) {
			return "Inteligencia";
		}
		return null;
	}

	public RazaDndDetalleResponse resolverRazaActual(Personaje personaje) {
		String nombreRaza = TagUtils.extractTagValue(personaje.getTags(), "Raza");
		if (nombreRaza == null || nombreRaza.isBlank()) {
			return null;
		}

		return dndInfoService.obtenerRazas().stream()
				.filter(raza -> TagUtils.normalizeText(raza.nombre()).equals(TagUtils.normalizeText(nombreRaza)))
				.findFirst()
				.flatMap(raza -> dndInfoService.obtenerRazaPorId(raza.id()))
				.orElse(null);
	}

	public void aplicarMejoraDeCaracteristicaSiCorresponde(
			Personaje personaje,
			String classId,
			int targetLevel,
			Map<String, Integer> baseStats,
			SubirNivelPersonajeRequest request
	) {
		if (!DndProgressionRules.isAbilityScoreImprovementLevel(TagUtils.normalizeText(classId), targetLevel)) {
			return;
		}

		String mode = request.modoMejoraCaracteristica() == null ? "" : TagUtils.normalizeText(request.modoMejoraCaracteristica());
		switch (mode) {
			case "una", "unsoloatributo", "single", "dosenuna" -> incrementarCaracteristica(baseStats, request.caracteristicaPrimaria(), 2);
			case "dos", "double", "dosatributos" -> aplicarMejoraDividida(baseStats, request.caracteristicaPrimaria(), request.caracteristicaSecundaria());
			case "dote", "feat" -> dndCharacterAbilityManagementUtils.aplicarDoteSeleccionada(personaje, baseStats, request.dote());
			default -> throw new ResponseStatusException(BAD_REQUEST, "Debes elegir cómo aplicar la mejora de característica");
		}
	}

	static void decrementarCaracteristica(Map<String, Integer> baseStats, String statName, int amount) {
		if (statName == null || statName.isBlank() || amount <= 0) {
			return;
		}

		String canonical = requerirCaracteristica(statName);
		int currentValue = baseStats.getOrDefault(canonical, 10);
		baseStats.put(canonical, Math.max(1, currentValue - amount));
	}

	private void aplicarMejoraDividida(Map<String, Integer> baseStats, String primaryStat, String secondaryStat) {
		String primary = requerirCaracteristica(primaryStat);
		String secondary = requerirCaracteristica(secondaryStat);
		if (TagUtils.normalizeText(primary).equals(TagUtils.normalizeText(secondary))) {
			throw new ResponseStatusException(BAD_REQUEST, "Debes elegir dos características distintas");
		}
		incrementarCaracteristica(baseStats, primary, 1);
		incrementarCaracteristica(baseStats, secondary, 1);
	}

	private void acumularRanurasDePacto(Map<Integer, Integer> slots, ClaseDndLanzamientoConjurosResponse spellcasting, int classLevel) {
		if (spellcasting.niveles() == null) {
			return;
		}

		spellcasting.niveles().stream()
				.filter(item -> item.nivel() == classLevel)
				.findFirst()
				.ifPresent(item -> {
					if (item.ranurasPacto() != null && item.nivelRanuraPacto() != null) {
						slots.merge(item.nivelRanuraPacto(), item.ranurasPacto(), Integer::sum);
					}
				});
	}

	private void acumularRanurasMulticlase(Map<Integer, Integer> slots, int casterLevel) {
		if (casterLevel <= 0) {
			return;
		}

		int[] multiclassSlots = DndProgressionRules.getMulticlassSpellSlots(casterLevel);
		for (int index = 0; index < multiclassSlots.length; index++) {
			if (multiclassSlots[index] > 0) {
				slots.merge(index + 1, multiclassSlots[index], Integer::sum);
			}
		}
	}

	private static String requerirCaracteristica(String value) {
		return DndCharacterRules.normalizeCanonicalAttribute(value)
				.orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "La característica seleccionada no es válida"));
	}

	private static void incrementarCaracteristica(Map<String, Integer> baseStats, String statName, int amount) {
		String canonical = requerirCaracteristica(statName);
		int currentValue = baseStats.getOrDefault(canonical, 10);
		baseStats.put(canonical, Math.min(20, currentValue + Math.max(0, amount)));
	}

	private boolean tieneEmbaucadorArcano(Personaje personaje) {
		String subclaseTag = TagUtils.extractTagValue(personaje.getTags(), "Subclase");
		return subclaseTag != null && TagUtils.normalizeText(subclaseTag).equals("embaucadorarcano");
	}

	private boolean tieneCaballeroArcano(Personaje personaje) {
		String subclaseTag = TagUtils.extractTagValue(personaje.getTags(), "Subclase");
		return subclaseTag != null && TagUtils.normalizeText(subclaseTag).equals("caballeroarcano");
	}

	private void acumularEspaciosEmbaucadorArcano(Map<Integer, Integer> slots, int picaroLevel) {
		dndInfoService.obtenerSubclasesClase("picaro").stream()
				.filter(s -> TagUtils.normalizeText(s.id()).equals("embaucadorarcano"))
				.findFirst()
				.flatMap(ea -> ea.tablas().stream().findFirst())
				.ifPresent(tabla -> acumularRanurasDesdeTabla(slots, tabla.filas(), picaroLevel));
	}

	private void acumularEspaciosCaballeroArcano(Map<Integer, Integer> slots, int fighterLevel) {
		dndInfoService.obtenerSubclasesClase("guerrero").stream()
				.filter(s -> TagUtils.normalizeText(s.id()).equals("caballeroarcano"))
				.findFirst()
				.flatMap(ek -> ek.tablas().stream().findFirst())
				.ifPresent(tabla -> acumularRanurasDesdeTabla(slots, tabla.filas(), fighterLevel));
	}

	private void acumularRanurasDesdeTabla(Map<Integer, Integer> slots, List<List<String>> filas, int classLevel) {
		filas.stream()
				.filter(fila -> fila.size() >= 7 && fila.getFirst().trim().equals(String.valueOf(classLevel)))
				.findFirst()
				.ifPresent(fila -> {
					for (int i = 3; i <= 6; i++) {
						String value = fila.get(i).trim();
						if (!"-".equals(value)) {
							try {
								int count = Integer.parseInt(value);
								if (count > 0) {
									slots.merge(i - 2, count, Integer::sum);
								}
							} catch (NumberFormatException ignored) {
								// non-numeric cell, skip
							}
						}
					}
				});
	}
}