package com.fosteriaVTT.fosteriaVTT_backend.Personaje;

import com.fosteriaVTT.fosteriaVTT_backend.dto.PagedResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PersonajeResumenResponse;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PersonajeControllerTest {

    @Mock
    private PersonajeService personajeService;

    @InjectMocks
    private PersonajeController personajeController;

    @Test
    void obtienePersonajesConFiltrosYpaginacion() {
        TestingAuthenticationToken authentication = new TestingAuthenticationToken("daria", null);
        authentication.setAuthenticated(true);
        PagedResponse<PersonajeResumenResponse> response = new PagedResponse<>(
                List.of(new PersonajeResumenResponse(1L, "Aria", "img", "Dungeons and Dragons", LocalDateTime.now(), "personaje")),
                false
        );

        when(personajeService.obtenerPersonajesOrdenadosPorUso("daria", "aria", List.of("Dungeons and Dragons"), false, 1, 15))
                .thenReturn(response);

        PagedResponse<PersonajeResumenResponse> result = personajeController.obtenerPersonajes(
                authentication,
                "aria",
                List.of("Dungeons and Dragons"),
                false,
                1,
                15
        );

        assertEquals(response, result);
        verify(personajeService).obtenerPersonajesOrdenadosPorUso("daria", "aria", List.of("Dungeons and Dragons"), false, 1, 15);
    }

    @Test
    void lanzaUnauthorizedSiNoHayAutenticacionEnListado() {
        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> personajeController.obtenerPersonajes(null, null, null, false, 0, 15)
        );

        assertEquals(401, exception.getStatusCode().value());
    }

    @Test
    void marcaPersonajeComoUsadoCuandoHayAutenticacion() {
        TestingAuthenticationToken authentication = new TestingAuthenticationToken("daria", null);
        authentication.setAuthenticated(true);

        personajeController.marcarPersonajeComoUsado(7L, authentication);

        verify(personajeService).marcarComoUsado(7L, "daria");
    }

    @Test
    void lanzaUnauthorizedSiNoHayAutenticacionAlMarcarUso() {
        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> personajeController.marcarPersonajeComoUsado(7L, null)
        );

        assertEquals(401, exception.getStatusCode().value());
    }
}