package com.fosteriaVTT.fosteriaVTT_backend.Dibujo;

import com.fosteriaVTT.fosteriaVTT_backend.Capa.Capa;
import com.fosteriaVTT.fosteriaVTT_backend.Capa.CapaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Jugador.JugadorRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Pestaña.Pestaña;
import com.fosteriaVTT.fosteriaVTT_backend.Pestaña.PestañaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Punto.Punto;
import com.fosteriaVTT.fosteriaVTT_backend.Punto.PuntoRepository;
import com.fosteriaVTT.fosteriaVTT_backend.dto.BorrarDibujoWsRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CrearDibujoWsRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.DibujoResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PuntoDibujoPayload;
import com.fosteriaVTT.fosteriaVTT_backend.dto.WebSocketDibujoEventDTO;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class DibujoService {

	private final DibujoRepository dibujoRepository;
	private final PuntoRepository puntoRepository;
	private final CapaRepository capaRepository;
	private final PestañaRepository pestañaRepository;
	private final JugadorRepository jugadorRepository;
	private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

	public DibujoService(
			DibujoRepository dibujoRepository,
			PuntoRepository puntoRepository,
			CapaRepository capaRepository,
			PestañaRepository pestañaRepository,
			JugadorRepository jugadorRepository,
			org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate
	) {
		this.dibujoRepository = dibujoRepository;
		this.puntoRepository = puntoRepository;
		this.capaRepository = capaRepository;
		this.pestañaRepository = pestañaRepository;
		this.jugadorRepository = jugadorRepository;
		this.messagingTemplate = messagingTemplate;
	}

	@Transactional(readOnly = true)
	public List<DibujoResponse> obtenerDibujos(Long campañaId, Long pestañaId, String username) {
		validarAccesoCampaña(campañaId, username);
		validarPestañaEnCampaña(campañaId, pestañaId);

		List<Dibujo> dibujos = dibujoRepository.findByCapaPestañaIdOrderByIdAsc(pestañaId);
		if (dibujos.isEmpty()) {
			return List.of();
		}

		List<Long> dibujoIds = dibujos.stream()
				.map(Dibujo::getId)
				.filter(Objects::nonNull)
				.toList();

		Map<Long, List<Punto>> puntosPorDibujoId = new HashMap<>();
		for (Punto punto : puntoRepository.findByDibujoIdInOrderByIdAsc(dibujoIds)) {
			Long dibujoId = punto.getDibujo() == null ? null : punto.getDibujo().getId();
			if (dibujoId == null) {
				continue;
			}
			puntosPorDibujoId.computeIfAbsent(dibujoId, ignored -> new ArrayList<>()).add(punto);
		}

		return dibujos.stream()
				.map(dibujo -> toResponse(dibujo, puntosPorDibujoId.getOrDefault(dibujo.getId(), List.of())))
				.toList();
	}

	@Transactional
	public DibujoResponse crearYEmitirDibujo(Long campañaId, CrearDibujoWsRequest request, String username) {
		if (request == null) {
			throw new ResponseStatusException(BAD_REQUEST, "No se recibió el dibujo");
		}

		validarAccesoCampaña(campañaId, username);
		Long pestañaId = request.pestanaId();
		validarPestañaEnCampaña(campañaId, pestañaId);

		Integer nivelCapa = mapearNivelCapa(request.capa());
		Capa capa = capaRepository.findByPestañaIdAndNivelDeCapa(pestañaId, nivelCapa)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "No existe la capa seleccionada"));

		String color = normalizarColor(request.color());
		TipoDibujo tipoDibujo = mapearTipoDibujo(request.tipo());
		List<PuntoDibujoPayload> puntosEntrada = normalizarPuntos(request.puntos(), tipoDibujo);

		int minX = puntosEntrada.stream().map(PuntoDibujoPayload::x).min(Comparator.naturalOrder()).orElse(0);
		int maxX = puntosEntrada.stream().map(PuntoDibujoPayload::x).max(Comparator.naturalOrder()).orElse(0);
		int minY = puntosEntrada.stream().map(PuntoDibujoPayload::y).min(Comparator.naturalOrder()).orElse(0);
		int maxY = puntosEntrada.stream().map(PuntoDibujoPayload::y).max(Comparator.naturalOrder()).orElse(0);

		Dibujo dibujo = Dibujo.builder()
				.tipoDibujo(tipoDibujo)
				.largo(Math.max(maxX - minX, 0))
				.ancho(Math.max(maxY - minY, 0))
				.color(color)
				.relleno(Boolean.TRUE.equals(request.relleno()))
				.capa(capa)
				.build();

		Dibujo guardado = dibujoRepository.save(dibujo);

		List<Punto> puntosParaGuardar = puntosEntrada.stream()
				.map(punto -> Punto.builder()
						.posicionX(punto.x())
						.posicionY(punto.y())
						.dibujo(guardado)
						.build())
				.map(Punto.class::cast)
				.toList();

		List<Punto> puntosGuardados = puntoRepository.saveAll(
				puntosParaGuardar
		);

		DibujoResponse response = toResponse(guardado, puntosGuardados);
		emitirEventoCreado(campañaId, response);
		return response;
	}

	@Transactional
	public void borrarYEmitirDibujo(Long campañaId, BorrarDibujoWsRequest request, String username) {
		if (request == null) {
			throw new ResponseStatusException(BAD_REQUEST, "No se recibió el borrado");
		}

		validarAccesoCampaña(campañaId, username);
		Long pestañaId = request.pestanaId();
		validarPestañaEnCampaña(campañaId, pestañaId);

		if (request.dibujoId() == null || request.dibujoId() <= 0) {
			throw new ResponseStatusException(BAD_REQUEST, "El dibujo a borrar no es válido");
		}

		Dibujo dibujo;
		try {
			dibujo = dibujoRepository.getReferenceById(request.dibujoId());
			dibujo.getId();
		} catch (EntityNotFoundException exception) {
			throw new ResponseStatusException(NOT_FOUND, "El dibujo no existe");
		}

		Long pestañaDeDibujo = dibujo.getCapa() == null || dibujo.getCapa().getPestaña() == null
				? null
				: dibujo.getCapa().getPestaña().getId();
		if (!Objects.equals(pestañaDeDibujo, pestañaId)) {
			throw new ResponseStatusException(FORBIDDEN, "El dibujo no pertenece a la pestaña");
		}

		Integer nivelEsperado = mapearNivelCapa(request.capa());
		Integer nivelReal = dibujo.getCapa() == null ? null : dibujo.getCapa().getNivelDeCapa();
		if (!Objects.equals(nivelReal, nivelEsperado)) {
			throw new ResponseStatusException(FORBIDDEN, "No puedes borrar un dibujo de otra capa");
		}

		puntoRepository.deleteByDibujoId(dibujo.getId());
		dibujoRepository.delete(dibujo);
		emitirEventoBorrado(campañaId, dibujo.getId());
	}

	private void emitirEventoCreado(Long campañaId, DibujoResponse dibujo) {
		WebSocketDibujoEventDTO event = new WebSocketDibujoEventDTO("CREATED", dibujo.id(), dibujo);
		messagingTemplate.convertAndSend("/topic/campanas/" + campañaId + "/dibujos", event);
	}

	private void emitirEventoBorrado(Long campañaId, Long dibujoId) {
		WebSocketDibujoEventDTO event = new WebSocketDibujoEventDTO("DELETED", dibujoId, null);
		messagingTemplate.convertAndSend("/topic/campanas/" + campañaId + "/dibujos", event);
	}

	private void validarAccesoCampaña(Long campañaId, String username) {
		if (campañaId == null || campañaId <= 0) {
			throw new ResponseStatusException(BAD_REQUEST, "La campaña no es válida");
		}

		if (username == null || username.isBlank()) {
			throw new ResponseStatusException(FORBIDDEN, "Usuario no autenticado");
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

	private TipoDibujo mapearTipoDibujo(String tipo) {
		String valor = tipo == null ? "" : tipo.trim().toLowerCase();
		return switch (valor) {
			case "pencil", "line" -> TipoDibujo.LINE;
			case "rectangle", "rect" -> TipoDibujo.RECT;
			case "ellipse", "circular" -> TipoDibujo.ELLIPSE;
			case "triangle", "conica" -> TipoDibujo.TRIANGLE;
			default -> throw new ResponseStatusException(BAD_REQUEST, "Tipo de dibujo no válido");
		};
	}

	private String normalizarColor(String color) {
		String limpio = color == null ? "" : color.trim();
		if (!limpio.matches("^#[0-9a-fA-F]{6}$")) {
			throw new ResponseStatusException(BAD_REQUEST, "Color no válido");
		}
		return limpio;
	}

	private List<PuntoDibujoPayload> normalizarPuntos(List<PuntoDibujoPayload> puntos, TipoDibujo tipoDibujo) {
		if (puntos == null || puntos.isEmpty()) {
			throw new ResponseStatusException(BAD_REQUEST, "El dibujo debe incluir puntos");
		}

		int minPuntos = tipoDibujo == TipoDibujo.LINE ? 2 : 2;
		if (puntos.size() < minPuntos) {
			throw new ResponseStatusException(BAD_REQUEST, "El dibujo no tiene suficientes puntos");
		}

		List<PuntoDibujoPayload> normalizados = new ArrayList<>();
		for (PuntoDibujoPayload punto : puntos) {
			if (punto == null || punto.x() == null || punto.y() == null) {
				throw new ResponseStatusException(BAD_REQUEST, "Los puntos del dibujo son inválidos");
			}
			normalizados.add(new PuntoDibujoPayload(punto.x(), punto.y()));
		}
		return normalizados;
	}

	private DibujoResponse toResponse(Dibujo dibujo, List<Punto> puntos) {
		String capa = mapearNombreCapa(dibujo.getCapa() == null ? null : dibujo.getCapa().getNivelDeCapa());
		String tipo = switch (dibujo.getTipoDibujo()) {
			case LINE -> "pencil";
			case RECT -> "rectangle";
			case ELLIPSE -> "ellipse";
			case TRIANGLE -> "triangle";
		};

		List<PuntoDibujoPayload> payloadPuntos = puntos.stream()
				.map(punto -> new PuntoDibujoPayload(punto.getPosicionX(), punto.getPosicionY()))
				.toList();

		return new DibujoResponse(
				dibujo.getId(),
				dibujo.getCapa() == null || dibujo.getCapa().getPestaña() == null ? null : dibujo.getCapa().getPestaña().getId(),
				capa,
				tipo,
				dibujo.getColor(),
				dibujo.isRelleno(),
				dibujo.getLargo(),
				dibujo.getAncho(),
				payloadPuntos,
				dibujo.getUpdatedAt()
		);
	}

	private String mapearNombreCapa(Integer nivelDeCapa) {
		if (nivelDeCapa == null) {
			return "mapa";
		}

		return switch (nivelDeCapa) {
			case 1 -> "fichas";
			case 2 -> "mapa";
			case 3 -> "dm";
			default -> "mapa";
		};
	}
}