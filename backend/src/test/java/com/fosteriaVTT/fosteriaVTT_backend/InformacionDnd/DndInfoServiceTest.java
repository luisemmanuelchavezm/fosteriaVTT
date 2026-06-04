package com.fosteriaVTT.fosteriaVTT_backend.InformacionDnd;

import com.fosteriaVTT.fosteriaVTT_backend.ContenidoSistemaJson.ContenidoSistemaJsonService;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.HabilidadRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.ObjetoRepository;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndCompetenciasResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndLanzamientoConjurosResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndNivelLanzamientoConjurosResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndPuntosGolpeResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndSubclaseResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.DndCompetencyCatalogResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.EquipamientoDndGrupoResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.EquipamientoDndOpcionResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.EquipamientoDndResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ObjetoInicialResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndEleccionResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndRasgoResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.SubrazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.TrasfondoDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.TrasfondoDndEleccionResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DndInfoServiceTest {

    @Mock
    private ObjetoRepository objetoRepository;

    @Mock
    private HabilidadRepository habilidadRepository;

    @Mock
    private ContenidoSistemaJsonService contenidoSistemaJsonService;

    @Mock
    private DndEquipamientoResolver equipamientoResolver;

    @Mock
    private DndCatalogoResolver catalogoResolver;

    @InjectMocks
    private DndInfoService dndInfoService;

    @Test
    void obtieneClaseEnriquecidaConEleccionesHechizosYEquipamiento() {
        ClaseDndDetalleResponse claseBase = new ClaseDndDetalleResponse(
                "mago",
                "Mago",
                "Ma",
                "",
                new ClaseDndPuntosGolpeResponse("1d6", "", ""),
                new ClaseDndCompetenciasResponse(
                        List.of(),
                        List.of(),
                        List.of("una instrumentos a elección"),
                        List.of(),
                        List.of("Elige dos entre Arcano, Historia y Investigación.")
                ),
                new ClaseDndLanzamientoConjurosResponse(
                        "preparado",
                        "Inteligencia",
                        null,
                        List.of(new ClaseDndNivelLanzamientoConjurosResponse(1, 2, 3, null, List.of(2), null, null, null, null))
                ),
                List.of(),
                List.of(),
                new EquipamientoDndResponse(
                        List.of(new EquipamientoDndOpcionResponse(
                                "staff",
                                "Bastón",
                                1,
                                new ObjetoInicialResponse(null, "Bastón", null, null, null, "", 1),
                                null,
                                List.of()
                        )),
                        List.of(new EquipamientoDndGrupoResponse(
                                "focus",
                                "Foco arcano",
                                List.of(new EquipamientoDndOpcionResponse(
                                        "instrument",
                                        "Instrumento",
                                        1,
                                        null,
                                        "CatalogoInstrumentosDnd",
                                        List.of()
                                ))
                        ))
                )
        );

        when(contenidoSistemaJsonService.obtenerClaseDndPorId("mago")).thenReturn(Optional.of(claseBase));
        when(contenidoSistemaJsonService.obtenerSubclasesClaseDnd("mago")).thenReturn(List.of(
                new ClaseDndSubclaseResponse("evocacion", "Escuela de evocacion", "", 2, List.of())
        ));
        when(habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc("ClaseInicial;mago")).thenReturn(List.of(
                habilidad("Luz", "TRUCO,ClaseInicial;mago"),
                habilidad("Prestidigitación", "Truco,ClaseInicial;mago"),
                habilidad("Armadura de mago", "Hechizo;1,ClaseInicial;mago")
        ));
        when(catalogoResolver.resolverOpcionesInstrumentos()).thenReturn(List.of("Laúd", "Tambor"));
        when(equipamientoResolver.resolverEquipamiento(claseBase.equipamiento())).thenReturn(
                new EquipamientoDndResponse(
                        List.of(new EquipamientoDndOpcionResponse("staff", "Bastón", 1,
                                new ObjetoInicialResponse(1L, "Bastón", null, null, null, "", 1), null, List.of())),
                        List.of(new EquipamientoDndGrupoResponse("focus", "Foco arcano",
                                List.of(new EquipamientoDndOpcionResponse("instrument", "Instrumento", 1, null, "instrumentos",
                                        List.of(
                                                new ObjetoInicialResponse(2L, "Laúd", null, null, null, "", 1),
                                                new ObjetoInicialResponse(3L, "Tambor", null, null, null, "", 1)
                                        )
                                ))
                        ))
                )
        );

        ClaseDndDetalleResponse response = dndInfoService.obtenerClasePorId("mago").orElseThrow();

        assertEquals(1, response.subclases().size());
        assertEquals(4, response.elecciones().size());
        assertEquals("class-skill-0", response.elecciones().get(0).id());
        assertEquals(List.of("Arcano", "Historia", "Investigacion"), response.elecciones().get(0).opciones());
        assertEquals("instrumentos", response.elecciones().get(1).catalogo());
        assertEquals(List.of("Laúd", "Tambor"), response.elecciones().get(1).opciones());
        assertEquals("class-cantrip-0", response.elecciones().get(2).id());
        assertEquals(List.of("Luz", "Prestidigitación"), response.elecciones().get(2).opciones());
        assertEquals("class-spell-0", response.elecciones().get(3).id());
        assertEquals("Bastón", response.equipamiento().fijos().get(0).objeto().nombre());
        assertEquals(List.of("Laúd", "Tambor"), response.equipamiento().gruposEleccion().get(0).opciones().get(0).opcionesCatalogo().stream().map(ObjetoInicialResponse::nombre).toList());
    }

    @Test
    void obtieneCatalogoDeCompetenciasOrdenadoYSinDuplicados() {
        when(catalogoResolver.resolverCatalogoHabilidades()).thenReturn(List.of("Arcano", "Historia"));
        when(catalogoResolver.resolverCatalogoArmasArmaduras()).thenReturn(List.of("Arco largo", "Espada larga"));
        when(catalogoResolver.resolverCatalogoHerramientas()).thenReturn(List.of("Herramientas de ladrón"));

        DndCompetencyCatalogResponse response = dndInfoService.obtenerCatalogoCompetencias();

        assertEquals(List.of("Arcano", "Historia"), response.habilidades());
        assertEquals(List.of("Arco largo", "Espada larga"), response.armasArmaduras());
        assertEquals(List.of("Herramientas de ladrón"), response.herramientas());
    }

    @Test
    void enriqueceTrasfondosYRazasConCatalogosYSubrazas() {
        TrasfondoDndDetalleResponse trasfondoBase = new TrasfondoDndDetalleResponse(
                "sabio",
                "Sabio",
                "",
                List.of("Historia"),
                List.of(),
                List.of("2 idiomas"),
                "Investigador",
                "",
                List.of(new TrasfondoDndEleccionResponse("bg-language", "Idiomas", "", "idiomas", 1, List.of())),
                null
        );
        RazaDndDetalleResponse razaBase = new RazaDndDetalleResponse(
                "elfo",
                "Elfo",
                "",
                List.of("+2 Destreza"),
                "",
                "Mediano",
                30,
                List.of("Comun"),
                List.of(),
                List.of(new RazaDndRasgoResponse("Visión en la oscuridad", "")),
                List.of(new RazaDndEleccionResponse("race-language", "Idioma", "", "idiomas", 1, null, List.of(), List.of())),
                List.of()
        );

        when(contenidoSistemaJsonService.obtenerTrasfondoDndPorId("sabio")).thenReturn(Optional.of(trasfondoBase));
        when(contenidoSistemaJsonService.obtenerRazaDndPorId("elfo")).thenReturn(Optional.of(razaBase));
        when(catalogoResolver.resolverCatalogoTexto("idiomas")).thenReturn(List.of("Dracónico", "Élfico"));
        when(contenidoSistemaJsonService.obtenerSubrazasRazaDnd("elfo")).thenReturn(List.of(
                new SubrazaDndDetalleResponse(
                        "alto-elfo",
                        "Alto elfo",
                        "",
                        List.of("+1 Inteligencia"),
                        List.of(),
                        List.of(),
                        List.of(new RazaDndEleccionResponse("subrace-cantrip", "Truco", "", "trucosdemago", 1, null, List.of(), List.of()))
                )
        ));
        TrasfondoDndDetalleResponse trasfondo = dndInfoService.obtenerTrasfondoPorId("sabio").orElseThrow();
        RazaDndDetalleResponse raza = dndInfoService.obtenerRazaPorId("elfo").orElseThrow();

        assertEquals(List.of("Dracónico", "Élfico"), trasfondo.elecciones().get(0).opciones());
        assertEquals(List.of("Dracónico", "Élfico"), raza.elecciones().get(0).opciones());
        assertEquals("classCantrips:mago", raza.subrazas().get(0).elecciones().get(0).catalogo());
        assertEquals(1, dndInfoService.obtenerSubrazasRaza("elfo").size());
        assertTrue(dndInfoService.obtenerClasePorId(" ").isEmpty());
    }

    @Test
    void obtieneListasResumenDirectamenteDelServicioJson() {
        List<ClaseDndResumenResponse> clases = List.of(new ClaseDndResumenResponse("mago", "Mago", "Ma"));
        when(contenidoSistemaJsonService.obtenerClasesDnd()).thenReturn(clases);

        assertEquals(clases, dndInfoService.obtenerClases());
    }

    private static Habilidad habilidad(String nombre, String tags) {
        return Habilidad.builder()
                .id(1L)
                .nombre(nombre)
                .descripcion("")
                .formula(null)
                .tags(tags)
                .build();
    }

}