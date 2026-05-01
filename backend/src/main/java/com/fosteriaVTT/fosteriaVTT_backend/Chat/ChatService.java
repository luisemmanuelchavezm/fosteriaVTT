package com.fosteriaVTT.fosteriaVTT_backend.Chat;

import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndSubclaseResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.SeleccionDoteRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.SubirNivelPersonajeRequest;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class ChatService {
	private static final String LEVEL_UP_EVENT = "LEVEL_UP";

	private final ChatRepository chatRepository;

	public ChatService(ChatRepository chatRepository) {
		this.chatRepository = chatRepository;
	}

	public void registrarEleccionProgresion(
			Personaje personaje,
			String classId,
			int level,
			SubirNivelPersonajeRequest request,
			ClaseDndSubclaseResponse subclass
	) {
		if (personaje == null || request == null) {
			return;
		}

		Map<String, String> values = new LinkedHashMap<>();
		values.put("classId", classId);
		values.put("level", String.valueOf(level));
		values.put("modoMejoraCaracteristica", valorSeguro(request.modoMejoraCaracteristica()));
		values.put("caracteristicaPrimaria", valorSeguro(request.caracteristicaPrimaria()));
		values.put("caracteristicaSecundaria", valorSeguro(request.caracteristicaSecundaria()));
		values.put("subclaseId", subclass == null ? "" : valorSeguro(subclass.id()));
		values.put("subclaseNombre", subclass == null ? "" : valorSeguro(subclass.nombre()));
		values.put("eleccionesClase", serializarEleccionesClase(request.eleccionesClase()));

		SeleccionDoteRequest feat = request.dote();
		if (feat != null) {
			values.put("doteNombre", valorSeguro(feat.nombre()));
			values.put("doteDescripcion", valorSeguro(feat.descripcion()));
			values.put("doteFormula", valorSeguro(feat.formula()));
			values.put("bonificacionesCaracteristica", serializarBonificaciones(feat.bonificacionesCaracteristica()));
			values.put("competenciasDote", serializarLista(feat.competencias()));
			values.put("habilidadesDote", serializarLista(feat.habilidades()));
			values.put("idiomasDote", serializarLista(feat.idiomas()));
			values.put("conjurosDote", serializarLista(feat.conjuros()));
			values.put("claseConjurosDote", valorSeguro(feat.claseConjuros()));
		}

		Chat entrada = Chat.builder()
				.mensaje(construirMensajeEvento(LEVEL_UP_EVENT, values))
				.mensajeLog(true)
				.personaje(personaje)
				.build();
		validarAntesDeGuardar(entrada);
		chatRepository.save(entrada);
	}

	public Optional<Map<String, String>> obtenerUltimoRegistroInterno(Personaje personaje, String classId, int level) {
		if (personaje == null || personaje.getId() == null || classId == null || classId.isBlank() || level <= 0) {
			return Optional.empty();
		}

		return chatRepository.findByPersonajeIdAndMensajeLogTrueOrderByIdDesc(personaje.getId()).stream()
				.map(Chat::getMensaje)
				.map(this::parsearMensajeEvento)
				.filter(evento -> LEVEL_UP_EVENT.equals(evento.get("tipo")))
				.filter(evento -> TagUtils.normalizeText(evento.get("classId")).equals(TagUtils.normalizeText(classId)))
				.filter(evento -> String.valueOf(level).equals(evento.get("level")))
				.findFirst();
	}

	private Map<String, String> parsearMensajeEvento(String mensaje) {
		if (mensaje == null || mensaje.isBlank()) {
			return Map.of();
		}

		String metadataLine = mensaje.lines().findFirst().orElse("");
		if (!metadataLine.contains("|")) {
			return Map.of();
		}

		String[] tokens = metadataLine.split("\\|");
		Map<String, String> values = new LinkedHashMap<>();
		values.put("tipo", tokens[0]);
		for (int index = 1; index < tokens.length; index += 1) {
			String token = tokens[index];
			int separatorIndex = token.indexOf('=');
			if (separatorIndex <= 0) {
				continue;
			}
			String key = token.substring(0, separatorIndex);
			String value = token.substring(separatorIndex + 1);
			values.put(key, decode(value));
		}
		return values;
	}

	private String construirMensajeEvento(String tipo, Map<String, String> values) {
		StringBuilder builder = new StringBuilder(tipo);
		for (Map.Entry<String, String> entry : values.entrySet()) {
			builder.append('|')
					.append(entry.getKey())
					.append('=')
					.append(encode(entry.getValue()));
		}
		return builder.toString();
	}

	private String serializarEleccionesClase(Map<String, List<String>> eleccionesClase) {
		if (eleccionesClase == null || eleccionesClase.isEmpty()) {
			return "";
		}

		return eleccionesClase.entrySet().stream()
				.map(entry -> encode(entry.getKey()) + ":" + entry.getValue().stream().map(this::encode).reduce((left, right) -> left + ";" + right).orElse(""))
				.reduce((left, right) -> left + "," + right)
				.orElse("");
	}

	private String serializarBonificaciones(Map<String, Integer> bonificaciones) {
		if (bonificaciones == null || bonificaciones.isEmpty()) {
			return "";
		}

		return bonificaciones.entrySet().stream()
				.map(entry -> encode(entry.getKey()) + ":" + (entry.getValue() == null ? 0 : entry.getValue()))
				.reduce((left, right) -> left + "," + right)
				.orElse("");
	}

	private String serializarLista(List<String> valores) {
		if (valores == null || valores.isEmpty()) {
			return "";
		}

		return valores.stream()
				.filter(Objects::nonNull)
				.map(String::trim)
				.filter(value -> !value.isBlank())
				.map(this::encode)
				.reduce((left, right) -> left + "," + right)
				.orElse("");
	}

	private String valorSeguro(String value) {
		return value == null ? "" : value;
	}

	private String encode(String value) {
		return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
	}

	private String decode(String value) {
		return URLDecoder.decode(value == null ? "" : value, StandardCharsets.UTF_8);
	}

	private void validarAntesDeGuardar(Chat entrada) {
		if (entrada == null) {
			throw new IllegalStateException("El chat no puede ser nulo");
		}

		if (entrada.isMensajeLog()) {
			if (entrada.getPersonaje() == null) {
				throw new IllegalStateException("Los mensajes de log requieren un personaje");
			}
			return;
		}

		if (entrada.getJugador() == null || entrada.getCampaña() == null) {
			throw new IllegalStateException("Los mensajes normales requieren jugador y campaña");
		}
	}
}