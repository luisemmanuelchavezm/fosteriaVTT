package com.fosteriaVTT.fosteriaVTT_backend.Marketplace;

import com.fosteriaVTT.fosteriaVTT_backend.Mapa.Mapa;
import com.fosteriaVTT.fosteriaVTT_backend.Mapa.MapaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.PersonajeRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario;
import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import com.fosteriaVTT.fosteriaVTT_backend.dto.MapaResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.MarketplacePersonajeResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PagedResponse;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.TestingAuthenticationToken;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MarketplaceControllerTest {

    @Mock private PersonajeRepository personajeRepository;
    @Mock private MapaRepository mapaRepository;

    @InjectMocks
    private MarketplaceController marketplaceController;

    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────

    private Usuario buildUsuario(String username) {
        Usuario u = new Usuario();
        u.setUsername(username);
        u.setEmail(username + "@test.com");
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

    private Mapa buildMapa(Long id, String nombre, boolean esPublico, Usuario usuario) {
        Mapa m = Mapa.builder()
                .nombre(nombre)
                .mapa("{}")
                .esPublico(esPublico)
                .usuario(usuario)
                .build();
        m.setId(id);
        m.setUpdatedAt(LocalDateTime.now());
        return m;
    }

    // ─────────────────────────────────────────────
    // listarPersonajes
    // ─────────────────────────────────────────────

    @Test
    void listarPersonajes_devuelvePaginaConResultados() {
        Usuario autor = buildUsuario("autor");
        Personaje p1 = buildPersonaje(1L, "Goblin", true, "enemigo", autor);
        Personaje p2 = buildPersonaje(2L, "Aria", true, "pnj", autor);
        var page = new PageImpl<>(List.of(p1, p2));

        when(personajeRepository.buscarMarketplace(eq(""), eq(""), any(Pageable.class)))
                .thenReturn(page);
        when(personajeRepository.existsByFuenteTagAndUsuarioUsername(anyString(), anyString()))
                .thenReturn(false);

        TestingAuthenticationToken auth = new TestingAuthenticationToken("daria", null);
        auth.setAuthenticated(true);

        PagedResponse<MarketplacePersonajeResponse> result =
                marketplaceController.listarPersonajes("", "", 0, 20, auth);

        assertEquals(2, result.items().size());
        assertEquals("Goblin", result.items().get(0).nombre());
        assertEquals("Aria", result.items().get(1).nombre());
        assertFalse(result.hasMore());
    }

    @Test
    void listarPersonajes_indicaYaTienesCopiaParaUsuarioConCopia() {
        Usuario autor = buildUsuario("autor");
        Personaje p1 = buildPersonaje(1L, "Goblin", true, "enemigo", autor);
        var page = new PageImpl<>(List.of(p1));

        when(personajeRepository.buscarMarketplace(eq(""), eq(""), any(Pageable.class)))
                .thenReturn(page);
        when(personajeRepository.existsByFuenteTagAndUsuarioUsername("1", "daria"))
                .thenReturn(true);

        TestingAuthenticationToken auth = new TestingAuthenticationToken("daria", null);
        auth.setAuthenticated(true);

        PagedResponse<MarketplacePersonajeResponse> result =
                marketplaceController.listarPersonajes("", "", 0, 20, auth);

        assertTrue(result.items().get(0).yaTienesCopia());
    }

    @Test
    void listarPersonajes_usuarioAnonimo_yaTienesCopiaEsFalse() {
        Usuario autor = buildUsuario("autor");
        Personaje p1 = buildPersonaje(1L, "Goblin", true, "enemigo", autor);
        var page = new PageImpl<>(List.of(p1));

        when(personajeRepository.buscarMarketplace(eq(""), eq(""), any(Pageable.class)))
                .thenReturn(page);

        PagedResponse<MarketplacePersonajeResponse> result =
                marketplaceController.listarPersonajes("", "", 0, 20, null);

        assertFalse(result.items().get(0).yaTienesCopia());
    }

    @Test
    void listarPersonajes_extractaTipoDesdeTagsEnemigo() {
        Usuario autor = buildUsuario("autor");
        Personaje p1 = buildPersonaje(1L, "Troll", true, "enemigo,grande", autor);
        var page = new PageImpl<>(List.of(p1));

        when(personajeRepository.buscarMarketplace(eq("troll"), eq(""), any(Pageable.class)))
                .thenReturn(page);

        PagedResponse<MarketplacePersonajeResponse> result =
                marketplaceController.listarPersonajes("troll", "", 0, 20, null);

        assertEquals("enemigo", result.items().get(0).tipo());
    }

    @Test
    void listarPersonajes_extractaTipoPnjDesdeTagsPnj() {
        Usuario autor = buildUsuario("autor");
        Personaje p1 = buildPersonaje(1L, "Tabernero", true, "pnj,humano", autor);
        var page = new PageImpl<>(List.of(p1));

        when(personajeRepository.buscarMarketplace(eq(""), eq(""), any(Pageable.class)))
                .thenReturn(page);

        PagedResponse<MarketplacePersonajeResponse> result =
                marketplaceController.listarPersonajes("", "", 0, 20, null);

        assertEquals("pnj", result.items().get(0).tipo());
    }

    @Test
    void listarPersonajes_capaTamanoMaximoPaginacion() {
        var page = new PageImpl<Personaje>(List.of());
        // size=200 should be capped to 50
        when(personajeRepository.buscarMarketplace(eq(""), eq(""), any(Pageable.class)))
                .thenReturn(page);

        PagedResponse<MarketplacePersonajeResponse> result =
                marketplaceController.listarPersonajes("", "", 0, 200, null);

        assertEquals(0, result.items().size());
    }

    // ─────────────────────────────────────────────
    // listarMapas
    // ─────────────────────────────────────────────

    @Test
    void listarMapas_devuelvePaginaDeMapasPublicos() {
        Usuario autor = buildUsuario("autor");
        Mapa m1 = buildMapa(1L, "Taberna", true, autor);
        Mapa m2 = buildMapa(2L, "Mazmorra", true, autor);
        var page = new PageImpl<>(List.of(m1, m2));

        when(mapaRepository.buscarMapasPublicos(eq(""), any(Pageable.class))).thenReturn(page);
        when(mapaRepository.existsByFuenteTagAndUsuarioUsername(anyString(), anyString()))
                .thenReturn(false);

        TestingAuthenticationToken auth = new TestingAuthenticationToken("daria", null);
        auth.setAuthenticated(true);

        PagedResponse<MapaResumenResponse> result =
                marketplaceController.listarMapas("", 0, 20, auth);

        assertEquals(2, result.items().size());
        assertEquals("Taberna", result.items().get(0).nombre());
        assertEquals("Mazmorra", result.items().get(1).nombre());
    }

    @Test
    void listarMapas_indicaYaTienesCopiaParaUsuarioConCopiaDeMapas() {
        Usuario autor = buildUsuario("autor");
        Mapa m1 = buildMapa(1L, "Taberna", true, autor);
        var page = new PageImpl<>(List.of(m1));

        when(mapaRepository.buscarMapasPublicos(eq(""), any(Pageable.class))).thenReturn(page);
        when(mapaRepository.existsByFuenteTagAndUsuarioUsername("1", "daria")).thenReturn(true);

        TestingAuthenticationToken auth = new TestingAuthenticationToken("daria", null);
        auth.setAuthenticated(true);

        PagedResponse<MapaResumenResponse> result =
                marketplaceController.listarMapas("", 0, 20, auth);

        assertTrue(result.items().get(0).yaTienesCopia());
    }

    @Test
    void listarMapas_usuarioAnonimo_yaTienesCopiaEsFalse() {
        Usuario autor = buildUsuario("autor");
        Mapa m1 = buildMapa(1L, "Taberna", true, autor);
        var page = new PageImpl<>(List.of(m1));

        when(mapaRepository.buscarMapasPublicos(eq(""), any(Pageable.class))).thenReturn(page);

        PagedResponse<MapaResumenResponse> result =
                marketplaceController.listarMapas("", 0, 20, null);

        assertFalse(result.items().get(0).yaTienesCopia());
    }
}
