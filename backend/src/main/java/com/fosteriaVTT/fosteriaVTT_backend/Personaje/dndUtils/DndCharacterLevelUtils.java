package com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils;

import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.EstadisticaService;
import com.fosteriaVTT.fosteriaVTT_backend.InformacionDnd.DndInfoService;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.PersonajeRepository;
import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import com.fosteriaVTT.fosteriaVTT_backend.common.dnd.DndCharacterRules;
import com.fosteriaVTT.fosteriaVTT_backend.common.dnd.DndCharacterValidationUtils;
import com.fosteriaVTT.fosteriaVTT_backend.dto.BajarNivelPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndSubclaseResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.SubirNivelPersonajeRequest;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class DndCharacterLevelUtils {

	private final PersonajeRepository personajeRepository;
	private final DndInfoService dndInfoService;
	private final EstadisticaService estadisticaService;
	private final DndAbilityUtils dndAbilityUtils;
	private final DndCharacterStatsUtils dndCharacterStatsUtils;
	private final DndCharacterProgressionUtils dndCharacterProgressionUtils;

	public DndCharacterLevelUtils(
			PersonajeRepository personajeRepository,
			DndInfoService dndInfoService,
			EstadisticaService estadisticaService,
			DndAbilityUtils dndAbilityUtils,
			DndCharacterStatsUtils dndCharacterStatsUtils,
			DndCharacterProgressionUtils dndCharacterProgressionUtils
	) {
		this.personajeRepository = personajeRepository;
		this.dndInfoService = dndInfoService;
		this.estadisticaService = estadisticaService;
		this.dndAbilityUtils = dndAbilityUtils;
		this.dndCharacterStatsUtils = dndCharacterStatsUtils;
		this.dndCharacterProgressionUtils = dndCharacterProgressionUtils;
	}

	public void subirNivel(Long personajeId, SubirNivelPersonajeRequest request, String username) {
		LevelChangeContext context = prepararSubidaNivel(personajeId, request, username);
		aplicarCambiosSubidaNivel(context);
		persistirSubidaNivel(context);
	}

	public void bajarNivel(Long personajeId, BajarNivelPersonajeRequest request, String username) {
		LevelChangeContext context = prepararBajadaNivel(personajeId, request, username);
		aplicarCambiosBajadaNivel(context);
		persistirBajadaNivel(context);
	}

	private LevelChangeContext prepararSubidaNivel(Long personajeId, SubirNivelPersonajeRequest request, String username) {
		validarCambioNivel(request == null ? null : request.claseId(), "subir");
		Personaje personaje = obtenerPersonajeUsuario(personajeId, username);
		int totalLevelActual = dndCharacterStatsUtils.resolverNivelTotalPersonaje(personaje);
		if (totalLevelActual >= 20) {
			throw new ResponseStatusException(BAD_REQUEST, "El personaje ya ha alcanzado el nivel máximo");
		}

		ClaseDndDetalleResponse classDetail = obtenerClase(request.claseId(), "Debes seleccionar una clase para subir de nivel");
		Map<String, Integer> classLevelsById = dndCharacterStatsUtils.resolverClasesPorId(personaje);
		int currentLevel = classLevelsById.getOrDefault(TagUtils.normalizeText(request.claseId()), 0);
		int targetLevel = currentLevel + 1;
		boolean isNewClass = currentLevel == 0;
		ClaseDndSubclaseResponse activeSubclass = dndCharacterProgressionUtils.resolverSubclaseParaProgresion(personaje, classDetail, request.subclaseId(), targetLevel, isNewClass);
		if (isNewClass) {
			DndCharacterValidationUtils.validateClassChoices(classDetail, DndCharacterRules.safeMap(request.eleccionesClase()), List.of());
		}

		Map<String, Integer> updatedBaseStats = new LinkedHashMap<>(estadisticaService.obtenerValoresPorPersonajeId(personajeId));
		Map<Integer, Integer> spellSlots = dndCharacterStatsUtils.resolverEspaciosDeConjuroTrasCambio(personaje, classDetail, targetLevel, activeSubclass);
		return new LevelChangeContext(personaje, classDetail, activeSubclass, request, currentLevel, targetLevel, totalLevelActual, updatedBaseStats, spellSlots, isNewClass);
	}

	private void aplicarCambiosSubidaNivel(LevelChangeContext context) {
		dndCharacterStatsUtils.aplicarMejoraDeCaracteristicaSiCorresponde(context.personaje(), context.classDetail().id(), context.targetLevel(), context.updatedBaseStats(), context.request());
		context.personaje().setTags(TagUtils.updateClassTags(
				context.personaje().getTags(),
				context.classDetail().nombre(),
				context.targetLevel(),
				context.activeSubclass() == null ? null : context.activeSubclass().nombre()
		));
		dndAbilityUtils.agregarHabilidadesDeClasePorNivel(context.personaje(), context.classDetail(), context.activeSubclass(), context.targetLevel(), context.request().eleccionesClase(), context.isNewClass());
		dndAbilityUtils.sincronizarMagiaRacialPorNivel(context.personaje(), dndCharacterStatsUtils.resolverRazaActual(context.personaje()), context.totalLevelActual() + 1);
	}

	private void persistirSubidaNivel(LevelChangeContext context) {
		personajeRepository.save(context.personaje());
		estadisticaService.aplicarSubidaNivel(
				context.personaje(),
				context.updatedBaseStats(),
				context.classDetail().puntosGolpe().dadoGolpe(),
				calcularCambioPuntosGolpe(context.updatedBaseStats(), context.classDetail()),
				context.spellSlots(),
				context.totalLevelActual() + 1
		);
	}

	private LevelChangeContext prepararBajadaNivel(Long personajeId, BajarNivelPersonajeRequest request, String username) {
		validarCambioNivel(request == null ? null : request.claseId(), "bajar");
		Personaje personaje = obtenerPersonajeUsuario(personajeId, username);
		ClaseDndDetalleResponse classDetail = obtenerClase(request.claseId(), "Debes seleccionar una clase para bajar de nivel");
		Map<String, Integer> classLevelsById = dndCharacterStatsUtils.resolverClasesPorId(personaje);
		int currentLevel = classLevelsById.getOrDefault(TagUtils.normalizeText(classDetail.id()), 0);
		if (currentLevel <= 0) {
			throw new ResponseStatusException(BAD_REQUEST, "El personaje no tiene niveles en esa clase");
		}

		int targetLevel = currentLevel - 1;
		Map<String, Integer> updatedBaseStats = new LinkedHashMap<>(estadisticaService.obtenerValoresPorPersonajeId(personajeId));
		ClaseDndSubclaseResponse activeSubclass = dndCharacterProgressionUtils.resolverSubclaseActual(personaje, classDetail);
		Map<Integer, Integer> spellSlots = dndCharacterStatsUtils.resolverEspaciosDeConjuroTrasCambio(personaje, classDetail, targetLevel, activeSubclass);
		return new LevelChangeContext(personaje, classDetail, activeSubclass, new SubirNivelPersonajeRequest(request.claseId(), null, null, null, null, null, null), currentLevel, targetLevel, dndCharacterStatsUtils.resolverNivelTotalPersonaje(personaje), updatedBaseStats, spellSlots, false);
	}

	private void aplicarCambiosBajadaNivel(LevelChangeContext context) {
		dndCharacterProgressionUtils.revertirProgresionRegistradaSiCorresponde(context.personaje(), context.classDetail(), context.currentLevel(), context.updatedBaseStats());
		dndAbilityUtils.removerHabilidadesDeClasePorNivel(context.personaje(), context.classDetail(), context.activeSubclass(), context.currentLevel());
		dndAbilityUtils.sincronizarMagiaRacialPorNivel(context.personaje(), dndCharacterStatsUtils.resolverRazaActual(context.personaje()), Math.max(1, context.totalLevelActual() - 1));
		context.personaje().setTags(TagUtils.updateClassTagsAfterLevelDown(
				context.personaje().getTags(),
				context.classDetail().nombre(),
				context.targetLevel(),
				context.activeSubclass() == null ? null : context.activeSubclass().nombre(),
				context.activeSubclass() == null ? null : context.activeSubclass().nivelDesbloqueo()
		));
	}

	private void persistirBajadaNivel(LevelChangeContext context) {
		personajeRepository.save(context.personaje());
		estadisticaService.aplicarBajadaNivel(
				context.personaje(),
				context.updatedBaseStats(),
				context.classDetail().puntosGolpe().dadoGolpe(),
				Math.max(1, dndCharacterStatsUtils.resolverNivelTotalPersonaje(context.personaje())),
				context.spellSlots(),
				calcularCambioPuntosGolpe(context.updatedBaseStats(), context.classDetail())
		);
	}

	private ClaseDndDetalleResponse obtenerClase(String claseId, String mensajeSiFalta) {
		return dndInfoService.obtenerClasePorId(DndCharacterRules.requireText(claseId, mensajeSiFalta))
				.orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "La clase seleccionada no existe"));
	}

	private Personaje obtenerPersonajeUsuario(Long personajeId, String username) {
		return personajeRepository.findByIdAndUsuarioUsername(personajeId, username)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Personaje no encontrado"));
	}

	private void validarCambioNivel(String claseId, String accion) {
		if (claseId == null || claseId.isBlank()) {
			throw new ResponseStatusException(BAD_REQUEST, "Debes seleccionar una clase para " + accion + " de nivel");
		}
	}

	private int calcularCambioPuntosGolpe(Map<String, Integer> updatedBaseStats, ClaseDndDetalleResponse classDetail) {
		int constitutionModifier = DndCharacterRules.calculateModifier(updatedBaseStats.getOrDefault("Constitucion", 10));
		return Math.max(1, (DndCharacterRules.extractHitDieMax(classDetail.puntosGolpe().dadoGolpe()) / 2) + 1 + constitutionModifier);
	}

	private record LevelChangeContext(
			Personaje personaje,
			ClaseDndDetalleResponse classDetail,
			ClaseDndSubclaseResponse activeSubclass,
			SubirNivelPersonajeRequest request,
			int currentLevel,
			int targetLevel,
			int totalLevelActual,
			Map<String, Integer> updatedBaseStats,
			Map<Integer, Integer> spellSlots,
			boolean isNewClass
	) {}
}