package com.fosteriaVTT.fosteriaVTT_backend.Mochila;

import com.fosteriaVTT.fosteriaVTT_backend.Objeto.Objeto;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.ObjetoService;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.TipoObjeto;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.EstadisticaService;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils.DndCombatUtils;
import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import com.fosteriaVTT.fosteriaVTT_backend.dto.EquipamientoDndGrupoResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.EquipamientoDndOpcionResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.EquipamientoDndResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.MochilaPersonajeResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ObjetoInicialResponse;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class MochilaService {

	private static final Map<String, String> MONEY_NAMES = Map.of(
			"ppt", "Piezas de platino",
			"po", "Piezas de oro",
			"pp", "Piezas de plata",
			"pc", "Piezas de cobre"
	);

	private final MochilaRepository mochilaRepository;
	private final ObjetoService objetoService;
	private final EstadisticaService estadisticaService;
	private final DndCombatUtils dndCombatUtils;

	public MochilaService(
			MochilaRepository mochilaRepository,
			ObjetoService objetoService,
			EstadisticaService estadisticaService,
			DndCombatUtils dndCombatUtils
	) {
		this.mochilaRepository = mochilaRepository;
		this.objetoService = objetoService;
		this.estadisticaService = estadisticaService;
		this.dndCombatUtils = dndCombatUtils;
	}

	public List<Mochila> actualizarItemPersonajeDnd(Personaje personaje, Long itemId, Boolean equipado, Integer cantidad) {
		List<Mochila> mochilaActualizada = actualizarItemPersonaje(personaje, itemId, equipado, cantidad);
		dndCombatUtils.sincronizarAtaquesArma(personaje, mochilaActualizada);
		estadisticaService.actualizarClaseArmadura(
				personaje,
				estadisticaService.obtenerValoresPorPersonajeId(personaje.getId()),
				mochilaActualizada,
				personaje.getHabilidades()
		);
		return mochilaActualizada;
	}

	public List<Mochila> agregarItemPersonajeDnd(
			Personaje personaje,
			Long objetoId,
			String nombre,
			String formula,
			String descripcion,
			TipoObjeto tipoObjeto,
			String indice,
			String username,
			Integer cantidad
	) {
		List<Mochila> mochilaActualizada = agregarItemPersonaje(personaje, objetoId, nombre, formula, descripcion, tipoObjeto, indice, username, cantidad);
		dndCombatUtils.sincronizarAtaquesArma(personaje, mochilaActualizada);
		estadisticaService.actualizarClaseArmadura(
				personaje,
				estadisticaService.obtenerValoresPorPersonajeId(personaje.getId()),
				mochilaActualizada,
				personaje.getHabilidades()
		);
		return mochilaActualizada;
	}

	public List<Mochila> eliminarItemPersonajeDnd(Personaje personaje, Long itemId) {
		List<Mochila> mochilaActualizada = eliminarItemPersonaje(personaje, itemId);
		dndCombatUtils.sincronizarAtaquesArma(personaje, mochilaActualizada);
		estadisticaService.actualizarClaseArmadura(
				personaje,
				estadisticaService.obtenerValoresPorPersonajeId(personaje.getId()),
				mochilaActualizada,
				personaje.getHabilidades()
		);
		return mochilaActualizada;
	}

	public List<MochilaPersonajeResponse> obtenerItemsPersonaje(Long personajeId) {
		return mochilaRepository.findByPersonajeIdOrderByIdAsc(personajeId).stream()
				.map(item -> new MochilaPersonajeResponse(
						item.getId(),
						item.getObjeto().getNombre(),
						item.getObjeto().getFormula(),
						item.getObjeto().getDescripcion(),
						item.getCantidad(),
						item.isEquipado(),
						item.getObjeto().getIndice(),
						item.getObjeto().getTipoObjeto().name()
				))
				.toList();
	}

	public List<Mochila> obtenerMochilaPersonaje(Long personajeId) {
		return mochilaRepository.findByPersonajeIdOrderByIdAsc(personajeId);
	}

	public List<Mochila> actualizarItemPersonaje(
			Personaje personaje,
			Long itemId,
			Boolean equipado,
			Integer cantidad
	) {
		Mochila item = mochilaRepository.findByIdAndPersonajeId(itemId, personaje.getId())
				.orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "No se encontró el objeto de la mochila"));

		if (cantidad != null) {
			if (cantidad < 0) {
				throw new ResponseStatusException(BAD_REQUEST, "La cantidad del objeto no es válida");
			}
			item.setCantidad(cantidad);
			if (cantidad == 0) {
				item.setEquipado(false);
			}
		}

		if (equipado != null) {
			actualizarEquipamiento(personaje.getId(), item, equipado);
		}

		mochilaRepository.save(item);
		return mochilaRepository.findByPersonajeIdOrderByIdAsc(personaje.getId());
	}

	public List<Mochila> agregarItemPersonaje(
			Personaje personaje,
			Long objetoId,
			String nombre,
			String formula,
			String descripcion,
			TipoObjeto tipoObjeto,
			String indice,
			String username,
			Integer cantidad
	) {
		int cantidadFinal = cantidad == null ? 1 : cantidad;
		if (cantidadFinal <= 0) {
			throw new ResponseStatusException(BAD_REQUEST, "La cantidad del objeto no es válida");
		}

		Objeto objeto;
		if (objetoId != null) {
			objeto = objetoService.obtenerObjetoVisibleParaUsuario(objetoId, username)
					.orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "No se encontró el objeto seleccionado"));
		} else {
			objeto = objetoService.crearObjetoPersonalizado(
					nombre,
					descripcion,
					formula,
					tipoObjeto == null ? TipoObjeto.MISCELANEO : tipoObjeto,
					indice,
					username
			);
		}

		Mochila existente = mochilaRepository.findByPersonajeIdOrderByIdAsc(personaje.getId()).stream()
				.filter(item -> item.getObjeto() != null && Objects.equals(item.getObjeto().getId(), objeto.getId()))
				.findFirst()
				.orElse(null);

		if (existente != null) {
			existente.setCantidad(existente.getCantidad() + cantidadFinal);
			mochilaRepository.save(existente);
		} else {
			Mochila nuevoItem = new Mochila();
			nuevoItem.setPersonaje(personaje);
			nuevoItem.setObjeto(objeto);
			nuevoItem.setCantidad(cantidadFinal);
			nuevoItem.setEquipado(false);
			mochilaRepository.save(nuevoItem);
		}

		return mochilaRepository.findByPersonajeIdOrderByIdAsc(personaje.getId());
	}

	public List<Mochila> eliminarItemPersonaje(Personaje personaje, Long itemId) {
		Mochila item = mochilaRepository.findByIdAndPersonajeId(itemId, personaje.getId())
				.orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "No se encontró el objeto de la mochila"));
		mochilaRepository.delete(item);
		return mochilaRepository.findByPersonajeIdOrderByIdAsc(personaje.getId());
	}

	public void actualizarDineroPersonaje(Personaje personaje, Map<String, Integer> dinero) {
		if (dinero == null || dinero.isEmpty()) {
			return;
		}

		List<Mochila> mochila = mochilaRepository.findByPersonajeIdOrderByIdAsc(personaje.getId());
		for (Map.Entry<String, Integer> entry : dinero.entrySet()) {
			String currencyKey = TagUtils.normalizeText(entry.getKey());
			String currencyName = MONEY_NAMES.get(currencyKey);
			if (currencyName == null) {
				throw new ResponseStatusException(BAD_REQUEST, "El tipo de moneda no es válido");
			}
			Integer amount = entry.getValue();
			if (amount == null || amount < 0) {
				throw new ResponseStatusException(BAD_REQUEST, "La cantidad de moneda no es válida");
			}

			Mochila moneyItem = mochila.stream()
					.filter(item -> TagUtils.normalizeText(item.getObjeto().getNombre()).equals(TagUtils.normalizeText(currencyName)))
					.findFirst()
					.orElseGet(() -> crearMonedaEnMochila(personaje, currencyName));
			moneyItem.setCantidad(amount);
			moneyItem.setEquipado(false);
			mochilaRepository.save(moneyItem);
		}
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

		List<Mochila> mochilaInicial = objetosAcumulados.values().stream()
				.map(item -> {
					Mochila mochila = new Mochila();
					mochila.setPersonaje(personaje);
					mochila.setObjeto(item.objeto());
					mochila.setCantidad(item.cantidad());
					mochila.setEquipado(false);
					return mochila;
				})
				.toList();

		marcarEquipamientoInicial(mochilaInicial);
		return mochilaInicial;
	}

	public List<Mochila> guardarMochilaInicial(
			Personaje personaje,
			EquipamientoDndResponse equipamientoClase,
			EquipamientoDndResponse equipamientoTrasfondo,
			Map<String, Integer> gruposEquipamiento,
			Map<String, Long> catalogosEquipamiento
	) {
		return mochilaRepository.saveAll(construirMochila(
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
		if (!opcion.opcionesCatalogo().isEmpty() && claveSeleccion != null) {
			for (String catalogSelectionKey : buildCatalogSelectionKeys(claveSeleccion, opcion.cantidad())) {
				Long objetoId = catalogosEquipamiento.get(catalogSelectionKey);
				ObjetoInicialResponse objetoCatalogo = opcion.opcionesCatalogo().stream()
						.filter(item -> Objects.equals(item.id(), objetoId))
						.findFirst()
						.orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "No se pudo resolver el objeto de equipamiento elegido"));
				acumularObjetoInicial(acumulado, objetoCatalogo, opcion.etiqueta(), 1);
			}
			if (opcion.objeto() != null) {
				acumularObjetoInicial(acumulado, opcion.objeto(), opcion.etiqueta(), 1);
			}
			return;
		}

		acumularObjetoInicial(
				acumulado,
				opcion.objeto(),
				opcion.etiqueta(),
				opcion.cantidad() == null ? 1 : opcion.cantidad()
		);
	}

	private void acumularObjetoInicial(
			Map<String, MochilaAcumulada> acumulado,
			ObjetoInicialResponse objetoSeleccionado,
			String fallbackLabel,
			int cantidad
	) {
		if (objetoSeleccionado == null || objetoSeleccionado.nombre() == null || objetoSeleccionado.nombre().isBlank()) {
			objetoSeleccionado = new ObjetoInicialResponse(
					null,
					fallbackLabel,
					null,
					null,
					TipoObjeto.MISCELANEO,
					null,
					cantidad
			);
		}

		Objeto objeto = objetoService.resolverOCrearObjeto(objetoSeleccionado);
		String clave = objeto.getId() != null ? "id:" + objeto.getId() : "nombre:" + TagUtils.normalizeText(objeto.getNombre());

		List<MochilaAcumulada> expansion = expandirObjetoInicial(objeto, cantidad);
		if (!expansion.isEmpty()) {
			for (MochilaAcumulada item : expansion) {
				String itemClave = item.objeto().getId() != null
						? "id:" + item.objeto().getId()
						: "nombre:" + TagUtils.normalizeText(item.objeto().getNombre());
				acumulado.compute(itemClave, (ignored, actual) -> actual == null
						? new MochilaAcumulada(item.objeto(), item.cantidad())
						: new MochilaAcumulada(actual.objeto(), actual.cantidad() + item.cantidad()));
			}
			return;
		}

		acumulado.compute(clave, (ignored, actual) -> actual == null
				? new MochilaAcumulada(objeto, cantidad)
				: new MochilaAcumulada(actual.objeto(), actual.cantidad() + cantidad));
	}

	private List<MochilaAcumulada> expandirObjetoInicial(Objeto objeto, int cantidad) {
		String nombreNormalizado = TagUtils.normalizeText(objeto.getNombre());
		if (nombreNormalizado.equals(TagUtils.normalizeText("Ballesta ligera y 20 virotes"))) {
			return List.of(
					new MochilaAcumulada(resolverObjetoPorNombre("Ballesta ligera"), cantidad),
					new MochilaAcumulada(resolverObjetoPorNombre("Virote"), cantidad * 20)
			);
		}

		if (nombreNormalizado.equals(TagUtils.normalizeText("Armadura de cuero, arco largo y 20 flechas"))) {
			return List.of(
					new MochilaAcumulada(resolverObjetoPorNombre("Armadura de cuero"), cantidad),
					new MochilaAcumulada(resolverObjetoPorNombre("Arco largo"), cantidad),
					new MochilaAcumulada(resolverObjetoPorNombre("Flecha"), cantidad * 20)
			);
		}

		return List.of();
	}

	private Objeto resolverObjetoPorNombre(String nombre) {
		return objetoService.resolverOCrearObjeto(new ObjetoInicialResponse(null, nombre, null, null, null, null, 1));
	}

	private void marcarEquipamientoInicial(List<Mochila> mochilaInicial) {
		boolean armorEquipped = false;
		boolean shieldEquipped = false;
		boolean weaponEquipped = false;

		for (Mochila item : mochilaInicial) {
			Objeto objeto = item.getObjeto();
			if (objeto == null) {
				continue;
			}

			if (objeto.getTipoObjeto() == com.fosteriaVTT.fosteriaVTT_backend.Objeto.TipoObjeto.ARMADURA) {
				boolean isShield = TagUtils.normalizeText(objeto.getIndice()).contains(TagUtils.normalizeText("Escudo"))
						|| TagUtils.normalizeText(objeto.getFormula()).contains(TagUtils.normalizeText("BONO_CA"));
				if (isShield && !shieldEquipped) {
					item.setEquipado(true);
					shieldEquipped = true;
				} else if (!isShield && !armorEquipped) {
					item.setEquipado(true);
					armorEquipped = true;
				}
				continue;
			}

			if (objeto.getTipoObjeto() == com.fosteriaVTT.fosteriaVTT_backend.Objeto.TipoObjeto.ARMA && !weaponEquipped) {
				item.setEquipado(true);
				weaponEquipped = true;
			}
		}
	}

	private List<String> buildCatalogSelectionKeys(String baseKey, Integer amount) {
		int selectionCount = Math.max(1, amount == null ? 1 : amount);
		if (selectionCount == 1) {
			return List.of(baseKey);
		}

		List<String> keys = new ArrayList<>(selectionCount);
		for (int index = 0; index < selectionCount; index++) {
			keys.add(baseKey + ":" + index);
		}
		return keys;
	}

	private void actualizarEquipamiento(Long personajeId, Mochila item, boolean equipado) {
		if (!equipado) {
			item.setEquipado(false);
			return;
		}

		if (item.getCantidad() <= 0) {
			throw new ResponseStatusException(BAD_REQUEST, "No puedes equipar un objeto sin cantidad disponible");
		}

		TipoObjeto tipoObjeto = item.getObjeto().getTipoObjeto();
		if (tipoObjeto == TipoObjeto.ARMADURA) {
			List<Mochila> mochila = mochilaRepository.findByPersonajeIdOrderByIdAsc(personajeId);
			boolean isShield = esEscudo(item.getObjeto());
			for (Mochila equippedItem : mochila) {
				if (!equippedItem.isEquipado()) {
					continue;
				}
				if (equippedItem.getId().equals(item.getId())) {
					continue;
				}
				if (equippedItem.getObjeto().getTipoObjeto() != TipoObjeto.ARMADURA) {
					continue;
				}
				if (esEscudo(equippedItem.getObjeto()) == isShield) {
					equippedItem.setEquipado(false);
					mochilaRepository.save(equippedItem);
				}
			}
		}

		item.setEquipado(true);
	}

	private boolean esEscudo(Objeto objeto) {
		return TagUtils.normalizeText(objeto.getIndice()).contains(TagUtils.normalizeText("Escudo"))
				|| TagUtils.normalizeText(objeto.getFormula()).contains(TagUtils.normalizeText("BONO_CA"));
	}

	private Mochila crearMonedaEnMochila(Personaje personaje, String currencyName) {
		Objeto objeto = objetoService.resolverOCrearObjeto(new ObjetoInicialResponse(
				null,
				currencyName,
				"Moneda persistida para el personaje",
				null,
				TipoObjeto.DINERO,
				"dinero",
				0
		));
		Mochila mochila = new Mochila();
		mochila.setPersonaje(personaje);
		mochila.setObjeto(objeto);
		mochila.setCantidad(0);
		mochila.setEquipado(false);
		return mochilaRepository.save(mochila);
	}

	private record MochilaAcumulada(Objeto objeto, int cantidad) {
	}
}