package com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils;

import com.fosteriaVTT.fosteriaVTT_backend.Chat.ChatService;
import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.EstadisticaService;
import com.fosteriaVTT.fosteriaVTT_backend.InformacionDnd.DndInfoService;
import com.fosteriaVTT.fosteriaVTT_backend.Mochila.Mochila;
import com.fosteriaVTT.fosteriaVTT_backend.Mochila.MochilaService;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.PersonajeRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.UserRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario;
import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import com.fosteriaVTT.fosteriaVTT_backend.common.dnd.DndCharacterRules;
import com.fosteriaVTT.fosteriaVTT_backend.common.dnd.DndCharacterValidationUtils;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndSubclaseResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CrearPersonajeDndRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PersonajeResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.SubirNivelPersonajeRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.SubrazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.TrasfondoDndDetalleResponse;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class DndCharacterCreationUtils {

	private final UserRepository userRepository;
	private final PersonajeRepository personajeRepository;
	private final DndInfoService dndInfoService;
	private final MochilaService mochilaService;
	private final EstadisticaService estadisticaService;
	private final ChatService chatService;
	private final DndAbilityUtils dndAbilityUtils;
	private final DndCombatUtils dndCombatUtils;
	private final DndCharacterProgressionUtils dndCharacterProgressionUtils;

	public DndCharacterCreationUtils(
			UserRepository userRepository,
			PersonajeRepository personajeRepository,
			DndInfoService dndInfoService,
			MochilaService mochilaService,
			EstadisticaService estadisticaService,
			ChatService chatService,
			DndAbilityUtils dndAbilityUtils,
			DndCombatUtils dndCombatUtils,
			DndCharacterProgressionUtils dndCharacterProgressionUtils
	) {
		this.userRepository = userRepository;
		this.personajeRepository = personajeRepository;
		this.dndInfoService = dndInfoService;
		this.mochilaService = mochilaService;
		this.estadisticaService = estadisticaService;
		this.chatService = chatService;
		this.dndAbilityUtils = dndAbilityUtils;
		this.dndCombatUtils = dndCombatUtils;
		this.dndCharacterProgressionUtils = dndCharacterProgressionUtils;
	}

	public PersonajeResumenResponse crearPersonajeDnd(CrearPersonajeDndRequest request, String retratoUrl, String username) {
		CreateCharacterContext context = prepararCreacionPersonaje(request, retratoUrl, username);
		Personaje personaje = construirPersonajeInicial(context);
		Personaje personajeGuardado = personajeRepository.save(personaje);
		registrarProgresionInicial(personajeGuardado, context);
		List<Mochila> mochilaInicial = guardarMochilaInicial(personajeGuardado, context);
		guardarEstadisticasIniciales(personajeGuardado, context, mochilaInicial);
		return construirResumenPersonaje(personajeGuardado);
	}

	private CreateCharacterContext prepararCreacionPersonaje(CrearPersonajeDndRequest request, String retratoUrl, String username) {
		if (request == null) {
			throw new ResponseStatusException(BAD_REQUEST, "No se recibió la información del personaje");
		}

		String nombre = DndCharacterRules.requireText(request.nombre(), "Debes indicar el nombre del personaje");
		Usuario usuario = userRepository.findByUsername(username)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Usuario no encontrado"));
		ClaseDndDetalleResponse clase = obtenerClase(request.claseId(), "Debes seleccionar una clase");
		ClaseDndSubclaseResponse subclaseClase = dndCharacterProgressionUtils.resolverSubclaseInicial(clase, request.subclaseId());
		TrasfondoDndDetalleResponse trasfondo = obtenerTrasfondo(request.trasfondoId());
		RazaDndDetalleResponse raza = obtenerRaza(request.razaId());
		SubrazaDndDetalleResponse subraza = DndCharacterValidationUtils.resolveSubrace(raza, request.subrazaId());
		Map<String, Integer> estadisticas = DndCharacterValidationUtils.validateStats(request.estadisticas());
		DndCharacterValidationUtils.ValidatedClassChoices eleccionesClase = DndCharacterValidationUtils.validateClassChoices(clase, request.eleccionesClase(), request.competenciasClase());
		Map<String, List<String>> eleccionesTrasfondo = DndCharacterValidationUtils.validateBackgroundChoices(trasfondo, request.eleccionesTrasfondo());
		Map<String, List<String>> eleccionesRaza = DndCharacterValidationUtils.validateRaceChoices(raza, subraza, request.eleccionesRaza());
		Map<String, Integer> gruposEquipamiento = DndCharacterRules.safeMap(request.gruposEquipamiento());
		Map<String, Long> catalogosEquipamiento = DndCharacterRules.safeMap(request.catalogosEquipamiento());
		validarEquipamientoInicial(clase, trasfondo, gruposEquipamiento, catalogosEquipamiento);

		Set<String> competenciasHabilidades = DndCharacterRules.resolveSkillCompetencies(
				eleccionesClase.selectedSkills(),
				trasfondo,
				raza,
				subraza,
				eleccionesTrasfondo,
				eleccionesRaza
		);

		return new CreateCharacterContext(
				request,
				nombre,
				retratoUrl,
				usuario,
				clase,
				subclaseClase,
				trasfondo,
				raza,
				subraza,
				estadisticas,
				eleccionesClase,
				eleccionesTrasfondo,
				eleccionesRaza,
				gruposEquipamiento,
				catalogosEquipamiento,
				competenciasHabilidades
		);
	}

	private Personaje construirPersonajeInicial(CreateCharacterContext context) {
		return Personaje.builder()
				.nombre(context.nombre())
				.biografia(DndCharacterNormalizers.construirBiografia(context.request().alineamiento(), context.request().historiaPersonal()))
				.retrato(context.retratoUrl())
				.sistemaDeJuego(SistemaDeJuego.DND)
				.tags(DndCharacterRules.buildCharacterTags(context.clase(), context.subclaseClase(), context.raza(), context.subraza(), context.trasfondo(), context.eleccionesRaza(), context.eleccionesTrasfondo()))
				.usuario(context.usuario())
				.habilidades(dndAbilityUtils.resolverHabilidadesIniciales(context.clase(), context.subclaseClase(), context.raza(), context.subraza(), context.trasfondo(), context.eleccionesClase().selectedChoices(), context.eleccionesRaza(), context.eleccionesTrasfondo()))
				.build();
	}

	private void registrarProgresionInicial(Personaje personajeGuardado, CreateCharacterContext context) {
		chatService.registrarEleccionProgresion(
				personajeGuardado,
				context.clase().id(),
				1,
				new SubirNivelPersonajeRequest(
						context.clase().id(),
						context.subclaseClase() == null ? null : context.subclaseClase().id(),
						context.eleccionesClase().selectedChoices(),
						null,
						null,
						null,
						null
				),
				context.subclaseClase()
		);
	}

	private List<Mochila> guardarMochilaInicial(Personaje personajeGuardado, CreateCharacterContext context) {
		List<Mochila> mochilaInicial = mochilaService.guardarMochilaInicial(
				personajeGuardado,
				context.clase().equipamiento(),
				context.trasfondo().equipamiento(),
				context.gruposEquipamiento(),
				context.catalogosEquipamiento()
		);
		dndCombatUtils.agregarHabilidadesDeCombate(personajeGuardado, mochilaInicial, context.raza(), context.subraza(), context.eleccionesRaza());
		return mochilaInicial;
	}

	private void guardarEstadisticasIniciales(Personaje personajeGuardado, CreateCharacterContext context, List<Mochila> mochilaInicial) {
		estadisticaService.guardarEstadisticasIniciales(
				personajeGuardado,
				context.estadisticas(),
				context.raza().velocidad(),
				context.clase().puntosGolpe().dadoGolpe(),
				context.clase().lanzamientoConjuros(),
				context.clase().competencias().salvaciones(),
				context.competenciasHabilidades(),
				Set.of(),
				mochilaInicial,
				personajeGuardado.getHabilidades()
		);
	}

	private PersonajeResumenResponse construirResumenPersonaje(Personaje personaje) {
		return new PersonajeResumenResponse(
				personaje.getId(),
				personaje.getNombre(),
				personaje.getRetrato(),
				personaje.getSistemaDeJuego().getDisplayName(),
				personaje.getUsado(),
				"personaje",
				personaje.isEsPublico(),
				false,
				com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils.extractTagValue(personaje.getTags(), "fuenteId") != null
		);
	}

	private void validarEquipamientoInicial(
			ClaseDndDetalleResponse clase,
			TrasfondoDndDetalleResponse trasfondo,
			Map<String, Integer> gruposEquipamiento,
			Map<String, Long> catalogosEquipamiento
	) {
		DndCharacterValidationUtils.validateEquipment("class", clase.equipamiento(), gruposEquipamiento, catalogosEquipamiento);
		DndCharacterValidationUtils.validateEquipment("background", trasfondo.equipamiento(), gruposEquipamiento, catalogosEquipamiento);
	}

	private ClaseDndDetalleResponse obtenerClase(String claseId, String mensajeSiFalta) {
		return dndInfoService.obtenerClasePorId(DndCharacterRules.requireText(claseId, mensajeSiFalta))
				.orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "La clase seleccionada no existe"));
	}

	private TrasfondoDndDetalleResponse obtenerTrasfondo(String trasfondoId) {
		return dndInfoService.obtenerTrasfondoPorId(DndCharacterRules.requireText(trasfondoId, "Debes seleccionar un trasfondo"))
				.orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "El trasfondo seleccionado no existe"));
	}

	private RazaDndDetalleResponse obtenerRaza(String razaId) {
		return dndInfoService.obtenerRazaPorId(DndCharacterRules.requireText(razaId, "Debes seleccionar una raza"))
				.orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "La raza seleccionada no existe"));
	}

	private record CreateCharacterContext(
			CrearPersonajeDndRequest request,
			String nombre,
			String retratoUrl,
			Usuario usuario,
			ClaseDndDetalleResponse clase,
			ClaseDndSubclaseResponse subclaseClase,
			TrasfondoDndDetalleResponse trasfondo,
			RazaDndDetalleResponse raza,
			SubrazaDndDetalleResponse subraza,
			Map<String, Integer> estadisticas,
			DndCharacterValidationUtils.ValidatedClassChoices eleccionesClase,
			Map<String, List<String>> eleccionesTrasfondo,
			Map<String, List<String>> eleccionesRaza,
			Map<String, Integer> gruposEquipamiento,
			Map<String, Long> catalogosEquipamiento,
			Set<String> competenciasHabilidades
	) {}
}