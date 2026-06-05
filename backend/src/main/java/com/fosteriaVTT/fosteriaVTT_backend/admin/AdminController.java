package com.fosteriaVTT.fosteriaVTT_backend.admin;

import com.fosteriaVTT.fosteriaVTT_backend.Campaña.CampañaService;
import com.fosteriaVTT.fosteriaVTT_backend.Jugador.JugadorRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Mapa.MapaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Mapa.MapaService;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.ObjetoService;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.NpcService;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.PersonajeRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.PersonajeService;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Rol;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.UserRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario;
import com.fosteriaVTT.fosteriaVTT_backend.dto.AgregarHabilidadNpcRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.AgregarItemMochilaRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CrearNpcRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private static final String SISTEMA_USERNAME = "sistema";

    private final UserRepository userRepository;
    private final JugadorRepository jugadorRepository;
    private final PersonajeRepository personajeRepository;
    private final PersonajeService personajeService;
    private final CampañaService campañaService;
    private final MapaRepository mapaRepository;
    private final MapaService mapaService;
    private final NpcService npcService;
    private final PasswordEncoder passwordEncoder;
    private final ObjetoService objetoService;

    public AdminController(UserRepository userRepository,
                           JugadorRepository jugadorRepository,
                           PersonajeRepository personajeRepository,
                           PersonajeService personajeService,
                           CampañaService campañaService,
                           MapaRepository mapaRepository,
                           MapaService mapaService,
                           NpcService npcService,
                           PasswordEncoder passwordEncoder,
                           ObjetoService objetoService) {
        this.userRepository = userRepository;
        this.jugadorRepository = jugadorRepository;
        this.personajeRepository = personajeRepository;
        this.personajeService = personajeService;
        this.campañaService = campañaService;
        this.mapaRepository = mapaRepository;
        this.mapaService = mapaService;
        this.npcService = npcService;
        this.passwordEncoder = passwordEncoder;
        this.objetoService = objetoService;
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        List<Map<String, Object>> users = userRepository.findAll().stream()
                .map(u -> {
                    long campañaCount = jugadorRepository.countByUsuarioId(u.getId());
                    long marketplaceCount =
                            mapaRepository.findByUsuarioUsernameAndEsPublico(u.getUsername(), true).size()
                            + personajeRepository.findPublicNpcEnemiesByUsuarioUsername(u.getUsername()).size();
                    Map<String, Object> row = new java.util.LinkedHashMap<>();
                    row.put("id", u.getId());
                    row.put("username", u.getUsername());
                    row.put("email", u.getEmail());
                    row.put("role", u.getRole().name());
                    row.put("avatar", u.getAvatar() != null ? u.getAvatar() : "");
                    row.put("campañaCount", campañaCount);
                    row.put("marketplaceCount", marketplaceCount);
                    return row;
                })
                .toList();
        return ResponseEntity.ok(users);
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String email = body.get("email");
        String password = body.get("password");
        String role = body.get("role");

        if (username == null || username.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "Username requerido"));
        if (username.trim().length() < 3)
            return ResponseEntity.badRequest().body(Map.of("error", "El username debe tener al menos 3 caracteres"));
        if (username.trim().length() > 100)
            return ResponseEntity.badRequest().body(Map.of("error", "El username no puede tener más de 100 caracteres"));

        if (email == null || email.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "Email requerido"));
        if (email.length() > 254)
            return ResponseEntity.badRequest().body(Map.of("error", "El email no puede tener más de 254 caracteres"));
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"))
            return ResponseEntity.badRequest().body(Map.of("error", "Formato de email no válido"));

        if (password == null || password.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "Password requerido"));
        if (password.length() < 8)
            return ResponseEntity.badRequest().body(Map.of("error", "La contraseña debe tener al menos 8 caracteres"));
        if (password.length() > 100)
            return ResponseEntity.badRequest().body(Map.of("error", "La contraseña no puede tener más de 100 caracteres"));

        if (userRepository.existsByUsername(username.trim()))
            return ResponseEntity.badRequest().body(Map.of("error", "El username ya existe"));
        if (userRepository.existsByEmail(email))
            return ResponseEntity.badRequest().body(Map.of("error", "El email ya existe"));

        Rol rolEnum = "ADMIN".equalsIgnoreCase(role) ? Rol.ADMIN : Rol.USER;

        Usuario user = Usuario.builder()
                .username(username.trim())
                .email(email.trim())
                .password(passwordEncoder.encode(password))
                .role(rolEnum)
                .build();

        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Usuario creado"));
    }

    @Transactional
    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id,
                                        @RequestBody Map<String, String> body) {
        return userRepository.findById(id)
                .map(u -> {
                    String newUsername = body.get("username");
                    String newEmail = body.get("email");

                    if (newUsername != null && !newUsername.isBlank()) {
                        String trimmed = newUsername.trim();
                        if (trimmed.length() < 3)
                            return ResponseEntity.badRequest().body(Map.of("error", "Mínimo 3 caracteres para el usuario"));
                        if (trimmed.length() > 50)
                            return ResponseEntity.badRequest().body(Map.of("error", "Máximo 50 caracteres para el usuario"));
                        if (!trimmed.equals(u.getUsername()) && userRepository.existsByUsername(trimmed))
                            return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
                        u.setUsername(trimmed);
                    }

                    if (newEmail != null && !newEmail.isBlank()) {
                        String trimmed = newEmail.trim().toLowerCase();
                        if (!trimmed.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"))
                            return ResponseEntity.badRequest().body(Map.of("error", "Formato de email no válido"));
                        if (trimmed.length() > 100)
                            return ResponseEntity.badRequest().body(Map.of("error", "Máximo 100 caracteres para el email"));
                        if (!trimmed.equals(u.getEmail()) && userRepository.existsByEmail(trimmed))
                            return ResponseEntity.badRequest().body(Map.of("error", "Email already exists"));
                        u.setEmail(trimmed);
                    }

                    userRepository.save(u);
                    return ResponseEntity.ok(Map.of("username", u.getUsername(), "email", u.getEmail()));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id,
                                        org.springframework.security.core.Authentication authentication) {
        String currentUsername = authentication.getName();
        return userRepository.findById(id)
                .map(u -> {
                    if (u.getUsername().equals(currentUsername))
                        return ResponseEntity.badRequest().body(Map.of("error", "No puedes eliminarte a ti mismo"));
                    if (u.getUsername().equals("sistema"))
                        return ResponseEntity.badRequest().body(Map.of("error", "El usuario sistema no puede eliminarse"));

                    campañaService.eliminarCampañasPorDm(id);
                    personajeRepository.findByUsuarioUsernameOrderByUsadoDesc(u.getUsername())
                            .forEach(p -> personajeService.eliminarPersonajeAdmin(p.getId()));
                    mapaRepository.findByUsuarioId(id).forEach(mapaRepository::delete);
                    jugadorRepository.findByUsuarioIdOrderByUltimaVezAccedidoDesc(id)
                            .forEach(jugadorRepository::delete);
                    userRepository.delete(u);
                    return ResponseEntity.noContent().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/maps/{id}")
    public ResponseEntity<?> deleteMap(@PathVariable Long id) {
        if (!mapaRepository.existsById(id)) return ResponseEntity.notFound().build();
        mapaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/personajes/{id}")
    public ResponseEntity<?> deletePersonaje(@PathVariable Long id) {
        if (!personajeRepository.existsById(id)) return ResponseEntity.notFound().build();
        personajeService.eliminarPersonajeAdmin(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/objetos")
    public ResponseEntity<?> createCatalogObject(@RequestBody Map<String, String> body) {
        String nombre = body.get("nombre");
        String descripcion = body.get("descripcion");
        String formula = body.get("formula");
        String tipo = body.get("tipoObjeto");
        String sistema = body.get("sistema");

        if (nombre == null || nombre.isBlank()) return ResponseEntity.badRequest().body(Map.of("error", "Nombre requerido"));
        if (tipo == null || tipo.isBlank()) return ResponseEntity.badRequest().body(Map.of("error", "Tipo requerido"));
        if (sistema == null || sistema.isBlank()) return ResponseEntity.badRequest().body(Map.of("error", "Sistema requerido"));

        com.fosteriaVTT.fosteriaVTT_backend.Objeto.TipoObjeto tipoEnum;
        try {
            tipoEnum = com.fosteriaVTT.fosteriaVTT_backend.Objeto.TipoObjeto.valueOf(tipo);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tipo no válido: " + tipo));
        }

        var obj = objetoService.crearObjetoDeCatalogo(nombre, formula, descripcion, tipoEnum, sistema);
        return ResponseEntity.ok(obj);
    }

    @GetMapping("/objetos")
    public ResponseEntity<?> getCatalogObjects() {
        var items = objetoService.obtenerTodoElCatalogo().stream()
                .map(obj -> {
                    String indice = obj.tags() != null ? obj.tags() : "";
                    String sistema = indice.toLowerCase().contains("mork_borg") ? "Mork Borg" : "D&D 5e";
                    boolean adminCreado = java.util.Arrays.stream(indice.split(","))
                            .map(String::trim)
                            .anyMatch(t -> t.equalsIgnoreCase("AdminCreado"));
                    Map<String, Object> row = new java.util.LinkedHashMap<>();
                    row.put("id", obj.id());
                    row.put("nombre", obj.nombre());
                    row.put("formula", obj.formula());
                    row.put("descripcion", obj.descripcion());
                    row.put("tipoObjeto", obj.tipoObjeto());
                    row.put("sistema", sistema);
                    row.put("adminCreado", adminCreado);
                    return row;
                })
                .toList();
        return ResponseEntity.ok(items);
    }

    @DeleteMapping("/objetos/{id}")
    public ResponseEntity<?> deleteCatalogObject(@PathVariable Long id) {
        objetoService.eliminarObjetoDeCatalogo(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/marketplace")
    public ResponseEntity<?> getMarketplace() {
        var items = new java.util.ArrayList<Map<String, Object>>();

        for (var mapa : mapaRepository.findByEsPublicoTrueOrderByUpdatedAtDesc()) {
            Map<String, Object> row = new java.util.LinkedHashMap<>();
            row.put("id", mapa.getId());
            row.put("tipo", "MAPA");
            row.put("subtipo", "Mapa");
            row.put("nombre", mapa.getNombre());
            row.put("imageUrl", mapa.getMapa());
            row.put("propietario", mapa.getUsuario().getUsername());
            row.put("sistema", null);
            row.put("updatedAt", mapa.getUpdatedAt() != null ? mapa.getUpdatedAt().toString() : null);
            items.add(row);
        }

        for (var personaje : personajeRepository.findAllPublicNpcEnemies()) {
            String tags = personaje.getTags() != null ? personaje.getTags().toLowerCase() : "";
            String subtipo = tags.contains("enemigo") ? "Enemigo" : "PNJ";
            Map<String, Object> row = new java.util.LinkedHashMap<>();
            row.put("id", personaje.getId());
            row.put("tipo", "PERSONAJE");
            row.put("subtipo", subtipo);
            row.put("nombre", personaje.getNombre());
            row.put("imageUrl", personaje.getRetrato());
            row.put("propietario", personaje.getUsuario().getUsername());
            row.put("sistema", personaje.getSistemaDeJuego() != null ? personaje.getSistemaDeJuego().getDisplayName() : null);
            row.put("updatedAt", personaje.getUsado() != null ? personaje.getUsado().toString() : null);
            items.add(row);
        }

        return ResponseEntity.ok(items);
    }

    // ── Creación de contenido bajo el usuario "sistema" ──────────────────────

    @PostMapping(value = "/mapas", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> subirMapaSistema(
            @RequestPart("mapImage") MultipartFile mapImage,
            @RequestPart("nombre") String nombre,
            @RequestPart(value = "tags", required = false) String tags) {
        var result = mapaService.crearMapa(SISTEMA_USERNAME, mapImage, nombre, true, tags);
        return ResponseEntity.ok(result);
    }

    @PostMapping(value = "/personajes/npc", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> crearNpcSistema(
            @RequestPart("payload") CrearNpcRequest payload,
            @RequestPart(value = "portrait", required = false) MultipartFile portrait) {
        CrearNpcRequest payloadPublico = new CrearNpcRequest(
                payload.nombre(), payload.tipo(), payload.sistemaDeJuego(),
                payload.vd(), payload.biografia(), true, payload.estadisticas());
        var result = npcService.crearNpc(payloadPublico, portrait, SISTEMA_USERNAME);
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/personajes/{id}/mb-enemy-traits")
    public ResponseEntity<?> appendTagsNpcSistema(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String appendTags = body.get("tags");
        if (appendTags != null && !appendTags.isBlank()) {
            npcService.appendTagsToEnemy(id, appendTags, SISTEMA_USERNAME);
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/personajes/{id}/habilidades/npc")
    public ResponseEntity<?> addHabilidadNpcSistema(
            @PathVariable Long id,
            @RequestBody AgregarHabilidadNpcRequest request) {
        npcService.agregarHabilidadNpc(id, request, SISTEMA_USERNAME);
        return ResponseEntity.noContent().build();
    }

    @Transactional
    @PostMapping("/personajes/{id}/mochila")
    public ResponseEntity<?> addMochilaSistema(
            @PathVariable Long id,
            @RequestBody AgregarItemMochilaRequest request) {
        var personaje = personajeRepository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Personaje no encontrado"));
        personajeService.agregarItemMochila(id, request, personaje.getUsuario().getUsername());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserDetail(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(u -> {
                    long campañaCount = jugadorRepository.countByUsuarioId(u.getId());
                    long personajeCount = personajeRepository.countByUsuarioUsername(u.getUsername());

                    List<Map<String, Object>> publishedMaps = mapaRepository
                            .findByUsuarioUsernameAndEsPublico(u.getUsername(), true)
                            .stream()
                            .map(m -> Map.<String, Object>of(
                                    "id", m.getId(),
                                    "nombre", m.getNombre(),
                                    "imageUrl", m.getMapa()))
                            .toList();

                    List<Map<String, Object>> publishedPersonajes = personajeRepository
                            .findPublicNpcEnemiesByUsuarioUsername(u.getUsername())
                            .stream()
                            .map(p -> Map.<String, Object>of(
                                    "id", p.getId(),
                                    "nombre", p.getNombre(),
                                    "imageUrl", p.getRetrato() != null ? p.getRetrato() : "",
                                    "sistemaDeJuego", p.getSistemaDeJuego() != null ? p.getSistemaDeJuego().getDisplayName() : ""
                            ))
                            .toList();

                    return ResponseEntity.ok(Map.<String, Object>of(
                            "id", u.getId(),
                            "username", u.getUsername(),
                            "email", u.getEmail(),
                            "avatar", u.getAvatar() != null ? u.getAvatar() : "",
                            "campañaCount", campañaCount,
                            "personajeCount", personajeCount,
                            "publishedMaps", publishedMaps,
                            "publishedPersonajes", publishedPersonajes
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
