package com.fosteriaVTT.fosteriaVTT_backend.Personaje;

import com.fosteriaVTT.fosteriaVTT_backend.dto.PersonajeResumenResponse;
import java.time.LocalDateTime;
import java.util.List;
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
	public List<PersonajeResumenResponse> obtenerPersonajesOrdenadosPorUso(String username) {
		return personajeRepository.findByUsuarioUsernameOrderByUsadoDesc(username).stream()
				.map(personaje -> new PersonajeResumenResponse(
						personaje.getId(),
						personaje.getNombre(),
						personaje.getRetrato(),
						personaje.getSistemaDeJuego().getDisplayName(),
						personaje.getUsado()
				))
				.toList();
	}

	@Transactional
	public void marcarComoUsado(Long personajeId, String username) {
		Personaje personaje = personajeRepository.findByIdAndUsuarioUsername(personajeId, username)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Personaje no encontrado"));

		personaje.setUsado(LocalDateTime.now());
		personajeRepository.save(personaje);
	}
}