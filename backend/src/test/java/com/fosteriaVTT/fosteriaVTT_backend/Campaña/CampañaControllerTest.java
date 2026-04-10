package com.fosteriaVTT.fosteriaVTT_backend.Campaña;

import com.fosteriaVTT.fosteriaVTT_backend.dto.CampañaResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PagedResponse;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class CampañaControllerTest {

    private static final LocalDateTime ULTIMO_ACCESO = LocalDateTime.of(2026, 4, 10, 18, 30);

    @Mock
    private CampañaService campañaService;

    @InjectMocks
    private CampañaController campañaController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUpMockMvc() {
        mockMvc = MockMvcBuilders.standaloneSetup(campañaController).build();
    }

    @Test
    void obtieneLasUltimasCampañasDelUsuarioAutenticado() {
        List<CampañaResumenResponse> campañas = List.of(
            new CampañaResumenResponse(1L, "Crónicas de la Bruma", "https://img.test/1", "Dungeons and Dragons", "dmuno", ULTIMO_ACCESO),
            new CampañaResumenResponse(2L, "La llamada", "https://img.test/2", "Call Of Cthulhu", "dmdos", ULTIMO_ACCESO.minusDays(1))
        );
        TestingAuthenticationToken authentication =
                new TestingAuthenticationToken("daria", null);
        authentication.setAuthenticated(true);

        when(campañaService.obtenerUltimasCampañas("daria")).thenReturn(campañas);

        List<CampañaResumenResponse> response = campañaController.obtenerUltimasCampañas(authentication);

        assertEquals(campañas, response);
        verify(campañaService).obtenerUltimasCampañas("daria");
    }

    @Test
    void lanzaUnauthorizedSiNoHayAutenticacion() {
        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> campañaController.obtenerUltimasCampañas(null)
        );

        assertEquals(401, exception.getStatusCode().value());
        assertEquals("Usuario no autenticado", exception.getReason());
    }

    @Test
    void endpointDevuelveLasUltimasCampañas() throws Exception {
        List<CampañaResumenResponse> campañas = List.of(
                new CampañaResumenResponse(1L, "Crónicas de la Bruma", "https://img.test/1", "Dungeons and Dragons", "dmuno", ULTIMO_ACCESO),
                new CampañaResumenResponse(2L, "La llamada", "https://img.test/2", "Call Of Cthulhu", "dmdos", ULTIMO_ACCESO.minusDays(1))
        );
        TestingAuthenticationToken authentication =
            new TestingAuthenticationToken("daria", null);
        authentication.setAuthenticated(true);
        when(campañaService.obtenerUltimasCampañas("daria")).thenReturn(campañas);

        mockMvc.perform(get("/api/campanas/ultimas")
                .principal(authentication)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre").value("Crónicas de la Bruma"))
                .andExpect(jsonPath("$[1].sistemaDeJuego").value("Call Of Cthulhu"))
                .andExpect(jsonPath("$[0].dmUsername").value("dmuno"));
    }

    @Test
    void obtieneLasCampañasOrdenadasPorUltimoAccesoDelUsuarioAutenticado() {
        List<CampañaResumenResponse> campañas = List.of(
                new CampañaResumenResponse(1L, "Crónicas de la Bruma", "https://img.test/1", "Dungeons and Dragons", "dmuno", ULTIMO_ACCESO),
                new CampañaResumenResponse(2L, "La llamada", "https://img.test/2", "Call Of Cthulhu", "dmdos", ULTIMO_ACCESO.minusDays(1))
        );
        PagedResponse<CampañaResumenResponse> pagedResponse = new PagedResponse<>(campañas, true);
        TestingAuthenticationToken authentication =
                new TestingAuthenticationToken("daria", null);
        authentication.setAuthenticated(true);

        when(campañaService.obtenerCampañasOrdenadasPorUltimoAcceso("daria", null, null, null, 0, 15))
                .thenReturn(pagedResponse);

        PagedResponse<CampañaResumenResponse> response = campañaController.obtenerCampañas(authentication, null, null, null, 0, 15);

        assertEquals(pagedResponse, response);
        verify(campañaService).obtenerCampañasOrdenadasPorUltimoAcceso("daria", null, null, null, 0, 15);
    }

        @Test
        void lanzaUnauthorizedSiNoHayAutenticacionEnCampañasPaginadas() {
                ResponseStatusException exception = assertThrows(
                                ResponseStatusException.class,
                                () -> campañaController.obtenerCampañas(null, null, null, null, 0, 15)
                );

                assertEquals(401, exception.getStatusCode().value());
                assertEquals("Usuario no autenticado", exception.getReason());
        }

    @Test
    void endpointDevuelveLasCampañasOrdenadasPorUltimoAcceso() throws Exception {
        List<CampañaResumenResponse> campañas = List.of(
                new CampañaResumenResponse(1L, "Crónicas de la Bruma", "https://img.test/1", "Dungeons and Dragons", "dmuno", ULTIMO_ACCESO),
                new CampañaResumenResponse(2L, "La llamada", "https://img.test/2", "Call Of Cthulhu", "dmdos", ULTIMO_ACCESO.minusDays(1))
        );
        PagedResponse<CampañaResumenResponse> pagedResponse = new PagedResponse<>(campañas, true);
        TestingAuthenticationToken authentication =
                new TestingAuthenticationToken("daria", null);
        authentication.setAuthenticated(true);

        when(campañaService.obtenerCampañasOrdenadasPorUltimoAcceso("daria", "cron", List.of("Dungeons and Dragons"), "dmu", 1, 15))
                .thenReturn(pagedResponse);

        mockMvc.perform(get("/api/campanas")
                .param("nombre", "cron")
                .param("sistemas", "Dungeons and Dragons")
                .param("dm", "dmu")
                .param("page", "1")
                .param("size", "15")
                .principal(authentication)
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].nombre").value("Crónicas de la Bruma"))
                .andExpect(jsonPath("$.items[0].ultimaVezAccedido").exists())
                .andExpect(jsonPath("$.items[1].sistemaDeJuego").value("Call Of Cthulhu"))
                .andExpect(jsonPath("$.hasMore").value(true));

        verify(campañaService).obtenerCampañasOrdenadasPorUltimoAcceso(
                "daria",
                "cron",
                List.of("Dungeons and Dragons"),
                "dmu",
                1,
                15
        );
    }
}