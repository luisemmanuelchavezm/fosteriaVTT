package com.fosteriaVTT.fosteriaVTT_backend.Personaje;

import com.fosteriaVTT.fosteriaVTT_backend.Cloudinary.CloudinaryService;
import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.EstadisticaService;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Mochila.Mochila;
import com.fosteriaVTT.fosteriaVTT_backend.Posicion.Posicion;
import com.fosteriaVTT.fosteriaVTT_backend.Posicion.PosicionRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.UserRepository;
import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarArmaHabilidadNpcRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarNpcRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.AgregarHabilidadNpcRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CrearNpcRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PersonajeDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PersonajeResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils.DndAbilityUtils;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils.DndCombatUtils;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;
import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Operaciones específicas de NPCs y enemigos (creación, edición, habilidades).
 * Las operaciones genéricas de personaje (obtener detalle, mochila, nivel…)
 * se mantienen en {@link PersonajeService}.
 */
@Service
public class NpcService {

	private final PersonajeRepository personajeRepository;
	private final UserRepository userRepository;
	private final EstadisticaService estadisticaService;
	private final CloudinaryService cloudinaryService;
	private final DndAbilityUtils dndAbilityUtils;
	private final DndCombatUtils dndCombatUtils;
	private final PosicionRepository posicionRepository;
	private final SimpMessagingTemplate messagingTemplate;
	private final PersonajeService personajeService;

	public NpcService(
			PersonajeRepository personajeRepository,
			UserRepository userRepository,
			EstadisticaService estadisticaService,
			CloudinaryService cloudinaryService,
			DndAbilityUtils dndAbilityUtils,
			DndCombatUtils dndCombatUtils,
			PosicionRepository posicionRepository,
			SimpMessagingTemplate messagingTemplate,
			PersonajeService personajeService
	) {
		this.personajeRepository = personajeRepository;
		this.userRepository = userRepository;
		this.estadisticaService = estadisticaService;
		this.cloudinaryService = cloudinaryService;
		this.dndAbilityUtils = dndAbilityUtils;
		this.dndCombatUtils = dndCombatUtils;
		this.posicionRepository = posicionRepository;
		this.messagingTemplate = messagingTemplate;
		this.personajeService = personajeService;
	}

	// ─────────────────────────────────────────────
	// Creación
	// ─────────────────────────────────────────────

	@Transactional
	public PersonajeResumenResponse crearNpc(CrearNpcRequest request, MultipartFile portrait, String username) {
		if (request == null || request.nombre() == null || request.nombre().isBlank()) {
			throw new ResponseStatusException(BAD_REQUEST, "El nombre del NPC es requerido");
		}
		com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario usuario = userRepository.findByUsername(username)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Usuario no encontrado"));

		String retratoUrl = (portrait != null && !portrait.isEmpty()) ? subirRetrato(portrait) : null;

		String tipo = (request.tipo() != null && !request.tipo().isBlank())
				? request.tipo().toLowerCase() : "enemigo";
		SistemaDeJuego sistema = SistemaDeJuego
				.fromValue(request.sistemaDeJuego() != null ? request.sistemaDeJuego() : "")
				.orElse(SistemaDeJuego.DND);

		String tags = construirTagsNpc(tipo, request.vd());
		boolean publico = request.esPublico() != null && request.esPublico();

		Personaje personaje = Personaje.builder()
				.nombre(request.nombre().trim())
				.tags(tags)
				.retrato(retratoUrl)
				.biografia(request.biografia())
				.sistemaDeJuego(sistema)
				.esPublico(publico)
				.usuario(usuario)
				.build();

		Personaje guardado = personajeRepository.save(personaje);

		if (request.estadisticas() != null && !request.estadisticas().isEmpty()) {
			estadisticaService.guardarEstadisticasNpc(guardado, request.estadisticas());
		}
		dndCombatUtils.sincronizarAtaquesArma(guardado, List.of());

		return personajeService.toResumen(guardado);
	}

	// ─────────────────────────────────────────────
	// Actualización NPC
	// ─────────────────────────────────────────────

	@Transactional
	public PersonajeDetalleResponse actualizarNpc(Long personajeId, ActualizarNpcRequest request, String username) {
		if (request == null) {
			throw new ResponseStatusException(BAD_REQUEST, "No se recibió la actualización del NPC");
		}
		Personaje personaje = obtenerPersonajeUsuario(personajeId, username);

		if (request.nombre() != null && !request.nombre().isBlank()) {
			personaje.setNombre(request.nombre().trim());
		}
		if (request.biografia() != null) {
			personaje.setBiografia(request.biografia());
		}
		if (request.vd() != null) {
			personaje.setTags(actualizarTagVd(personaje.getTags(), request.vd()));
		}
		personajeRepository.save(personaje);

		if (request.estadisticas() != null && !request.estadisticas().isEmpty()) {
			sincronizarEstadisticasNpc(personajeId, personaje, request.estadisticas());
		}

		emitirActualizacionPersonaje(personajeId);
		return personajeService.obtenerDetallePersonaje(personajeId, username);
	}

