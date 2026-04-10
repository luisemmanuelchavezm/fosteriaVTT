package com.fosteriaVTT.fosteriaVTT_backend.Campaña;

import com.fosteriaVTT.fosteriaVTT_backend.Jugador.Jugador;
import com.fosteriaVTT.fosteriaVTT_backend.Jugador.JugadorRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.UserRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario;
import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CampañaResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PagedResponse;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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
	public PagedResponse<CampañaResumenResponse> obtenerCampañasOrdenadasPorUltimoAcceso(
			String username,
			String nombre,
			List<String> sistemas,
			String dm,
			int page,
			int size
	) {
		Usuario usuario = userRepository.findByUsername(username)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Usuario no encontrado"));
		String nombreNormalizado = normalizarFiltro(nombre);
		String dmNormalizado = normalizarFiltro(dm);
		List<SistemaDeJuego> sistemasNormalizados = sistemas == null ? List.of() : sistemas.stream()
				.map(SistemaDeJuego::fromValue)
				.flatMap(java.util.Optional::stream)
				.toList();
		Page<Jugador> resultPage = jugadorRepository.buscarPorFiltros(
				usuario.getUsername(),
				nombreNormalizado,
				sistemasNormalizados,
				sistemasNormalizados.isEmpty(),
				dmNormalizado,
				PageRequest.of(Math.max(page, 0), Math.max(size, 1))
		);

		return new PagedResponse<>(
				resultPage.getContent().stream()
				.map(jugador -> new CampañaResumenResponse(
						jugador.getCampaña().getId(),
						jugador.getCampaña().getNombre(),
						jugador.getCampaña().getPortadaUrl(),
						jugador.getCampaña().getSistemaDeJuego().getDisplayName(),
						jugador.getCampaña().getDm().getUsername(),
						jugador.getUltimaVezAccedido()
				))
				.toList(),
				resultPage.hasNext()
		);
	}

	private String normalizarFiltro(String valor) {
		return valor == null ? "" : valor.trim().toLowerCase(Locale.ROOT);
	}
}