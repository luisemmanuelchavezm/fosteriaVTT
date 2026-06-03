package com.fosteriaVTT.fosteriaVTT_backend.Estadistica;

import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.dnd.DndArmaduraFormulaUtils;
import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.dnd.DndCaracteristicaUtils;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Mochila.MochilaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.anyIterable;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EstadisticaServiceTest {

	@Test
	void extraerClaseArmaduraDesdeFormula_preservaCapDeDestreza() {
		Integer armorClass = DndArmaduraFormulaUtils.extraerClaseArmadura(
				"CA=14+DES(max:2)",
				Map.of("Destreza", 18)
		);

		assertEquals(16, armorClass);
	}

	@Test
	void extraerClaseArmaduraDesdeFormula_ignoraFormulaVacia() {
		Integer armorClass = DndArmaduraFormulaUtils.extraerClaseArmadura("", Map.of("Destreza", 18));

		assertNull(armorClass);
	}

	@Test
	void resolverValorCaracteristica_priorizaNombreEnEspanol() {
		int valor = DndCaracteristicaUtils.resolverValor(
				Map.of("Destreza", 16, "dexterity", 8),
				"Destreza"
		);

		assertEquals(16, valor);
	}

	@Test
	void aplicarSubidaNivel_conservaPericiasExistentesAlRecalcularBonificacion() {
		EstadisticaRepository repository = mock(EstadisticaRepository.class);
		MochilaRepository mochilaRepository = mock(MochilaRepository.class);
		EstadisticaService service = new EstadisticaService(repository, mochilaRepository);
		Personaje personaje = Personaje.builder().id(1L).nombre("Nim").tags("Clase;Picaro:4").build();
		List<Estadistica> persistedStats = new ArrayList<>(List.of(
				estadistica(personaje, "Constitucion", 14),
				estadistica(personaje, "Bonificador por competencia", 2),
				estadistica(personaje, "Acrobacias", 4),
				estadistica(personaje, "Sigilo", 2),
				estadistica(personaje, "Puntos de vida", 20),
				estadistica(personaje, "Vida actual", 20),
				estadistica(personaje, "Experiencia", 0),
				estadistica(personaje, "Dados de golpe d8", 4),
				estadistica(personaje, "Iniciativa", 3)
		));

		when(repository.findByPersonajeIdOrderByIdAsc(1L)).thenReturn(persistedStats);
		when(mochilaRepository.findByPersonajeIdOrderByIdAsc(1L)).thenReturn(List.of());

		service.aplicarSubidaNivel(
				personaje,
				new LinkedHashMap<>(Map.of("Constitucion", 14)),
				"d8",
				7,
				Map.of(),
				5,
				Set.of()
		);

		ArgumentCaptor<Iterable<Estadistica>> captor = estadisticaIterableCaptor();
		verify(repository).saveAll(captor.capture());

		Map<String, Integer> savedValues = new LinkedHashMap<>();
		for (Estadistica estadistica : captor.getValue()) {
			savedValues.put(estadistica.getNombre(), estadistica.getValor());
		}

		assertEquals(3, savedValues.get("Bonificador por competencia"));
		assertEquals(6, savedValues.get("Acrobacias"));
		assertEquals(3, savedValues.get("Sigilo"));
	}

	@Test
	void aplicarSubidaNivel_recalculaCaDeBarbaroSinArmaduraConConstitucion() {
		EstadisticaRepository repository = mock(EstadisticaRepository.class);
		MochilaRepository mochilaRepository = mock(MochilaRepository.class);
		EstadisticaService service = new EstadisticaService(repository, mochilaRepository);
		Habilidad defensaSinArmadura = Habilidad.builder()
				.nombre("Defensa sin armadura")
				.tags("CBarbaro;1,Defensa")
				.build();
		Personaje personaje = Personaje.builder()
				.id(1L)
				.nombre("Korga")
				.tags("Clase;Barbaro:1")
				.habilidades(new ArrayList<>(List.of(defensaSinArmadura)))
				.build();
		List<Estadistica> persistedStats = new ArrayList<>(List.of(
				estadistica(personaje, "Destreza", 14),
				estadistica(personaje, "Constitucion", 14),
				estadistica(personaje, "Bonificador por competencia", 2),
				estadistica(personaje, "Puntos de vida", 12),
				estadistica(personaje, "Vida actual", 12),
				estadistica(personaje, "Experiencia", 0),
				estadistica(personaje, "Dados de golpe d12", 1),
				estadistica(personaje, "Iniciativa", 2),
				estadistica(personaje, "CA", 12)
		));

		when(repository.findByPersonajeIdOrderByIdAsc(1L)).thenReturn(persistedStats);
		when(mochilaRepository.findByPersonajeIdOrderByIdAsc(1L)).thenReturn(List.of());

		service.aplicarSubidaNivel(
				personaje,
				new LinkedHashMap<>(Map.of("Destreza", 14, "Constitucion", 16)),
				"d12",
				8,
				Map.of(),
				2,
				Set.of()
		);

		ArgumentCaptor<Iterable<Estadistica>> captor = estadisticaIterableCaptor();
		verify(repository).saveAll(captor.capture());

		Map<String, Integer> savedValues = new LinkedHashMap<>();
		for (Estadistica estadistica : captor.getValue()) {
			savedValues.put(estadistica.getNombre(), estadistica.getValor());
		}

		assertEquals(15, savedValues.get("CA"));
	}

	@Test
	void actualizarRecursosPersonaje_actualizaVidaRanurasYRecursosExtra() {
		EstadisticaRepository repository = mock(EstadisticaRepository.class);
		MochilaRepository mochilaRepository = mock(MochilaRepository.class);
		EstadisticaService service = new EstadisticaService(repository, mochilaRepository);
		Personaje personaje = Personaje.builder().id(4L).nombre("Aerin").build();
		List<Estadistica> persistedStats = new ArrayList<>(List.of(
				estadistica(personaje, "Puntos de vida", 20),
				estadistica(personaje, "Vida actual", 12),
				estadistica(personaje, "Vida temporal", 1),
				estadistica(personaje, "Hechizos nivel 1", 4),
				estadistica(personaje, "Hechizos nivel 1 gastados", 4),
				estadistica(personaje, "Recurso custom dnd maximo 1", 3),
				estadistica(personaje, "Recurso custom dnd actual 1", 0)
		));

		when(repository.findByPersonajeIdAndNombreIn(
				4L,
				List.of(
						"Puntos de vida",
						"Vida actual",
						"Vida temporal",
						"Vida maxima",
						"Hechizos nivel 1",
						"Hechizos nivel 1 gastados",
						"Recurso custom dnd actual 1",
						"Recurso custom dnd maximo 1"
				)
		)).thenReturn(persistedStats);

		service.actualizarRecursosPersonaje(personaje, 15, 2, Map.of(1, 3), Map.of(1, 2));

		ArgumentCaptor<Iterable<Estadistica>> captor = estadisticaIterableCaptor();
		verify(repository).saveAll(captor.capture());

		Map<String, Integer> savedValues = new LinkedHashMap<>();
		for (Estadistica estadistica : captor.getValue()) {
			savedValues.put(estadistica.getNombre(), estadistica.getValor());
		}

		assertEquals(15, savedValues.get("Vida actual"));
		assertEquals(2, savedValues.get("Vida temporal"));
		assertEquals(3, savedValues.get("Hechizos nivel 1 gastados"));
		assertEquals(2, savedValues.get("Recurso custom dnd actual 1"));
	}

	@Test
	void actualizarEdicionHoja_sincronizaRanurasYRecursosExtraEnUtilidadesExtraidas() {
		EstadisticaRepository repository = mock(EstadisticaRepository.class);
		MochilaRepository mochilaRepository = mock(MochilaRepository.class);
		EstadisticaService service = new EstadisticaService(repository, mochilaRepository);
		Personaje personaje = Personaje.builder().id(3L).nombre("Lyra").tags("Clase;Mago:3").build();
		List<Estadistica> persistedStats = new ArrayList<>(List.of(
				estadistica(personaje, "Fuerza", 10),
				estadistica(personaje, "Destreza", 14),
				estadistica(personaje, "Constitucion", 12),
				estadistica(personaje, "Inteligencia", 16),
				estadistica(personaje, "Sabiduria", 10),
				estadistica(personaje, "Carisma", 8),
				estadistica(personaje, "Puntos de vida", 18),
				estadistica(personaje, "Vida actual", 18),
				estadistica(personaje, "Bonificador por competencia", 2),
				estadistica(personaje, "Iniciativa", 2),
				estadistica(personaje, "CA", 12),
				estadistica(personaje, "Hechizos nivel 1", 4),
				estadistica(personaje, "Hechizos nivel 1 gastados", 2)
		));

		when(repository.findByPersonajeIdOrderByIdAsc(3L)).thenReturn(persistedStats);
		when(mochilaRepository.findByPersonajeIdOrderByIdAsc(3L)).thenReturn(List.of());

		service.actualizarEdicionHoja(
				personaje,
				Map.of(
						"Fuerza", 10,
						"Destreza", 14,
						"Constitucion", 12,
						"Inteligencia", 16,
						"Sabiduria", 10,
						"Carisma", 8
				),
				30,
				18,
				Map.of(1, 4, 2, 2),
				Map.of(1, 3, 2, 1),
				Map.of(1, 3),
				Map.of(1, 2),
				Set.of(),
				Set.of(),
				Set.of(),
				3
		);

		verify(repository).deleteAll(anyIterable());
		ArgumentCaptor<Iterable<Estadistica>> captor = estadisticaIterableCaptor();
		verify(repository).saveAll(captor.capture());

		Map<String, Integer> savedValues = new LinkedHashMap<>();
		for (Estadistica estadistica : captor.getValue()) {
			savedValues.put(estadistica.getNombre(), estadistica.getValor());
		}

		assertEquals(4, savedValues.get("Hechizos nivel 1"));
		assertEquals(3, savedValues.get("Hechizos nivel 1 gastados"));
		assertEquals(2, savedValues.get("Hechizos nivel 2"));
		assertEquals(1, savedValues.get("Hechizos nivel 2 gastados"));
		assertEquals(3, savedValues.get("Recurso custom dnd maximo 1"));
		assertEquals(2, savedValues.get("Recurso custom dnd actual 1"));
	}

	private Estadistica estadistica(Personaje personaje, String nombre, int valor) {
		return Estadistica.builder()
				.personaje(personaje)
				.nombre(nombre)
				.valor(valor)
				.build();
	}

	@SuppressWarnings({ "unchecked", "rawtypes" })
	private ArgumentCaptor<Iterable<Estadistica>> estadisticaIterableCaptor() {
		return (ArgumentCaptor) ArgumentCaptor.forClass(Iterable.class);
	}
}