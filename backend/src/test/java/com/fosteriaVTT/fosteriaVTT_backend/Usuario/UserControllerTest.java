package com.fosteriaVTT.fosteriaVTT_backend.Usuario;

import com.fosteriaVTT.fosteriaVTT_backend.Cloudinary.CloudinaryService;
import com.fosteriaVTT.fosteriaVTT_backend.auth.CustomUserDetailsService;
import com.fosteriaVTT.fosteriaVTT_backend.configuration.JwtUtil;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class UserControllerTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private CloudinaryService cloudinaryService;
    @Mock private JwtUtil jwtUtil;
    @Mock private CustomUserDetailsService userDetailsService;
    @Mock private UsuarioService usuarioService;

    @InjectMocks
    private UserController userController;

    private UserDetails mockUserDetails(String username) {
        return new User(username, "password", List.of());
    }

    private Usuario mockUsuario(Long id, String username, String email, String password) {
        Usuario u = mock(Usuario.class);
        when(u.getId()).thenReturn(id);
        when(u.getUsername()).thenReturn(username);
        when(u.getEmail()).thenReturn(email);
        when(u.getPassword()).thenReturn(password);
        when(u.getAvatar()).thenReturn(null);
        return u;
    }

    // ─── checkUsername ───────────────────────────────────────────────────────────

    @Test
    void checkUsername_disponibleCuandoNoExiste() {
        UserDetails userDetails = mockUserDetails("currentuser");
        when(userRepository.existsByUsername("newname")).thenReturn(false);

        ResponseEntity<?> response = userController.checkUsername(userDetails, "newname");

        assertEquals(200, response.getStatusCode().value());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertNotNull(body);
        assertEquals(true, body.get("available"));
    }

    @Test
    void checkUsername_noDisponibleCuandoEsUsadoPorOtroUsuario() {
        UserDetails userDetails = mockUserDetails("currentuser");
        when(userRepository.existsByUsername("takenname")).thenReturn(true);

        ResponseEntity<?> response = userController.checkUsername(userDetails, "takenname");

        assertEquals(200, response.getStatusCode().value());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertNotNull(body);
        assertEquals(false, body.get("available"));
    }

    @Test
    void checkUsername_disponibleCuandoEsElMismoUsuario() {
        UserDetails userDetails = mockUserDetails("currentuser");
        when(userRepository.existsByUsername("currentuser")).thenReturn(true);

        ResponseEntity<?> response = userController.checkUsername(userDetails, "currentuser");

        assertEquals(200, response.getStatusCode().value());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertNotNull(body);
        assertEquals(true, body.get("available"));
    }

    // ─── checkEmail ──────────────────────────────────────────────────────────────

    @Test
    void checkEmail_disponibleCuandoNoExiste() {
        UserDetails userDetails = mockUserDetails("currentuser");
        Usuario current = mockUsuario(1L, "currentuser", "current@test.com", "pwd");
        when(userRepository.findByUsername("currentuser")).thenReturn(Optional.of(current));
        when(userRepository.existsByEmail("new@test.com")).thenReturn(false);

        ResponseEntity<?> response = userController.checkEmail(userDetails, "new@test.com");

        assertEquals(200, response.getStatusCode().value());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertNotNull(body);
        assertEquals(true, body.get("available"));
    }

    @Test
    void checkEmail_noDisponibleCuandoEsUsadoPorOtroUsuario() {
        UserDetails userDetails = mockUserDetails("currentuser");
        Usuario current = mockUsuario(1L, "currentuser", "current@test.com", "pwd");
        when(userRepository.findByUsername("currentuser")).thenReturn(Optional.of(current));
        when(userRepository.existsByEmail("other@test.com")).thenReturn(true);

        ResponseEntity<?> response = userController.checkEmail(userDetails, "other@test.com");

        assertEquals(200, response.getStatusCode().value());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertNotNull(body);
        assertEquals(false, body.get("available"));
    }

    @Test
    void checkEmail_disponibleCuandoEsElMismoEmail() {
        UserDetails userDetails = mockUserDetails("currentuser");
        Usuario current = mockUsuario(1L, "currentuser", "current@test.com", "pwd");
        when(userRepository.findByUsername("currentuser")).thenReturn(Optional.of(current));
        when(userRepository.existsByEmail("current@test.com")).thenReturn(true);

        ResponseEntity<?> response = userController.checkEmail(userDetails, "current@test.com");

        assertEquals(200, response.getStatusCode().value());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertNotNull(body);
        assertEquals(true, body.get("available"));
    }

    // ─── getMe ────────────────────────────────────────────────────────────────────

    @Test
    void getMe_devuelveInformacionDelUsuario() {
        UserDetails userDetails = mockUserDetails("daria");
        Usuario user = mockUsuario(1L, "daria", "daria@test.com", "encoded");

        when(userRepository.findByUsername("daria")).thenReturn(Optional.of(user));

        ResponseEntity<?> response = userController.getMe(userDetails);

        assertEquals(200, response.getStatusCode().value());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertNotNull(body);
        assertEquals("daria", body.get("username"));
        assertEquals("daria@test.com", body.get("email"));
        assertEquals("", body.get("avatar"));
    }

    @Test
    void getMe_devuelveAvatarCuandoExiste() {
        UserDetails userDetails = mockUserDetails("daria");
        Usuario user = mock(Usuario.class);
        when(user.getUsername()).thenReturn("daria");
        when(user.getEmail()).thenReturn("daria@test.com");
        when(user.getAvatar()).thenReturn("https://cloudinary.com/avatar.jpg");
        when(userRepository.findByUsername("daria")).thenReturn(Optional.of(user));

        ResponseEntity<?> response = userController.getMe(userDetails);

        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertNotNull(body);
        assertEquals("https://cloudinary.com/avatar.jpg", body.get("avatar"));
    }

    // ─── updateMe ─────────────────────────────────────────────────────────────────

    @Test
    void updateMe_retornaUnauthorizedSiContrasenaActualEsIncorrecta() {
        UserDetails userDetails = mockUserDetails("daria");
        Usuario user = mockUsuario(1L, "daria", "daria@test.com", "encoded");
        when(userRepository.findByUsername("daria")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongpassword", "encoded")).thenReturn(false);

        ResponseEntity<?> response = userController.updateMe(
                userDetails, Map.of("currentPassword", "wrongpassword", "username", "newname"));

        assertEquals(401, response.getStatusCode().value());
    }

    @Test
    void updateMe_retornaBadRequestSiNuevoUsernameEsMuyCorto() {
        UserDetails userDetails = mockUserDetails("daria");
        Usuario user = mockUsuario(1L, "daria", "daria@test.com", "encoded");
        when(userRepository.findByUsername("daria")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correct", "encoded")).thenReturn(true);

        ResponseEntity<?> response = userController.updateMe(
                userDetails, Map.of("currentPassword", "correct", "username", "ab"));

        assertEquals(400, response.getStatusCode().value());
    }

    @Test
    void updateMe_retornaBadRequestSiNuevoUsernameEsMuyLargo() {
        UserDetails userDetails = mockUserDetails("daria");
        Usuario user = mockUsuario(1L, "daria", "daria@test.com", "encoded");
        when(userRepository.findByUsername("daria")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correct", "encoded")).thenReturn(true);

        ResponseEntity<?> response = userController.updateMe(
                userDetails, Map.of("currentPassword", "correct", "username", "u".repeat(51)));

        assertEquals(400, response.getStatusCode().value());
    }

    @Test
    void updateMe_retornaBadRequestSiNuevoUsernameYaExiste() {
        UserDetails userDetails = mockUserDetails("daria");
        Usuario user = mockUsuario(1L, "daria", "daria@test.com", "encoded");
        when(userRepository.findByUsername("daria")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correct", "encoded")).thenReturn(true);
        when(userRepository.existsByUsername("taken")).thenReturn(true);

        ResponseEntity<?> response = userController.updateMe(
                userDetails, Map.of("currentPassword", "correct", "username", "taken"));

        assertEquals(400, response.getStatusCode().value());
    }

    @Test
    void updateMe_retornaBadRequestSiEmailTieneFormatoInvalido() {
        UserDetails userDetails = mockUserDetails("daria");
        Usuario user = mockUsuario(1L, "daria", "daria@test.com", "encoded");
        when(userRepository.findByUsername("daria")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correct", "encoded")).thenReturn(true);

        ResponseEntity<?> response = userController.updateMe(
                userDetails, Map.of("currentPassword", "correct", "email", "notanemail"));

        assertEquals(400, response.getStatusCode().value());
    }

    @Test
    void updateMe_retornaBadRequestSiEmailEsMuyLargo() {
        UserDetails userDetails = mockUserDetails("daria");
        Usuario user = mockUsuario(1L, "daria", "daria@test.com", "encoded");
        when(userRepository.findByUsername("daria")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correct", "encoded")).thenReturn(true);

        ResponseEntity<?> response = userController.updateMe(
                userDetails, Map.of("currentPassword", "correct",
                        "email", "a".repeat(95) + "@test.com"));

        assertEquals(400, response.getStatusCode().value());
    }

    @Test
    void updateMe_retornaBadRequestSiEmailYaExiste() {
        UserDetails userDetails = mockUserDetails("daria");
        Usuario user = mockUsuario(1L, "daria", "daria@test.com", "encoded");
        when(userRepository.findByUsername("daria")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correct", "encoded")).thenReturn(true);
        when(userRepository.existsByEmail("other@test.com")).thenReturn(true);

        ResponseEntity<?> response = userController.updateMe(
                userDetails, Map.of("currentPassword", "correct", "email", "other@test.com"));

        assertEquals(400, response.getStatusCode().value());
    }

    @Test
    void updateMe_retornaBadRequestSiNuevaClaveMuyCorta() {
        UserDetails userDetails = mockUserDetails("daria");
        Usuario user = mockUsuario(1L, "daria", "daria@test.com", "encoded");
        when(userRepository.findByUsername("daria")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correct", "encoded")).thenReturn(true);

        ResponseEntity<?> response = userController.updateMe(
                userDetails, Map.of("currentPassword", "correct", "newPassword", "1234"));

        assertEquals(400, response.getStatusCode().value());
    }

    @Test
    void updateMe_retornaBadRequestSiNuevaClaveMuyLarga() {
        UserDetails userDetails = mockUserDetails("daria");
        Usuario user = mockUsuario(1L, "daria", "daria@test.com", "encoded");
        when(userRepository.findByUsername("daria")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correct", "encoded")).thenReturn(true);

        ResponseEntity<?> response = userController.updateMe(
                userDetails, Map.of("currentPassword", "correct", "newPassword", "p".repeat(101)));

        assertEquals(400, response.getStatusCode().value());
    }

    @Test
    void updateMe_actualizaPasswordConExito() {
        String bcryptHash = "newencoded";
        UserDetails userDetails = mockUserDetails("daria");
        Usuario user = mockUsuario(1L, "daria", "daria@test.com", "encoded");
        UserDetails updatedDetails = mockUserDetails("daria");
        when(userRepository.findByUsername("daria")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correct", "encoded")).thenReturn(true);
        when(passwordEncoder.encode("newpassword123")).thenReturn(bcryptHash);
        when(userDetailsService.loadUserByUsername("daria")).thenReturn(updatedDetails);
        when(jwtUtil.generateToken(updatedDetails)).thenReturn("new-jwt-token");

        ResponseEntity<?> response = userController.updateMe(
                userDetails, Map.of("currentPassword", "correct", "newPassword", "newpassword123"));

        assertEquals(200, response.getStatusCode().value());
        verify(userRepository).save(user);
        verify(user).setPassword(anyString());
    }

    @Test
    void updateMe_actualizaUsernameConExito() {
        UserDetails userDetails = mockUserDetails("daria");
        Usuario user = mockUsuario(1L, "daria", "daria@test.com", "encoded");
        UserDetails updatedDetails = mockUserDetails("newname");
        when(userRepository.findByUsername("daria")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correct", "encoded")).thenReturn(true);
        when(userRepository.existsByUsername("newname")).thenReturn(false);
        when(userDetailsService.loadUserByUsername("daria")).thenReturn(updatedDetails);
        when(jwtUtil.generateToken(updatedDetails)).thenReturn("jwt-token");

        ResponseEntity<?> response = userController.updateMe(
                userDetails, Map.of("currentPassword", "correct", "username", "newname"));

        assertEquals(200, response.getStatusCode().value());
        verify(user).setUsername("newname");
        verify(userRepository).save(user);
    }

    @Test
    void updateMe_actualizaEmailConExito() {
        UserDetails userDetails = mockUserDetails("daria");
        Usuario user = mockUsuario(1L, "daria", "daria@test.com", "encoded");
        UserDetails updatedDetails = mockUserDetails("daria");
        when(userRepository.findByUsername("daria")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correct", "encoded")).thenReturn(true);
        when(userRepository.existsByEmail("newemail@test.com")).thenReturn(false);
        when(userDetailsService.loadUserByUsername("daria")).thenReturn(updatedDetails);
        when(jwtUtil.generateToken(updatedDetails)).thenReturn("jwt-token");

        ResponseEntity<?> response = userController.updateMe(
                userDetails, Map.of("currentPassword", "correct", "email", "newemail@test.com"));

        assertEquals(200, response.getStatusCode().value());
        verify(user).setEmail("newemail@test.com");
        verify(userRepository).save(user);
    }

    // ─── deleteMe ─────────────────────────────────────────────────────────────────

    @Test
    void deleteMe_eliminaCuentaConExito() {
        UserDetails userDetails = mockUserDetails("daria");
        Usuario user = mockUsuario(1L, "daria", "daria@test.com", "encoded");
        when(userRepository.findByUsername("daria")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correct", "encoded")).thenReturn(true);

        ResponseEntity<?> response = userController.deleteMe(
                userDetails, Map.of("currentPassword", "correct"));

        assertEquals(200, response.getStatusCode().value());
        verify(usuarioService).deleteUser(1L);
    }

    @Test
    void deleteMe_retornaUnauthorizedSiContrasenaIncorrecta() {
        UserDetails userDetails = mockUserDetails("daria");
        Usuario user = mockUsuario(1L, "daria", "daria@test.com", "encoded");
        when(userRepository.findByUsername("daria")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "encoded")).thenReturn(false);

        ResponseEntity<?> response = userController.deleteMe(
                userDetails, Map.of("currentPassword", "wrong"));

        assertEquals(401, response.getStatusCode().value());
    }

    @Test
    void deleteMe_retornaUnauthorizedSiBodyEsNulo() {
        UserDetails userDetails = mockUserDetails("daria");
        Usuario user = mockUsuario(1L, "daria", "daria@test.com", "encoded");
        when(userRepository.findByUsername("daria")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(null, "encoded")).thenReturn(false);

        ResponseEntity<?> response = userController.deleteMe(userDetails, null);

        assertEquals(401, response.getStatusCode().value());
    }
}
