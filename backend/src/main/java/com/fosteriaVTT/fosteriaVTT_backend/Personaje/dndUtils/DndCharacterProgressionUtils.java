package com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils;

import com.fosteriaVTT.fosteriaVTT_backend.Chat.ChatService;
import com.fosteriaVTT.fosteriaVTT_backend.InformacionDnd.DndSubclassService;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import com.fosteriaVTT.fosteriaVTT_backend.common.dnd.DndPatterns;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CatalogoDndEleccion;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndSubclaseResponse;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class DndCharacterProgressionUtils {

	private final ChatService chatService;
	private final DndAbilityUtils dndAbilityUtils;
	private final DndCharacterAbilityManagementUtils dndCharacterAbilityManagementUtils;
	private final DndSubclassService dndSubclassService;

	public DndCharacterProgressionUtils(
			ChatService chatService,
			DndAbilityUtils dndAbilityUtils,
			DndCharacterAbilityManagementUtils dndCharacterAbilityManagementUtils,
			DndSubclassService dndSubclassService
	) {
		this.chatService = chatService;
		this.dndAbilityUtils = dndAbilityUtils;
		this.dndCharacterAbilityManagementUtils = dndCharacterAbilityManagementUtils;
		this.dndSubclassService = dndSubclassService;
	}

	public ClaseDndSubclaseResponse resolverSubclaseInicial(ClaseDndDetalleResponse clase, String subclaseId) {
		List<ClaseDndSubclaseResponse> subclasesDisponibles = clase.subclases() == null ? List.of() : clase.subclases();
		boolean requiereSubclaseInicial = subclasesDisponibles.stream().anyMatch(item -> item.nivelDesbloqueo() <= 1);

		if (subclaseId == null || subclaseId.isBlank()) {
			if (requiereSubclaseInicial) {
				throw new ResponseStatusException(BAD_REQUEST, "Debes seleccionar una subclase inicial");
			}
			return null;
		}

		ClaseDndSubclaseResponse subclase = dndSubclassService.buscarSubclase(clase.id(), subclaseId)
				.or(() -> subclasesDisponibles.stream()
						.filter(item -> TagUtils.normalizeText(item.id()).equals(TagUtils.normalizeText(subclaseId))
								|| TagUtils.normalizeText(item.nombre()).equals(TagUtils.normalizeText(subclaseId)))
						.findFirst())
				.orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "La subclase seleccionada no existe para esta clase"));

		if (subclase.nivelDesbloqueo() > 1) {
			throw new ResponseStatusException(BAD_REQUEST, "La subclase seleccionada no está disponible al nivel 1");
		}

		return subclase;
	}

	public ClaseDndSubclaseResponse resolverSubclaseParaProgresion(
			Personaje personaje,
			ClaseDndDetalleResponse clase,
			String requestedSubclassId,
			int targetLevel,
			boolean isNewClass
	) {
		ClaseDndSubclaseResponse currentSubclass = resolverSubclaseActual(personaje, clase);
		if (currentSubclass != null) {
			return currentSubclass;
		}

		List<ClaseDndSubclaseResponse> availableSubclasses = clase.subclases() == null ? List.of() : clase.subclases();
		boolean requiresSubclass = availableSubclasses.stream().anyMatch(item -> item.nivelDesbloqueo() <= targetLevel);
		if (!requiresSubclass && !isNewClass) {
			return null;
		}
		if (requestedSubclassId == null || requestedSubclassId.isBlank()) {
			if (requiresSubclass) {
				throw new ResponseStatusException(BAD_REQUEST, "Debes seleccionar una subclase para esta subida de nivel");
			}
			return null;
		}

		ClaseDndSubclaseResponse subclass = dndSubclassService.buscarSubclase(clase.id(), requestedSubclassId)
				.or(() -> availableSubclasses.stream()
						.filter(item -> TagUtils.normalizeText(item.id()).equals(TagUtils.normalizeText(requestedSubclassId))
								|| TagUtils.normalizeText(item.nombre()).equals(TagUtils.normalizeText(requestedSubclassId)))
						.findFirst())
				.orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "La subclase seleccionada no existe para esta clase"));

		if (subclass.nivelDesbloqueo() > targetLevel) {
			throw new ResponseStatusException(BAD_REQUEST, "La subclase seleccionada todavía no está disponible");
		}

		return subclass;
	}

	public ClaseDndSubclaseResponse resolverSubclaseActual(Personaje personaje, ClaseDndDetalleResponse clase) {
		List<ClaseDndSubclaseResponse> availableSubclasses = clase.subclases() == null ? List.of() : clase.subclases();
		for (ClaseDndSubclaseResponse subclass : availableSubclasses) {
			boolean matchesAbility = personaje.getHabilidades().stream()
					.anyMatch(habilidad -> DndCharacterCheckers.contieneSubclase(habilidad.getTags(), subclass));
			if (matchesAbility) {
				return subclass;
			}
		}

		String tagValue = TagUtils.extractTagValue(personaje.getTags(), "Subclase");
		if (tagValue == null) {
			return null;
		}

		return availableSubclasses.stream()
				.filter(item -> TagUtils.normalizeText(item.nombre()).equals(TagUtils.normalizeText(tagValue)))
				.findFirst()
				.orElse(null);
	}

	public void revertirProgresionRegistradaSiCorresponde(
			Personaje personaje,
			ClaseDndDetalleResponse classDetail,
			int currentLevel,
			Map<String, Integer> baseStats
	) {
		Map<String, String> detalle = chatService.obtenerUltimoRegistroInterno(personaje, classDetail.id(), currentLevel).orElse(null);
		if (classDetail == null || detalle == null || detalle.isEmpty()) {
			return;
		}

		revertirEleccionesClaseRegistradas(personaje, classDetail, detalle);

		String mode = TagUtils.normalizeText(detalle.get("modoMejoraCaracteristica"));
		switch (mode) {
			case "una", "unsoloatributo", "single", "dosenuna" -> DndCharacterStatsUtils.decrementarCaracteristica(baseStats, detalle.get("caracteristicaPrimaria"), 2);
			case "dos", "double", "dosatributos" -> {
				DndCharacterStatsUtils.decrementarCaracteristica(baseStats, detalle.get("caracteristicaPrimaria"), 1);
				DndCharacterStatsUtils.decrementarCaracteristica(baseStats, detalle.get("caracteristicaSecundaria"), 1);
			}
			case "dote", "feat" -> revertirDoteRegistrada(personaje, baseStats, detalle);
			default -> {
			}
		}
	}

	private void revertirEleccionesClaseRegistradas(
			Personaje personaje,
			ClaseDndDetalleResponse classDetail,
			Map<String, String> detalle
	) {
		Map<String, List<String>> eleccionesRegistradas = DndCharacterNormalizers.deserializarEleccionesClase(detalle.get("eleccionesClase"));
		if (eleccionesRegistradas.isEmpty() || classDetail.elecciones() == null || classDetail.elecciones().isEmpty()) {
			return;
		}

		for (CatalogoDndEleccion eleccion : classDetail.elecciones()) {
			List<String> valoresSeleccionados = eleccionesRegistradas.getOrDefault(eleccion.id(), List.of());
			if (valoresSeleccionados.isEmpty()) {
				continue;
			}

			for (String valor : valoresSeleccionados) {
				if (valor == null || valor.isBlank()) {
					continue;
				}

				dndAbilityUtils.resolverHechizoPorNombre(valor).ifPresentOrElse(
						hechizo -> personaje.getHabilidades().removeIf(habilidad ->
								TagUtils.normalizeText(habilidad.getNombre()).equals(TagUtils.normalizeText(hechizo.getNombre()))),
						() -> {
							String nombreHabilidad = DndCharacterNormalizers.nombreHabilidadDesdeEleccion(eleccion.catalogo(), eleccion.etiqueta(), valor);
							personaje.getHabilidades().removeIf(habilidad ->
									TagUtils.normalizeText(habilidad.getNombre()).equals(TagUtils.normalizeText(nombreHabilidad))
										&& TagUtils.normalizeText(habilidad.getTags()).contains(TagUtils.normalizeText("DND,CLASE")));
						}
				);
			}
		}
	}

	private void revertirDoteRegistrada(Personaje personaje, Map<String, Integer> baseStats, Map<String, String> detalle) {
		String featName = detalle.getOrDefault("doteNombre", "").trim();
		if (!featName.isBlank()) {
			personaje.getHabilidades().removeIf(habilidad ->
					TagUtils.normalizeText(habilidad.getNombre()).equals(TagUtils.normalizeText(featName))
							&& TagUtils.normalizeText(habilidad.getTags()).contains(TagUtils.normalizeText("DND,DOTE")));
		}

		eliminarHabilidadesDeDote(personaje, DndCharacterNormalizers.deserializarLista(detalle.get("competenciasDote")), DndPatterns.FEAT_COMPETENCY_PREFIX, "(?i)^Competencia dote:\\s*");
		eliminarHabilidadesDeDote(personaje, DndCharacterNormalizers.deserializarLista(detalle.get("habilidadesDote")), DndPatterns.FEAT_COMPETENCY_PREFIX, "(?i)^Competencia dote:\\s*");
		eliminarHabilidadesDeDote(personaje, DndCharacterNormalizers.deserializarLista(detalle.get("idiomasDote")), DndPatterns.FEAT_LANGUAGE_PREFIX, "(?i)^Idioma dote:\\s*");

		Set<String> conjurosDote = new LinkedHashSet<>(DndCharacterNormalizers.deserializarLista(detalle.get("conjurosDote")));
		if (!conjurosDote.isEmpty()) {
			personaje.getHabilidades().removeIf(habilidad ->
					conjurosDote.stream().anyMatch(conjuro -> TagUtils.normalizeText(conjuro).equals(TagUtils.normalizeText(habilidad.getNombre())))
							&& TagUtils.normalizeText(habilidad.getTags()).contains(TagUtils.normalizeText("DND,DOTE,CONJURO")));
		}

		for (Map.Entry<String, Integer> entry : dndCharacterAbilityManagementUtils.deserializarBonificacionesDote(detalle.get("bonificacionesCaracteristica")).entrySet()) {
			DndCharacterStatsUtils.decrementarCaracteristica(baseStats, entry.getKey(), entry.getValue());
		}
	}

	private void eliminarHabilidadesDeDote(Personaje personaje, List<String> valores, String prefijo, String patron) {
		Set<String> normalizados = new LinkedHashSet<>(valores);
		if (normalizados.isEmpty()) {
			return;
		}

		personaje.getHabilidades().removeIf(habilidad -> {
			String nombre = TagUtils.cleanValue(habilidad.getNombre());
			if (!TagUtils.normalizeText(nombre).startsWith(TagUtils.normalizeText(prefijo))) {
				return false;
			}
			String valor = nombre.replaceFirst(patron, "").trim();
			return normalizados.stream().anyMatch(item -> TagUtils.normalizeText(item).equals(TagUtils.normalizeText(valor)));
		});
	}
}