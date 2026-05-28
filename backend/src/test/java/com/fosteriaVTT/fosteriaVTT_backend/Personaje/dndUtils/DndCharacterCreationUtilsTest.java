package com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils;

import com.fosteriaVTT.fosteriaVTT_backend.Chat.ChatService;
import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.EstadisticaService;
import com.fosteriaVTT.fosteriaVTT_backend.InformacionDnd.DndInfoService;
import com.fosteriaVTT.fosteriaVTT_backend.Mochila.MochilaService;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.PersonajeRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.UserRepository;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CrearPersonajeDndRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DndCharacterCreationUtilsTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PersonajeRepository personajeRepository;

    @Mock
    private DndInfoService dndInfoService;

    @Mock
    private MochilaService mochilaService;

    @Mock
    private EstadisticaService estadisticaService;

    @Mock
    private ChatService chatService;

    @Mock
    private DndAbilityUtils dndAbilityUtils;

    @Mock
    private DndCombatUtils dndCombatUtils;

    @Mock
    private DndCharacterProgressionUtils dndCharacterProgressionUtils;

    @InjectMocks
    private DndCharacterCreationUtils dndCharacterCreationUtils;

    // ── Validación de request nulo ──────────────────────────────────────────

    @Test
    void crearPersonajeDnd_lanzaBadRequestSiRequestEsNulo() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> dndCharacterCreationUtils.crearPersonajeDnd(null, null, "daria")
        );

        assertEquals(400, ex.getStatusCode().value());
    }

    // ── Validación de nombre ────────────────────────────────────────────────

    @Test
    void crearPersonajeDnd_lanzaBadRequestSiNombreEsNulo() {
        CrearPersonajeDndRequest request = new CrearPersonajeDndRequest(
                null, "mago", null, "heroe", "humano", null,
                null, null, null, null, null, null, null, null, null
        );

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> dndCharacterCreationUtils.crearPersonajeDnd(request, null, "daria")
        );

        assertEquals(400, ex.getStatusCode().value());
    }

    @Test
    void crearPersonajeDnd_lanzaBadRequestSiNombreEsBlanco() {
        CrearPersonajeDndRequest request = new CrearPersonajeDndRequest(
                "   ", "mago", null, "heroe", "humano", null,
                null, null, null, null, null, null, null, null, null
        );

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> dndCharacterCreationUtils.crearPersonajeDnd(request, null, "daria")
        );

        assertEquals(400, ex.getStatusCode().value());
    }

    // ── Usuario no encontrado ────────────────────────────────────────────────

    @Test
    void crearPersonajeDnd_lanzaNotFoundSiUsuarioNoExiste() {
        CrearPersonajeDndRequest request = new CrearPersonajeDndRequest(
                "Aria", "mago", null, "heroe", "humano", null,
                null, null, null, null, null, null, null, null, null
        );

        when(userRepository.findByUsername("daria")).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> dndCharacterCreationUtils.crearPersonajeDnd(request, null, "daria")
        );

        assertEquals(404, ex.getStatusCode().value());
    }

    // ── Clase no encontrada ─────────────────────────────────────────────────

    @Test
    void crearPersonajeDnd_lanzaBadRequestSiClaseIdEsNulo() {
        CrearPersonajeDndRequest request = new CrearPersonajeDndRequest(
                "Aria", null, null, "heroe", "humano", null,
                null, null, null, null, null, null, null, null, null
        );

        // User lookup happens before class lookup → must mock user so code reaches clase check
        when(userRepository.findByUsername("daria")).thenReturn(
                Optional.of(com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario.builder()
                        .id(1L).username("daria").email("d@test.com").password("pw")
                        .role(com.fosteriaVTT.fosteriaVTT_backend.Usuario.Rol.USER).build())
        );

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> dndCharacterCreationUtils.crearPersonajeDnd(request, null, "daria")
        );

        // null claseId → requireText throws BAD_REQUEST "Debes seleccionar una clase"
        assertEquals(400, ex.getStatusCode().value());
    }

    @Test
    void crearPersonajeDnd_lanzaBadRequestSiClaseNoExiste() {
        CrearPersonajeDndRequest request = new CrearPersonajeDndRequest(
                "Aria", "mago-inexistente", null, "heroe", "humano", null,
                null, null, null, null, null, null, null, null, null
        );

        when(userRepository.findByUsername("daria")).thenReturn(
                Optional.of(com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario.builder()
                        .id(1L).username("daria").email("d@test.com").password("pw")
                        .role(com.fosteriaVTT.fosteriaVTT_backend.Usuario.Rol.USER).build())
        );
        when(dndInfoService.obtenerClasePorId("mago-inexistente")).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> dndCharacterCreationUtils.crearPersonajeDnd(request, null, "daria")
        );

        assertEquals(400, ex.getStatusCode().value());
    }
}
