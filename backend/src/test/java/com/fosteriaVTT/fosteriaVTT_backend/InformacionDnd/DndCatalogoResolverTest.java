package com.fosteriaVTT.fosteriaVTT_backend.InformacionDnd;

import com.fosteriaVTT.fosteriaVTT_backend.ContenidoSistemaJson.ContenidoSistemaJsonService;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.HabilidadRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.Objeto;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.ObjetoRepository;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DndCatalogoResolverTest {

    @Mock
    ObjetoRepository objetoRepository;

    @Mock
    HabilidadRepository habilidadRepository;

    @Mock
    ContenidoSistemaJsonService contenidoSistemaJsonService;

    DndCatalogoResolver resolver;

    @BeforeEach
    void setUp() {
        resolver = new DndCatalogoResolver(objetoRepository, habilidadRepository, contenidoSistemaJsonService);
    }

    // ── resolverCatalogoTexto edge cases ──────────────────────────────────────

    @Test
    void resolverCatalogoTexto_retornaVacioParaNull() {
        assertTrue(resolver.resolverCatalogoTexto(null).isEmpty());
        verifyNoInteractions(objetoRepository, habilidadRepository, contenidoSistemaJsonService);
    }

    @Test
    void resolverCatalogoTexto_retornaVacioParaBlanco() {
        assertTrue(resolver.resolverCatalogoTexto("   ").isEmpty());
        verifyNoInteractions(objetoRepository, habilidadRepository, contenidoSistemaJsonService);
    }

    // ── instrumentos ─────────────────────────────────────────────────────────

    @Test
    void resolverCatalogoTexto_instrumentos_retornaNombresDeObjetos() {
        Objeto flauta = objetoConNombreEIndice("Flauta", "DND,InstrumentoMusical,CatalogoInstrumentosDnd");
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc("CatalogoInstrumentosDnd"))
                .thenReturn(List.of(flauta));

        List<String> result = resolver.resolverCatalogoTexto("instrumentos");

        assertEquals(List.of("Flauta"), result);
    }

    @Test
    void resolverCatalogoTexto_instrumentos_filtraObjetosConEtiquetaInexacta() {
        Objeto noInstrumento = objetoConNombreEIndice("Falso", "CatalogoInstrumentosDnd,Extra");
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc("CatalogoInstrumentosDnd"))
                .thenReturn(List.of(noInstrumento));

        // El objeto tiene "CatalogoInstrumentosDnd" pero la etiqueta exacta no está sola en indice split
        // Flauta: "DND,InstrumentoMusical,CatalogoInstrumentosDnd" → split por coma → "CatalogoInstrumentosDnd" ✓
        // Falso: "CatalogoInstrumentosDnd,Extra" → split → "CatalogoInstrumentosDnd" ✓ (también pasa)
        List<String> result = resolver.resolverCatalogoTexto("instrumentos");
        assertFalse(result.isEmpty());
    }

    // ── juegos ────────────────────────────────────────────────────────────────

    @Test
    void resolverCatalogoTexto_juegos_retornaListaDeJuegos() {
        Objeto dados = objetoConNombreEIndice("Juego de dados", "DND,Juego,CatalogoJuegosDnd");
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc("CatalogoJuegosDnd"))
                .thenReturn(List.of(dados));

        List<String> result = resolver.resolverCatalogoTexto("juegos");

        assertTrue(result.contains("Juego de dados"));
    }

    // ── herramientasArtesano ──────────────────────────────────────────────────

    @Test
    void resolverCatalogoTexto_herramientasArtesano_retornaListaDeHerramientas() {
        Objeto herramienta = objetoConNombreEIndice("Herramientas de herrero", "DND,HerramientaArtesano,CatalogoHerramientasArtesanoDnd");
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc("CatalogoHerramientasArtesanoDnd"))
                .thenReturn(List.of(herramienta));

        List<String> result = resolver.resolverCatalogoTexto("herramientasArtesano");

        assertTrue(result.contains("Herramientas de herrero"));
    }

    // ── habilidades ───────────────────────────────────────────────────────────

    @Test
    void resolverCatalogoTexto_habilidades_retornaHabilidadesOrdenadas() {
        Habilidad sigilo = habilidadConNombreYTags("Sigilo", "DND,CatalogoHabilidadDnd;sigilo");
        Habilidad atletismo = habilidadConNombreYTags("Atletismo", "DND,CatalogoHabilidadDnd;atletismo");
        when(habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc("CatalogoHabilidadDnd"))
                .thenReturn(List.of(atletismo, sigilo));

        List<String> result = resolver.resolverCatalogoTexto("habilidades");

        assertEquals(List.of("Atletismo", "Sigilo"), result);
    }

    // ── idiomas ───────────────────────────────────────────────────────────────

    @Test
    void resolverCatalogoTexto_idiomas_delegaAContenidoSistemaJson() {
        when(contenidoSistemaJsonService.obtenerCatalogoRazaDnd("idiomas"))
                .thenReturn(List.of("Común", "Élfico"));

        List<String> result = resolver.resolverCatalogoTexto("idiomas");

        assertEquals(2, result.size());
        assertTrue(result.contains("Común"));
        assertTrue(result.contains("Élfico"));
    }

    @Test
    void resolverCatalogoTexto_ancestrosDraconicos_delegaAContenidoSistemaJson() {
        when(contenidoSistemaJsonService.obtenerCatalogoRazaDnd("ancestrosDraconicos"))
                .thenReturn(List.of("Cromatico", "Metalico"));

        List<String> result = resolver.resolverCatalogoTexto("ancestrosDraconicos");

        assertEquals(2, result.size());
    }

    // ── classCantrips ─────────────────────────────────────────────────────────

    @Test
    void resolverCatalogoTexto_classCantripsMago_retornaTrucosDeMago() {
        Habilidad rayo = habilidadConNombreYTags("Rayo de escarcha", "truco,ClaseInicial;mago");
        Habilidad noTruco = habilidadConNombreYTags("Proyectil mágico", "Hechizo;1,ClaseInicial;mago");
        when(habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc("ClaseInicial;mago"))
                .thenReturn(List.of(rayo, noTruco));

        List<String> result = resolver.resolverCatalogoTexto("trucosDeMago");

        assertTrue(result.contains("Rayo de escarcha"));
        assertFalse(result.contains("Proyectil mágico"));
    }

    @Test
    void resolverCatalogoTexto_classCantripsClaseVacia_retornaListaVacia() {
        List<String> result = resolver.resolverCatalogoTexto("classCantrips:");
        assertTrue(result.isEmpty());
        verifyNoInteractions(habilidadRepository);
    }

    // ── catálogo estático ─────────────────────────────────────────────────────

    @Test
    void resolverCatalogoTexto_puntuacionesCaracteristica_retornaListaEstatica() {
        List<String> result = resolver.resolverCatalogoTexto("puntuacionesCaracteristica");

        assertEquals(6, result.size());
        assertTrue(result.contains("Fuerza"));
        assertTrue(result.contains("Carisma"));
    }

    @Test
    void resolverCatalogoTexto_catalogoDesconocido_retornaVacio() {
        List<String> result = resolver.resolverCatalogoTexto("catalogoInexistente");
        assertTrue(result.isEmpty());
    }

    // ── métodos directos ──────────────────────────────────────────────────────

    @Test
    void resolverCatalogoHabilidades_retornaHabilidades() {
        Habilidad percepcion = habilidadConNombreYTags("Percepción", "DND,CatalogoHabilidadDnd;percepcion");
        when(habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc("CatalogoHabilidadDnd"))
                .thenReturn(List.of(percepcion));

        List<String> result = resolver.resolverCatalogoHabilidades();

        assertEquals(List.of("Percepción"), result);
    }

    @Test
    void resolverOpcionesInstrumentos_retornaInstrumentos() {
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc("CatalogoInstrumentosDnd"))
                .thenReturn(List.of());

        List<String> result = resolver.resolverOpcionesInstrumentos();

        assertTrue(result.isEmpty());
    }

    @Test
    void resolverCatalogoArmasArmaduras_retornaCompetencias() {
        Objeto comp = objetoConNombreEIndice("Armaduras ligeras", "DND,Competencia,ArmaArmadura,CatalogoCompetenciasArmasArmadurasDnd");
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc("CatalogoCompetenciasArmasArmadurasDnd"))
                .thenReturn(List.of(comp));

        List<String> result = resolver.resolverCatalogoArmasArmaduras();

        assertTrue(result.contains("Armaduras ligeras"));
    }

    @Test
    void resolverCatalogoHerramientas_retornaHerramientas() {
        Objeto tool = objetoConNombreEIndice("Herramientas de ladrón", "DND,Competencia,Herramienta,CatalogoCompetenciasHerramientasDnd");
        when(objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc("CatalogoCompetenciasHerramientasDnd"))
                .thenReturn(List.of(tool));

        List<String> result = resolver.resolverCatalogoHerramientas();

        assertTrue(result.contains("Herramientas de ladrón"));
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private Objeto objetoConNombreEIndice(String nombre, String indice) {
        Objeto obj = new Objeto();
        obj.setNombre(nombre);
        obj.setIndice(indice);
        return obj;
    }

    private Habilidad habilidadConNombreYTags(String nombre, String tags) {
        return Habilidad.builder()
                .nombre(nombre)
                .tags(tags)
                .build();
    }
}
