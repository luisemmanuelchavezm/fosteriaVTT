package com.fosteriaVTT.fosteriaVTT_backend.Personaje;

import com.fosteriaVTT.fosteriaVTT_backend.Cloudinary.CloudinaryService;
import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.EstadisticaService;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Mochila.MochilaService;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.Objeto;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.UserRepository;
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
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils.DndWeaponProficiencies;
import com.fosteriaVTT.fosteriaVTT_backend.Posicion.Posicion;
import com.fosteriaVTT.fosteriaVTT_backend.Posicion.PosicionRepository;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarRecursosPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarHojaPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarExperienciaPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.AgregarHabilidadNpcRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.AgregarHabilidadPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.AgregarItemMochilaRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarItemMochilaRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.BajarNivelPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CrearNpcRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CrearPersonajeDndRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.HabilidadResponse;
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
	private final UserRepository userRepository;
	private final EstadisticaService estadisticaService;
	private final MochilaService mochilaService;
	private final CloudinaryService cloudinaryService;
	private final DndAbilityUtils dndAbilityUtils;
	private final DndCharacterAbilityManagementUtils dndCharacterAbilityManagementUtils;
	private final DndCombatUtils dndCombatUtils;
	private final DndCharacterStatsUtils dndCharacterStatsUtils;
	private final DndCharacterCreationUtils dndCharacterCreationUtils;
	private final DndCharacterLevelUtils dndCharacterLevelUtils;
	private final PosicionRepository posicionRepository;
	private final SimpMessagingTemplate messagingTemplate;

	public PersonajeService(
			PersonajeRepository personajeRepository,
			UserRepository userRepository,
			EstadisticaService estadisticaService,
			MochilaService mochilaService,
			CloudinaryService cloudinaryService,
			DndAbilityUtils dndAbilityUtils,
			DndCharacterAbilityManagementUtils dndCharacterAbilityManagementUtils,
			DndCombatUtils dndCombatUtils,
			DndCharacterStatsUtils dndCharacterStatsUtils,
			DndCharacterCreationUtils dndCharacterCreationUtils,
			DndCharacterLevelUtils dndCharacterLevelUtils,
			PosicionRepository posicionRepository,
			SimpMessagingTemplate messagingTemplate
	) {
		this.personajeRepository = personajeRepository;
		this.userRepository = userRepository;
		this.estadisticaService = estadisticaService;
		this.mochilaService = mochilaService;
		this.cloudinaryService = cloudinaryService;
		this.dndAbilityUtils = dndAbilityUtils;
		this.dndCharacterAbilityManagementUtils = dndCharacterAbilityManagementUtils;
		this.dndCombatUtils = dndCombatUtils;
		this.dndCharacterStatsUtils = dndCharacterStatsUtils;
		this.dndCharacterCreationUtils = dndCharacterCreationUtils;
		this.dndCharacterLevelUtils = dndCharacterLevelUtils;
		this.posicionRepository = posicionRepository;
		this.messagingTemplate = messagingTemplate;
	}

	@Transactional(readOnly = true)
	public PersonajeDetalleResponse obtenerDetallePersonaje(Long personajeId, String username) {
		Personaje personaje = personajeRepository.findById(personajeId)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Personaje no encontrado"));
		Map<String, Integer> estadisticas = estadisticaService.obtenerValoresPorPersonajeId(personajeId);
		String tipo = tipoFromTags(personaje.getTags());

		if (esEnemigo(personaje)) {
			Map<Long, com.fosteriaVTT.fosteriaVTT_backend.Mochila.Mochila> mochilaByObjetoId =
					mochilaService.obtenerMochilaPersonaje(personajeId).stream()
							.filter(item -> item.getObjeto() != null && item.getObjeto().getId() != null)
							.collect(java.util.stream.Collectors.toMap(
									item -> item.getObjeto().getId(),
									item -> item,
									(a, b) -> a
							));
			return new PersonajeDetalleResponse(
					personaje.getId(),
					personaje.getNombre(),
					personaje.getRetrato(),
					personaje.getBiografia(),
					personaje.getSistemaDeJuego().getDisplayName(),
					null,
					null,
					List.of(),
					null,
					estadisticas,
					personaje.getHabilidades().stream()
							.map(h -> {
								Integer bonif = 0;
								Long objetoId = dndCombatUtils.extraerIdObjetoArma(h.getTags());
								if (objetoId != null) {
									com.fosteriaVTT.fosteriaVTT_backend.Mochila.Mochila item = mochilaByObjetoId.get(objetoId);
									if (item != null && item.getObjeto() != null) {
										bonif = extraerBonoAtaqueDesdeIndice(item.getObjeto().getIndice());
									}
								}
								return new HabilidadResponse(
										h.getId(),
										h.getNombre(),
										bonif,
										h.getFormula(),
										h.getDescripcion(),
										h.getTags()
								);
							})
							.toList(),
					mochilaService.obtenerItemsPersonaje(personajeId),
					personaje.getUsado(),
					tipo,
					TagUtils.extractTagValue(personaje.getTags(), "vd"),
					personaje.getUsuario() != null ? personaje.getUsuario().getUsername() : null
			);
		}

		List<Habilidad> habilidades = personaje.getHabilidades();
		DndWeaponProficiencies weaponProficiencies = dndCombatUtils.resolverCompetenciasArma(personaje);
		Map<Long, Objeto> weaponObjectsById = dndCombatUtils.resolverObjetosArmaPorHabilidades(habilidades);

		return new PersonajeDetalleResponse(
				personaje.getId(),
				personaje.getNombre(),
				personaje.getRetrato(),
				personaje.getBiografia(),
				personaje.getSistemaDeJuego().getDisplayName(),
				TagUtils.extractTagValue(personaje.getTags(), "Raza"),
				TagUtils.extractTagValue(personaje.getTags(), "Subraza"),
				dndCharacterStatsUtils.resolverClasesPersonaje(personaje),
				dndCharacterStatsUtils.resolverCaracteristicaLanzamientoConjuros(personaje),
				estadisticas,
				habilidades.stream()
						.map(habilidad -> new HabilidadResponse(
								habilidad.getId(),
								habilidad.getNombre(),
								dndCombatUtils.resolverBonificacionHabilidad(
										personaje,
										habilidad,
										estadisticas,
										weaponProficiencies,
										weaponObjectsById
								),
								habilidad.getFormula(),
								habilidad.getDescripcion(),
								habilidad.getTags()
						))
						.toList(),
				mochilaService.obtenerItemsPersonaje(personajeId),
				personaje.getUsado(),
				tipo,
				null,
				personaje.getUsuario() != null ? personaje.getUsuario().getUsername() : null
		);
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
						.map(personaje -> new PersonajeResumenResponse(
								personaje.getId(),
								personaje.getNombre(),
								personaje.getRetrato(),
								personaje.getSistemaDeJuego().getDisplayName(),
								personaje.getUsado(),
								tipoFromTags(personaje.getTags())
						))
						.toList(),
				resultPage.hasNext()
		);
	}

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

	@Transactional
	public void eliminarPersonaje(Long personajeId, String username) {
		Personaje personaje = obtenerPersonajeUsuario(personajeId, username);
		mochilaService.obtenerMochilaPersonaje(personajeId).forEach(item -> mochilaService.eliminarItemPersonaje(personaje, item.getId()));
		personaje.getHabilidades().clear();
		personajeRepository.save(personaje);
		personajeRepository.delete(personaje);
	}

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

	private MultipartFile validarRetrato(MultipartFile portrait) {
		if (portrait == null || portrait.isEmpty()) {
			throw new ResponseStatusException(BAD_REQUEST, "Debes subir un retrato para el personaje");
		}

		return portrait;
	}

	@Transactional
	public PersonajeResumenResponse crearNpc(CrearNpcRequest request, MultipartFile portrait, String username) {
		if (request == null || request.nombre() == null || request.nombre().isBlank()) {
			throw new ResponseStatusException(BAD_REQUEST, "El nombre del NPC es requerido");
		}
		com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario usuario = userRepository.findByUsername(username)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Usuario no encontrado"));

		String retratoUrl = null;
		if (portrait != null && !portrait.isEmpty()) {
			retratoUrl = subirRetrato(portrait);
		}

		String tipo = (request.tipo() != null && !request.tipo().isBlank()) ? request.tipo().toLowerCase() : "enemigo";
		SistemaDeJuego sistema = SistemaDeJuego.fromValue(request.sistemaDeJuego() != null ? request.sistemaDeJuego() : "")
				.orElse(SistemaDeJuego.DND);

		String tags = tipo;
		if (request.vd() != null && !request.vd().isBlank()) {
			tags = tags + ",vd;" + request.vd().trim();
		}

		Personaje personaje = Personaje.builder()
				.nombre(request.nombre().trim())
				.tags(tags)
				.retrato(retratoUrl)
				.biografia(request.biografia())
				.sistemaDeJuego(sistema)
				.usuario(usuario)
				.build();

		Personaje guardado = personajeRepository.save(personaje);

		if (request.estadisticas() != null && !request.estadisticas().isEmpty()) {
			estadisticaService.guardarEstadisticasNpc(guardado, request.estadisticas());
		}

		dndCombatUtils.sincronizarAtaquesArma(guardado, List.of());

		return new PersonajeResumenResponse(
				guardado.getId(),
				guardado.getNombre(),
				guardado.getRetrato(),
				guardado.getSistemaDeJuego().getDisplayName(),
				guardado.getUsado(),
				tipo
		);
	}

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

	private String subirRetrato(MultipartFile retrato) {
		try {
			return cloudinaryService.uploadFile(retrato);
		} catch (IOException exception) {
			throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "No se pudo subir el retrato del personaje");
		}
	}

	@Transactional
	public void agregarHabilidadNpc(Long personajeId, AgregarHabilidadNpcRequest request, String username) {
		if (request == null || request.nombre() == null || request.nombre().isBlank()) {
			throw new ResponseStatusException(BAD_REQUEST, "El nombre de la habilidad es requerido");
		}
		Personaje personaje = obtenerPersonajeUsuario(personajeId, username);
		String tags = request.tags() != null && !request.tags().isBlank() ? request.tags().trim() : "NPC";
		Habilidad habilidad = dndAbilityUtils.resolverORegistrarHabilidad(
				request.nombre().trim(),
				request.descripcion() != null ? request.descripcion().trim() : null,
				null,
				tags
		);
		dndAbilityUtils.agregarHabilidadSiNoExiste(personaje, habilidad);
		personajeRepository.save(personaje);
	}

	private Integer extraerBonoAtaqueDesdeIndice(String indice) {
		if (indice == null || indice.isBlank()) {
			return 0;
		}
		for (String parte : indice.split(",")) {
			String trimmed = parte.trim().toUpperCase();
			if (trimmed.startsWith("BONO_ATAQUE=")) {
				try {
					return Integer.parseInt(trimmed.substring("BONO_ATAQUE=".length()).trim());
				} catch (NumberFormatException ignored) {
				}
			}
		}
		return 0;
	}

	private Personaje obtenerPersonajeUsuario(Long personajeId, String username) {
		return personajeRepository.findByIdAndUsuarioUsername(personajeId, username)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Personaje no encontrado"));
	}
}