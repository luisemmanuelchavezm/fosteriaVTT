package com.fosteriaVTT.fosteriaVTT_backend.Personaje;

import com.fosteriaVTT.fosteriaVTT_backend.Chat.ChatRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Cloudinary.CloudinaryService;
import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.EstadisticaService;
import com.fosteriaVTT.fosteriaVTT_backend.Mochila.MochilaService;
import com.fosteriaVTT.fosteriaVTT_backend.common.dnd.DndCharacterRules;
import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils.DndAbilityUtils;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils.DndCharacterAbilityManagementUtils;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils.DndCharacterCreationUtils;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils.DndCharacterNormalizers;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils.DndCharacterLevelUtils;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils.DndCharacterStatsUtils;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils.DndCombatUtils;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.mbUtils.MorkBorgCharacterCreationUtils;
import com.fosteriaVTT.fosteriaVTT_backend.dto.morkborg.CrearPersonajeMorkBorgRequest;
import com.fosteriaVTT.fosteriaVTT_backend.Posicion.Posicion;
import com.fosteriaVTT.fosteriaVTT_backend.Posicion.PosicionRepository;
import com.fosteriaVTT.fosteriaVTT_backend.dto.WebSocketPosicionEventDTO;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarRecursosPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarHojaPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarExperienciaPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.AgregarHabilidadPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.AgregarItemMochilaRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarItemMochilaRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.BajarNivelPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CrearPersonajeDndRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PagedResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PersonajeDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PersonajeResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.SubirNivelPersonajeRequest;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class PersonajeService {

	private final PersonajeRepository personajeRepository;
	private final EstadisticaService estadisticaService;
	private final MochilaService mochilaService;
	private final CloudinaryService cloudinaryService;
	private final DndAbilityUtils dndAbilityUtils;
	private final DndCharacterAbilityManagementUtils dndCharacterAbilityManagementUtils;
	private final DndCombatUtils dndCombatUtils;
	private final DndCharacterStatsUtils dndCharacterStatsUtils;
	private final DndCharacterCreationUtils dndCharacterCreationUtils;
	private final DndCharacterLevelUtils dndCharacterLevelUtils;
	private final MorkBorgCharacterCreationUtils morkBorgCharacterCreationUtils;
	private final PosicionRepository posicionRepository;
	private final ChatRepository chatRepository;
	private final SimpMessagingTemplate messagingTemplate;
	private final PersonajeDetailBuilder personajeDetailBuilder;

	public PersonajeService(
			PersonajeRepository personajeRepository,
			EstadisticaService estadisticaService,
			MochilaService mochilaService,
			CloudinaryService cloudinaryService,
			DndAbilityUtils dndAbilityUtils,
			DndCharacterAbilityManagementUtils dndCharacterAbilityManagementUtils,
			DndCombatUtils dndCombatUtils,
			DndCharacterStatsUtils dndCharacterStatsUtils,
			DndCharacterCreationUtils dndCharacterCreationUtils,
			DndCharacterLevelUtils dndCharacterLevelUtils,
			MorkBorgCharacterCreationUtils morkBorgCharacterCreationUtils,
			PosicionRepository posicionRepository,
			ChatRepository chatRepository,
			SimpMessagingTemplate messagingTemplate,
			PersonajeDetailBuilder personajeDetailBuilder
	) {
		this.personajeRepository = personajeRepository;
		this.estadisticaService = estadisticaService;
		this.mochilaService = mochilaService;
		this.cloudinaryService = cloudinaryService;
		this.dndAbilityUtils = dndAbilityUtils;
		this.dndCharacterAbilityManagementUtils = dndCharacterAbilityManagementUtils;
		this.dndCombatUtils = dndCombatUtils;
		this.dndCharacterStatsUtils = dndCharacterStatsUtils;
		this.dndCharacterCreationUtils = dndCharacterCreationUtils;
		this.dndCharacterLevelUtils = dndCharacterLevelUtils;
		this.morkBorgCharacterCreationUtils = morkBorgCharacterCreationUtils;
		this.posicionRepository = posicionRepository;
		this.chatRepository = chatRepository;
		this.messagingTemplate = messagingTemplate;
		this.personajeDetailBuilder = personajeDetailBuilder;
	}

	// ─────────────────────────────────────────────
	// Consulta
	// ─────────────────────────────────────────────

	@Transactional(readOnly = true)
	public PersonajeDetalleResponse obtenerDetallePersonaje(Long personajeId, String username) {
		Personaje personaje = personajeRepository.findById(personajeId)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Personaje no encontrado"));
		Map<String, Integer> estadisticas = estadisticaService.obtenerValoresPorPersonajeId(personajeId);
		String tipo = tipoFromTags(personaje.getTags());

		if (esEnemigo(personaje)) {
			return personajeDetailBuilder.buildDetalleEnemigo(personaje, estadisticas, tipo, personajeId);
		}

		return personajeDetailBuilder.buildDetallePersonaje(personaje, estadisticas, tipo, personajeId);
	}

	@Transactional(readOnly = true)
	public PagedResponse<PersonajeResumenResponse> obtenerPersonajesOrdenadosPorUso(
			String username,
			String nombre,
			List<String> sistemas,
			boolean incluirTodos,
			int page,
			int size
	) {
		String nombreNormalizado = DndCharacterNormalizers.normalizarFiltroTexto(nombre);
		List<SistemaDeJuego> sistemasNormalizados = sistemas == null ? List.of() : sistemas.stream()
				.map(SistemaDeJuego::fromValue)
				.flatMap(java.util.Optional::stream)
				.toList();
		Page<Personaje> resultPage = personajeRepository.buscarPorFiltros(
				username,
				nombreNormalizado,
				sistemasNormalizados,
				sistemasNormalizados.isEmpty(),
				incluirTodos,
				PageRequest.of(Math.max(page, 0), Math.max(size, 1))
		);

		return new PagedResponse<>(
				resultPage.getContent().stream()
						.filter(personaje -> !esInstancia(personaje.getTags()))
						.map(this::toResumen)
						.toList(),
				resultPage.hasNext()
		);
	}

	// ─────────────────────────────────────────────
	// Creación de personaje jugador
	// ─────────────────────────────────────────────

	@Transactional
	public PersonajeResumenResponse crearPersonajeDnd(
			CrearPersonajeDndRequest request,
			MultipartFile portrait,
			String username
	) {
		MultipartFile retrato = validarRetrato(portrait);
		return dndCharacterCreationUtils.crearPersonajeDnd(request, subirRetrato(retrato), username);
	}

	@Transactional
	public PersonajeResumenResponse crearPersonajeMorkBorg(
			CrearPersonajeMorkBorgRequest request,
			MultipartFile portrait,
			String username
	) {
		MultipartFile retrato = validarRetrato(portrait);
		return morkBorgCharacterCreationUtils.crearPersonajeMorkBorg(request, subirRetrato(retrato), username);
	}

	// ─────────────────────────────────────────────
	// Actualización de uso y recursos
	// ─────────────────────────────────────────────

	@Transactional
	public void marcarComoUsado(Long personajeId, String username) {
		Personaje personaje = obtenerPersonajeUsuario(personajeId, username);
		personaje.setUsado(LocalDateTime.now());
		personajeRepository.save(personaje);
	}

	@Transactional
	public void actualizarRecursos(
			Long personajeId,
			ActualizarRecursosPersonajeRequest request,
			String username
	) {
		if (request == null) {
			throw new ResponseStatusException(BAD_REQUEST, "No se recibió la actualización de recursos");
		}

		Personaje personaje = obtenerPersonajeUsuario(personajeId, username);

		estadisticaService.actualizarRecursosPersonaje(
				personaje,
				request.vidaActual(),
				request.vidaTemporal(),
				request.espaciosConjuroActuales(),
				request.recursosExtraActuales()
		);
		mochilaService.actualizarDineroPersonaje(personaje, request.dinero());
		emitirActualizacionPersonaje(personajeId);
	}

	// ─────────────────────────────────────────────
	// Edición de hoja
	// ─────────────────────────────────────────────

	@Transactional
	public PersonajeDetalleResponse actualizarHojaPersonaje(
			Long personajeId,
			ActualizarHojaPersonajeRequest request,
			String username
	) {
		if (request == null) {
			throw new ResponseStatusException(BAD_REQUEST, "No se recibió la edición del personaje");
		}

		Personaje personaje = obtenerPersonajeUsuario(personajeId, username);
		Map<String, Integer> currentStats = estadisticaService.obtenerValoresPorPersonajeId(personajeId);
		Map<String, Integer> updatedBaseStats = DndCharacterNormalizers.resolverEstadisticasEditables(currentStats, request.estadisticasBase());
		int totalLevel = Math.max(1, dndCharacterStatsUtils.resolverNivelTotalPersonaje(personaje));

		personaje.setNombre(DndCharacterRules.requireText(request.nombre() == null ? personaje.getNombre() : request.nombre(), "Debes indicar el nombre del personaje"));
		personaje.setBiografia(DndCharacterNormalizers.construirBiografia(request.alineamiento(), request.historiaPersonal()));
		dndAbilityUtils.sincronizarIdiomasEditables(personaje, request.idiomasTexto());
		dndAbilityUtils.sincronizarCompetenciasEditables(personaje, request.competenciasArmasArmaduras(), request.competenciasHerramientas());
		estadisticaService.actualizarEdicionHoja(
				personaje,
				updatedBaseStats,
				request.movimiento(),
				request.vidaMaxima(),
				request.espaciosConjuroMaximos(),
				request.espaciosConjuroActuales(),
				request.recursosExtraMaximos(),
				request.recursosExtraActuales(),
				DndCharacterNormalizers.normalizarSalvaciones(request.salvacionesCompetentes()),
				DndCharacterNormalizers.normalizarHabilidades(request.habilidadesCompetentes()),
				DndCharacterNormalizers.normalizarHabilidades(request.habilidadesConPericia()),
				totalLevel
		);
		personajeRepository.save(personaje);
		emitirActualizacionPersonaje(personajeId);
		return obtenerDetallePersonaje(personajeId, username);
	}

	@Transactional
	public PersonajeDetalleResponse actualizarExperiencia(
			Long personajeId,
			ActualizarExperienciaPersonajeRequest request,
			String username
	) {
		if (request == null || request.experiencia() == null) {
			throw new ResponseStatusException(BAD_REQUEST, "No se recibió la nueva experiencia");
		}

		Personaje personaje = obtenerPersonajeUsuario(personajeId, username);
		int level = dndCharacterStatsUtils.resolverNivelTotalPersonaje(personaje);
		Integer maximum = dndCharacterStatsUtils.experienciaMaximaParaNivel(level);
		int experience = Math.max(0, request.experiencia());
		if (maximum != null) {
			experience = Math.min(experience, maximum);
		}
		estadisticaService.actualizarExperienciaPersonaje(personaje, experience);
		emitirActualizacionPersonaje(personajeId);
		return obtenerDetallePersonaje(personajeId, username);
	}

	// ─────────────────────────────────────────────
	// Mochila
	// ─────────────────────────────────────────────

	@Transactional
	public PersonajeDetalleResponse actualizarItemMochila(
			Long personajeId,
			Long itemId,
			ActualizarItemMochilaRequest request,
			String username
	) {
		if (request == null) {
			throw new ResponseStatusException(BAD_REQUEST, "No se recibió la actualización del inventario");
		}

		Personaje personaje = obtenerPersonajeUsuario(personajeId, username);

		mochilaService.actualizarItemPersonajeDnd(
				personaje,
				itemId,
				request.equipado(),
				request.cantidad()
		);
		emitirActualizacionPersonaje(personajeId);
		return obtenerDetallePersonaje(personajeId, username);
	}

	@Transactional
	public PersonajeDetalleResponse agregarItemMochila(
			Long personajeId,
			AgregarItemMochilaRequest request,
			String username
	) {
		if (request == null) {
			throw new ResponseStatusException(BAD_REQUEST, "No se recibió el nuevo objeto de mochila");
		}

		Personaje personaje = obtenerPersonajeUsuario(personajeId, username);

		mochilaService.agregarItemPersonajeDnd(
				personaje,
				request.objetoId(),
				request.nombre(),
				request.formula(),
				request.descripcion(),
				request.tipoObjeto(),
				request.indice(),
				username,
				request.cantidad()
		);
		emitirActualizacionPersonaje(personajeId);
		return obtenerDetallePersonaje(personajeId, username);
	}

	@Transactional
	public PersonajeDetalleResponse eliminarItemMochila(Long personajeId, Long itemId, String username) {
		Personaje personaje = obtenerPersonajeUsuario(personajeId, username);

		mochilaService.eliminarItemPersonajeDnd(personaje, itemId);
		emitirActualizacionPersonaje(personajeId);
		return obtenerDetallePersonaje(personajeId, username);
	}

	// ─────────────────────────────────────────────
	// Habilidades (personaje jugador)
	// ─────────────────────────────────────────────

	@Transactional
	public PersonajeDetalleResponse agregarHabilidad(Long personajeId, AgregarHabilidadPersonajeRequest request, String username) {
		if (request == null || request.habilidadId() == null) {
			throw new ResponseStatusException(BAD_REQUEST, "No se recibió la habilidad a añadir");
		}

		Personaje personaje = obtenerPersonajeUsuario(personajeId, username);
		dndCharacterAbilityManagementUtils.agregarHabilidadManual(personaje, request.habilidadId());
		emitirActualizacionPersonaje(personajeId);

		return obtenerDetallePersonaje(personajeId, username);
	}

	@Transactional
	public PersonajeDetalleResponse eliminarHabilidad(Long personajeId, Long habilidadId, String username) {
		Personaje personaje = obtenerPersonajeUsuario(personajeId, username);
		dndCharacterAbilityManagementUtils.eliminarHabilidadManual(personaje, habilidadId);
		emitirActualizacionPersonaje(personajeId);
		return obtenerDetallePersonaje(personajeId, username);
	}

	// ─────────────────────────────────────────────
	// Nivel
	// ─────────────────────────────────────────────

	@Transactional
	public PersonajeDetalleResponse subirNivel(Long personajeId, SubirNivelPersonajeRequest request, String username) {
		dndCharacterLevelUtils.subirNivel(personajeId, request, username);
		emitirActualizacionPersonaje(personajeId);
		return obtenerDetallePersonaje(personajeId, username);
	}

	@Transactional
	public PersonajeDetalleResponse bajarNivel(Long personajeId, BajarNivelPersonajeRequest request, String username) {
		dndCharacterLevelUtils.bajarNivel(personajeId, request, username);
		emitirActualizacionPersonaje(personajeId);
		return obtenerDetallePersonaje(personajeId, username);
	}

	// ─────────────────────────────────────────────
	// Retrato
	// ─────────────────────────────────────────────

	@Transactional
	public PersonajeDetalleResponse actualizarRetratoPersonaje(Long personajeId, MultipartFile portrait, String username) {
		if (portrait == null || portrait.isEmpty()) {
			throw new ResponseStatusException(BAD_REQUEST, "Debes subir una imagen");
		}
		Personaje personaje = obtenerPersonajeUsuario(personajeId, username);
		String retratoUrl = subirRetrato(portrait);
		personaje.setRetrato(retratoUrl);
		personajeRepository.save(personaje);
		emitirActualizacionPersonaje(personajeId);
		return obtenerDetallePersonaje(personajeId, username);
	}

	// ─────────────────────────────────────────────
	// Eliminación
	// ─────────────────────────────────────────────

	@Transactional
	public void eliminarPersonaje(Long personajeId, String username) {
		Personaje personaje = obtenerPersonajeUsuario(personajeId, username);

		String fuenteIdStr = TagUtils.extractTagValue(personaje.getTags(), "fuenteId");
		if (personaje.isEsPublico() && fuenteIdStr != null) {
			try {
				Long fuenteId = Long.parseLong(fuenteIdStr);
				personajeRepository.findById(fuenteId).ifPresent(fuente -> {
					String tags = fuente.getTags();
					if (tags != null && tags.toLowerCase().contains("publicado")) {
						String limpio = java.util.Arrays.stream(tags.split(","))
								.map(String::trim)
								.filter(t -> !t.equalsIgnoreCase("publicado"))
								.collect(java.util.stream.Collectors.joining(","));
						fuente.setTags(limpio.isBlank() ? null : limpio);
						personajeRepository.save(fuente);
					}
				});
			} catch (NumberFormatException ignored) { }
		}

		chatRepository.desvincularPersonaje(personajeId);
		posicionRepository.findByPersonajeId(personajeId).ifPresent(posicion -> {
			Long posicionId = posicion.getId();
			Long campañaId = posicion.getCapa() != null
					&& posicion.getCapa().getPestaña() != null
					&& posicion.getCapa().getPestaña().getCampaña() != null
					? posicion.getCapa().getPestaña().getCampaña().getId()
					: null;
			posicionRepository.delete(posicion);
			if (campañaId != null) {
				messagingTemplate.convertAndSend(
						"/topic/campanas/" + campañaId + "/posiciones",
						new WebSocketPosicionEventDTO("DELETED", posicionId, null)
				);
			}
		});
		mochilaService.obtenerMochilaPersonaje(personajeId).forEach(item -> mochilaService.eliminarItemPersonaje(personaje, item.getId()));
		personaje.getHabilidades().clear();
		personajeRepository.save(personaje);
		estadisticaService.eliminarEstadisticasPersonaje(personajeId);
		personajeRepository.delete(personaje);
	}

	@Transactional
	public void eliminarPersonajeAdmin(Long personajeId) {
		personajeRepository.findById(personajeId).ifPresent(personaje -> {
			chatRepository.desvincularPersonaje(personajeId);
			posicionRepository.findByPersonajeId(personajeId).ifPresent(posicionRepository::delete);
			mochilaService.obtenerMochilaPersonaje(personajeId).forEach(item -> mochilaService.eliminarItemPersonaje(personaje, item.getId()));
			personaje.getHabilidades().clear();
			personajeRepository.save(personaje);
			estadisticaService.eliminarEstadisticasPersonaje(personajeId);
			personajeRepository.delete(personaje);
		});
	}

	// ─────────────────────────────────────────────
	// Seeder / migraciones
	// ─────────────────────────────────────────────

	@Transactional
	public void sincronizarAtaquesArmaPorId(Long personajeId) {
		personajeRepository.findById(personajeId).ifPresent(personaje -> {
			java.util.List<com.fosteriaVTT.fosteriaVTT_backend.Mochila.Mochila> mochila =
				mochilaService.obtenerMochilaPersonaje(personajeId);
			dndCombatUtils.sincronizarAtaquesArma(personaje, mochila);
		});
	}

	// ─────────────────────────────────────────────
	// Package-private helpers (usados por NpcService, PersonajeMarketplaceService y PersonajeMBService)
	// ─────────────────────────────────────────────

	PersonajeResumenResponse toResumen(Personaje p) {
		return new PersonajeResumenResponse(
				p.getId(),
				p.getNombre(),
				p.getRetrato(),
				p.getSistemaDeJuego().getDisplayName(),
				p.getUsado(),
				tipoFromTags(p.getTags()),
				p.isEsPublico(),
				estaPublicado(p.getTags()),
				TagUtils.extractTagValue(p.getTags(), "fuenteId") != null
		);
	}

	boolean estaPublicado(String tags) {
		return tags != null && tags.toLowerCase().contains("publicado");
	}

	Personaje obtenerPersonajeUsuario(Long personajeId, String username) {
		return personajeRepository.findByIdAndUsuarioUsername(personajeId, username)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Personaje no encontrado"));
	}

	void emitirActualizacionPersonaje(Long personajeId) {
		posicionRepository.findByPersonajeId(personajeId)
				.map(Posicion::getCapa)
				.filter(Objects::nonNull)
				.map(capa -> capa.getPestaña())
				.filter(Objects::nonNull)
				.map(pestana -> pestana.getCampaña())
				.filter(Objects::nonNull)
				.map(campania -> campania.getId())
				.filter(Objects::nonNull)
				.ifPresent(campaniaId -> messagingTemplate.convertAndSend(
						"/topic/campanas/" + campaniaId + "/personajes",
						Map.of("accion", "UPDATED", "personajeId", personajeId)
				));
	}

	// ─────────────────────────────────────────────
	// Helpers privados
	// ─────────────────────────────────────────────

	private boolean esInstancia(String tags) {
		return tags != null && tags.toLowerCase().contains("instancia");
	}

	private boolean esEnemigo(Personaje personaje) {
		String tags = personaje.getTags();
		if (tags == null) return false;
		String lower = tags.toLowerCase();
		return lower.contains("enemigo") || lower.contains("pnj");
	}

	private String tipoFromTags(String tags) {
		if (tags == null) return "personaje";
		String lower = tags.toLowerCase();
		if (lower.contains("enemigo")) return "enemigo";
		if (lower.contains("pnj")) return "PNJ";
		return "personaje";
	}

	private MultipartFile validarRetrato(MultipartFile portrait) {
		if (portrait == null || portrait.isEmpty()) {
			throw new ResponseStatusException(BAD_REQUEST, "Debes subir un retrato para el personaje");
		}
		return portrait;
	}

	private String subirRetrato(MultipartFile retrato) {
		try {
			return cloudinaryService.uploadFile(retrato);
		} catch (IOException exception) {
			throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "No se pudo subir el retrato del personaje");
		}
	}
}