	// ─────────────────────────────────────────────
	// Habilidades NPC
	// ─────────────────────────────────────────────

	@Transactional
	public void agregarHabilidadNpc(Long personajeId, AgregarHabilidadNpcRequest request, String username) {
		if (request == null || request.nombre() == null || request.nombre().isBlank()) {
			throw new ResponseStatusException(BAD_REQUEST, "El nombre de la habilidad es requerido");
		}
		Personaje personaje = obtenerPersonajeUsuario(personajeId, username);

		String baseTags = (request.tags() != null && !request.tags().isBlank())
				? request.tags().trim() : "NPC";
		String finalTags = (request.bonificacion() != null)
				? baseTags + ",BONO;" + request.bonificacion()
				: baseTags;

		Habilidad habilidad;
		if (baseTags.toUpperCase().contains("ARMA")) {
			String exclusiveTags = finalTags + ",PROPIA;" + personajeId;
			habilidad = dndAbilityUtils.crearHabilidadArmaExclusiva(
					request.nombre().trim(),
					request.descripcion() != null ? request.descripcion().trim() : null,
					request.formula(),
					exclusiveTags
			);
		} else {
			habilidad = dndAbilityUtils.resolverORegistrarHabilidad(
					request.nombre().trim(),
					request.descripcion() != null ? request.descripcion().trim() : null,
					null,
					finalTags
			);
		}
		dndAbilityUtils.agregarHabilidadSiNoExiste(personaje, habilidad);
		personajeRepository.save(personaje);
		emitirActualizacionPersonaje(personajeId);
	}

	@Transactional
	public PersonajeDetalleResponse actualizarArmaHabilidadNpc(
			Long personajeId,
			Long habilidadId,
			ActualizarArmaHabilidadNpcRequest request,
			String username
	) {
		if (request == null) {
			throw new ResponseStatusException(BAD_REQUEST, "No se recibió la actualización del arma");
		}
		Personaje personaje = obtenerPersonajeUsuario(personajeId, username);
		boolean pertenece = personaje.getHabilidades().stream().anyMatch(h -> h.getId().equals(habilidadId));
		if (!pertenece) {
			throw new ResponseStatusException(BAD_REQUEST, "El arma no pertenece a este personaje");
		}

		Habilidad habilidad = dndAbilityUtils.obtenerHabilidadPorId(habilidadId);
		String currentTags = habilidad.getTags() != null ? habilidad.getTags() : "";
		String newTags = reconstruirTagsSinBono(currentTags, request.bonificacion());

		if (esArmaPropia(currentTags, personajeId)) {
			// Arma custom del NPC — actualizar en sitio
			dndAbilityUtils.actualizarHabilidadArma(habilidadId, request.nombre(), request.formula(), newTags);
		} else {
			// Arma de plantilla — clonar exclusivamente para este NPC
			String cloneTags = newTags + ",PROPIA;" + personajeId;
			String cloneName = (request.nombre() != null && !request.nombre().isBlank())
					? request.nombre().trim() : habilidad.getNombre();
			String cloneFormula = request.formula() != null ? request.formula() : habilidad.getFormula();
			Habilidad clon = dndAbilityUtils.crearHabilidadArmaExclusiva(
					cloneName, habilidad.getDescripcion(), cloneFormula, cloneTags);
			final Long oldId = habilidadId;
			personaje.getHabilidades().removeIf(h -> h.getId().equals(oldId));
			personaje.getHabilidades().add(clon);
			personajeRepository.save(personaje);
		}

		emitirActualizacionPersonaje(personajeId);
		return personajeService.obtenerDetallePersonaje(personajeId, username);
	}

	// ─────────────────────────────────────────────
	// MB Enemy — traits & moral
	// ─────────────────────────────────────────────

	@Transactional
	public void appendTagsToEnemy(Long personajeId, String tagsToAdd, String username) {
		Personaje personaje = obtenerPersonajeUsuario(personajeId, username);
		String current = personaje.getTags() != null ? personaje.getTags() : "";
		personaje.setTags(current.isBlank() ? tagsToAdd : current + "," + tagsToAdd);
		personajeRepository.save(personaje);
		emitirActualizacionPersonaje(personajeId);
	}

