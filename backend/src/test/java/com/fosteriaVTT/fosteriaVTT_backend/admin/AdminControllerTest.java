package com.fosteriaVTT.fosteriaVTT_backend.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fosteriaVTT.fosteriaVTT_backend.Campaña.CampañaService;
import com.fosteriaVTT.fosteriaVTT_backend.Jugador.JugadorRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Mapa.Mapa;
import com.fosteriaVTT.fosteriaVTT_backend.Mapa.MapaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Mapa.MapaService;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.ObjetoService;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.NpcService;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.PersonajeRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.PersonajeService;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Rol;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.UserRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario;
import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ObjetoCatalogoResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.argThat;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AdminControllerTest {

    @Mock private UserRepository userRepository;
    @Mock private JugadorRepository jugadorRepository;
    @Mock private PersonajeRepository personajeRepository;
    @Mock private PersonajeService personajeService;
    @Mock private CampañaService campañaService;
    @Mock private MapaRepository mapaRepository;
    @Mock private MapaService mapaService;
    @Mock private NpcService npcService;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private ObjetoService objetoService;

    @InjectMocks
    private AdminController adminController;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminController).build();
    }

    private Usuario mockUser(Long id, String username, String email, Rol role) {
        Usuario u = mock(Usuario.class);
        when(u.getId()).thenReturn(id);
        when(u.getUsername()).thenReturn(username);
        when(u.getEmail()).thenReturn(email);
        when(u.getRole()).thenReturn(role);
        when(u.getAvatar()).thenReturn(null);
        return u;
    }

    // ─── getAllUsers ────────────────────────────────────────────────────────────

    @Test
    void getAllUsers_devuelveListaDeUsuarios() throws Exception {
        Usuario u = mockUser(1L, "admin", "admin@test.com", Rol.ADMIN);
        when(userRepository.findAll()).thenReturn(List.of(u));
        when(jugadorRepository.countByUsuarioId(1L)).thenReturn(3L);
        when(mapaRepository.findByUsuarioUsernameAndEsPublico("admin", true)).thenReturn(List.of());
        when(personajeRepository.findPublicNpcEnemiesByUsuarioUsername("admin")).thenReturn(List.of());

        mockMvc.perform(get("/api/admin/users").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("admin"))
                .andExpect(jsonPath("$[0].email").value("admin@test.com"))
                .andExpect(jsonPath("$[0].campañaCount").value(3));
    }

    @Test
    void getAllUsers_devuelveListaVaciaConMarketplace() throws Exception {
        Usuario u = mockUser(2L, "user1", "user1@test.com", Rol.USER);
        when(userRepository.findAll()).thenReturn(List.of(u));
        when(jugadorRepository.countByUsuarioId(2L)).thenReturn(0L);
        when(mapaRepository.findByUsuarioUsernameAndEsPublico("user1", true)).thenReturn(List.of());
        when(personajeRepository.findPublicNpcEnemiesByUsuarioUsername("user1")).thenReturn(List.of());

        mockMvc.perform(get("/api/admin/users").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].marketplaceCount").value(0));
    }

    // ─── createUser ─────────────────────────────────────────────────────────────

    @Test
    void createUser_creaUsuarioConExito() throws Exception {
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("new@test.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded");

        mockMvc.perform(post("/api/admin/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                        "username", "newuser",
                        "email", "new@test.com",
                        "password", "password123",
                        "role", "USER"
                ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Usuario creado"));

        verify(userRepository).save(any(Usuario.class));
    }

    @Test
    void createUser_conRolAdmin_asignaRolAdmin() throws Exception {
        when(userRepository.existsByUsername("adminuser")).thenReturn(false);
        when(userRepository.existsByEmail("adminuser@test.com")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded");

        mockMvc.perform(post("/api/admin/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                        "username", "adminuser",
                        "email", "adminuser@test.com",
                        "password", "password123",
                        "role", "ADMIN"
                ))))
                .andExpect(status().isOk());

        verify(userRepository).save(argThat(u -> u.getRole() == Rol.ADMIN));
    }

    @Test
    void createUser_retornaBadRequestSiUsernameIsBlank() throws Exception {
        mockMvc.perform(post("/api/admin/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                        "username", "",
                        "email", "test@test.com",
                        "password", "password123"
                ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Username requerido"));
    }

    @Test
    void createUser_retornaBadRequestSiUsernameEsMuyCorto() throws Exception {
        mockMvc.perform(post("/api/admin/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                        "username", "ab",
                        "email", "test@test.com",
                        "password", "password123"
                ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void createUser_retornaBadRequestSiUsernameEsMuyLargo() throws Exception {
        mockMvc.perform(post("/api/admin/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                        "username", "u".repeat(101),
                        "email", "test@test.com",
                        "password", "password123"
                ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void createUser_retornaBadRequestSiEmailIsBlank() throws Exception {
        mockMvc.perform(post("/api/admin/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                        "username", "validuser",
                        "email", "",
                        "password", "password123"
                ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Email requerido"));
    }

    @Test
    void createUser_retornaBadRequestSiEmailTieneFormatoInvalido() throws Exception {
        mockMvc.perform(post("/api/admin/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                        "username", "validuser",
                        "email", "notanemail",
                        "password", "password123"
                ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void createUser_retornaBadRequestSiEmailEsMuyLargo() throws Exception {
        mockMvc.perform(post("/api/admin/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                        "username", "validuser",
                        "email", "a".repeat(255) + "@test.com",
                        "password", "password123"
                ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void createUser_retornaBadRequestSiPasswordIsBlank() throws Exception {
        mockMvc.perform(post("/api/admin/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                        "username", "validuser",
                        "email", "valid@test.com",
                        "password", ""
                ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Password requerido"));
    }

    @Test
    void createUser_retornaBadRequestSiPasswordEsMuyCorta() throws Exception {
        mockMvc.perform(post("/api/admin/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                        "username", "validuser",
                        "email", "valid@test.com",
                        "password", "1234"
                ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void createUser_retornaBadRequestSiPasswordEsMuyLarga() throws Exception {
        mockMvc.perform(post("/api/admin/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                        "username", "validuser",
                        "email", "valid@test.com",
                        "password", "p".repeat(101)
                ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void createUser_retornaBadRequestSiUsernameYaExiste() throws Exception {
        when(userRepository.existsByUsername("existinguser")).thenReturn(true);

        mockMvc.perform(post("/api/admin/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                        "username", "existinguser",
                        "email", "new@test.com",
                        "password", "password123"
                ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("El username ya existe"));
    }

    @Test
    void createUser_retornaBadRequestSiEmailYaExiste() throws Exception {
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("existing@test.com")).thenReturn(true);

        mockMvc.perform(post("/api/admin/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                        "username", "newuser",
                        "email", "existing@test.com",
                        "password", "password123"
                ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("El email ya existe"));
    }

    // ─── updateUser ─────────────────────────────────────────────────────────────

    @Test
    void updateUser_actualizaUsernameConExito() throws Exception {
        Usuario u = mockUser(1L, "olduser", "old@test.com", Rol.USER);
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        when(userRepository.existsByUsername("newuser")).thenReturn(false);

        mockMvc.perform(put("/api/admin/users/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("username", "newuser"))))
                .andExpect(status().isOk());

        verify(userRepository).save(u);
    }

    @Test
    void updateUser_retornaNotFoundSiUsuarioNoExiste() throws Exception {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(put("/api/admin/users/99")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("username", "newuser"))))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateUser_retornaBadRequestSiUsernameEsMuyCorto() throws Exception {
        Usuario u = mockUser(1L, "olduser", "old@test.com", Rol.USER);
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));

        mockMvc.perform(put("/api/admin/users/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("username", "ab"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void updateUser_retornaBadRequestSiUsernameEsMuyLargo() throws Exception {
        Usuario u = mockUser(1L, "olduser", "old@test.com", Rol.USER);
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));

        mockMvc.perform(put("/api/admin/users/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("username", "u".repeat(51)))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void updateUser_retornaBadRequestSiUsernameYaExiste() throws Exception {
        Usuario u = mockUser(1L, "olduser", "old@test.com", Rol.USER);
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        when(userRepository.existsByUsername("taken")).thenReturn(true);

        mockMvc.perform(put("/api/admin/users/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("username", "taken"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Username already exists"));
    }

    @Test
    void updateUser_retornaBadRequestSiEmailTieneFormatoInvalido() throws Exception {
        Usuario u = mockUser(1L, "user1", "old@test.com", Rol.USER);
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));

        mockMvc.perform(put("/api/admin/users/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("email", "notemail"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void updateUser_retornaBadRequestSiEmailEsMuyLargo() throws Exception {
        Usuario u = mockUser(1L, "user1", "old@test.com", Rol.USER);
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));

        mockMvc.perform(put("/api/admin/users/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("email", "a".repeat(95) + "@test.com"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void updateUser_retornaBadRequestSiEmailYaExistePorOtroUsuario() throws Exception {
        Usuario u = mockUser(1L, "user1", "old@test.com", Rol.USER);
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        when(userRepository.existsByEmail("other@test.com")).thenReturn(true);

        mockMvc.perform(put("/api/admin/users/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("email", "other@test.com"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Email already exists"));
    }

    // ─── deleteUser ─────────────────────────────────────────────────────────────

    @Test
    void deleteUser_eliminaUsuarioConExito() throws Exception {
        Usuario u = mockUser(2L, "deleteme", "del@test.com", Rol.USER);
        TestingAuthenticationToken auth = new TestingAuthenticationToken("currentadmin", null);
        when(userRepository.findById(2L)).thenReturn(Optional.of(u));
        when(personajeRepository.findByUsuarioUsernameOrderByUsadoDesc("deleteme")).thenReturn(List.of());
        when(mapaRepository.findByUsuarioId(2L)).thenReturn(List.of());
        when(jugadorRepository.findByUsuarioIdOrderByUltimaVezAccedidoDesc(2L)).thenReturn(List.of());

        mockMvc.perform(delete("/api/admin/users/2").principal(auth))
                .andExpect(status().isNoContent());

        verify(campañaService).eliminarCampañasPorDm(2L);
        verify(userRepository).delete(u);
    }

    @Test
    void deleteUser_retornaNotFoundSiUsuarioNoExiste() throws Exception {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("admin", null);
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(delete("/api/admin/users/99").principal(auth))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteUser_retornaBadRequestSiSeIntentaEliminarASiMismo() throws Exception {
        Usuario u = mockUser(1L, "currentadmin", "admin@test.com", Rol.ADMIN);
        TestingAuthenticationToken auth = new TestingAuthenticationToken("currentadmin", null);
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));

        mockMvc.perform(delete("/api/admin/users/1").principal(auth))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("No puedes eliminarte a ti mismo"));
    }

    @Test
    void deleteUser_retornaBadRequestSiEsUsuarioSistema() throws Exception {
        Usuario u = mockUser(5L, "sistema", "sistema@test.com", Rol.USER);
        TestingAuthenticationToken auth = new TestingAuthenticationToken("admin", null);
        when(userRepository.findById(5L)).thenReturn(Optional.of(u));

        mockMvc.perform(delete("/api/admin/users/5").principal(auth))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("El usuario sistema no puede eliminarse"));
    }

    // ─── deleteMap ───────────────────────────────────────────────────────────────

    @Test
    void deleteMap_eliminaMapaConExito() throws Exception {
        when(mapaRepository.existsById(10L)).thenReturn(true);

        mockMvc.perform(delete("/api/admin/maps/10"))
                .andExpect(status().isNoContent());

        verify(mapaRepository).deleteById(10L);
    }

    @Test
    void deleteMap_retornaNotFoundSiMapaNoExiste() throws Exception {
        when(mapaRepository.existsById(99L)).thenReturn(false);

        mockMvc.perform(delete("/api/admin/maps/99"))
                .andExpect(status().isNotFound());
    }

    // ─── deletePersonaje ─────────────────────────────────────────────────────────

    @Test
    void deletePersonaje_eliminaPersonajeConExito() throws Exception {
        when(personajeRepository.existsById(20L)).thenReturn(true);

        mockMvc.perform(delete("/api/admin/personajes/20"))
                .andExpect(status().isNoContent());

        verify(personajeService).eliminarPersonajeAdmin(20L);
    }

    @Test
    void deletePersonaje_retornaNotFoundSiNoExiste() throws Exception {
        when(personajeRepository.existsById(99L)).thenReturn(false);

        mockMvc.perform(delete("/api/admin/personajes/99"))
                .andExpect(status().isNotFound());
    }

    // ─── createCatalogObject ─────────────────────────────────────────────────────

    @Test
    void createCatalogObject_retornaBadRequestSiNombreIsBlank() throws Exception {
        mockMvc.perform(post("/api/admin/objetos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                        "nombre", "",
                        "tipoObjeto", "ARMA",
                        "sistema", "DnD"
                ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Nombre requerido"));
    }

    @Test
    void createCatalogObject_retornaBadRequestSiTipoIsBlank() throws Exception {
        mockMvc.perform(post("/api/admin/objetos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                        "nombre", "Espada",
                        "tipoObjeto", "",
                        "sistema", "DnD"
                ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Tipo requerido"));
    }

    @Test
    void createCatalogObject_retornaBadRequestSiSistemaIsBlank() throws Exception {
        mockMvc.perform(post("/api/admin/objetos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                        "nombre", "Espada",
                        "tipoObjeto", "ARMA",
                        "sistema", ""
                ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Sistema requerido"));
    }

    @Test
    void createCatalogObject_retornaBadRequestSiTipoEsInvalido() throws Exception {
        mockMvc.perform(post("/api/admin/objetos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                        "nombre", "Espada",
                        "tipoObjeto", "TIPO_INVALIDO",
                        "sistema", "DnD"
                ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(containsString("Tipo no válido")));
    }

    // ─── getCatalogObjects ────────────────────────────────────────────────────────

    @Test
    void getCatalogObjects_devuelveLista() throws Exception {
        when(objetoService.obtenerTodoElCatalogo()).thenReturn(List.of());

        mockMvc.perform(get("/api/admin/objetos").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void getCatalogObjects_devuelveItemsConInfoSistema() throws Exception {
        ObjetoCatalogoResponse item = new ObjetoCatalogoResponse(
                1L, "Daga", "1d4", "Daga simple", "ARMA", "AdminCreado,mork_borg");
        when(objetoService.obtenerTodoElCatalogo()).thenReturn(List.of(item));

        mockMvc.perform(get("/api/admin/objetos").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre").value("Daga"))
                .andExpect(jsonPath("$[0].adminCreado").value(true))
                .andExpect(jsonPath("$[0].sistema").value("Mork Borg"));
    }

    @Test
    void getCatalogObjects_identificaSistemaDnd() throws Exception {
        ObjetoCatalogoResponse item = new ObjetoCatalogoResponse(
                2L, "Espada larga", "1d8", "Espada de DnD", "ARMA", "DnD_5e");
        when(objetoService.obtenerTodoElCatalogo()).thenReturn(List.of(item));

        mockMvc.perform(get("/api/admin/objetos").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].sistema").value("D&D 5e"))
                .andExpect(jsonPath("$[0].adminCreado").value(false));
    }

    // ─── deleteCatalogObject ──────────────────────────────────────────────────────

    @Test
    void deleteCatalogObject_eliminaConExito() throws Exception {
        doNothing().when(objetoService).eliminarObjetoDeCatalogo(5L);

        mockMvc.perform(delete("/api/admin/objetos/5"))
                .andExpect(status().isNoContent());

        verify(objetoService).eliminarObjetoDeCatalogo(5L);
    }

    // ─── getMarketplace ──────────────────────────────────────────────────────────

    @Test
    void getMarketplace_devuelveListaVacia() throws Exception {
        when(mapaRepository.findByEsPublicoTrueOrderByUpdatedAtDesc()).thenReturn(List.of());
        when(personajeRepository.findAllPublicNpcEnemies()).thenReturn(List.of());

        mockMvc.perform(get("/api/admin/marketplace").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ─── getUserDetail ────────────────────────────────────────────────────────────

    @Test
    void getUserDetail_devuelveDetallesDeUsuario() throws Exception {
        Usuario u = mockUser(1L, "testuser", "test@test.com", Rol.USER);
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        when(jugadorRepository.countByUsuarioId(1L)).thenReturn(2L);
        when(personajeRepository.countByUsuarioUsername("testuser")).thenReturn(5L);
        when(mapaRepository.findByUsuarioUsernameAndEsPublico("testuser", true)).thenReturn(List.of());
        when(personajeRepository.findPublicNpcEnemiesByUsuarioUsername("testuser")).thenReturn(List.of());

        mockMvc.perform(get("/api/admin/users/1").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.campañaCount").value(2))
                .andExpect(jsonPath("$.personajeCount").value(5));
    }

    @Test
    void getUserDetail_retornaNotFoundSiNoExiste() throws Exception {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/admin/users/99").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    // ─── P-054: Sin autenticación → endpoint rechaza petición (standaloneSetup note) ─

    /**
     * P-054 (RF28): La protección real de este endpoint la gestiona Spring Security
     * (JwtAuthenticationFilter + SecurityConfig). Con standaloneSetup los filtros de
     * seguridad no se activan, por lo que este test verifica únicamente que el endpoint
     * existe y responde; la prueba de acceso sin token se cubre por SecurityConfig en
     * la suite de integración. Lo que sí podemos verificar es que sin principal el
     * controlador no lanza excepciones propias de autenticación.
     */
    @Test
    void getAllUsers_sinAutenticacionStandaloneRetorna200PorqueSegurityFiltroEsExterno() throws Exception {
        when(userRepository.findAll()).thenReturn(List.of());

        // standaloneSetup no aplica filtros de Spring Security; el endpoint responde 200.
        // La restricción real (401/403) la aplica SecurityConfig fuera de este controlador.
        mockMvc.perform(get("/api/admin/users").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    // ─── P-064: Marketplace devuelve mapas y personajes mezclados ─────────────────

    @Test
    void getMarketplace_devuelveMapasYPersonajesMezclados() throws Exception {
        // Mapa público
        Mapa mapa = mock(Mapa.class);
        Usuario mapaOwner = mockUser(10L, "cartographer", "carto@test.com", Rol.USER);
        when(mapa.getId()).thenReturn(1L);
        when(mapa.getNombre()).thenReturn("Mazmorra oscura");
        when(mapa.getMapa()).thenReturn("https://img.example.com/map.png");
        when(mapa.getUsuario()).thenReturn(mapaOwner);
        when(mapa.getUpdatedAt()).thenReturn(null);

        // Personaje público (enemigo)
        Personaje personaje = mock(Personaje.class);
        Usuario personajeOwner = mockUser(11L, "dungeonmaster", "dm@test.com", Rol.USER);
        when(personaje.getId()).thenReturn(2L);
        when(personaje.getNombre()).thenReturn("Goblin jefe");
        when(personaje.getRetrato()).thenReturn(null);
        when(personaje.getUsuario()).thenReturn(personajeOwner);
        when(personaje.getTags()).thenReturn("enemigo,MORK_BORG");
        when(personaje.getSistemaDeJuego()).thenReturn(SistemaDeJuego.MORK_BORG);
        when(personaje.getUsado()).thenReturn(null);

        when(mapaRepository.findByEsPublicoTrueOrderByUpdatedAtDesc()).thenReturn(List.of(mapa));
        when(personajeRepository.findAllPublicNpcEnemies()).thenReturn(List.of(personaje));

        mockMvc.perform(get("/api/admin/marketplace").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].tipo").value("MAPA"))
                .andExpect(jsonPath("$[0].subtipo").value("Mapa"))
                .andExpect(jsonPath("$[0].nombre").value("Mazmorra oscura"))
                .andExpect(jsonPath("$[0].propietario").value("cartographer"))
                .andExpect(jsonPath("$[0].sistema").isEmpty())
                .andExpect(jsonPath("$[1].tipo").value("PERSONAJE"))
                .andExpect(jsonPath("$[1].subtipo").value("Enemigo"))
                .andExpect(jsonPath("$[1].nombre").value("Goblin jefe"))
                .andExpect(jsonPath("$[1].propietario").value("dungeonmaster"))
                .andExpect(jsonPath("$[1].sistema").value("Mork Borg"));
    }
}
