package com.fosteriaVTT.fosteriaVTT_backend.auth;

import com.fosteriaVTT.fosteriaVTT_backend.configuration.JwtUtil;
import com.fosteriaVTT.fosteriaVTT_backend.dto.LoginRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RegisterRequest;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Rol;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.UserRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final SendGridEmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          AuthenticationManager authenticationManager,
                          JwtUtil jwtUtil,
                          SendGridEmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
    }

    private String generateCode() {
        return String.format("%06d", secureRandom.nextInt(1_000_000));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid payload"));
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already exists"));
        }

        Usuario user = Usuario.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Rol.USER)
                .build();

        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "User registered"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Credenciales inválidas"));
        }
        if (request.getUsername() != null && request.getUsername().length() > 100) {
            return ResponseEntity.badRequest().body(Map.of("error", "El usuario no puede tener más de 100 caracteres"));
        }
        if (request.getPassword() != null && request.getPassword().length() > 100) {
            return ResponseEntity.badRequest().body(Map.of("error", "La contraseña no puede tener más de 100 caracteres"));
        }
        Usuario usuario = userRepository.findByUsername(request.getUsername()).orElse(null);
        if (usuario == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Usuario no encontrado"));
        }
        if (!passwordEncoder.matches(request.getPassword(), usuario.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("error", "Contraseña incorrecta"));
        }
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String jwt = jwtUtil.generateToken(userDetails);
        Map<String, Object> body = new HashMap<>();
        body.put("message", "Login successful");
        body.put("token", jwt);
        body.put("username", request.getUsername());
        body.put("avatar", usuario.getAvatar());
        body.put("role", usuario.getRole().name());
        return ResponseEntity.ok(body);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "El email es requerido"));

        Optional<Usuario> userOpt = userRepository.findByEmail(email.trim().toLowerCase());
        if (userOpt.isEmpty())
            return ResponseEntity.status(404).body(Map.of("error", "Email incorrecto, usuario no encontrado"));

        Usuario candidate = userOpt.get();
        if (candidate.getRole() == Rol.ADMIN || candidate.getUsername().equalsIgnoreCase("sistema"))
            return ResponseEntity.status(403).body(Map.of("error", "Usuario restringido, no permite modificaciones"));

        String code = generateCode();
        Usuario user = userOpt.get();
        user.setRecoverCode(passwordEncoder.encode(code));
        user.setExpiration(LocalDateTime.now().plusMinutes(30));
        userRepository.save(user);
        emailService.sendResetCode(user.getEmail(), user.getUsername(), code);
        return ResponseEntity.ok(Map.of("message", "Código enviado correctamente"));
    }

    @PostMapping("/verify-reset-code")
    public ResponseEntity<?> verifyResetCode(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String code = body.get("code");
        if (email == null || code == null)
            return ResponseEntity.badRequest().body(Map.of("error", "Email y código son requeridos"));

        Optional<Usuario> userOpt = userRepository.findByEmail(email.trim().toLowerCase());
        if (userOpt.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "Código inválido o expirado"));

        Usuario user = userOpt.get();
        if (user.getRecoverCode() == null || user.getExpiration() == null
                || LocalDateTime.now().isAfter(user.getExpiration())
                || !passwordEncoder.matches(code.trim(), user.getRecoverCode()))
            return ResponseEntity.badRequest().body(Map.of("error", "Código inválido o expirado"));

        return ResponseEntity.ok(Map.of("message", "Código válido"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String code = body.get("code");
        String newPassword = body.get("newPassword");

        if (newPassword == null || newPassword.length() < 8 || newPassword.length() > 100)
            return ResponseEntity.badRequest().body(Map.of("error", "La contraseña debe tener entre 8 y 100 caracteres"));

        Optional<Usuario> userOpt = userRepository.findByEmail(email.trim().toLowerCase());
        if (userOpt.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "Código inválido o expirado"));

        Usuario user = userOpt.get();
        if (user.getRecoverCode() == null || user.getExpiration() == null
                || LocalDateTime.now().isAfter(user.getExpiration())
                || !passwordEncoder.matches(code.trim(), user.getRecoverCode()))
            return ResponseEntity.badRequest().body(Map.of("error", "Código inválido o expirado"));

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setRecoverCode(null);
        user.setExpiration(null);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Contraseña actualizada correctamente"));
    }
}