	@Transactional
	public void actualizarMoralMBEnemy(Long personajeId, int moralActual, String username) {
		Personaje personaje = obtenerPersonajeUsuario(personajeId, username);
		var stats = estadisticaService.obtenerValoresPorPersonajeId(personajeId);
		int maxMoral = stats.getOrDefault("Moral maxima", moralActual);
		int clamped = Math.max(0, Math.min(maxMoral, moralActual));
		estadisticaService.upsertStat(personaje, "Moral actual", clamped);
		emitirActualizacionPersonaje(personajeId);
	}

	// ─────────────────────────────────────────────
	// Helpers privados
	// ─────────────────────────────────────────────

	/** Construye los tags iniciales de un NPC con tipo y valor de desafío opcional. */
	private String construirTagsNpc(String tipo, String vd) {
		String tags = tipo;
		if (vd != null && !vd.isBlank()) {
			tags = tags + ",vd;" + vd.trim();
		}
		return tags;
	}

	/**
	 * Reemplaza el token {@code vd;X} en los tags del personaje.
	 * Si {@code nuevoVd} es blanco, elimina el token.
	 */
	private String actualizarTagVd(String currentTags, String nuevoVd) {
		String base = currentTags != null ? currentTags : "";
		StringBuilder sb = new StringBuilder();
		for (String part : base.split(",")) {
			String t = part.trim();
			if (!t.isEmpty() && !t.startsWith("vd;")) {
				if (sb.length() > 0) sb.append(",");
				sb.append(t);
			}
		}
		String tagsWithoutVd = sb.toString();
		if (!nuevoVd.isBlank()) {
			if (!tagsWithoutVd.isEmpty()) tagsWithoutVd += ",";
			tagsWithoutVd += "vd;" + nuevoVd.trim();
		}
		return tagsWithoutVd;
	}

	/**
	 * Preserva la vida actual/temporal antes de reemplazar todas las estadísticas del NPC.
	 * Clampea la vida actual al nuevo máximo.
	 */
	private void sincronizarEstadisticasNpc(Long personajeId, Personaje personaje, Map<String, Integer> nuevasStats) {
		Map<String, Integer> currentStats = estadisticaService.obtenerValoresPorPersonajeId(personajeId);
		Integer vidaActual = currentStats.get("Vida actual");
		Integer vidaTemporal = currentStats.get("Vida temporal");

		estadisticaService.eliminarEstadisticasPersonaje(personajeId);

		Map<String, Integer> statsToSave = new java.util.HashMap<>(nuevasStats);
		int maxHp = statsToSave.getOrDefault("Puntos de vida",
				currentStats.getOrDefault("Puntos de vida", 1));
		statsToSave.put("Vida actual", vidaActual != null ? Math.min(vidaActual, maxHp) : maxHp);
		statsToSave.put("Vida temporal", vidaTemporal != null ? vidaTemporal : 0);

		estadisticaService.guardarEstadisticasNpc(personaje, statsToSave);
	}

	/**
	 * Reconstruye los tags de una habilidad eliminando el token {@code BONO;X}
	 * y añadiendo el nuevo bono si se proporciona.
	 */
	private String reconstruirTagsSinBono(String currentTags, Integer nuevoBono) {
		StringBuilder sb = new StringBuilder();
		for (String rawTag : currentTags.split(",")) {
			String tag = rawTag.trim();
			if (tag.isEmpty() || (tag.length() > 5 && tag.substring(0, 5).equalsIgnoreCase("BONO;"))) {
				continue;
			}
			if (sb.length() > 0) sb.append(",");
			sb.append(tag);
		}
		String result = sb.toString();
		if (nuevoBono != null) {
			if (!result.isEmpty()) result += ",";
			result += "BONO;" + nuevoBono;
		}
		return result;
	}

	/** Devuelve {@code true} si la habilidad está marcada como exclusiva del NPC con {@code PROPIA;{personajeId}}. */
	private boolean esArmaPropia(String tags, Long personajeId) {
		for (String rawTag : tags.split(",")) {
			if (rawTag.trim().equalsIgnoreCase("PROPIA;" + personajeId)) {
				return true;
			}
		}
		return false;
	}

	private void emitirActualizacionPersonaje(Long personajeId) {
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

	private Personaje obtenerPersonajeUsuario(Long personajeId, String username) {
		return personajeRepository.findByIdAndUsuarioUsername(personajeId, username)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Personaje no encontrado"));
	}

	private String subirRetrato(MultipartFile retrato) {
		try {
			return cloudinaryService.uploadFile(retrato);
		} catch (IOException exception) {
			throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "No se pudo subir el retrato del personaje");
		}
	}
}
