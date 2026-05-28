package com.fosteriaVTT.fosteriaVTT_backend.Personaje;

import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.EstadisticaService;
import com.fosteriaVTT.fosteriaVTT_backend.Mochila.MochilaService;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.UserRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario;
import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PersonajeResumenResponse;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PersonajeMarketplaceServiceTest {

    @Mock private PersonajeRepository personajeRepository;
    @Mock private UserRepository userRepository;
    @Mock private EstadisticaService estadisticaService;
    @Mock private MochilaService mochilaService;
    @Mock private PersonajeService personajeService;

    @InjectMocks
    private PersonajeMarketplaceService marketplaceService;

    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────

    /** Credencial ficticia usada solo en tests — no es una contraseña real. */
    private static final String DUMMY_TEST_PASSWORD = "[TEST-PLACEHOLDER]";

    private Usuario buildUsuario(String username) {
        Usuario u = new Usuario();
        u.setUsername(username);
        u.setEmail(username + "@test.com");
        u.setPassword(DUMMY_TEST_PASSWORD);
        return u;
    }

    private Personaje buildPersonaje(Long id, String nombre, boolean esPublico, String tags, Usuario usuario) {
        Personaje p = Personaje.builder()
                .nombre(nombre)
                .sistemaDeJuego(SistemaDeJuego.DND)
                .esPublico(esPublico)
                .tags(tags)
                .usuario(usuario)
                .build();
        p.setId(id);
        p.setUpdatedAt(LocalDateTime.now());
        return p;
    }

    private PersonajeResumenResponse buildResumen(Long id, String nombre) {
        return new PersonajeResumenResponse(id, nombre, null, "Dungeons and Dragons",
                LocalDateTime.now(), "personaje", false, false, false);
    }

    // ─────────────────────────────────────────────
    // instanciarPersonaje
    // ─────────────────────────────────────────────

    @Test
    void instanciarPersonaje_creaInstanciaDePersonajePublico() {
        Usuario dueno = buildUsuario("autor");
        Personaje source = buildPersonaje(10L, "Dragón Anciano", true, "enemigo", dueno);
        Usuario usuario = buildUsuario("daria");
        Personaje saved = buildPersonaje(11L, "Dragón Anciano", false, "enemigo,instancia", usuario);
        PersonajeResumenResponse resumen = buildResumen(11L, "Dragón Anciano");

        when(personajeRepository.findById(10L)).thenReturn(Optional.of(source));
        when(userRepository.findByUsername("daria")).thenReturn(Optional.of(usuario));
        when(personajeRepository.save(any())).thenReturn(saved);
        when(personajeService.toResumen(any())).thenReturn(resumen);

        PersonajeResumenResponse result = marketplaceService.instanciarPersonaje(10L, "daria", null);

        assertEquals(resumen, result);
        verify(estadisticaService).clonarEstadisticasParaPersonaje(eq(10L), any());
        verify(mochilaService).clonarMochilaParaPersonaje(eq(10L), any());
    }

    @Test
    void instanciarPersonaje_usaNombreOverrideCuandoSeProporcionaNoBlanco() {
        Usuario dueno = buildUsuario("autor");
        Personaje source = buildPersonaje(10L, "Dragón Anciano", true, "enemigo", dueno);
        Usuario usuario = buildUsuario("daria");
        Personaje saved = buildPersonaje(11L, "Mi Dragón", false, "enemigo,instancia", usuario);

        when(personajeRepository.findById(10L)).thenReturn(Optional.of(source));
        when(userRepository.findByUsername("daria")).thenReturn(Optional.of(usuario));
        when(personajeRepository.save(any())).thenReturn(saved);
        when(personajeService.toResumen(any())).thenReturn(buildResumen(11L, "Mi Dragón"));

        marketplaceService.instanciarPersonaje(10L, "daria", "Mi Dragón");

        ArgumentCaptor<Personaje> captor = ArgumentCaptor.forClass(Personaje.class);
        verify(personajeRepository).save(captor.capture());
        assertEquals("Mi Dragón", captor.getValue().getNombre());
    }

    @Test
    void instanciarPersonaje_propioNoPublicoPermiteInstanciar() {
        Usuario dueno = buildUsuario("daria");
        Personaje source = buildPersonaje(10L, "Aria", false, null, dueno);
        Personaje saved = buildPersonaje(11L, "Aria", false, "instancia", dueno);

        when(personajeRepository.findById(10L)).thenReturn(Optional.of(source));
        when(userRepository.findByUsername("daria")).thenReturn(Optional.of(dueno));
        when(personajeRepository.save(any())).thenReturn(saved);
        when(personajeService.toResumen(any())).thenReturn(buildResumen(11L, "Aria"));

        // No exception — owner can instantiate their own private character
        marketplaceService.instanciarPersonaje(10L, "daria", null);
        verify(personajeRepository).save(any());
    }

    @Test
    void instanciarPersonaje_lanza404SiPersonajeNoExiste() {
        when(personajeRepository.findById(99L)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> marketplaceService.instanciarPersonaje(99L, "daria", null));

        assertEquals(404, ex.getStatusCode().value());
    }

    @Test
    void instanciarPersonaje_lanza403SiPersonajePrivadoYNoEsPropio() {
        Usuario dueno = buildUsuario("autor");
        Personaje source = buildPersonaje(10L, "Aria", false, null, dueno);

        when(personajeRepository.findById(10L)).thenReturn(Optional.of(source));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> marketplaceService.instanciarPersonaje(10L, "daria", null));

        assertEquals(403, ex.getStatusCode().value());
        verify(personajeRepository, never()).save(any());
    }

    // ─────────────────────────────────────────────
    // publicarPersonaje
    // ─────────────────────────────────────────────

    @Test
    void publicarPersonaje_creaVersionPublicaYMarcaOriginalComoPublicado() {
        Usuario dueno = buildUsuario("daria");
        Personaje source = buildPersonaje(10L, "Aria", false, "dnd", dueno);
        Personaje saved = buildPersonaje(11L, "Aria", true, "dnd,fuenteId;10", dueno);

        when(personajeRepository.findById(10L)).thenReturn(Optional.of(source));
        when(personajeRepository.save(any()))
                .thenReturn(source)   // first save: mark original
                .thenReturn(saved);   // second save: save copy
        when(userRepository.findByUsername("daria")).thenReturn(Optional.of(dueno));
        when(personajeService.estaPublicado(anyString())).thenReturn(false);
        when(personajeService.toResumen(any())).thenReturn(buildResumen(11L, "Aria"));

        PersonajeResumenResponse result = marketplaceService.publicarPersonaje(10L, "daria");

        assertEquals(11L, result.id());
        // Original is saved (with "publicado" tag) + public copy is saved = 2 saves total
        verify(personajeRepository, times(2)).save(any());
    }

    @Test
    void publicarPersonaje_lanza404SiPersonajeNoExiste() {
        when(personajeRepository.findById(99L)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> marketplaceService.publicarPersonaje(99L, "daria"));

        assertEquals(404, ex.getStatusCode().value());
    }

    @Test
    void publicarPersonaje_lanza403SiNoDueno() {
        Usuario dueno = buildUsuario("autor");
        Personaje source = buildPersonaje(10L, "Aria", false, null, dueno);

        when(personajeRepository.findById(10L)).thenReturn(Optional.of(source));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> marketplaceService.publicarPersonaje(10L, "daria"));

        assertEquals(403, ex.getStatusCode().value());
    }

    @Test
    void publicarPersonaje_lanza403SiEsCopiaDeMercado() {
        Usuario dueno = buildUsuario("daria");
        Personaje source = buildPersonaje(10L, "Aria", false, "fuenteId;5", dueno);

        when(personajeRepository.findById(10L)).thenReturn(Optional.of(source));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> marketplaceService.publicarPersonaje(10L, "daria"));

        assertEquals(403, ex.getStatusCode().value());
    }

    @Test
    void publicarPersonaje_lanza409SiYaEstaPublicado() {
        Usuario dueno = buildUsuario("daria");
        Personaje source = buildPersonaje(10L, "Aria", false, "dnd", dueno);

        when(personajeRepository.findById(10L)).thenReturn(Optional.of(source));
        when(personajeService.estaPublicado(anyString())).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> marketplaceService.publicarPersonaje(10L, "daria"));

        assertEquals(409, ex.getStatusCode().value());
    }

    // ─────────────────────────────────────────────
    // guardarPersonaje
    // ─────────────────────────────────────────────

    @Test
    void guardarPersonaje_creaCopiaSiPublicoYSinCopiaPrevia() {
        Usuario dueno = buildUsuario("autor");
        Personaje source = buildPersonaje(10L, "Aria", true, "dnd,fuenteId;5", dueno);
        Usuario comprador = buildUsuario("daria");
        Personaje saved = buildPersonaje(11L, "Aria", false, "dnd,fuenteId;5,fuenteId;10", comprador);

        when(personajeRepository.findById(10L)).thenReturn(Optional.of(source));
        when(personajeRepository.existsByFuenteTagAndUsuarioUsername("10", "daria")).thenReturn(false);
        when(userRepository.findByUsername("daria")).thenReturn(Optional.of(comprador));
        when(personajeRepository.save(any())).thenReturn(saved);
        when(personajeService.toResumen(any())).thenReturn(buildResumen(11L, "Aria"));

        PersonajeResumenResponse result = marketplaceService.guardarPersonaje(10L, "daria");

        assertEquals(11L, result.id());
        verify(estadisticaService).clonarEstadisticasParaPersonaje(eq(10L), any());
        verify(mochilaService).clonarMochilaParaPersonaje(eq(10L), any());
    }

    @Test
    void guardarPersonaje_lanza403SiPersonajeNoPublico() {
        Usuario dueno = buildUsuario("autor");
        Personaje source = buildPersonaje(10L, "Aria", false, null, dueno);

        when(personajeRepository.findById(10L)).thenReturn(Optional.of(source));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> marketplaceService.guardarPersonaje(10L, "daria"));

        assertEquals(403, ex.getStatusCode().value());
        verify(personajeRepository, never()).save(any());
    }

    @Test
    void guardarPersonaje_lanza409SiYaExisteCopia() {
        Usuario dueno = buildUsuario("autor");
        Personaje source = buildPersonaje(10L, "Aria", true, null, dueno);

        when(personajeRepository.findById(10L)).thenReturn(Optional.of(source));
        when(personajeRepository.existsByFuenteTagAndUsuarioUsername("10", "daria")).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> marketplaceService.guardarPersonaje(10L, "daria"));

        assertEquals(409, ex.getStatusCode().value());
        verify(personajeRepository, never()).save(any());
    }

    @Test
    void guardarPersonaje_lanza404SiPersonajeNoExiste() {
        when(personajeRepository.findById(99L)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> marketplaceService.guardarPersonaje(99L, "daria"));

        assertEquals(404, ex.getStatusCode().value());
    }
}
