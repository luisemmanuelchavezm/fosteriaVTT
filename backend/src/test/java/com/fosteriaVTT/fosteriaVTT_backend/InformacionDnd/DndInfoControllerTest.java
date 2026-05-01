package com.fosteriaVTT.fosteriaVTT_backend.InformacionDnd;

import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndSubclaseResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.DndCompetencyCatalogResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.SubrazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.TrasfondoDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.TrasfondoDndResumenResponse;
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

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class DndInfoControllerTest {

    @Mock
    private DndInfoService dndInfoService;

    @InjectMocks
    private DndInfoController dndInfoController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(dndInfoController).build();
    }

    @Test
    void delegaEnElServicioParaLosEndpointsPrincipales() {
        TestingAuthenticationToken authentication = auth();
        List<ClaseDndResumenResponse> clases = List.of(new ClaseDndResumenResponse("mago", "Mago", "Ma"));
        List<ClaseDndSubclaseResponse> subclases = List.of(new ClaseDndSubclaseResponse("evocacion", "Escuela de evocacion", "", 2, List.of()));
        List<TrasfondoDndResumenResponse> trasfondos = List.of(new TrasfondoDndResumenResponse("sabio", "Sabio"));
        List<RazaDndResumenResponse> razas = List.of(new RazaDndResumenResponse("elfo", "Elfo"));
        ClaseDndDetalleResponse clase = new ClaseDndDetalleResponse("mago", "Mago", "Ma", "", null, null, null, List.of(), List.of(), null);
        TrasfondoDndDetalleResponse trasfondo = new TrasfondoDndDetalleResponse("sabio", "Sabio", "", List.of(), List.of(), List.of(), "", "", List.of(), null);
        RazaDndDetalleResponse raza = new RazaDndDetalleResponse("elfo", "Elfo", "", List.of(), "", "Mediano", 30, List.of(), List.of(), List.of(), List.of(), List.of());
        List<SubrazaDndDetalleResponse> subrazas = List.of(new SubrazaDndDetalleResponse("alto-elfo", "Alto elfo", "", List.of(), List.of(), List.of(), List.of()));
        DndCompetencyCatalogResponse catalogo = new DndCompetencyCatalogResponse(List.of("Arcano"), List.of("Espada larga"), List.of("Herramientas de ladrón"));

        when(dndInfoService.obtenerClases()).thenReturn(clases);
        when(dndInfoService.obtenerClasePorId("mago")).thenReturn(Optional.of(clase));
        when(dndInfoService.obtenerSubclasesClase("mago")).thenReturn(subclases);
        when(dndInfoService.obtenerTrasfondos()).thenReturn(trasfondos);
        when(dndInfoService.obtenerTrasfondoPorId("sabio")).thenReturn(Optional.of(trasfondo));
        when(dndInfoService.obtenerRazas()).thenReturn(razas);
        when(dndInfoService.obtenerRazaPorId("elfo")).thenReturn(Optional.of(raza));
        when(dndInfoService.obtenerSubrazasRaza("elfo")).thenReturn(subrazas);
        when(dndInfoService.obtenerCatalogoCompetencias()).thenReturn(catalogo);

        assertEquals(clases, dndInfoController.obtenerClases(authentication));
        assertEquals(clase, dndInfoController.obtenerClasePorId("mago", authentication));
        assertEquals(subclases, dndInfoController.obtenerSubclasesClase("mago", authentication));
        assertEquals(trasfondos, dndInfoController.obtenerTrasfondos(authentication));
        assertEquals(trasfondo, dndInfoController.obtenerTrasfondoPorId("sabio", authentication));
        assertEquals(razas, dndInfoController.obtenerRazas(authentication));
        assertEquals(raza, dndInfoController.obtenerRazaPorId("elfo", authentication));
        assertEquals(subrazas, dndInfoController.obtenerSubrazasRaza("elfo", authentication));
        assertEquals(catalogo, dndInfoController.obtenerCatalogoCompetencias(authentication));

        verify(dndInfoService).obtenerClases();
        verify(dndInfoService).obtenerCatalogoCompetencias();
    }

    @Test
    void rechazaSinAutenticacionYCuandoNoEncuentraDatos() {
        ResponseStatusException unauthorized = assertThrows(ResponseStatusException.class, () -> dndInfoController.obtenerClases(null));
        assertEquals(401, unauthorized.getStatusCode().value());

        TestingAuthenticationToken authentication = auth();
        when(dndInfoService.obtenerClasePorId("mago")).thenReturn(Optional.empty());
        when(dndInfoService.obtenerSubclasesClase("mago")).thenReturn(List.of());

        ResponseStatusException notFoundClass = assertThrows(ResponseStatusException.class, () -> dndInfoController.obtenerClasePorId("mago", authentication));
        ResponseStatusException notFoundSubclasses = assertThrows(ResponseStatusException.class, () -> dndInfoController.obtenerSubclasesClase("mago", authentication));

        assertEquals(404, notFoundClass.getStatusCode().value());
        assertEquals(404, notFoundSubclasses.getStatusCode().value());
    }

    @Test
    void endpointDevuelveCatalogoYSubclases() throws Exception {
        when(dndInfoService.obtenerCatalogoCompetencias()).thenReturn(new DndCompetencyCatalogResponse(
                List.of("Arcano"),
                List.of("Espada larga"),
                List.of("Herramientas de ladrón")
        ));
        when(dndInfoService.obtenerSubclasesClase("mago")).thenReturn(List.of(
                new ClaseDndSubclaseResponse("evocacion", "Escuela de evocacion", "", 2, List.of())
        ));

        mockMvc.perform(get("/api/informacion/dnd/catalogos/competencias")
                        .principal(auth())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.habilidades[0]").value("Arcano"))
                .andExpect(jsonPath("$.armasArmaduras[0]").value("Espada larga"));

        mockMvc.perform(get("/api/informacion/dnd/clases/mago/subclases")
                        .principal(auth())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("evocacion"))
                .andExpect(jsonPath("$[0].nivelDesbloqueo").value(2));
    }

    private static TestingAuthenticationToken auth() {
        TestingAuthenticationToken authentication = new TestingAuthenticationToken("daria", null);
        authentication.setAuthenticated(true);
        return authentication;
    }
}