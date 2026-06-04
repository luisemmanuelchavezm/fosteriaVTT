package com.fosteriaVTT.fosteriaVTT_backend.Mapa;

import com.fosteriaVTT.fosteriaVTT_backend.Cloudinary.CloudinaryService;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.UserRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario;
import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import com.fosteriaVTT.fosteriaVTT_backend.dto.MapaResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PagedResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class MapaService {

    private final MapaRepository mapaRepository;
	private final UserRepository userRepository;
	private final CloudinaryService cloudinaryService;

	public MapaService(
			MapaRepository mapaRepository,
			UserRepository userRepository,
			CloudinaryService cloudinaryService
	) {
	this.mapaRepository = mapaRepository;
	this.userRepository = userRepository;
	this.cloudinaryService = cloudinaryService;
    }

    private boolean estaPublicado(String tags) {
	return tags != null && tags.toLowerCase().contains("publicado");
    }

    private MapaResumenResponse toResumen(Mapa m) {
	String creador = m.getUsuario() != null ? m.getUsuario().getUsername() : "Desconocido";
	return new MapaResumenResponse(
		m.getId(),
		m.getNombre(),
		m.getMapa(),
		m.isEsPublico(),
		estaPublicado(m.getTags()),
		creador,
		false,  // yaTienesCopia solo se calcula en el marketplace
		TagUtils.extractTagValue(m.getTags(), "fuenteId") != null
	);
    }

    @Transactional(readOnly = true)
    public PagedResponse<MapaResumenResponse> obtenerMapasDeUsuario(
	    String username,
	    String nombre,
	    int page,
	    int size
    ) {
	String nombreNormalizado = nombre == null ? "" : nombre.trim().toLowerCase();

	Page<Mapa> resultPage = mapaRepository.buscarMapasPorUsuario(
		username,
		nombreNormalizado,
		PageRequest.of(Math.max(page, 0), Math.max(size, 1))
	);

	return new PagedResponse<>(
		resultPage.getContent().stream()
			.map(this::toResumen)
			.toList(),
		resultPage.hasNext()
	);
    }

    @Transactional
    public MapaResumenResponse crearMapa(
	    String username,
	    MultipartFile mapImage,
	    String nombre,
	    boolean esPublico,
	    String tagsRaw
    ) {
	if (mapImage == null || mapImage.isEmpty()) {
	    throw new ResponseStatusException(BAD_REQUEST, "Debes seleccionar una imagen para el mapa");
	}

	String nombreNormalizado = nombre == null ? "" : nombre.trim();
	if (nombreNormalizado.isBlank()) {
	    throw new ResponseStatusException(BAD_REQUEST, "El nombre del mapa es obligatorio");
	}
	if (nombreNormalizado.length() > 100) {
	    throw new ResponseStatusException(BAD_REQUEST, "El nombre del mapa no puede superar 100 caracteres");
	}

	List<String> tags = normalizarTags(tagsRaw);
	if (tags.size() > 3) {
	    throw new ResponseStatusException(BAD_REQUEST, "Solo puedes agregar hasta 3 tags");
	}
	if (tags.stream().anyMatch(tag -> tag.length() > 20)) {
	    throw new ResponseStatusException(BAD_REQUEST, "Cada tag puede tener maximo 20 caracteres");
	}

	Usuario usuario = userRepository.findByUsername(username)
		.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Usuario no encontrado"));

	String mapUrl;
	try {
	    mapUrl = cloudinaryService.uploadFile(mapImage);
	} catch (IOException ex) {
	    throw new ResponseStatusException(BAD_REQUEST, "No se pudo subir la imagen del mapa");
	}

	String tagsPersistidos = esPublico && !tags.isEmpty() ? String.join(",", tags) : null;

	Mapa mapaGuardado = mapaRepository.save(Mapa.builder()
		.nombre(nombreNormalizado)
		.mapa(mapUrl)
		.esPublico(esPublico)
		.tags(tagsPersistidos)
		.usuario(usuario)
		.build());

	return toResumen(mapaGuardado);
    }

    @Transactional
    public MapaResumenResponse publicarMapa(Long mapaId, String username) {
	Mapa source = mapaRepository.findById(mapaId)
		.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Mapa no encontrado"));

	if (source.getUsuario() == null || !source.getUsuario().getUsername().equals(username)) {
	    throw new ResponseStatusException(FORBIDDEN, "Solo el dueño puede publicar este mapa");
	}

	if (TagUtils.extractTagValue(source.getTags(), "fuenteId") != null) {
	    throw new ResponseStatusException(FORBIDDEN, "No puedes publicar un mapa guardado del marketplace");
	}

	if (estaPublicado(source.getTags())) {
	    throw new ResponseStatusException(CONFLICT, "Este mapa ya fue publicado");
	}

	Usuario usuario = userRepository.findByUsername(username)
		.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Usuario no encontrado"));

	// Marcar el original con "publicado"
	String sourceTags = source.getTags();
	String tagsConPublicado = (sourceTags != null && !sourceTags.isBlank())
		? sourceTags + ",publicado"
		: "publicado";
	source.setTags(tagsConPublicado);
	mapaRepository.save(source);

	// La copia lleva el fuenteId como tag
	String copiaTags = (sourceTags != null && !sourceTags.isBlank())
		? sourceTags + ",fuenteId;" + mapaId
		: "fuenteId;" + mapaId;

	Mapa copia = Mapa.builder()
		.nombre(source.getNombre())
		.mapa(source.getMapa())
		.esPublico(true)
		.tags(copiaTags)
		.usuario(usuario)
		.build();

	Mapa guardado = mapaRepository.save(copia);
	return toResumen(guardado);
    }

    @Transactional
    public MapaResumenResponse guardarMapa(Long mapaId, String username) {
	Mapa source = mapaRepository.findById(mapaId)
		.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Mapa no encontrado"));

	if (!source.isEsPublico()) {
	    throw new ResponseStatusException(FORBIDDEN, "Solo puedes guardar mapas públicos");
	}

	if (mapaRepository.existsByFuenteTagAndUsuarioUsername(String.valueOf(mapaId), username)) {
	    throw new ResponseStatusException(CONFLICT, "Ya tienes una copia guardada de este mapa");
	}

	Usuario usuario = userRepository.findByUsername(username)
		.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Usuario no encontrado"));

	// La copia privada también lleva el fuenteId como tag
	String sourceTags = source.getTags();
	String copiaTags = (sourceTags != null && !sourceTags.isBlank())
		? sourceTags + ",fuenteId;" + mapaId
		: "fuenteId;" + mapaId;

	Mapa copia = Mapa.builder()
		.nombre(source.getNombre())
		.mapa(source.getMapa())
		.esPublico(false)
		.tags(copiaTags)
		.usuario(usuario)
		.build();

	Mapa guardado = mapaRepository.save(copia);
	return toResumen(guardado);
    }

    /**
     * Crea una copia privada de un mapa público para ser usada en una campaña.
     * La copia lleva tags fuenteId;{sourceId},mapaInstancia y es invisible
     * en la lista de mapas del DM.
     */
    @Transactional
    public Mapa crearInstanciaParaCampaña(Mapa source, String dmUsername) {
        Usuario dm = userRepository.findByUsername(dmUsername)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Usuario no encontrado"));
        String copiaTags = "fuenteId;" + source.getId() + ",mapaInstancia";
        return mapaRepository.save(Mapa.builder()
                .nombre(source.getNombre())
                .mapa(source.getMapa())
                .esPublico(false)
                .tags(copiaTags)
                .usuario(dm)
                .build());
    }

    public static boolean esInstanciaDeCampaña(Mapa mapa) {
        if (mapa == null || mapa.getTags() == null) return false;
        return java.util.Arrays.stream(mapa.getTags().split(","))
                .map(String::trim)
                .anyMatch(t -> t.equalsIgnoreCase("mapaInstancia"));
    }

    @Transactional
    public void eliminarMapa(Long mapaId, String username) {
	Mapa mapa = mapaRepository.findById(mapaId)
		.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Mapa no encontrado"));

	if (mapa.getUsuario() == null || !mapa.getUsuario().getUsername().equals(username)) {
	    throw new ResponseStatusException(FORBIDDEN, "Solo el dueño puede borrar este mapa");
	}

	// Si es una copia pública (publicar), quitamos el tag "publicado" del original
	String fuenteIdStr = TagUtils.extractTagValue(mapa.getTags(), "fuenteId");
	if (mapa.isEsPublico() && fuenteIdStr != null) {
	    try {
		Long fuenteId = Long.parseLong(fuenteIdStr);
		mapaRepository.findById(fuenteId).ifPresent(fuente -> {
		    String tags = fuente.getTags();
		    if (tags != null && tags.toLowerCase().contains("publicado")) {
			String limpio = java.util.Arrays.stream(tags.split(","))
				.map(String::trim)
				.filter(t -> !t.equalsIgnoreCase("publicado"))
				.collect(java.util.stream.Collectors.joining(","));
			fuente.setTags(limpio.isBlank() ? null : limpio);
			mapaRepository.save(fuente);
		    }
		});
	    } catch (NumberFormatException ignored) { }
	}

	mapaRepository.delete(mapa);
    }

    private List<String> normalizarTags(String tagsRaw) {
	if (tagsRaw == null || tagsRaw.isBlank()) {
	    return List.of();
	}

	String[] splitTags = tagsRaw.split(",");
	List<String> tags = new ArrayList<>();
	for (String tag : splitTags) {
	    String normalizedTag = tag == null ? "" : tag.trim();
	    if (!normalizedTag.isBlank()) {
		tags.add(normalizedTag);
	    }
	}

	return tags;
    }
}
