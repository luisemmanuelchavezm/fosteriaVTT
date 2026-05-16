package com.fosteriaVTT.fosteriaVTT_backend.Mapa;

import com.fosteriaVTT.fosteriaVTT_backend.Cloudinary.CloudinaryService;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.UserRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario;
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
			.map(mapa -> new MapaResumenResponse(
				mapa.getId(),
				mapa.getNombre(),
				mapa.getMapa(),
				mapa.isEsPublico()
			))
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

	return new MapaResumenResponse(
		mapaGuardado.getId(),
		mapaGuardado.getNombre(),
		mapaGuardado.getMapa(),
		mapaGuardado.isEsPublico()
	);
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