package com.fosteriaVTT.fosteriaVTT_backend.Mochila;

import com.fosteriaVTT.fosteriaVTT_backend.Objeto.Objeto;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.ObjetoService;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import com.fosteriaVTT.fosteriaVTT_backend.dto.EquipamientoDndGrupoResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.EquipamientoDndOpcionResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.EquipamientoDndResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.MochilaPersonajeResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ObjetoInicialResponse;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class MochilaService {

	private final MochilaRepository mochilaRepository;
	private final ObjetoService objetoService;

	public MochilaService(MochilaRepository mochilaRepository, ObjetoService objetoService) {
		this.mochilaRepository = mochilaRepository;
		this.objetoService = objetoService;
	}

	public List<MochilaPersonajeResponse> obtenerItemsPersonaje(Long personajeId) {
		return mochilaRepository.findByPersonajeIdOrderByIdAsc(personajeId).stream()
				.map(item -> new MochilaPersonajeResponse(
						item.getId(),
						item.getObjeto().getNombre(),
						item.getCantidad(),
						item.isEquipado(),
						item.getObjeto().getTipoObjeto().name(),
						item.getObjeto().getTipoObjeto().name()
				))
				.toList();
	}

	public List<Mochila> construirMochila(
			Personaje personaje,
			EquipamientoDndResponse equipamientoClase,
			EquipamientoDndResponse equipamientoTrasfondo,
			Map<String, Integer> gruposEquipamiento,
			Map<String, Long> catalogosEquipamiento
	) {
		Map<String, MochilaAcumulada> objetosAcumulados = new LinkedHashMap<>();
		acumularEquipamiento(objetosAcumulados, equipamientoClase, "class", gruposEquipamiento, catalogosEquipamiento);
		acumularEquipamiento(objetosAcumulados, equipamientoTrasfondo, "background", gruposEquipamiento, catalogosEquipamiento);

		return objetosAcumulados.values().stream()
				.map(item -> {
					Mochila mochila = new Mochila();
					mochila.setPersonaje(personaje);
					mochila.setObjeto(item.objeto());
					mochila.setCantidad(item.cantidad());
					mochila.setEquipado(false);
					return mochila;
				})
				.toList();
	}

	public void guardarMochilaInicial(
			Personaje personaje,
			EquipamientoDndResponse equipamientoClase,
			EquipamientoDndResponse equipamientoTrasfondo,
			Map<String, Integer> gruposEquipamiento,
			Map<String, Long> catalogosEquipamiento
	) {
		mochilaRepository.saveAll(construirMochila(
				personaje,
				equipamientoClase,
				equipamientoTrasfondo,
				gruposEquipamiento,
				catalogosEquipamiento
		));
	}

	private void acumularEquipamiento(
			Map<String, MochilaAcumulada> acumulado,
			EquipamientoDndResponse equipamiento,
			String origen,
			Map<String, Integer> gruposEquipamiento,
			Map<String, Long> catalogosEquipamiento
	) {
		for (EquipamientoDndOpcionResponse fijo : equipamiento.fijos()) {
			acumularOpcion(acumulado, fijo, null, catalogosEquipamiento);
		}

		for (EquipamientoDndGrupoResponse grupo : equipamiento.gruposEleccion()) {
			String clave = origen + ":" + grupo.id();
			Integer indice = gruposEquipamiento.get(clave);
			if (indice == null) {
				continue;
			}

			acumularOpcion(acumulado, grupo.opciones().get(indice), clave, catalogosEquipamiento);
		}
	}

	private void acumularOpcion(
			Map<String, MochilaAcumulada> acumulado,
			EquipamientoDndOpcionResponse opcion,
			String claveSeleccion,
			Map<String, Long> catalogosEquipamiento
	) {
		ObjetoInicialResponse objetoSeleccionado = opcion.objeto();
		if (!opcion.opcionesCatalogo().isEmpty() && claveSeleccion != null) {
			Long objetoId = catalogosEquipamiento.get(claveSeleccion);
			objetoSeleccionado = opcion.opcionesCatalogo().stream()
					.filter(item -> Objects.equals(item.id(), objetoId))
					.findFirst()
					.orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "No se pudo resolver el objeto de equipamiento elegido"));
		}

		Objeto objeto = objetoService.resolverOCrearObjeto(objetoSeleccionado);
		String clave = objeto.getId() != null ? "id:" + objeto.getId() : "nombre:" + TagUtils.normalizeText(objeto.getNombre());
		int cantidad = opcion.cantidad() == null ? 1 : opcion.cantidad();

		acumulado.compute(clave, (ignored, actual) -> actual == null
				? new MochilaAcumulada(objeto, cantidad)
				: new MochilaAcumulada(actual.objeto(), actual.cantidad() + cantidad));
	}

	private record MochilaAcumulada(Objeto objeto, int cantidad) {
	}
}