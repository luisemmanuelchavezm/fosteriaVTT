package com.fosteriaVTT.fosteriaVTT_backend.Posicion;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

import com.fosteriaVTT.fosteriaVTT_backend.Capa.Capa;
import com.fosteriaVTT.fosteriaVTT_backend.Capa.CapaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Jugador.JugadorRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.PersonajeRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Pestaña.Pestaña;
import com.fosteriaVTT.fosteriaVTT_backend.Pestaña.PestañaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CrearPosicionRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CrearPosicionWsRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PosicionResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.WebSocketPosicionEventDTO;
import java.util.List;
import java.util.Objects;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PosicionService {

    private final PosicionRepository posicionRepository;
    private final CapaRepository capaRepository;
    private final PestañaRepository pestañaRepository;
    private final JugadorRepository jugadorRepository;
    private final PersonajeRepository personajeRepository;
    private final SimpMessagingTemplate messagingTemplate;

	public PosicionService(
			PosicionRepository posicionRepository,
			CapaRepository capaRepository,
			PestañaRepository pestañaRepository,
			JugadorRepository jugadorRepository,
			PersonajeRepository personajeRepository,
			SimpMessagingTemplate messagingTemplate
	) {
		this.posicionRepository = posicionRepository;
		this.capaRepository = capaRepository;
		this.pestañaRepository = pestañaRepository;
		this.jugadorRepository = jugadorRepository;
		this.personajeRepository = personajeRepository;
		this.messagingTemplate = messagingTemplate;
	}

	@Transactional(readOnly = true)
	public List<PosicionResponse> obtenerPosiciones(Long campañaId, Long pestañaId, String username) {
		validarAccesoCampaña(campañaId, username);
		validarPestañaEnCampaña(campañaId, pestañaId);

		return posicionRepository.findByCapaPestañaIdOrderByIdAsc(pestañaId).stream()
				.map(this::toResponse)
				.toList();
	}

	@Transactional
	public PosicionResponse crearOActualizarPosicion(Long campañaId, CrearPosicionRequest request, String username) {
		if (request == null) {
			throw new ResponseStatusException(BAD_REQUEST, "No se recibió la posición");
		}

		validarAccesoCampaña(campañaId, username);
		validarPestañaEnCampaña(campañaId, request.pestanaId());

		if (request.personajeId() == null || request.personajeId() <= 0) {
			throw new ResponseStatusException(BAD_REQUEST, "El personaje no es válido");
		}

		if (request.posicionX() == null || request.posicionX() < 0 || request.posicionY() == null || request.posicionY() < 0) {
			throw new ResponseStatusException(BAD_REQUEST, "La posición no es válida");
		}

		Integer nivelCapa = mapearNivelCapa(request.capa());
		Capa capa = capaRepository.findByPestañaIdAndNivelDeCapa(request.pestanaId(), nivelCapa)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "No existe la capa seleccionada"));

		Personaje personaje = personajeRepository.findByIdAndUsuarioUsername(request.personajeId(), username)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "No se encontró el personaje seleccionado"));

		Posicion posicion = posicionRepository.findByPersonajeId(personaje.getId())
				.orElseGet(() -> Posicion.builder()
						.personaje(personaje)
						.build());

		posicion.setPosicionX(request.posicionX());
		posicion.setPosicionY(request.posicionY());
		posicion.setLargo(1);
		posicion.setAncho(1);
		posicion.setCapa(capa);

		return toResponse(posicionRepository.save(posicion));
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

	private void validarPestañaEnCampaña(Long campañaId, Long pestañaId) {
		if (pestañaId == null || pestañaId <= 0) {
			throw new ResponseStatusException(BAD_REQUEST, "La pestaña no es válida");
		}

		Pestaña pestaña = pestañaRepository.findById(pestañaId)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "La pestaña no existe"));

		Long campañaDePestaña = pestaña.getCampaña() == null ? null : pestaña.getCampaña().getId();
		if (!Objects.equals(campañaDePestaña, campañaId)) {
			throw new ResponseStatusException(FORBIDDEN, "La pestaña no pertenece a la campaña");
		}
	}

	private Integer mapearNivelCapa(String capa) {
		String valor = capa == null ? "" : capa.trim().toLowerCase();
		return switch (valor) {
			case "fichas" -> 1;
			case "mapa" -> 2;
			case "dm" -> 3;
			default -> throw new ResponseStatusException(BAD_REQUEST, "Capa no válida");
		};
	}

	private String mapearNombreCapa(Integer nivelDeCapa) {
		if (nivelDeCapa == null) {
			return "";
		}

		return switch (nivelDeCapa) {
			case 1 -> "fichas";
			case 2 -> "mapa";
			case 3 -> "dm";
			default -> "";
		};
	}

	@Transactional
	public void crearOActualizarPosicionYEmitir(Long campañaId, CrearPosicionWsRequest request, String username) {
		CrearPosicionRequest restRequest = new CrearPosicionRequest(
				request.pestanaId(),
				request.capa(),
				request.personajeId(),
				request.posicionX(),
				request.posicionY()
		);

		PosicionResponse posicion = crearOActualizarPosicion(campañaId, restRequest, username);
		emitirEventoCreado(campañaId, posicion);
	}

	@Transactional
	public void moverPosicionYEmitir(Long campañaId, PosicionWebSocketController.PosicionMovePayload payload, String username) {
		if (payload.posicionId() == null || payload.posicionId() <= 0) {
			throw new ResponseStatusException(BAD_REQUEST, "La posición no es válida");
		}

		if (payload.posicionX() == null || payload.posicionX() < 0 || payload.posicionY() == null || payload.posicionY() < 0) {
			throw new ResponseStatusException(BAD_REQUEST, "Las coordenadas no son válidas");
		}

		validarAccesoCampaña(campañaId, username);

		Posicion posicion = posicionRepository.findById(payload.posicionId())
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "La posición no existe"));

		if (posicion.getPersonaje() == null || !Objects.equals(posicion.getPersonaje().getUsuario().getUsername(), username)) {
			throw new ResponseStatusException(FORBIDDEN, "No puedes mover una posición que no es tuya");
		}

		if (posicion.getCapa() == null || posicion.getCapa().getPestaña() == null) {
			throw new ResponseStatusException(NOT_FOUND, "La pestaña de la posición no existe");
		}

		Long campañaDePestaña = posicion.getCapa().getPestaña().getCampaña() == null ? null : posicion.getCapa().getPestaña().getCampaña().getId();
		if (!Objects.equals(campañaDePestaña, campañaId)) {
			throw new ResponseStatusException(FORBIDDEN, "La posición no pertenece a la campaña");
		}

		posicion.setPosicionX(payload.posicionX());
		posicion.setPosicionY(payload.posicionY());

		Posicion actualizada = posicionRepository.save(posicion);
		PosicionResponse response = toResponse(actualizada);
		emitirEventoCreado(campañaId, response);
	}

	private void emitirEventoCreado(Long campañaId, PosicionResponse posicion) {
		WebSocketPosicionEventDTO event = new WebSocketPosicionEventDTO("CREATED", posicion.id(), posicion);
		messagingTemplate.convertAndSend("/topic/campanas/" + campañaId + "/posiciones", event);
	}

	private PosicionResponse toResponse(Posicion posicion) {
		Personaje personaje = posicion.getPersonaje();
		Capa capa = posicion.getCapa();

		return new PosicionResponse(
				posicion.getId(),
				capa == null || capa.getPestaña() == null ? null : capa.getPestaña().getId(),
				mapearNombreCapa(capa == null ? null : capa.getNivelDeCapa()),
				personaje == null ? null : personaje.getId(),
				personaje == null ? null : personaje.getNombre(),
				personaje == null ? null : personaje.getRetrato(),
				posicion.getPosicionX(),
				posicion.getPosicionY(),
				posicion.getLargo(),
				posicion.getAncho()
		);
	}
}