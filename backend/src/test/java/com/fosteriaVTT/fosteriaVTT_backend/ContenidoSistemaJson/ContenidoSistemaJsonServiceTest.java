package com.fosteriaVTT.fosteriaVTT_backend.ContenidoSistemaJson;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ContenidoSistemaJsonServiceTest {

        private static <T> TypeReference<T> anyTypeReference() {
                return org.mockito.ArgumentMatchers.<TypeReference<T>>any();
        }

    @Mock
    private ContenidoSistemaJsonRepository contenidoSistemaJsonRepository;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private ContenidoSistemaJsonService contenidoSistemaJsonService;

    private ContenidoSistemaJson contenido;

    @BeforeEach
    void setUp() {
        contenido = ContenidoSistemaJson.builder()
                .sistema(SistemaDeJuego.DND)
                .paquete(ContenidoSistemaJsonService.DND_PACKAGE_CLASS_SUMMARIES)
                .jsonB("[\"mago\",\"clerigo\"]")
                .build();
    }

    @Test
    void obtienePaqueteRawCuandoExisteContenidoValido() {
        when(contenidoSistemaJsonRepository.findBySistemaAndPaquete(SistemaDeJuego.DND, contenido.getPaquete()))
                .thenReturn(Optional.of(contenido));

        String json = contenidoSistemaJsonService.obtenerPaqueteRaw(SistemaDeJuego.DND, contenido.getPaquete());

        assertEquals("[\"mago\",\"clerigo\"]", json);
    }

    @Test
    void devuelveVacioYLanzaExcepcionSegunElTipoDeConsulta() {
        when(contenidoSistemaJsonRepository.findBySistemaAndPaquete(SistemaDeJuego.DND, "faltante"))
                .thenReturn(Optional.empty());

        assertTrue(contenidoSistemaJsonService
                .obtenerPaqueteTipadoOpcional(SistemaDeJuego.DND, "faltante", new TypeReference<List<String>>() {})
                .isEmpty());
        assertThrows(IllegalStateException.class, () -> contenidoSistemaJsonService.obtenerPaqueteRaw(SistemaDeJuego.DND, "faltante"));
        assertThrows(IllegalStateException.class,
                () -> contenidoSistemaJsonService.obtenerPaqueteTipado(SistemaDeJuego.DND, "faltante", new TypeReference<List<String>>() {}));
    }

    @Test
    void deserializaContenidoTipadoYEnvuelveErroresDeJson() throws Exception {
        when(contenidoSistemaJsonRepository.findBySistemaAndPaquete(SistemaDeJuego.DND, contenido.getPaquete()))
                .thenReturn(Optional.of(contenido));
        when(objectMapper.readValue(eq(contenido.getJsonB()), anyTypeReference()))
                .thenReturn(List.of("mago", "clerigo"));

        List<String> resultado = contenidoSistemaJsonService.obtenerPaqueteTipado(
                SistemaDeJuego.DND,
                contenido.getPaquete(),
                new TypeReference<List<String>>() {}
        );

        assertEquals(List.of("mago", "clerigo"), resultado);

        JsonProcessingException jsonException = new JsonProcessingException("boom") {};
        when(objectMapper.readValue(eq(contenido.getJsonB()), anyTypeReference()))
                .thenThrow(jsonException);

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> contenidoSistemaJsonService.obtenerPaqueteTipadoOpcional(
                        SistemaDeJuego.DND,
                        contenido.getPaquete(),
                        new TypeReference<List<String>>() {}
                )
        );

        assertEquals("No se pudo deserializar el contenido JSONB", exception.getMessage());
        assertEquals(jsonException, exception.getCause());
    }

    @Test
    void guardaContenidoNuevoOExistenteYNormalizaLosPaquetes() {
        when(contenidoSistemaJsonRepository.findBySistemaAndPaquete(SistemaDeJuego.DND, "clases:detalle:mago"))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(ContenidoSistemaJson.builder()
                        .sistema(SistemaDeJuego.DND)
                        .paquete("clases:detalle:mago")
                        .jsonB("{}")
                        .build()));

        contenidoSistemaJsonService.guardarPaquete(SistemaDeJuego.DND, "clases:detalle:mago", "{\"id\":\"mago\"}");
        contenidoSistemaJsonService.guardarPaquete(SistemaDeJuego.DND, "clases:detalle:mago", "{\"id\":\"mago-evocador\"}");

        ArgumentCaptor<ContenidoSistemaJson> captor = ArgumentCaptor.forClass(ContenidoSistemaJson.class);
        verify(contenidoSistemaJsonRepository, org.mockito.Mockito.times(2)).save(captor.capture());

        List<ContenidoSistemaJson> guardados = captor.getAllValues();
        assertEquals("{\"id\":\"mago\"}", guardados.getFirst().getJsonB());
        assertEquals("{\"id\":\"mago-evocador\"}", guardados.getLast().getJsonB());
        assertEquals("clases:detalle:mago", ContenidoSistemaJsonService.paqueteDetalleClase(" prefijo:mago "));
        assertEquals("razas:catalogo:elfo", ContenidoSistemaJsonService.paqueteCatalogoRaza("raza:elfo"));
                assertFalse(guardados.isEmpty());
    }

    @Test
    void rechazaIdentificadoresDePaqueteVacios() {
        assertThrows(IllegalArgumentException.class, () -> ContenidoSistemaJsonService.paqueteDetalleClase("   "));
    }
}