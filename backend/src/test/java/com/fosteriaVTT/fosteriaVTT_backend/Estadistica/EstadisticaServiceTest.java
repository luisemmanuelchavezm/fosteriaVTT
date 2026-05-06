package com.fosteriaVTT.fosteriaVTT_backend.Estadistica;

import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Mochila.MochilaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EstadisticaServiceTest {

	@Test
	void extraerClaseArmaduraDesdeFormula_preservaCapDeDestreza() throws Exception {
		EstadisticaService service = new EstadisticaService(mock(EstadisticaRepository.class), mock(MochilaRepository.class));
		Method method = EstadisticaService.class.getDeclaredMethod(
				"extraerClaseArmaduraDesdeFormula",
				String.class,
				Map.class
		);
		method.setAccessible(true);

		Integer armorClass = (Integer) method.invoke(
				service,
				"CA=14+DES(max:2)",
				Map.of("dexterity", 18)
		);

		assertEquals(16, armorClass);
	}

	@Test
	void extraerClaseArmaduraDesdeFormula_ignoraFormulaVacia() throws Exception {
		EstadisticaService service = new EstadisticaService(mock(EstadisticaRepository.class), mock(MochilaRepository.class));
		Method method = EstadisticaService.class.getDeclaredMethod(
				"extraerClaseArmaduraDesdeFormula",
				String.class,
				Map.class
		);
		method.setAccessible(true);

		Integer armorClass = (Integer) method.invoke(service, "", Map.of("dexterity", 18));

		assertNull(armorClass);
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