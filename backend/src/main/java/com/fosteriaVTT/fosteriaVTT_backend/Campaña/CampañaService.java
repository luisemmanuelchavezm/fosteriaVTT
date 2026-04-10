package com.fosteriaVTT.fosteriaVTT_backend.Campaña;

import com.fosteriaVTT.fosteriaVTT_backend.Jugador.JugadorRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.UserRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CampañaResumenResponse;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class CampañaService {

	private final JugadorRepository jugadorRepository;
	private final UserRepository userRepository;

	public CampañaService(JugadorRepository jugadorRepository, UserRepository userRepository) {
		this.jugadorRepository = jugadorRepository;
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public List<CampañaResumenResponse> obtenerUltimasCampañas(String username) {
		Usuario usuario = userRepository.findByUsername(username)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Usuario no encontrado"));

		return jugadorRepository.findTop5ByUsuarioIdOrderByUltimaVezAccedidoDesc(usuario.getId()).stream()
				.map(jugador -> new CampañaResumenResponse(
						jugador.getCampaña().getId(),
						jugador.getCampaña().getNombre(),
						jugador.getCampaña().getPortadaUrl(),
						jugador.getCampaña().getSistemaDeJuego().getDisplayName(),
						jugador.getCampaña().getDm().getUsername(),
						jugador.getUltimaVezAccedido()
				))
				.toList();
	}

	@Transactional(readOnly = true)
	public List<CampañaResumenResponse> obtenerCampañasOrdenadasPorUltimoAcceso(String username) {
		Usuario usuario = userRepository.findByUsername(username)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Usuario no encontrado"));

		return jugadorRepository.findByUsuarioIdOrderByUltimaVezAccedidoDesc(usuario.getId()).stream()
				.map(jugador -> new CampañaResumenResponse(
						jugador.getCampaña().getId(),
						jugador.getCampaña().getNombre(),
						jugador.getCampaña().getPortadaUrl(),
						jugador.getCampaña().getSistemaDeJuego().getDisplayName(),
						jugador.getCampaña().getDm().getUsername(),
						jugador.getUltimaVezAccedido()
				))
				.toList();
	}
}