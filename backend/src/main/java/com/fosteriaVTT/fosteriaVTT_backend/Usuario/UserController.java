package com.fosteriaVTT.fosteriaVTT_backend.Usuario;

import com.fosteriaVTT.fosteriaVTT_backend.Cloudinary.CloudinaryService;
import com.fosteriaVTT.fosteriaVTT_backend.auth.CustomUserDetailsService;
import com.fosteriaVTT.fosteriaVTT_backend.configuration.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CloudinaryService cloudinaryService;
    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;
    private final UsuarioService usuarioService;

    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder,
                          CloudinaryService cloudinaryService, JwtUtil jwtUtil,
                          CustomUserDetailsService userDetailsService,
                          UsuarioService usuarioService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.cloudinaryService = cloudinaryService;
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
        this.usuarioService = usuarioService;
    }

    @GetMapping("/check-username")
    public ResponseEntity<?> checkUsername(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String username) {
        boolean takenByOther = userRepository.existsByUsername(username.trim())
                && !username.trim().equals(userDetails.getUsername());
        return ResponseEntity.ok(Map.of("available", !takenByOther));
    }

    @GetMapping("/check-email")
    public ResponseEntity<?> checkEmail(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String email) {
        Usuario current = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean takenByOther = userRepository.existsByEmail(email.trim().toLowerCase())
                && !email.trim().equalsIgnoreCase(current.getEmail());
        return ResponseEntity.ok(Map.of("available", !takenByOther));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(@AuthenticationPrincipal UserDetails userDetails) {
        Usuario user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(Map.of(
                "username", user.getUsername(),
                "email", user.getEmail(),
                "avatar", user.getAvatar() != null ? user.getAvatar() : ""
        ));
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMe(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body) {
        Usuario user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String newUsername = body.get("username");
        String newEmail = body.get("email");
        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");

        // Always require current password to authorise any profile change
        if (currentPassword == null || !passwordEncoder.matches(currentPassword, user.getPassword()))
            return ResponseEntity.status(401).body(Map.of("error", "Contraseña actual incorrecta"));

        if (newUsername != null && !newUsername.isBlank()) {
            String trimmed = newUsername.trim();
            if (trimmed.length() < 3)
                return ResponseEntity.badRequest().body(Map.of("error", "El usuario debe tener al menos 3 caracteres"));
            if (trimmed.length() > 50)
                return ResponseEntity.badRequest().body(Map.of("error", "El usuario no puede tener más de 50 caracteres"));
            if (!trimmed.equals(user.getUsername()) && userRepository.existsByUsername(trimmed))
                return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
            user.setUsername(trimmed);
        }

        if (newEmail != null && !newEmail.isBlank()) {
            String trimmed = newEmail.trim().toLowerCase();
            if (!trimmed.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"))
                return ResponseEntity.badRequest().body(Map.of("error", "Formato de email no válido"));
            if (trimmed.length() > 100)
                return ResponseEntity.badRequest().body(Map.of("error", "El email no puede tener más de 100 caracteres"));
            if (!trimmed.equals(user.getEmail()) && userRepository.existsByEmail(trimmed))
                return ResponseEntity.badRequest().body(Map.of("error", "Email already exists"));
            user.setEmail(trimmed);
        }

        if (newPassword != null && !newPassword.isBlank()) {
            if (newPassword.length() < 8)
                return ResponseEntity.badRequest().body(Map.of("error", "La nueva contraseña debe tener al menos 8 caracteres"));
            if (newPassword.length() > 100)
                return ResponseEntity.badRequest().body(Map.of("error", "La contraseña no puede tener más de 100 caracteres"));
            user.setPassword(passwordEncoder.encode(newPassword));
        }

        userRepository.save(user);
        UserDetails updatedDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String newToken = jwtUtil.generateToken(updatedDetails);
        return ResponseEntity.ok(Map.of(
                "username", user.getUsername(),
                "email", user.getEmail(),
                "avatar", user.getAvatar() != null ? user.getAvatar() : "",
                "token", newToken
        ));
    }

    @PostMapping("/me/avatar")
    public ResponseEntity<?> updateAvatar(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) {
        if (file.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("error", "No se proporcionó ningún archivo"));

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/"))
            return ResponseEntity.badRequest().body(Map.of("error", "Solo se permiten imágenes"));

        try {
            Usuario user = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            String avatarUrl = cloudinaryService.uploadFile(file);
            user.setAvatar(avatarUrl);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("avatar", avatarUrl));
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error al subir la imagen"));
        }
    }

    @DeleteMapping("/me")
    public ResponseEntity<?> deleteMe(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody(required = false) Map<String, String> body) {
        String currentPassword = body != null ? body.get("currentPassword") : null;
        Usuario user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (currentPassword == null || !passwordEncoder.matches(currentPassword, user.getPassword()))
            return ResponseEntity.status(401).body(Map.of("error", "Contraseña actual incorrecta"));
        usuarioService.deleteUser(user.getId());
        return ResponseEntity.ok(Map.of("message", "Cuenta eliminada correctamente"));
    }
}
