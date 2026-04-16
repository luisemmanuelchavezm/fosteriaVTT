package com.fosteriaVTT.fosteriaVTT_backend.Personaje;

import com.fosteriaVTT.fosteriaVTT_backend.Cloudinary.CloudinaryService;
import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.EstadisticaService;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.HabilidadRepository;
import com.fosteriaVTT.fosteriaVTT_backend.InformacionDnd.DndInfoService;
import com.fosteriaVTT.fosteriaVTT_backend.Mochila.MochilaService;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.UserRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario;
import com.fosteriaVTT.fosteriaVTT_backend.common.DndCharacterRules;
import com.fosteriaVTT.fosteriaVTT_backend.common.DndCharacterValidationUtils;
import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CatalogoDndEleccion;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndLanzamientoConjurosResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClasePersonajeResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CrearPersonajeDndRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.HabilidadResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PagedResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PersonajeDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PersonajeResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndRasgoResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.SubrazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.TrasfondoDndDetalleResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
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
	private final UserRepository userRepository;
	private final DndInfoService dndInfoService;
	private final HabilidadRepository habilidadRepository;
	private final EstadisticaService estadisticaService;
	private final MochilaService mochilaService;
	private final CloudinaryService cloudinaryService;

	public PersonajeService(
			PersonajeRepository personajeRepository,
			UserRepository userRepository,
			DndInfoService dndInfoService,
			HabilidadRepository habilidadRepository,
			EstadisticaService estadisticaService,
			MochilaService mochilaService,
			CloudinaryService cloudinaryService
	) {
		this.personajeRepository = personajeRepository;
		this.userRepository = userRepository;
		this.dndInfoService = dndInfoService;
		this.habilidadRepository = habilidadRepository;
		this.estadisticaService = estadisticaService;
		this.mochilaService = mochilaService;
		this.cloudinaryService = cloudinaryService;
	}

	@Transactional(readOnly = true)
	 public PersonajeDetalleResponse obtenerDetallePersonaje(Long personajeId, String username) {
	 		Personaje personaje = personajeRepository.findByIdAndUsuarioUsername(personajeId, username)
	 				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Personaje no encontrado"));

	 		return new PersonajeDetalleResponse(
	 				personaje.getId(),
	 				personaje.getNombre(),
	 				personaje.getRetrato(),
	 				personaje.getSistemaDeJuego().getDisplayName(),
	 				TagUtils.extractTagValue(personaje.getTags(), "Raza"),
	 				TagUtils.extractTagValue(personaje.getTags(), "Subraza"),
	 				resolverClasesPersonaje(personaje),
		 			resolverCaracteristicaLanzamientoConjuros(personaje),
	 				estadisticaService.obtenerValoresPorPersonajeId(personajeId),
		 			personaje.getHabilidades().stream()
		 					.map(habilidad -> new HabilidadResponse(
		 							habilidad.getId(),
		 							habilidad.getNombre(),
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
		String nombreNormalizado = normalizarFiltro(nombre);
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
		if (request == null) {
			throw new ResponseStatusException(BAD_REQUEST, "No se recibió la información del personaje");
		}

		String nombre = DndCharacterRules.requireText(request.nombre(), "Debes indicar el nombre del personaje");
		MultipartFile retrato = validarRetrato(portrait);
		Usuario usuario = userRepository.findByUsername(username)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Usuario no encontrado"));
		ClaseDndDetalleResponse clase = dndInfoService.obtenerClasePorId(DndCharacterRules.requireText(request.claseId(), "Debes seleccionar una clase"))
				.orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "La clase seleccionada no existe"));
		TrasfondoDndDetalleResponse trasfondo = dndInfoService.obtenerTrasfondoPorId(DndCharacterRules.requireText(request.trasfondoId(), "Debes seleccionar un trasfondo"))
				.orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "El trasfondo seleccionado no existe"));
		RazaDndDetalleResponse raza = dndInfoService.obtenerRazaPorId(DndCharacterRules.requireText(request.razaId(), "Debes seleccionar una raza"))
				.orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "La raza seleccionada no existe"));
		SubrazaDndDetalleResponse subraza = DndCharacterValidationUtils.resolveSubrace(raza, request.subrazaId());
		Map<String, Integer> estadisticas = DndCharacterValidationUtils.validateStats(request.estadisticas());
		List<String> competenciasClase = DndCharacterValidationUtils.validateClassSkillChoices(clase.competencias().habilidades(), request.competenciasClase());
		Map<String, List<String>> eleccionesTrasfondo = DndCharacterValidationUtils.validateBackgroundChoices(trasfondo, request.eleccionesTrasfondo());
		Map<String, List<String>> eleccionesRaza = DndCharacterValidationUtils.validateRaceChoices(raza, subraza, request.eleccionesRaza());
		Map<String, Integer> gruposEquipamiento = DndCharacterRules.safeMap(request.gruposEquipamiento());
		Map<String, Long> catalogosEquipamiento = DndCharacterRules.safeMap(request.catalogosEquipamiento());
		Set<String> competenciasHabilidades = DndCharacterRules.resolveSkillCompetencies(
				competenciasClase,
				trasfondo,
				raza,
				subraza,
				eleccionesTrasfondo,
				eleccionesRaza
		);

		DndCharacterValidationUtils.validateEquipment("class", clase.equipamiento(), gruposEquipamiento, catalogosEquipamiento);
		DndCharacterValidationUtils.validateEquipment("background", trasfondo.equipamiento(), gruposEquipamiento, catalogosEquipamiento);

		Personaje personaje = Personaje.builder()
				.nombre(nombre)
				.retrato(subirRetrato(retrato))
				.sistemaDeJuego(SistemaDeJuego.DND)
				.tags(DndCharacterRules.buildCharacterTags(clase, raza, subraza, trasfondo, eleccionesRaza, eleccionesTrasfondo))
				.usuario(usuario)
				.habilidades(resolverHabilidadesIniciales(clase, raza, subraza, trasfondo, eleccionesRaza, eleccionesTrasfondo))
				.build();

		Personaje personajeGuardado = personajeRepository.save(personaje);
		estadisticaService.guardarEstadisticasIniciales(
				personajeGuardado,
				estadisticas,
				raza.velocidad(),
				clase.puntosGolpe().dadoGolpe(),
				clase.lanzamientoConjuros(),
				clase.competencias().salvaciones(),
				competenciasHabilidades
		);
		mochilaService.guardarMochilaInicial(
				personajeGuardado,
				clase.equipamiento(),
				trasfondo.equipamiento(),
				gruposEquipamiento,
				catalogosEquipamiento
		);

		return new PersonajeResumenResponse(
				personajeGuardado.getId(),
				personajeGuardado.getNombre(),
				personajeGuardado.getRetrato(),
				personajeGuardado.getSistemaDeJuego().getDisplayName(),
				personajeGuardado.getUsado()
		);
	}

	@Transactional
	public void marcarComoUsado(Long personajeId, String username) {
		Personaje personaje = personajeRepository.findByIdAndUsuarioUsername(personajeId, username)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Personaje no encontrado"));

		personaje.setUsado(LocalDateTime.now());
		personajeRepository.save(personaje);
	}

	private String normalizarFiltro(String valor) {
		return valor == null ? "" : valor.trim().toLowerCase(Locale.ROOT);
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

	private List<Habilidad> resolverHabilidadesIniciales(
			ClaseDndDetalleResponse clase,
			RazaDndDetalleResponse raza,
			SubrazaDndDetalleResponse subraza,
			TrasfondoDndDetalleResponse trasfondo,
			Map<String, List<String>> eleccionesRaza,
			Map<String, List<String>> eleccionesTrasfondo
	) {
		Map<String, Habilidad> habilidades = new LinkedHashMap<>();

		habilidadRepository.findAll().stream()
				.filter(habilidad -> Integer.valueOf(1).equals(TagUtils.extractClassLevel(habilidad.getTags(), clase.nombre())))
				.forEach(habilidad -> habilidades.putIfAbsent(TagUtils.normalizeText(habilidad.getNombre()), habilidad));

		agregarHabilidad(habilidades, resolverOCrearHabilidad(trasfondo.nombreRasgo(), trasfondo.descripcionRasgo(), null, "DND,TRASFONDO," + trasfondo.id()));
		agregarEntradasComoHabilidades(habilidades, trasfondo.competenciasHabilidades(), "Competencia: ", "Competencia inicial de trasfondo", "DND,TRASFONDO," + trasfondo.id());
		agregarEntradasComoHabilidades(habilidades, trasfondo.competenciasHerramientas(), "Competencia: ", "Competencia inicial de trasfondo", "DND,TRASFONDO," + trasfondo.id());
		agregarEntradasComoHabilidades(habilidades, raza.idiomas(), "Idioma: ", "Idioma racial", "DND,RAZA," + raza.id());
		agregarEntradasComoHabilidades(habilidades, raza.competencias(), "Competencia: ", "Competencia racial", "DND,RAZA," + raza.id());
		agregarRasgos(habilidades, raza.rasgos(), "DND,RAZA," + raza.id());

		if (subraza != null) {
			agregarEntradasComoHabilidades(habilidades, subraza.competencias(), "Competencia: ", "Competencia de subraza", "DND,SUBRAZA," + subraza.id());
			agregarRasgos(habilidades, subraza.rasgos(), "DND,SUBRAZA," + subraza.id());
		}

		agregarEleccionesComoHabilidades(
				habilidades,
				raza.elecciones(),
				eleccionesRaza,
				"DND,RAZA," + raza.id(),
				eleccion -> !"abilityScores".equalsIgnoreCase(eleccion.catalogo())
		);
		if (subraza != null) {
			agregarEleccionesComoHabilidades(
					habilidades,
					subraza.elecciones(),
					eleccionesRaza,
					"DND,SUBRAZA," + subraza.id(),
					eleccion -> !"abilityScores".equalsIgnoreCase(eleccion.catalogo())
			);
		}
		agregarEleccionesComoHabilidades(
				habilidades,
				trasfondo.elecciones(),
				eleccionesTrasfondo,
				"DND,TRASFONDO," + trasfondo.id(),
				eleccion -> true
		);

		return new ArrayList<>(habilidades.values());
	}

	private void agregarRasgos(Map<String, Habilidad> habilidades, List<RazaDndRasgoResponse> rasgos, String tags) {
		for (RazaDndRasgoResponse rasgo : rasgos) {
			agregarHabilidad(habilidades, resolverOCrearHabilidad(rasgo.titulo(), rasgo.descripcion(), null, tags));
		}
	}

	private void agregarEntradasComoHabilidades(
			Map<String, Habilidad> habilidades,
			Collection<String> entradas,
			String prefijo,
			String descripcion,
			String tags
	) {
		for (String entrada : entradas) {
			String valor = TagUtils.cleanValue(entrada);
			if (valor.isBlank()) {
				continue;
			}

			agregarHabilidad(habilidades, resolverOCrearHabilidad(prefijo + valor, descripcion, null, tags));
		}
	}

	private <T extends CatalogoDndEleccion> void agregarEleccionesComoHabilidades(
			Map<String, Habilidad> habilidades,
			List<T> elecciones,
			Map<String, List<String>> seleccionadas,
			String tags,
			Function<T, Boolean> debeIncluirse
	) {
		for (T eleccion : elecciones) {
			if (!debeIncluirse.apply(eleccion)) {
				continue;
			}

			for (String valor : seleccionadas.getOrDefault(eleccion.id(), List.of())) {
				String nombre = nombreHabilidadDesdeEleccion(eleccion.catalogo(), eleccion.etiqueta(), valor);
				agregarHabilidad(habilidades, resolverOCrearHabilidad(nombre, "Seleccion inicial de personaje", null, tags));
			}
		}
	}

	private String nombreHabilidadDesdeEleccion(String catalogo, String etiqueta, String valor) {
		if (catalogo == null) {
			return etiqueta + ": " + valor;
		}

		return switch (catalogo) {
			case "languages" -> "Idioma: " + valor;
			case "skills", "artisanTools", "games", "instruments" -> "Competencia: " + valor;
			default -> etiqueta + ": " + valor;
		};
	}

	private void agregarHabilidad(Map<String, Habilidad> habilidades, Habilidad habilidad) {
		habilidades.putIfAbsent(TagUtils.normalizeText(habilidad.getNombre()), habilidad);
	}

	private Habilidad resolverOCrearHabilidad(String nombre, String descripcion, String formula, String tags) {
		String nombreLimpio = DndCharacterRules.requireText(nombre, "La habilidad generada no tiene nombre");

		return habilidadRepository.findByNombreIgnoreCaseOrderByIdAsc(nombreLimpio).stream()
				.findFirst()
				.orElseGet(() -> habilidadRepository.save(Habilidad.builder()
						.nombre(nombreLimpio)
						.descripcion(descripcion)
						.formula(formula)
						.tags(tags)
						.build()));
	}

	private List<ClasePersonajeResponse> resolverClasesPersonaje(Personaje personaje) {
		Map<String, Integer> clases = new LinkedHashMap<>();
		extraerClasesDesdeTags(clases, personaje.getTags());

		if (clases.isEmpty()) {
			for (Habilidad habilidad : personaje.getHabilidades()) {
				extraerClasesDesdeTags(clases, habilidad.getTags());
			}
		}

		return clases.entrySet().stream()
				.map(entry -> new ClasePersonajeResponse(entry.getKey(), entry.getValue()))
				.toList();
	}

	private String resolverCaracteristicaLanzamientoConjuros(Personaje personaje) {
		List<ClasePersonajeResponse> clases = resolverClasesPersonaje(personaje);
		if (clases.isEmpty()) {
			return null;
		}

		String nombreClase = clases.getFirst().nombre();
		return dndInfoService.obtenerClases().stream()
				.filter(item -> TagUtils.normalizeText(item.nombre()).equals(TagUtils.normalizeText(nombreClase)))
				.findFirst()
				.flatMap(resumen -> dndInfoService.obtenerClasePorId(resumen.id()))
				.map(ClaseDndDetalleResponse::lanzamientoConjuros)
				.map(ClaseDndLanzamientoConjurosResponse::caracteristica)
				.orElse(null);
	}

	private void extraerClasesDesdeTags(Map<String, Integer> clases, String tags) {
		TagUtils.extractClasses(tags).forEach((name, level) -> clases.merge(name, level, Math::max));
	}
}