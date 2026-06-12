package com.fosteriaVTT.fosteriaVTT_backend.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Rol;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.UserRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario;
import com.fosteriaVTT.fosteriaVTT_backend.configuration.JwtUtil;
import com.fosteriaVTT.fosteriaVTT_backend.dto.LoginRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RegisterRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.BindingResult;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import java.util.Map;
import java.util.Optional;

import com.fosteriaVTT.fosteriaVTT_backend.auth.SendGridEmailService;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private BindingResult bindingResult;

    @Mock
    private Authentication authentication;

    @Mock
    private UserDetails userDetails;

    @Mock
    private SendGridEmailService emailService;

    @InjectMocks
    private AuthController authController;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUpMockMvc() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mockMvc = MockMvcBuilders.standaloneSetup(authController)
                .setValidator(validator)
                .build();
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void registerReturnsBadRequestWhenPayloadIsInvalid() {
        RegisterRequest request = new RegisterRequest();
        when(bindingResult.hasErrors()).thenReturn(true);

        ResponseEntity<?> response = authController.register(request, bindingResult);

        assertEquals(400, response.getStatusCode().value());
        assertEquals(Map.of("error", "Invalid payload"), response.getBody());
        verify(userRepository, never()).save(any());
    }

    @Test
    void registerReturnsBadRequestWhenUsernameAlreadyExists() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("daria");
        when(bindingResult.hasErrors()).thenReturn(false);
        when(userRepository.existsByUsername("daria")).thenReturn(true);

        ResponseEntity<?> response = authController.register(request, bindingResult);

        assertEquals(400, response.getStatusCode().value());
        assertEquals(Map.of("error", "Username already exists"), response.getBody());
    }

    @Test
    void registerReturnsBadRequestWhenEmailAlreadyExists() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("daria");
        request.setEmail("daria@test.com");
        when(bindingResult.hasErrors()).thenReturn(false);
        when(userRepository.existsByUsername("daria")).thenReturn(false);
        when(userRepository.existsByEmail("daria@test.com")).thenReturn(true);

        ResponseEntity<?> response = authController.register(request, bindingResult);

        assertEquals(400, response.getStatusCode().value());
        assertEquals(Map.of("error", "Email already exists"), response.getBody());
    }

    @Test
    void registerEncodesPasswordAndSavesUser() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("daria");
        request.setEmail("daria@test.com");
        request.setPassword("12345678");
        when(bindingResult.hasErrors()).thenReturn(false);
        when(userRepository.existsByUsername("daria")).thenReturn(false);
        when(userRepository.existsByEmail("daria@test.com")).thenReturn(false);
        when(passwordEncoder.encode("12345678")).thenReturn("encoded-password");

        ResponseEntity<?> response = authController.register(request, bindingResult);
        ArgumentCaptor<Usuario> userCaptor = ArgumentCaptor.forClass(Usuario.class);

        verify(userRepository).save(userCaptor.capture());
        Usuario savedUser = userCaptor.getValue();

        assertEquals(200, response.getStatusCode().value());
        assertEquals("daria", savedUser.getUsername());
        assertEquals("daria@test.com", savedUser.getEmail());
        assertEquals("encoded-password", savedUser.getPassword());
        assertEquals(Rol.USER, savedUser.getRole());
    }

    @Test
    void loginReturnsBadRequestWhenPayloadIsInvalid() {
        LoginRequest request = new LoginRequest();
        when(bindingResult.hasErrors()).thenReturn(true);

        ResponseEntity<?> response = authController.login(request, bindingResult);

        assertEquals(400, response.getStatusCode().value());
        assertEquals(Map.of("error", "Credenciales inválidas"), response.getBody());
    }

    @Test
    void loginReturnsBadRequestWhenUsernameIsTooLong() {
        LoginRequest request = new LoginRequest();
        request.setUsername("u".repeat(101));
        request.setPassword("12345678");
        when(bindingResult.hasErrors()).thenReturn(false);

        ResponseEntity<?> response = authController.login(request, bindingResult);

        assertEquals(400, response.getStatusCode().value());
        assertEquals(
                Map.of("error", "El usuario no puede tener más de 100 caracteres"),
                response.getBody()
        );
    }

    @Test
    void loginReturnsNotFoundWhenUserDoesNotExist() {
        LoginRequest request = new LoginRequest();
        request.setUsername("daria");
        request.setPassword("12345678");
        when(bindingResult.hasErrors()).thenReturn(false);
        when(userRepository.findByUsername("daria")).thenReturn(Optional.empty());

        ResponseEntity<?> response = authController.login(request, bindingResult);

        assertEquals(404, response.getStatusCode().value());
        assertEquals(Map.of("error", "Usuario no encontrado"), response.getBody());
    }

    @Test
    void loginReturnsUnauthorizedWhenPasswordDoesNotMatch() {
        LoginRequest request = new LoginRequest();
        request.setUsername("daria");
        request.setPassword("12345678");
        Usuario user = Usuario.builder().username("daria").password("encoded-password").build();
        when(bindingResult.hasErrors()).thenReturn(false);
        when(userRepository.findByUsername("daria")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("12345678", "encoded-password")).thenReturn(false);

        ResponseEntity<?> response = authController.login(request, bindingResult);

        assertEquals(401, response.getStatusCode().value());
        assertEquals(Map.of("error", "Contraseña incorrecta"), response.getBody());
    }

    @Test
    void loginAuthenticatesAndReturnsJwt() {
        LoginRequest request = new LoginRequest();
        request.setUsername("daria");
        request.setPassword("12345678");
        Usuario user = Usuario.builder().username("daria").password("encoded-password").build();

        when(bindingResult.hasErrors()).thenReturn(false);
        when(userRepository.findByUsername("daria")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("12345678", "encoded-password")).thenReturn(true);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(jwtUtil.generateToken(userDetails)).thenReturn("jwt-token");

        ResponseEntity<?> response = authController.login(request, bindingResult);

        assertEquals(200, response.getStatusCode().value());
        assertInstanceOf(Map.class, response.getBody());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("Login successful", body.get("message"));
        assertEquals("jwt-token", body.get("token"));
        assertEquals("daria", body.get("username"));
        assertSame(authentication, SecurityContextHolder.getContext().getAuthentication());
        assertNull(SecurityContextHolder.createEmptyContext().getAuthentication());
    }

    @Test
    void registerEndpointReturnsOkForValidPayload() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("daria");
        request.setEmail("daria@test.com");
        request.setPassword("12345678");

        when(userRepository.existsByUsername("daria")).thenReturn(false);
        when(userRepository.existsByEmail("daria@test.com")).thenReturn(false);
        when(passwordEncoder.encode("12345678")).thenReturn("encoded-password");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User registered"));
    }

    @Test
    void registerEndpointReturnsBadRequestForInvalidPayload() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("ab");
        request.setEmail("mail@test.com");
        request.setPassword("1234");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid payload"));
    }

    @Test
    void loginEndpointReturnsNotFoundWhenUserDoesNotExist() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsername("daria");
        request.setPassword("12345678");

        when(userRepository.findByUsername("daria")).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Usuario no encontrado"));
    }

    // ─── forgotPassword ──────────────────────────────────────────────────────────

    @Test
    void forgotPassword_retornaBadRequestSiEmailEsBlanco() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("El email es requerido"));
    }

    @Test
    void forgotPassword_retornaNotFoundSiUsuarioNoExiste() throws Exception {
        when(userRepository.findByEmail("noexiste@test.com")).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"noexiste@test.com\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void forgotPassword_retornaForbiddenSiEsAdmin() throws Exception {
        Usuario adminUser = Usuario.builder()
                .username("adminuser")
                .email("admin@test.com")
                .password("encoded")
                .role(Rol.ADMIN)
                .build();
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(adminUser));

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@test.com\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void forgotPassword_retornaForbiddenSiEsUsuarioSistema() throws Exception {
        Usuario sistemaUser = Usuario.builder()
                .username("sistema")
                .email("sistema@test.com")
                .password("encoded")
                .role(Rol.USER)
                .build();
        when(userRepository.findByEmail("sistema@test.com")).thenReturn(Optional.of(sistemaUser));

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"sistema@test.com\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void forgotPassword_enviaCodigoConExito() throws Exception {
        Usuario user = Usuario.builder()
                .username("daria")
                .email("daria@test.com")
                .password("encoded")
                .role(Rol.USER)
                .build();
        when(userRepository.findByEmail("daria@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode(anyString())).thenReturn("encoded-code");
        doNothing().when(emailService).sendResetCode(anyString(), anyString(), anyString());

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"daria@test.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Código enviado correctamente"));

        verify(userRepository).save(user);
        verify(emailService).sendResetCode(eq("daria@test.com"), eq("daria"), anyString());
    }

    // ─── verifyResetCode ─────────────────────────────────────────────────────────

    @Test
    void verifyResetCode_retornaBadRequestSiCamposSonNulos() throws Exception {
        mockMvc.perform(post("/api/auth/verify-reset-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"daria@test.com\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void verifyResetCode_retornaBadRequestSiUsuarioNoExiste() throws Exception {
        when(userRepository.findByEmail("noexiste@test.com")).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/auth/verify-reset-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"noexiste@test.com\",\"code\":\"123456\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void verifyResetCode_retornaBadRequestSiCodigoEsNulo() throws Exception {
        Usuario user = Usuario.builder()
                .username("daria")
                .email("daria@test.com")
                .password("encoded")
                .role(Rol.USER)
                .build();
        when(userRepository.findByEmail("daria@test.com")).thenReturn(Optional.of(user));

        mockMvc.perform(post("/api/auth/verify-reset-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"daria@test.com\",\"code\":\"123456\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void verifyResetCode_retornaBadRequestSiCodigoExpirado() throws Exception {
        Usuario user = Usuario.builder()
                .username("daria")
                .email("daria@test.com")
                .password("encoded")
                .role(Rol.USER)
                .build();
        user.setRecoverCode("encoded-code");
        user.setExpiration(LocalDateTime.now().minusMinutes(5));
        when(userRepository.findByEmail("daria@test.com")).thenReturn(Optional.of(user));

        mockMvc.perform(post("/api/auth/verify-reset-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"daria@test.com\",\"code\":\"123456\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void verifyResetCode_retornaOkSiCodigoEsValido() throws Exception {
        Usuario user = Usuario.builder()
                .username("daria")
                .email("daria@test.com")
                .password("encoded")
                .role(Rol.USER)
                .build();
        user.setRecoverCode("encoded-code");
        user.setExpiration(LocalDateTime.now().plusMinutes(25));
        when(userRepository.findByEmail("daria@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("123456", "encoded-code")).thenReturn(true);

        mockMvc.perform(post("/api/auth/verify-reset-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"daria@test.com\",\"code\":\"123456\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Código válido"));
    }

    // ─── resetPassword ───────────────────────────────────────────────────────────

    @Test
    void resetPassword_retornaBadRequestSiPasswordEsMuyCorta() throws Exception {
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"daria@test.com\",\"code\":\"123456\",\"newPassword\":\"1234\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void resetPassword_retornaBadRequestSiUsuarioNoExiste() throws Exception {
        when(userRepository.findByEmail("noexiste@test.com")).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"noexiste@test.com\",\"code\":\"123456\",\"newPassword\":\"password123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void resetPassword_retornaBadRequestSiCodigoExpirado() throws Exception {
        Usuario user = Usuario.builder()
                .username("daria")
                .email("daria@test.com")
                .password("encoded")
                .role(Rol.USER)
                .build();
        user.setRecoverCode("encoded-code");
        user.setExpiration(LocalDateTime.now().minusMinutes(5));
        when(userRepository.findByEmail("daria@test.com")).thenReturn(Optional.of(user));

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"daria@test.com\",\"code\":\"123456\",\"newPassword\":\"password123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void resetPassword_actualizaPasswordConExito() throws Exception {
        Usuario user = Usuario.builder()
                .username("daria")
                .email("daria@test.com")
                .password("old-encoded")
                .role(Rol.USER)
                .build();
        user.setRecoverCode("encoded-code");
        user.setExpiration(LocalDateTime.now().plusMinutes(25));
        when(userRepository.findByEmail("daria@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("123456", "encoded-code")).thenReturn(true);
        when(passwordEncoder.encode("newpassword123")).thenReturn("new-encoded");

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"daria@test.com\",\"code\":\"123456\",\"newPassword\":\"newpassword123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Contraseña actualizada correctamente"));

        verify(userRepository).save(user);
    }

    @Test
    void loginEndpointReturnsTokenForValidCredentials() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsername("daria");
        request.setPassword("12345678");
        Usuario user = Usuario.builder().username("daria").password("encoded-password").build();
        User principal = new User("daria", "encoded-password", java.util.List.of());

        when(userRepository.findByUsername("daria")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("12345678", "encoded-password")).thenReturn(true);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(principal);
        when(jwtUtil.generateToken(principal)).thenReturn("jwt-token");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Login successful"))
                .andExpect(jsonPath("$.token").value("jwt-token"))
                .andExpect(jsonPath("$.username").value("daria"));
    }
}
