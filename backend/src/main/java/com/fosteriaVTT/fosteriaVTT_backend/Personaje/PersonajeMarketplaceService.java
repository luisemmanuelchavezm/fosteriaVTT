package com.fosteriaVTT.fosteriaVTT_backend.Personaje;

import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.EstadisticaService;
import com.fosteriaVTT.fosteriaVTT_backend.Mochila.MochilaService;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.UserRepository;
import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PersonajeResumenResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Operaciones del marketplace de personajes: publicar, guardar e instanciar.
 * Las operaciones genéricas de personaje (detalle, mochila, nivel…)
 * se mantienen en {@link PersonajeService}.
 */
@Service
public class PersonajeMarketplaceService {

	private final PersonajeRepository personajeRepository;
	private final UserRepository userRepository;
	private final EstadisticaService estadisticaService;
	private final MochilaService mochilaService;
	private final PersonajeService personajeService;

	public PersonajeMarketplaceService(
			PersonajeRepository personajeRepository,
			UserRepository userRepository,
			EstadisticaService estadisticaService,
			MochilaService mochilaService,
			PersonajeService personajeService
	) {
		this.personajeRepository = personajeRepository;
		this.userRepository = userRepository;
		this.estadisticaService = estadisticaService;
		this.mochilaService = mochilaService;
		this.personajeService = personajeService;
	}

	// ─────────────────────────────────────────────
	// Instanciar
	// ─────────────────────────────────────────────

	/**
	 * Crea una copia privada del personaje para usarla en campaña.
	 * El personaje fuente puede ser público o propio del usuario.
	 */
	@Transactional
	public PersonajeResumenResponse instanciarPersonaje(Long sourceId, String username, String nombreOverride) {
		Personaje source = personajeRepository.findById(sourceId)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Personaje no encontrado"));

		boolean esPropio = source.getUsuario() != null && source.getUsuario().getUsername().equals(username);
		if (!source.isEsPublico() && !esPropio) {
			throw new ResponseStatusException(FORBIDDEN, "No tienes acceso a este personaje");
		}

		com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario usuario = userRepository.findByUsername(username)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Usuario no encontrado"));

		String sourceTags = source.getTags();
		String instanceTags = (sourceTags != null && !sourceTags.isBlank())
				? sourceTags + ",instancia"
				: "instancia";

		String nombreFinal = (nombreOverride != null && !nombreOverride.isBlank())
				? nombreOverride
				: source.getNombre();

		Personaje instancia = Personaje.builder()
				.nombre(nombreFinal)
				.tags(instanceTags)
				.retrato(source.getRetrato())
				.biografia(source.getBiografia())
				.sistemaDeJuego(source.getSistemaDeJuego())
				.esPublico(false)
				.usuario(usuario)
				.build();

		instancia.getHabilidades().addAll(source.getHabilidades());

		Personaje guardada = personajeRepository.save(instancia);

		estadisticaService.clonarEstadisticasParaPersonaje(sourceId, guardada);
		mochilaService.clonarMochilaParaPersonaje(sourceId, guardada);

		return personajeService.toResumen(guardada);
	}

	// ─────────────────────────────────────────────
	// Publicar
	// ─────────────────────────────────────────────

	/**
	 * Crea una copia pública del personaje y marca el original como "publicado"
	 * para evitar doble publicación.
	 */
	@Transactional
	public PersonajeResumenResponse publicarPersonaje(Long sourceId, String username) {
		Personaje source = personajeRepository.findById(sourceId)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Personaje no encontrado"));

		if (source.getUsuario() == null || !source.getUsuario().getUsername().equals(username)) {
			throw new ResponseStatusException(FORBIDDEN, "Solo el dueño puede publicar este personaje");
		}

		if (TagUtils.extractTagValue(source.getTags(), "fuenteId") != null) {
			throw new ResponseStatusException(FORBIDDEN, "No puedes publicar un personaje guardado del marketplace");
		}

		if (personajeService.estaPublicado(source.getTags())) {
			throw new ResponseStatusException(CONFLICT, "Este personaje ya fue publicado");
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

		// La copia pública lleva el fuenteId como tag
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

		return personajeService.toResumen(guardada);
	}

	// ─────────────────────────────────────────────
	// Guardar del marketplace
	// ─────────────────────────────────────────────

	/**
	 * Guarda en la colección privada del usuario una copia de un personaje público.
	 */
	@Transactional
	public PersonajeResumenResponse guardarPersonaje(Long sourceId, String username) {
		Personaje source = personajeRepository.findById(sourceId)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Personaje no encontrado"));

		if (!source.isEsPublico()) {
			throw new ResponseStatusException(FORBIDDEN, "Solo puedes guardar personajes públicos");
		}

		if (personajeRepository.existsByFuenteTagAndUsuarioUsername(String.valueOf(sourceId), username)) {
			throw new ResponseStatusException(CONFLICT, "Ya tienes una copia guardada de este personaje");
		}

		com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario usuario = userRepository.findByUsername(username)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Usuario no encontrado"));

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

		return personajeService.toResumen(guardada);
	}
}
