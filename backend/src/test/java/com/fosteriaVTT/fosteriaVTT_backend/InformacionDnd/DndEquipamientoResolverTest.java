package com.fosteriaVTT.fosteriaVTT_backend.InformacionDnd;

import com.fosteriaVTT.fosteriaVTT_backend.Objeto.Objeto;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.ObjetoRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.TipoObjeto;
import com.fosteriaVTT.fosteriaVTT_backend.dto.EquipamientoDndGrupoResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.EquipamientoDndOpcionResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.EquipamientoDndResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ObjetoInicialResponse;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DndEquipamientoResolverTest {

    @Mock
    ObjetoRepository objetoRepository;

    DndEquipamientoResolver resolver;

    @BeforeEach
    void setUp() {
        resolver = new DndEquipamientoResolver(objetoRepository);
    }

    // ── resolverEquipamiento null guard ───────────────────────────────────────

    @Test
    void resolverEquipamiento_null_retornaRespuestaVacia() {
        EquipamientoDndResponse result = resolver.resolverEquipamiento(null);

        assertNotNull(result);
        assertTrue(result.fijos().isEmpty());
        assertTrue(result.gruposEleccion().isEmpty());
        verifyNoInteractions(objetoRepository);
    }

    // ── fijos con objeto encontrado ───────────────────────────────────────────

    @Test
    void resolverEquipamiento_fijoConObjetoEncontrado_mapea() {
        Objeto espada = objetoPersistido(1L, "Espada corta", "Arma ligera", "1d6", TipoObjeto.ARMA, "MORK_BORG,Arma");
        when(objetoRepository.findByNombreIgnoreCaseOrderByIdAsc("Espada corta"))
                .thenReturn(List.of(espada));

        ObjetoInicialResponse objetoRef = new ObjetoInicialResponse(null, "Espada corta", null, null, null, "", 1);
        EquipamientoDndOpcionResponse opcion = new EquipamientoDndOpcionResponse(
                "op1", "Espada corta", 1, objetoRef, null, List.of()
        );
        EquipamientoDndResponse equipamiento = new EquipamientoDndResponse(List.of(opcion), List.of());

        EquipamientoDndResponse result = resolver.resolverEquipamiento(equipamiento);

        assertEquals(1, result.fijos().size());
        assertNotNull(result.fijos().get(0).objeto());
        assertEquals(1L, result.fijos().get(0).objeto().id());
        assertEquals("Espada corta", result.fijos().get(0).objeto().nombre());
    }

    // ── fijos con objeto NO encontrado → fallback ─────────────────────────────

    @Test
    void resolverEquipamiento_fijoConObjetoNoEncontrado_usaFallback() {
        when(objetoRepository.findByNombreIgnoreCaseOrderByIdAsc("Arma inexistente"))
                .thenReturn(List.of());

        ObjetoInicialResponse objetoRef = new ObjetoInicialResponse(null, "Arma inexistente", null, null, null, "", 1);
        EquipamientoDndOpcionResponse opcion = new EquipamientoDndOpcionResponse(
                "op2", "Arma", 2, objetoRef, null, List.of()
        );
        EquipamientoDndResponse equipamiento = new EquipamientoDndResponse(List.of(opcion), List.of());

        EquipamientoDndResponse result = resolver.resolverEquipamiento(equipamiento);

        assertNotNull(result.fijos().get(0).objeto());
        assertNull(result.fijos().get(0).objeto().id());
        assertEquals("Arma inexistente", result.fijos().get(0).objeto().nombre());
        assertEquals(2, result.fijos().get(0).objeto().cantidad());
    }

    // ── opción sin objeto (objeto = null) ─────────────────────────────────────

    @Test
    void resolverEquipamiento_opcionSinObjeto_retornaObjetoNull() {
        EquipamientoDndOpcionResponse opcion = new EquipamientoDndOpcionResponse(
                "op3", "Elección", 1, null, null, List.of()
        );
        EquipamientoDndResponse equipamiento = new EquipamientoDndResponse(List.of(opcion), List.of());

        EquipamientoDndResponse result = resolver.resolverEquipamiento(equipamiento);

        assertNull(result.fijos().get(0).objeto());
        verifyNoInteractions(objetoRepository);
    }

    // ── opción con catálogo ───────────────────────────────────────────────────

    @Test
    void resolverEquipamiento_opcionConCatalogo_resuelveCatalogo() {
        Objeto escudo = objetoPersistido(5L, "Escudo", "Protección", null, TipoObjeto.ARMADURA, "DND,CatalogoArmadura");
        when(objetoRepository.findAll()).thenReturn(List.of(escudo));

        EquipamientoDndOpcionResponse opcion = new EquipamientoDndOpcionResponse(
                "op4", "Armadura inicial", 1, null, "CatalogoArmadura", List.of()
        );
        EquipamientoDndResponse equipamiento = new EquipamientoDndResponse(List.of(opcion), List.of());

        EquipamientoDndResponse result = resolver.resolverEquipamiento(equipamiento);

        assertFalse(result.fijos().get(0).opcionesCatalogo().isEmpty());
        assertEquals("Escudo", result.fijos().get(0).opcionesCatalogo().get(0).nombre());
    }

    // ── grupos de elección ────────────────────────────────────────────────────

    @Test
    void resolverEquipamiento_conGrupoDeEleccion_resuelveOpciones() {
        when(objetoRepository.findByNombreIgnoreCaseOrderByIdAsc("Hacha"))
                .thenReturn(List.of());

        ObjetoInicialResponse objetoRef = new ObjetoInicialResponse(null, "Hacha", null, null, null, "", 1);
        EquipamientoDndOpcionResponse opcionGrupo = new EquipamientoDndOpcionResponse(
                "g1op1", "Hacha de mano", 1, objetoRef, null, List.of()
        );
        EquipamientoDndGrupoResponse grupo = new EquipamientoDndGrupoResponse(
                "g1", "Arma marcial a elección", List.of(opcionGrupo)
        );
        EquipamientoDndResponse equipamiento = new EquipamientoDndResponse(List.of(), List.of(grupo));

        EquipamientoDndResponse result = resolver.resolverEquipamiento(equipamiento);

        assertEquals(1, result.gruposEleccion().size());
        assertEquals("g1", result.gruposEleccion().get(0).id());
        assertEquals(1, result.gruposEleccion().get(0).opciones().size());
    }

    // ── null en fijos/grupos → tratados como vacíos ───────────────────────────

    @Test
    void resolverEquipamiento_fijosNull_seTratatComoVacio() {
        EquipamientoDndResponse equipamiento = new EquipamientoDndResponse(null, List.of());

        EquipamientoDndResponse result = resolver.resolverEquipamiento(equipamiento);

        assertTrue(result.fijos().isEmpty());
        assertTrue(result.gruposEleccion().isEmpty());
    }

    @Test
    void resolverEquipamiento_gruposNull_seTratatComoVacio() {
        EquipamientoDndResponse equipamiento = new EquipamientoDndResponse(List.of(), null);

        EquipamientoDndResponse result = resolver.resolverEquipamiento(equipamiento);

        assertTrue(result.fijos().isEmpty());
        assertTrue(result.gruposEleccion().isEmpty());
    }

    // ── objeto con cantidad null → usa 1 ─────────────────────────────────────

    @Test
    void resolverEquipamiento_cantidadNull_usaUno() {
        when(objetoRepository.findByNombreIgnoreCaseOrderByIdAsc("Ballesta"))
                .thenReturn(List.of());

        ObjetoInicialResponse objetoRef = new ObjetoInicialResponse(null, "Ballesta", null, null, null, "", null);
        EquipamientoDndOpcionResponse opcion = new EquipamientoDndOpcionResponse(
                "op5", "Ballesta", null, objetoRef, null, List.of()
        );
        EquipamientoDndResponse equipamiento = new EquipamientoDndResponse(List.of(opcion), List.of());

        EquipamientoDndResponse result = resolver.resolverEquipamiento(equipamiento);

        assertEquals(1, result.fijos().get(0).objeto().cantidad());
    }

    // ── helper ────────────────────────────────────────────────────────────────

    private Objeto objetoPersistido(Long id, String nombre, String descripcion, String formula, TipoObjeto tipo, String indice) {
        Objeto obj = new Objeto();
        obj.setId(id);
        obj.setNombre(nombre);
        obj.setDescripcion(descripcion);
        obj.setFormula(formula);
        obj.setTipoObjeto(tipo);
        obj.setIndice(indice);
        return obj;
    }
}
