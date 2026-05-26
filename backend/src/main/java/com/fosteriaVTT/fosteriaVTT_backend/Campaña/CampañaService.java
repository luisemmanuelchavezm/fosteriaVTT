package com.fosteriaVTT.fosteriaVTT_backend.Campaña;

import com.fosteriaVTT.fosteriaVTT_backend.Cloudinary.CloudinaryService;
import com.fosteriaVTT.fosteriaVTT_backend.Jugador.Jugador;
import com.fosteriaVTT.fosteriaVTT_backend.Jugador.JugadorRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.UserRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario;
import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CampañaResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CrearCampañaRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.JugadorCampañaResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PagedResponse;
import java.io.IOException;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class CampañaService {

	private final JugadorRepository jugadorRepository;
	private final UserRepository userRepository;
	private final CampañaRepository campañaRepository;
	private final CloudinaryService cloudinaryService;

	public CampañaService(
			JugadorRepository jugadorRepository,
			UserRepository userRepository,
			CampañaRepository campañaRepository,
			CloudinaryService cloudinaryService
	) {
		this.jugadorRepository = jugadorRepository;
		this.userRepository = userRepository;
		this.campañaRepository = campañaRepository;
		this.cloudinaryService = cloudinaryService;
	}

	@Transactional
	public CampañaResumenResponse crearCampaña(CrearCampañaRequest request, MultipartFile cover, String username) {
		if (request == null) {
			throw new ResponseStatusException(BAD_REQUEST, "No se recibió la información de la campaña");
		}

		String nombre = request.nombre() == null ? "" : request.nombre().trim();
		if (nombre.isBlank()) {
			throw new ResponseStatusException(BAD_REQUEST, "El nombre de la campaña es obligatorio");
		}

		SistemaDeJuego sistema = SistemaDeJuego.fromValue(request.sistemaDeJuego())
				.orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "El sistema de juego es obligatorio"));

		if (sistema == SistemaDeJuego.VAMPIRE) {
			throw new ResponseStatusException(BAD_REQUEST, "Solo se permiten campañas de Dungeons and Dragons o Call Of Cthulhu");
		}

		Usuario usuario = userRepository.findByUsername(username)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Usuario no encontrado"));

		String portadaUrl = null;
		if (cover != null && !cover.isEmpty()) {
			try {
				portadaUrl = cloudinaryService.uploadFile(cover);
			} catch (IOException ex) {
				throw new ResponseStatusException(BAD_REQUEST, "No se pudo subir la portada de la campaña");
			}
		}

		Campaña campaña = Campaña.builder()
				.nombre(nombre)
				.sistemaDeJuego(sistema)
				.dm(usuario)
				.build();

		if (portadaUrl != null && !portadaUrl.isBlank()) {
			campaña.setPortadaUrl(portadaUrl);
		}

		Campaña campañaGuardada = campañaRepository.save(campaña);

		Jugador jugador = Jugador.builder()
				.usuario(usuario)
				.campaña(campañaGuardada)
				.build();
		Jugador jugadorGuardado = jugadorRepository.save(jugador);

		return new CampañaResumenResponse(
				campañaGuardada.getId(),
				campañaGuardada.getNombre(),
				campañaGuardada.getPortadaUrl(),
				campañaGuardada.getSistemaDeJuego().getDisplayName(),
				campañaGuardada.getDm().getUsername(),
				jugadorGuardado.getUltimaVezAccedido()
		);
	}

	/** Une al usuario autenticado a la campaña como jugador.
	 *  Es idempotente: si ya es jugador no lanza error. */
	@Transactional
	public void unirseCampaña(Long campaniaId, String username) {
		Campaña campaña = campañaRepository.findById(campaniaId)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Campaña no encontrada"));

		Usuario usuario = userRepository.findByUsername(username)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Usuario no encontrado"));

		// Idempotente: si ya es jugador no hace nada
		if (jugadorRepository.buscarPorUsuarioYCampaniaId(username, campaniaId).isPresent()) {
			return;
		}

		Jugador jugador = Jugador.builder()
				.usuario(usuario)
				.campaña(campaña)
				.build();
		jugadorRepository.save(jugador);
	}

	@Transactional(readOnly = true)
	public List<JugadorCampañaResponse> obtenerJugadoresCampaña(Long campaniaId, String username) {
		jugadorRepository.buscarPorUsuarioYCampaniaId(username, campaniaId)
				.orElseThrow(() -> new ResponseStatusException(FORBIDDEN, "No tienes acceso a esta campaña"));

		return jugadorRepository.findByCampañaIdOrderByUsuarioUsernameAsc(campaniaId).stream()
				.map(jugador -> new JugadorCampañaResponse(
						jugador.getUsuario().getUsername(),
						jugador.getCampaña().getDm().getId().equals(jugador.getUsuario().getId())
				))
				.toList();
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