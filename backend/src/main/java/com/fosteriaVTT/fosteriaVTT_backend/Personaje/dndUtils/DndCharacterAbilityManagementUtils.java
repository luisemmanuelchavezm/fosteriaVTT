package com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils;

import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.HabilidadRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.PersonajeRepository;
import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import com.fosteriaVTT.fosteriaVTT_backend.common.dnd.DndCharacterRules;
import com.fosteriaVTT.fosteriaVTT_backend.common.dnd.DndPatterns;
import com.fosteriaVTT.fosteriaVTT_backend.dto.SeleccionDoteRequest;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class DndCharacterAbilityManagementUtils {

	private final HabilidadRepository habilidadRepository;
	private final PersonajeRepository personajeRepository;
	private final DndAbilityUtils dndAbilityUtils;

	public DndCharacterAbilityManagementUtils(
			HabilidadRepository habilidadRepository,
			PersonajeRepository personajeRepository,
			DndAbilityUtils dndAbilityUtils
	) {
		this.habilidadRepository = habilidadRepository;
		this.personajeRepository = personajeRepository;
		this.dndAbilityUtils = dndAbilityUtils;
	}

	public void agregarHabilidadManual(Personaje personaje, Long habilidadId) {
		Habilidad habilidad = habilidadRepository.findById(habilidadId)
				.orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "No se encontró la habilidad seleccionada"));
		if (!DndCharacterCheckers.esHechizoOTruco(habilidad)) {
			throw new ResponseStatusException(BAD_REQUEST, "Solo se pueden añadir conjuros o trucos desde este flujo");
		}
		if (agregarHabilidadAPersonaje(personaje, habilidad)) {
			personajeRepository.save(personaje);
		}
	}

	public void agregarRasgoClaseMB(Personaje personaje, Long habilidadId) {
		Habilidad habilidad = habilidadRepository.findById(habilidadId)
				.orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "No se encontró el rasgo de clase"));
		if (agregarHabilidadAPersonaje(personaje, habilidad)) {
			personajeRepository.save(personaje);
		}
	}

	public void crearRasgoCustomMB(Personaje personaje, String nombre, String descripcion) {
		Habilidad habilidad = Habilidad.builder()
				.nombre(nombre)
				.descripcion(descripcion)
				.tags("MORK_BORG,MorkBorgCustom")
				.build();
		habilidadRepository.save(habilidad);
		agregarHabilidadAPersonaje(personaje, habilidad);
		personajeRepository.save(personaje);
	}

	public void intercambiarEscoriaEspecialidad(Personaje personaje, List<Long> habilidadesAEliminar, List<Integer> nuevosIdxs) {
		// Quitar las especialidades anteriores
		if (habilidadesAEliminar != null) {
			for (Long id : habilidadesAEliminar) {
				personaje.getHabilidades().removeIf(h -> h.getId().equals(id));
			}
		}
		// Añadir las nuevas
		if (nuevosIdxs != null) {
			for (Integer idx : nuevosIdxs) {
				String tagBusqueda = "EscEspecialidadIdx;" + idx;
				habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc(tagBusqueda)
						.stream().findFirst()
						.ifPresent(h -> agregarHabilidadAPersonaje(personaje, h));
			}
		}
		personajeRepository.save(personaje);
	}

	public void eliminarHabilidadManual(Personaje personaje, Long habilidadId) {
		boolean eliminada = personaje.getHabilidades().removeIf(item -> item.getId().equals(habilidadId));
		if (!eliminada) {
			throw new ResponseStatusException(BAD_REQUEST, "No se encontró la habilidad en el personaje");
		}
		personajeRepository.save(personaje);
	}

	public void aplicarDoteSeleccionada(Personaje personaje, Map<String, Integer> baseStats, SeleccionDoteRequest featSelection) {
		if (featSelection == null || featSelection.nombre() == null || featSelection.nombre().isBlank()) {
			throw new ResponseStatusException(BAD_REQUEST, "Debes seleccionar una dote");
		}

		Habilidad feat = resolverOCrearHabilidadDote(featSelection.nombre(), featSelection.descripcion(), featSelection.formula(), "DND,DOTE");
		agregarHabilidadAPersonaje(personaje, feat);

		for (Map.Entry<String, Integer> entry : DndCharacterRules.safeMap(featSelection.bonificacionesCaracteristica()).entrySet()) {
			String statName = entry.getKey();
			Integer amount = entry.getValue();
			if (statName == null || amount == null) {
				continue;
			}
			baseStats.put(statName, baseStats.getOrDefault(statName, 10) + amount);
		}

		agregarCompetenciasDeDote(personaje, featSelection.competencias());
		agregarHabilidadesDeDote(personaje, featSelection.habilidades());
		agregarIdiomasDeDote(personaje, featSelection.idiomas());
		agregarConjurosDeDote(personaje, featSelection.conjuros());
	}

	public Map<String, Integer> deserializarBonificacionesDote(String rawBonuses) {
		Map<String, Integer> result = new LinkedHashMap<>();
		if (rawBonuses == null || rawBonuses.isBlank()) {
			return result;
		}

		for (String rawEntry : rawBonuses.split(",")) {
			String entry = rawEntry.trim();
			if (entry.isBlank()) {
				continue;
			}

			String[] pair = entry.split(":", 2);
			if (pair.length != 2) {
				continue;
			}

			try {
				result.put(java.net.URLDecoder.decode(pair[0], java.nio.charset.StandardCharsets.UTF_8), Integer.parseInt(pair[1].trim()));
			} catch (NumberFormatException ignored) {
			}
		}
		return result;
	}

	private void agregarCompetenciasDeDote(Personaje personaje, List<String> competencias) {
		for (String competencia : new LinkedHashSet<>(competencias == null ? List.of() : competencias)) {
			String limpia = TagUtils.cleanValue(competencia);
			if (!limpia.isBlank()) {
				agregarHabilidadAPersonaje(personaje, dndAbilityUtils.resolverORegistrarHabilidad(DndPatterns.FEAT_COMPETENCY_PREFIX + limpia, "Competencia otorgada por una dote", null, "DND,DOTE,COMPETENCIA"));
			}
		}
	}

	private void agregarHabilidadesDeDote(Personaje personaje, List<String> habilidades) {
		for (String habilidad : new LinkedHashSet<>(habilidades == null ? List.of() : habilidades)) {
			String limpia = DndCharacterRules.normalizeCanonicalSkill(habilidad).orElse("");
			if (!limpia.isBlank()) {
				agregarHabilidadAPersonaje(personaje, dndAbilityUtils.resolverORegistrarHabilidad(DndPatterns.FEAT_COMPETENCY_PREFIX + limpia, "Competencia en habilidad otorgada por una dote", null, "DND,DOTE,COMPETENCIA"));
			}
		}
	}

	private void agregarIdiomasDeDote(Personaje personaje, List<String> idiomas) {
		for (String idioma : new LinkedHashSet<>(idiomas == null ? List.of() : idiomas)) {
			String limpio = DndCharacterRules.normalizeLanguage(idioma).orElse("");
			if (!limpio.isBlank()) {
				agregarHabilidadAPersonaje(personaje, dndAbilityUtils.resolverORegistrarHabilidad(DndPatterns.FEAT_LANGUAGE_PREFIX + limpio, "Idioma otorgado por una dote", null, "DND,DOTE,IDIOMA"));
			}
		}
	}

	private void agregarConjurosDeDote(Personaje personaje, List<String> conjuros) {
		for (String conjuro : new LinkedHashSet<>(conjuros == null ? List.of() : conjuros)) {
			String limpio = TagUtils.cleanValue(conjuro);
			if (limpio.isBlank()) {
				continue;
			}
			Habilidad conjuroBase = dndAbilityUtils.resolverHechizoPorNombre(limpio)
					.orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "El conjuro seleccionado para la dote no existe"));
			agregarHabilidadAPersonaje(personaje, resolverOCrearHabilidadDote(conjuroBase.getNombre(), conjuroBase.getDescripcion(), conjuroBase.getFormula(), TagUtils.mergeTags(conjuroBase.getTags(), "DND,DOTE,CONJURO")));
		}
	}

	private Habilidad resolverOCrearHabilidadDote(String nombre, String descripcion, String formula, String tags) {
		String nombreLimpio = DndCharacterRules.requireText(nombre, "La habilidad generada por una dote no tiene nombre");
		return habilidadRepository.findByNombreIgnoreCaseOrderByIdAsc(nombreLimpio).stream()
				.filter(habilidad -> TagUtils.normalizeText(habilidad.getTags()).contains(TagUtils.normalizeText("DND,DOTE")))
				.findFirst()
				.orElseGet(() -> habilidadRepository.save(Habilidad.builder().nombre(nombreLimpio).descripcion(descripcion).formula(formula).tags(tags).build()));
	}

	private boolean agregarHabilidadAPersonaje(Personaje personaje, Habilidad habilidad) {
		boolean alreadyPresent = personaje.getHabilidades().stream().anyMatch(item -> item.getId().equals(habilidad.getId()));
		if (alreadyPresent) {
			return false;
		}
		personaje.getHabilidades().add(habilidad);
		return true;
	}
}