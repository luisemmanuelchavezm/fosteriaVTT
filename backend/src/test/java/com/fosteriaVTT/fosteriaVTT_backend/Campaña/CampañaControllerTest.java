package com.fosteriaVTT.fosteriaVTT_backend.Campaña;

import com.fosteriaVTT.fosteriaVTT_backend.dto.CampañaResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.JugadorCampañaResponse;
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
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

    @Test
    void obtenerJugadoresCampañaDevuelveLaLista() {
        List<JugadorCampañaResponse> jugadores = List.of(
                new JugadorCampañaResponse("dm1", true),
                new JugadorCampañaResponse("jugador1", false)
        );
        TestingAuthenticationToken auth = new TestingAuthenticationToken("dm1", null);
        auth.setAuthenticated(true);
        when(campañaService.obtenerJugadoresCampaña(5L, "dm1")).thenReturn(jugadores);

        List<JugadorCampañaResponse> resultado = campañaController.obtenerJugadoresCampaña(5L, auth);

        assertEquals(2, resultado.size());
        assertEquals("dm1", resultado.get(0).username());
        verify(campañaService).obtenerJugadoresCampaña(5L, "dm1");
    }

    @Test
    void obtenerJugadoresViaHttpDevuelveJson() throws Exception {
        List<JugadorCampañaResponse> jugadores = List.of(
                new JugadorCampañaResponse("maestro", true)
        );
        TestingAuthenticationToken auth = new TestingAuthenticationToken("maestro", null);
        auth.setAuthenticated(true);
        when(campañaService.obtenerJugadoresCampaña(3L, "maestro")).thenReturn(jugadores);

        mockMvc.perform(get("/api/campanas/3/jugadores")
                        .principal(auth)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("maestro"))
                .andExpect(jsonPath("$[0].dm").value(true));
    }

    @Test
    void unirseCampañaLlamaAlServicio() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("jugador1", null);
        auth.setAuthenticated(true);
        doNothing().when(campañaService).unirseCampaña(7L, "jugador1");

        campañaController.unirseCampaña(7L, auth);

        verify(campañaService).unirseCampaña(7L, "jugador1");
    }

    @Test
    void unirseCampañaViaHttpDevuelve204() throws Exception {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("jugador2", null);
        auth.setAuthenticated(true);
        doNothing().when(campañaService).unirseCampaña(8L, "jugador2");

        mockMvc.perform(post("/api/campanas/8/unirse")
                        .principal(auth))
                .andExpect(status().isNoContent());

        verify(campañaService).unirseCampaña(8L, "jugador2");
    }

    @Test
    void unirseCampañaConAuthNulaLanzaUnauthorized() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> campañaController.unirseCampaña(9L, null)
        );
        assertEquals(401, ex.getStatusCode().value());
    }
}