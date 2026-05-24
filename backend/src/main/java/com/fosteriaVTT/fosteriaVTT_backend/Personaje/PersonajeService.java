package com.fosteriaVTT.fosteriaVTT_backend.Personaje;

import com.fosteriaVTT.fosteriaVTT_backend.Chat.ChatRepository;
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
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarNpcRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.WebSocketPosicionEventDTO;
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
	private final ChatRepository chatRepository;
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
			ChatRepository chatRepository,
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
		this.chatRepository = chatRepository;
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
								// BONO;X tag always takes priority (user-set bonus)
								Integer bonifFromTag = null;
								if (h.getTags() != null) {
									for (String rawTag : h.getTags().split(",")) {
										String tag = rawTag.trim();
										if (tag.length() > 5 && tag.substring(0, 5).equalsIgnoreCase("BONO;")) {
											try {
												bonifFromTag = Integer.parseInt(tag.substring(5).trim());
											} catch (NumberFormatException ignored) { }
											break;
										}
									}
								}
								Integer bonif = 0;
								if (bonifFromTag != null) {
									bonif = bonifFromTag;
								} else {
									// Fall back: look up attack bonus from the Objeto's indice (catalog weapons in mochila)
									Long objetoId = dndCombatUtils.extraerIdObjetoArma(h.getTags());
									if (objetoId != null) {
										com.fosteriaVTT.fosteriaVTT_backend.Mochila.Mochila item = mochilaByObjetoId.get(objetoId);
										if (item != null && item.getObjeto() != null) {
											bonif = extraerBonoAtaqueDesdeIndice(item.getObjeto().getIndice());
										}
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
						.map(this::toResumen)
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

		// Si es una copia pública (publicar), quitamos el tag "publicado" del original
		String fuenteIdStr = com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils.extractTagValue(personaje.getTags(), "fuenteId");
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

	/**
	 * Seeder migration helper: ensures weapon-attack habilidades exist for every
	 * ARMA-type item in the personaje's mochila. Safe to call multiple times.
	 */
	@Transactional
	public void sincronizarAtaquesArmaPorId(Long personajeId) {
		personajeRepository.findById(personajeId).ifPresent(personaje -> {
			java.util.List<com.fosteriaVTT.fosteriaVTT_backend.Mochila.Mochila> mochila =
				mochilaService.obtenerMochilaPersonaje(personajeId);
			dndCombatUtils.sincronizarAtaquesArma(personaje, mochila);
		});
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

		return toResumen(guardado);
	}

	@Transactional
	public PersonajeResumenResponse instanciarPersonaje(Long sourceId, String username) {
		Personaje source = personajeRepository.findById(sourceId)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Personaje no encontrado"));

		boolean esPropio = source.getUsuario() != null && source.getUsuario().getUsername().equals(username);
		if (!source.isEsPublico() && !esPropio) {
			throw new ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "No tienes acceso a este personaje");
		}

		com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario usuario = userRepository.findByUsername(username)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Usuario no encontrado"));

		// Build tags for the instance: preserve original tags and append "instancia"
		String sourceTags = source.getTags();
		String instanceTags = (sourceTags != null && !sourceTags.isBlank())
				? sourceTags + ",instancia"
				: "instancia";

		Personaje instancia = Personaje.builder()
				.nombre(source.getNombre())
				.tags(instanceTags)
				.retrato(source.getRetrato())
				.biografia(source.getBiografia())
				.sistemaDeJuego(source.getSistemaDeJuego())
				.esPublico(false)
				.usuario(usuario)
				.build();

		// Copy habilidades (ManyToMany — reuse same entities, no duplication)
		instancia.getHabilidades().addAll(source.getHabilidades());

		Personaje guardada = personajeRepository.save(instancia);

		// Clone stats with HP reset to full
		estadisticaService.clonarEstadisticasParaPersonaje(sourceId, guardada);

		// Clone mochila items
		mochilaService.clonarMochilaParaPersonaje(sourceId, guardada);

		return toResumen(guardada);
	}

	@Transactional
	public PersonajeResumenResponse publicarPersonaje(Long sourceId, String username) {
		Personaje source = personajeRepository.findById(sourceId)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Personaje no encontrado"));

		if (source.getUsuario() == null || !source.getUsuario().getUsername().equals(username)) {
			throw new ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Solo el dueño puede publicar este personaje");
		}

		if (com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils.extractTagValue(source.getTags(), "fuenteId") != null) {
			throw new ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "No puedes publicar un personaje guardado del marketplace");
		}

		if (estaPublicado(source.getTags())) {
			throw new ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT, "Este personaje ya fue publicado");
		}

		com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario usuario = userRepository.findByUsername(username)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Usuario no encontrado"));

		// Marcar el original con "publicado" para que no se pueda volver a publicar
		String sourceTags = source.getTags();
		String tagsConPublicado = (sourceTags != null && !sourceTags.isBlank())
				? sourceTags + ",publicado"
				: "publicado";
		source.setTags(tagsConPublicado);
		personajeRepository.save(source);

		// La copia lleva el fuenteId como tag
		String copiaTags = (sourceTags != null && !sourceTags.isBlank())
				? sourceTags + ",fuenteId;" + sourceId
				: "fuenteId;" + sourceId;

		Personaje copia = Personaje.builder()
				.nombre(source.getNombre())
				.tags(copiaTags)
				.retrato(source.getRetrato())
				.biografia(source.getBiografia())
				.sistemaDeJuego(source.getSistemaDeJuego())
				.esPublico(true)
				.usuario(usuario)
				.build();

		copia.getHabilidades().addAll(source.getHabilidades());

		Personaje guardada = personajeRepository.save(copia);

		estadisticaService.clonarEstadisticasParaPersonaje(sourceId, guardada);
		mochilaService.clonarMochilaParaPersonaje(sourceId, guardada);

		return toResumen(guardada);
	}

	@Transactional
	public PersonajeResumenResponse guardarPersonaje(Long sourceId, String username) {
		Personaje source = personajeRepository.findById(sourceId)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Personaje no encontrado"));

		if (!source.isEsPublico()) {
			throw new ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Solo puedes guardar personajes públicos");
		}

		if (personajeRepository.existsByFuenteTagAndUsuarioUsername(String.valueOf(sourceId), username)) {
			throw new ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT, "Ya tienes una copia guardada de este personaje");
		}

		com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario usuario = userRepository.findByUsername(username)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Usuario no encontrado"));

		// La copia privada también lleva el fuenteId como tag
		String sourceTags = source.getTags();
		String copiaTags = (sourceTags != null && !sourceTags.isBlank())
				? sourceTags + ",fuenteId;" + sourceId
				: "fuenteId;" + sourceId;

		Personaje copia = Personaje.builder()
				.nombre(source.getNombre())
				.tags(copiaTags)
				.retrato(source.getRetrato())
				.biografia(source.getBiografia())
				.sistemaDeJuego(source.getSistemaDeJuego())
				.esPublico(false)
				.usuario(usuario)
				.build();

		copia.getHabilidades().addAll(source.getHabilidades());

		Personaje guardada = personajeRepository.save(copia);

		estadisticaService.clonarEstadisticasParaPersonaje(sourceId, guardada);
		mochilaService.clonarMochilaParaPersonaje(sourceId, guardada);

		return toResumen(guardada);
	}

	private boolean esInstancia(String tags) {
		return tags != null && tags.toLowerCase().contains("instancia");
	}

	private boolean estaPublicado(String tags) {
		return tags != null && tags.toLowerCase().contains("publicado");
	}

	private PersonajeResumenResponse toResumen(Personaje p) {
		return new PersonajeResumenResponse(
				p.getId(),
				p.getNombre(),
				p.getRetrato(),
				p.getSistemaDeJuego().getDisplayName(),
				p.getUsado(),
				tipoFromTags(p.getTags()),
				p.isEsPublico(),
				estaPublicado(p.getTags()),
				com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils.extractTagValue(p.getTags(), "fuenteId") != null
		);
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
		String baseTags = request.tags() != null && !request.tags().isBlank() ? request.tags().trim() : "NPC";

		// Encode attack bonus into tags for weapons
		String finalTags = baseTags;
		if (request.bonificacion() != null) {
			finalTags = finalTags + ",BONO;" + request.bonificacion();
		}

		boolean esArma = baseTags.toUpperCase().contains("ARMA");
		Habilidad habilidad;
		if (esArma) {
			// For weapons, always create a new exclusive Habilidad marked as custom (PROPIA;{personajeId})
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
	}

	@Transactional
	public PersonajeDetalleResponse actualizarArmaHabilidadNpc(Long personajeId, Long habilidadId, com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarArmaHabilidadNpcRequest request, String username) {
		if (request == null) {
			throw new ResponseStatusException(BAD_REQUEST, "No se recibió la actualización del arma");
		}
		Personaje personaje = obtenerPersonajeUsuario(personajeId, username);
		boolean pertenece = personaje.getHabilidades().stream().anyMatch(h -> h.getId().equals(habilidadId));
		if (!pertenece) {
			throw new ResponseStatusException(BAD_REQUEST, "El arma no pertenece a este personaje");
		}
		Habilidad habilidad = dndAbilityUtils.obtenerHabilidadPorId(habilidadId);

		// Rebuild tags: strip old BONO, append new BONO if provided
		String currentTags = habilidad.getTags() != null ? habilidad.getTags() : "";
		StringBuilder sb = new StringBuilder();
		for (String rawTag : currentTags.split(",")) {
			String tag = rawTag.trim();
			if (tag.isEmpty() || (tag.length() > 5 && tag.substring(0, 5).equalsIgnoreCase("BONO;"))) {
				continue;
			}
			if (sb.length() > 0) sb.append(",");
			sb.append(tag);
		}
		String newTags = sb.toString();
		if (request.bonificacion() != null) {
			if (!newTags.isEmpty()) newTags += ",";
			newTags += "BONO;" + request.bonificacion();
		}

		// Check if this weapon is exclusive to this NPC (marked with PROPIA;{personajeId})
		boolean esPropia = false;
		for (String rawTag : currentTags.split(",")) {
			if (rawTag.trim().equalsIgnoreCase("PROPIA;" + personajeId)) {
				esPropia = true;
				break;
			}
		}

		if (!esPropia) {
			// System weapon (inherited from template) — clone it exclusively for this NPC
			// so we never modify the shared template, then apply request changes to the clone.
			String cloneTags = newTags + ",PROPIA;" + personajeId;
			String cloneName = (request.nombre() != null && !request.nombre().isBlank())
					? request.nombre().trim() : habilidad.getNombre();
			String cloneFormula = request.formula() != null ? request.formula() : habilidad.getFormula();
			Habilidad clon = dndAbilityUtils.crearHabilidadArmaExclusiva(
					cloneName,
					habilidad.getDescripcion(),
					cloneFormula,
					cloneTags
			);
			final Long oldId = habilidadId;
			personaje.getHabilidades().removeIf(h -> h.getId().equals(oldId));
			personaje.getHabilidades().add(clon);
			personajeRepository.save(personaje);
		} else {
			// Custom weapon — update in place (name/formula preserved if not provided)
			dndAbilityUtils.actualizarHabilidadArma(habilidadId, request.nombre(), request.formula(), newTags);
		}

		emitirActualizacionPersonaje(personajeId);
		return obtenerDetallePersonaje(personajeId, username);
	}

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
			String currentTags = personaje.getTags() != null ? personaje.getTags() : "";
			StringBuilder sb = new StringBuilder();
			for (String part : currentTags.split(",")) {
				String t = part.trim();
				if (!t.isEmpty() && !t.startsWith("vd;")) {
					if (sb.length() > 0) sb.append(",");
					sb.append(t);
				}
			}
			String tagsWithoutVd = sb.toString();
			if (!request.vd().isBlank()) {
				if (!tagsWithoutVd.isEmpty()) tagsWithoutVd += ",";
				tagsWithoutVd += "vd;" + request.vd().trim();
			}
			personaje.setTags(tagsWithoutVd);
		}
		personajeRepository.save(personaje);

		if (request.estadisticas() != null && !request.estadisticas().isEmpty()) {
			// Preserve live HP before wiping all stats
			Map<String, Integer> currentStats = estadisticaService.obtenerValoresPorPersonajeId(personajeId);
			Integer vidaActual  = currentStats.get("Vida actual");
			Integer vidaTemporal = currentStats.get("Vida temporal");

			estadisticaService.eliminarEstadisticasPersonaje(personajeId);

			Map<String, Integer> statsToSave = new java.util.HashMap<>(request.estadisticas());
			int maxHp = statsToSave.getOrDefault("Puntos de vida",
					currentStats.getOrDefault("Puntos de vida", 1));
			// Re-insert current HP clamped to new max, keeping temporal HP as-is
			statsToSave.put("Vida actual",   vidaActual  != null ? Math.min(vidaActual, maxHp)  : maxHp);
			statsToSave.put("Vida temporal", vidaTemporal != null ? vidaTemporal : 0);

			estadisticaService.guardarEstadisticasNpc(personaje, statsToSave);
		}

		emitirActualizacionPersonaje(personajeId);
		return obtenerDetallePersonaje(personajeId, username);
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