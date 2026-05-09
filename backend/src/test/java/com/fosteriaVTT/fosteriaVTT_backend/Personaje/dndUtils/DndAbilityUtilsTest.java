package com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils;

import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.HabilidadRepository;
import com.fosteriaVTT.fosteriaVTT_backend.InformacionDnd.DndSubclassService;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.PersonajeRepository;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndCompetenciasResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndSubclaseRasgoResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndSubclaseResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndTablaResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.TrasfondoDndDetalleResponse;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DndAbilityUtilsTest {

	@Mock
	private HabilidadRepository habilidadRepository;

	@Mock
	private PersonajeRepository personajeRepository;

	@Mock
	private DndSubclassService dndSubclassService;

	@InjectMocks
	private DndAbilityUtils dndAbilityUtils;

	@Test
	void agregaRasgosSinteticosDeSubclaseCuandoNoHayHabilidadesPersistidas() {
		ClaseDndSubclaseResponse subclase = new ClaseDndSubclaseResponse(
				"patron-feerico",
				"Patron feerico",
				"Descripcion de subclase",
				1,
				List.of(new ClaseDndTablaResponse(
						"Conjuros adicionales del patron",
						List.of("Nivel de conjuro", "Conjuros"),
						List.of(List.of("1", "Dormir, Fuego feerico"))
				))
		);
		ClaseDndDetalleResponse clase = new ClaseDndDetalleResponse(
				"brujo",
				"Brujo",
				null,
				"Descripcion",
				null,
				new ClaseDndCompetenciasResponse(List.of(), List.of(), List.of(), List.of(), List.of()),
				null,
				List.of(subclase),
				List.of(),
				null
		);
		RazaDndDetalleResponse raza = new RazaDndDetalleResponse(
				"humano",
				"Humano",
				"Descripcion",
				List.of(),
				null,
				null,
				30,
				List.of(),
				List.of(),
				List.of(),
				List.of(),
				List.of()
		);
		TrasfondoDndDetalleResponse trasfondo = new TrasfondoDndDetalleResponse(
				"acolito",
				"Acolito",
				"Descripcion",
				List.of(),
				List.of(),
				List.of(),
				"Refugio de los fieles",
				"Descripcion del trasfondo",
				List.of(),
				null
		);

		when(habilidadRepository.findAll()).thenReturn(List.of());
		when(habilidadRepository.findByNombreIgnoreCaseOrderByIdAsc(anyString())).thenAnswer(invocation -> {
			String nombre = invocation.getArgument(0, String.class);
			if (nombre.equalsIgnoreCase("Dormir")) {
				return List.of(Habilidad.builder().id(10L).nombre("Dormir").tags("Hechizo;1").descripcion("Conjuro de prueba").build());
			}
			if (nombre.equalsIgnoreCase("Fuego feerico")) {
				return List.of(Habilidad.builder().id(11L).nombre("Fuego feerico").tags("Hechizo;1").descripcion("Conjuro de prueba").build());
			}
			return List.of();
		});
		when(habilidadRepository.save(any(Habilidad.class))).thenAnswer(invocation -> invocation.getArgument(0));
		when(dndSubclassService.obtenerRasgosSubclase("brujo", "patron-feerico")).thenReturn(List.of(
				new ClaseDndSubclaseRasgoResponse(
						"patron-feerico",
						1,
						"Presencia feerica",
						"Aliado: Luces danzantes",
						"Obtienes un rasgo inicial de patron."
				)
		));

		List<Habilidad> habilidades = dndAbilityUtils.resolverHabilidadesIniciales(
				clase,
				subclase,
				raza,
				null,
				trasfondo,
				Map.of(),
				Map.of(),
				Map.of()
		);

		assertTrue(habilidades.stream().anyMatch(habilidad -> habilidad.getNombre().equals("Presencia feerica")));
		assertTrue(habilidades.stream().anyMatch(habilidad -> habilidad.getNombre().equals("Dormir")));
		assertTrue(habilidades.stream().anyMatch(habilidad -> habilidad.getNombre().equals("Fuego feerico")));
		assertTrue(habilidades.stream().anyMatch(habilidad -> {
			String tags = habilidad.getTags() == null ? "" : habilidad.getTags();
			return tags.contains("Subclase;patron-feerico");
		}));
	}

	@Test
	void agregaManiobrasDeMaestroDeBatallaComoHabilidadesElegidas() {
		ClaseDndSubclaseResponse subclase = new ClaseDndSubclaseResponse(
				"maestrobatalla",
				"Maestro de batalla",
				"",
				3,
				List.of()
		);
		ClaseDndDetalleResponse clase = new ClaseDndDetalleResponse(
				"guerrero",
				"Guerrero",
				null,
				"",
				null,
				new ClaseDndCompetenciasResponse(List.of(), List.of(), List.of(), List.of(), List.of()),
				null,
				List.of(subclase),
				List.of(),
				null
		);
		Personaje personaje = Personaje.builder().habilidades(new java.util.ArrayList<>()).build();

		when(habilidadRepository.findAll()).thenReturn(List.of());
		when(habilidadRepository.findByNombreIgnoreCaseOrderByIdAsc("Parada")).thenReturn(List.of(
				Habilidad.builder().id(20L).nombre("Parada").tags("DND,Guerrero,MaestroDeBatalla,Maniobra").descripcion("Reduce daño").build()
		));

		dndAbilityUtils.agregarHabilidadesDeClasePorNivel(
				personaje,
				clase,
				subclase,
				3,
				Map.of("bm-maneuver", List.of("Parada")),
				false
		);

		assertTrue(personaje.getHabilidades().stream().anyMatch(habilidad -> habilidad.getNombre().equals("Parada")));
	}
}