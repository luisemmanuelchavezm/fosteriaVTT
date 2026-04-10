package com.fosteriaVTT.fosteriaVTT_backend.Personaje;

import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Rol;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario;
import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PagedResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PersonajeResumenResponse;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PersonajeServiceTest {

    @Mock
    private PersonajeRepository personajeRepository;

    @InjectMocks
    private PersonajeService personajeService;

    @Test
    void obtienePersonajesPaginadosYMapeados() {
        Usuario usuario = Usuario.builder().username("daria").email("d@test.com").password("pw").role(Rol.USER).build();
        Personaje personaje = Personaje.builder()
                .id(1L)
                .nombre("Aria")
                .retrato("img")
                .sistemaDeJuego(SistemaDeJuego.DND)
                .usado(LocalDateTime.of(2026, 4, 10, 12, 0))
                .usuario(usuario)
                .build();

        when(personajeRepository.buscarPorFiltros(eq("daria"), eq("aria"), eq(List.of(SistemaDeJuego.DND)), eq(false), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(personaje)));

        PagedResponse<PersonajeResumenResponse> response = personajeService.obtenerPersonajesOrdenadosPorUso(
                "daria",
                " Aria ",
                List.of("Dungeons and Dragons"),
                0,
                15
        );

        assertEquals(1, response.items().size());
        assertEquals("Aria", response.items().getFirst().nombre());
        assertEquals("Dungeons and Dragons", response.items().getFirst().sistemaDeJuego());
        assertFalse(response.hasMore());
    }

    @Test
    void normalizaParametrosYAcotaPaginacion() {
        when(personajeRepository.buscarPorFiltros(eq("daria"), eq(""), eq(List.of()), eq(true), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), org.springframework.data.domain.PageRequest.of(0, 1), 0));

        personajeService.obtenerPersonajesOrdenadosPorUso("daria", null, List.of("desconocido"), -5, 0);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(personajeRepository).buscarPorFiltros(eq("daria"), eq(""), eq(List.of()), eq(true), pageableCaptor.capture());
        assertEquals(0, pageableCaptor.getValue().getPageNumber());
        assertEquals(1, pageableCaptor.getValue().getPageSize());
    }

    @Test
    void marcaComoUsadoYGuardaElPersonaje() {
        Personaje personaje = Personaje.builder().id(7L).nombre("Aria").sistemaDeJuego(SistemaDeJuego.DND).build();
        when(personajeRepository.findByIdAndUsuarioUsername(7L, "daria")).thenReturn(Optional.of(personaje));

        personajeService.marcarComoUsado(7L, "daria");

        assertTrue(personaje.getUsado() != null);
        verify(personajeRepository).save(personaje);
    }

    @Test
    void lanzaNotFoundCuandoNoExisteElPersonaje() {
        when(personajeRepository.findByIdAndUsuarioUsername(7L, "daria")).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> personajeService.marcarComoUsado(7L, "daria")
        );

        assertEquals(404, exception.getStatusCode().value());
    }
}