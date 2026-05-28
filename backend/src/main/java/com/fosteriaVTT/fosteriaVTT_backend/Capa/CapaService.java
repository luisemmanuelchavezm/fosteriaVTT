package com.fosteriaVTT.fosteriaVTT_backend.Capa;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

import com.fosteriaVTT.fosteriaVTT_backend.Jugador.JugadorRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Mapa.Mapa;
import com.fosteriaVTT.fosteriaVTT_backend.Mapa.MapaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Pestaña.Pestaña;
import com.fosteriaVTT.fosteriaVTT_backend.Pestaña.PestañaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.dto.AsignarMapaCapaRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CapaMapaResponse;
import java.util.Objects;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CapaService {

	private static final int NIVEL_CAPA_MAPA = 2;

	private final CapaRepository capaRepository;
	private final PestañaRepository pestañaRepository;
	private final MapaRepository mapaRepository;
	private final JugadorRepository jugadorRepository;
	private final SimpMessagingTemplate messagingTemplate;

	public CapaService(
			CapaRepository capaRepository,
			PestañaRepository pestañaRepository,
			MapaRepository mapaRepository,
			JugadorRepository jugadorRepository,
			SimpMessagingTemplate messagingTemplate
	) {
		this.capaRepository = capaRepository;
		this.pestañaRepository = pestañaRepository;
		this.mapaRepository = mapaRepository;
		this.jugadorRepository = jugadorRepository;
		this.messagingTemplate = messagingTemplate;
	}

	@Transactional
	public CapaMapaResponse asignarMapaACapa(Long campañaId, AsignarMapaCapaRequest request, String username) {
		if (request == null) {
			throw new ResponseStatusException(BAD_REQUEST, "No se recibió la selección de mapa");
		}

		validarAccesoCampaña(campañaId, username);

		if (request.pestanaId() == null || request.pestanaId() <= 0) {
			throw new ResponseStatusException(BAD_REQUEST, "La pestaña no es válida");
		}

		if (request.mapaId() == null || request.mapaId() <= 0) {
			throw new ResponseStatusException(BAD_REQUEST, "El mapa no es válido");
		}

		Pestaña pestaña = pestañaRepository.findById(request.pestanaId())
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "La pestaña no existe"));

		Long campañaDePestaña = pestaña.getCampaña() == null ? null : pestaña.getCampaña().getId();
		if (!Objects.equals(campañaDePestaña, campañaId)) {
			throw new ResponseStatusException(FORBIDDEN, "La pestaña no pertenece a la campaña");
		}

		Capa capaMapa = capaRepository.findByPestañaIdAndNivelDeCapa(request.pestanaId(), NIVEL_CAPA_MAPA)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "No existe la capa de mapa en la pestaña"));

		// Allow the user to assign maps they own OR any public map (marketplace)
		Mapa mapa = mapaRepository.findById(request.mapaId())
				.filter(m -> {
					String owner = m.getUsuario() != null ? m.getUsuario().getUsername() : null;
					return username.equals(owner) || m.isEsPublico();
				})
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "No se encontró el mapa seleccionado"));

		capaMapa.setMapa(mapa);
		Capa guardada = capaRepository.save(capaMapa);

		return new CapaMapaResponse(
				guardada.getId(),
				guardada.getPestaña() == null ? null : guardada.getPestaña().getId(),
				guardada.getMapa() == null ? null : guardada.getMapa().getId(),
				guardada.getMapa() == null ? null : guardada.getMapa().getMapa()
		);
	}

	@Transactional
	public CapaMapaResponse asignarMapaACapaYEmitir(Long campañaId, AsignarMapaCapaRequest request, String username) {
		CapaMapaResponse response = asignarMapaACapa(campañaId, request, username);
		messagingTemplate.convertAndSend("/topic/campanas/" + campañaId + "/capas/mapa", response);
		return response;
	}

	private void validarAccesoCampaña(Long campañaId, String username) {
		if (campañaId == null || campañaId <= 0) {
			throw new ResponseStatusException(BAD_REQUEST, "La campaña no es válida");
		}

		if (username == null || username.isBlank()) {
			throw new ResponseStatusException(UNAUTHORIZED, "Usuario no autenticado");
		}

		boolean pertenece = jugadorRepository.buscarPorUsuarioYCampaniaId(username, campañaId).isPresent();
		if (!pertenece) {
			throw new ResponseStatusException(FORBIDDEN, "No tienes acceso a esta campaña");
		}
	}
}