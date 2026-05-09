package com.fosteriaVTT.fosteriaVTT_backend.Personaje;

import com.fosteriaVTT.fosteriaVTT_backend.Cloudinary.CloudinaryService;
import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.EstadisticaService;
import com.fosteriaVTT.fosteriaVTT_backend.Mochila.MochilaService;
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
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarRecursosPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarHojaPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarExperienciaPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.AgregarHabilidadPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.AgregarItemMochilaRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ActualizarItemMochilaRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.BajarNivelPersonajeRequest;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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
			DndCharacterLevelUtils dndCharacterLevelUtils
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
	}

	@Transactional(readOnly = true)
	 public PersonajeDetalleResponse obtenerDetallePersonaje(Long personajeId, String username) {
	 		Personaje personaje = obtenerPersonajeUsuario(personajeId, username);
			Map<String, Integer> estadisticas = estadisticaService.obtenerValoresPorPersonajeId(personajeId);

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
		 			personaje.getHabilidades().stream()
		 					.map(habilidad -> new HabilidadResponse(
		 							habilidad.getId(),
		 							habilidad.getNombre(),
			 							dndCombatUtils.resolverBonificacionHabilidad(personaje, habilidad, estadisticas),
		 							habilidad.getFormula(),
		 							habilidad.getDescripcion(),
		 							habilidad.getTags()
		 					))
		 					.toList(),
		 				mochilaService.obtenerItemsPersonaje(personajeId),
	 				personaje.getUsado()
	 		);
	 }

		@Transactional(readOnly = true)
	public PagedResponse<PersonajeResumenResponse> obtenerPersonajesOrdenadosPorUso(
			String username,
			String nombre,
			List<String> sistemas,
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
				PageRequest.of(Math.max(page, 0), Math.max(size, 1))
		);

		return new PagedResponse<>(
				resultPage.getContent().stream()
						.map(personaje -> new PersonajeResumenResponse(
								personaje.getId(),
								personaje.getNombre(),
								personaje.getRetrato(),
								personaje.getSistemaDeJuego().getDisplayName(),
								personaje.getUsado()
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
		return obtenerDetallePersonaje(personajeId, username);
	}

	@Transactional
	public PersonajeDetalleResponse eliminarItemMochila(Long personajeId, Long itemId, String username) {
		Personaje personaje = obtenerPersonajeUsuario(personajeId, username);

		mochilaService.eliminarItemPersonajeDnd(personaje, itemId);
		return obtenerDetallePersonaje(personajeId, username);
	}

	@Transactional
	public PersonajeDetalleResponse agregarHabilidad(Long personajeId, AgregarHabilidadPersonajeRequest request, String username) {
		if (request == null || request.habilidadId() == null) {
			throw new ResponseStatusException(BAD_REQUEST, "No se recibió la habilidad a añadir");
		}

		Personaje personaje = obtenerPersonajeUsuario(personajeId, username);
		dndCharacterAbilityManagementUtils.agregarHabilidadManual(personaje, request.habilidadId());

		return obtenerDetallePersonaje(personajeId, username);
	}

	@Transactional
	public PersonajeDetalleResponse eliminarHabilidad(Long personajeId, Long habilidadId, String username) {
		Personaje personaje = obtenerPersonajeUsuario(personajeId, username);
		dndCharacterAbilityManagementUtils.eliminarHabilidadManual(personaje, habilidadId);
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
		return obtenerDetallePersonaje(personajeId, username);
	}

	@Transactional
	public PersonajeDetalleResponse bajarNivel(Long personajeId, BajarNivelPersonajeRequest request, String username) {
		dndCharacterLevelUtils.bajarNivel(personajeId, request, username);
		return obtenerDetallePersonaje(personajeId, username);
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

	private Personaje obtenerPersonajeUsuario(Long personajeId, String username) {
		return personajeRepository.findByIdAndUsuarioUsername(personajeId, username)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Personaje no encontrado"));
	}
}