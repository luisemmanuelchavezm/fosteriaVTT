package com.fosteriaVTT.fosteriaVTT_backend.Personaje;

import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PagedResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PersonajeResumenResponse;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class PersonajeService {

	private final PersonajeRepository personajeRepository;

	public PersonajeService(PersonajeRepository personajeRepository) {
		this.personajeRepository = personajeRepository;
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
	public void marcarComoUsado(Long personajeId, String username) {
		Personaje personaje = personajeRepository.findByIdAndUsuarioUsername(personajeId, username)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Personaje no encontrado"));

		personaje.setUsado(LocalDateTime.now());
		personajeRepository.save(personaje);
	}

	private String normalizarFiltro(String valor) {
		return valor == null ? "" : valor.trim().toLowerCase(Locale.ROOT);
	}
}