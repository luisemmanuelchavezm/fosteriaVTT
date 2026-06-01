package com.fosteriaVTT.fosteriaVTT_backend.Personaje.mbUtils;

import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.Estadistica;
import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.EstadisticaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.HabilidadRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Mochila.Mochila;
import com.fosteriaVTT.fosteriaVTT_backend.Mochila.MochilaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.Objeto;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.ObjetoRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.PersonajeRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.UserRepository;
import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import com.fosteriaVTT.fosteriaVTT_backend.dto.morkborg.CrearPersonajeMorkBorgRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PersonajeResumenResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class MorkBorgCharacterCreationUtils {

    private final UserRepository userRepository;
    private final PersonajeRepository personajeRepository;
    private final EstadisticaRepository estadisticaRepository;
    private final MochilaRepository mochilaRepository;
    private final ObjetoRepository objetoRepository;
    private final HabilidadRepository habilidadRepository;

    public MorkBorgCharacterCreationUtils(
            UserRepository userRepository,
            PersonajeRepository personajeRepository,
            EstadisticaRepository estadisticaRepository,
            MochilaRepository mochilaRepository,
            ObjetoRepository objetoRepository,
            HabilidadRepository habilidadRepository
    ) {
        this.userRepository      = userRepository;
        this.personajeRepository = personajeRepository;
        this.estadisticaRepository = estadisticaRepository;
        this.mochilaRepository   = mochilaRepository;
        this.objetoRepository    = objetoRepository;
        this.habilidadRepository = habilidadRepository;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Entrada pública
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public PersonajeResumenResponse crearPersonajeMorkBorg(
            CrearPersonajeMorkBorgRequest req,
            String retratoUrl,
            String username
    ) {
        var usuario = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Usuario no encontrado"));

        // 1. Construir la entidad base con habilidades ya asignadas
        var personaje = Personaje.builder()
                .nombre(req.nombre())
                .retrato(retratoUrl)
                .sistemaDeJuego(SistemaDeJuego.MORK_BORG)
                .tags(construirTags(req))
                .usuario(usuario)
                .build();

        // 2. Resolver habilidades de opción de clase (las que son Habilidad)
        resolverHabilidadesClase(personaje, req.claseId(), req.claseOpciones());

        // Herborista siempre obtiene "Creación de decocciones"
        if ("herborista-ocultista".equals(req.claseId())) {
            habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc("HerboristaHabilidadIdx;1")
                    .stream().findFirst().ifPresent(h -> personaje.getHabilidades().add(h));
        }

        // Pergamino inicial (opcional, excepto ermitaño que lo tiene obligatorio)
        if (Boolean.TRUE.equals(req.wantsScroll()) && req.perScrollIdx() != null && req.perScrollTipo() != null) {
            String tag = pergaminoTag(req.perScrollTipo(), req.perScrollIdx());
            habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc(tag)
                    .stream().findFirst().ifPresent(h -> personaje.getHabilidades().add(h));
        }
        if (req.esotScrollIdx() != null && req.esotScrollTipo() != null) {
            String tag = pergaminoTag(req.esotScrollTipo(), req.esotScrollIdx());
            habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc(tag)
                    .stream().findFirst().ifPresent(h -> personaje.getHabilidades().add(h));
        }

        // 3. Guardar personaje (persiste join-table de habilidades)
        personajeRepository.save(personaje);

        // 4. Resolver objetos de opción de clase (los que son Objeto) → mochila
        resolverObjetosClase(personaje, req.claseId(), req.claseOpciones());

        // 5. Equipo base → mochila
        guardarEquipoBase(personaje, req);

        // 6. Estadísticas
        guardarEstadisticas(personaje, req);

        return toResumen(personaje);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Tags
    // ─────────────────────────────────────────────────────────────────────────

    private String construirTags(CrearPersonajeMorkBorgRequest req) {
        var sb = new StringBuilder("MORK_BORG,clase;").append(req.claseId());

        if (req.claseOpciones() != null && !req.claseOpciones().isEmpty()) {
            sb.append(",claseOpciones;");
            req.claseOpciones().forEach(i -> sb.append(i).append('-'));
            sb.deleteCharAt(sb.length() - 1);
        }
        appendTag(sb, "rasgoTerrible1",   req.rasgoTerrible1());
        appendTag(sb, "rasgoTerrible2",   req.rasgoTerrible2());
        appendTag(sb, "cuerpoRoto",       req.cuerpoRoto());
        appendTag(sb, "habito",           req.habito());
        appendTag(sb, "historia",         req.historiaperturbadora());

        return sb.toString();
    }

    private void appendTag(StringBuilder sb, String key, Integer value) {
        if (value != null) sb.append(',').append(key).append(';').append(value);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Resolución de opción de clase
    // ─────────────────────────────────────────────────────────────────────────

    private void resolverHabilidadesClase(Personaje personaje, String claseId, List<Integer> opciones) {
        if (opciones == null || opciones.isEmpty()) return;
        for (Integer idx : opciones) {
            if (isHabilidad(claseId, idx)) addHabilidadClase(personaje, claseId, idx);
        }
    }

    private void resolverObjetosClase(Personaje personaje, String claseId, List<Integer> opciones) {
        if (opciones == null || opciones.isEmpty()) return;
        for (Integer idx : opciones) {
            if (!isHabilidad(claseId, idx)) addObjetoClase(personaje, claseId, idx);
        }
    }

    /** true → la opción es una Habilidad; false → es un Objeto en mochila. */
    private boolean isHabilidad(String claseId, Integer idx) {
        if (idx == null) return false;
        int n = idx + 1;
        return switch (claseId) {
            case "escoria-alcantarillas" -> true;
            case "ermitano-esoterico"    -> n != 2;  // opción 2 = Libro (Objeto)
            case "realeza-desgracia"     -> n == 2 || n == 3 || n == 4;  // acompañantes
            case "sacerdote-hereje"      -> false;   // todos son Objeto
            case "desertor-colmilludo"   -> n == 5;  // Viejo sabueso
            default -> false;
        };
    }

    private void addHabilidadClase(Personaje personaje, String claseId, Integer idx) {
        int n = idx + 1;
        String tag = switch (claseId) {
            case "escoria-alcantarillas" -> "EscEspecialidadIdx;" + n;
            case "ermitano-esoterico"    -> "ErmitanoEspecialidadIdx;" + n;
            case "realeza-desgracia"     -> "RealezaItemIdx;" + n;
            case "desertor-colmilludo"   -> "DesertorItemIdx;" + n;
            default -> null;
        };
        if (tag != null) {
            habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc(tag)
                    .stream().findFirst().ifPresent(h -> personaje.getHabilidades().add(h));
        }
    }

    private void addObjetoClase(Personaje personaje, String claseId, Integer idx) {
        int n = idx + 1;
        Optional<Objeto> obj = switch (claseId) {
            case "ermitano-esoterico" -> // n == 2: "Un libro de sangre hirviendo"
                    objetoRepository.findByNombreIgnoreCaseOrderByIdAsc("Un libro de sangre hirviendo")
                            .stream().findFirst();
            case "realeza-desgracia" ->
                    objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc("RealezaItemIdx;" + n)
                            .stream().findFirst();
            case "sacerdote-hereje" ->
                    objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc("SacerdoteItemIdx;" + n)
                            .stream().findFirst();
            case "desertor-colmilludo" -> desertorObjeto(n);
            default -> Optional.empty();
        };
        boolean equipped = esArmaDeClase(claseId, n);
        obj.ifPresent(o -> guardarItem(personaje, o, 1, equipped));
    }

    private Optional<Objeto> desertorObjeto(int n) {
        String nombre = switch (n) {
            case 1 -> "Máscara de monstruo arrugada";
            case 2 -> "La cimitarra marrón de Galgenbeck";
            case 3 -> "Dientes de mago";
            case 4 -> "Honda del viejo Sigûrd";
            case 6 -> "La herradura del caballo de la Muerte";
            default -> null;
        };
        return nombre == null ? Optional.empty()
                : objetoRepository.findByNombreIgnoreCaseOrderByIdAsc(nombre).stream().findFirst();
    }

    private boolean esArmaDeClase(String claseId, int n) {
        return switch (claseId) {
            case "desertor-colmilludo" -> n == 2 || n == 4 || n == 6;
            case "realeza-desgracia"   -> n == 1;
            case "sacerdote-hereje"    -> n == 1;
            default -> false;
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Equipo base
    // ─────────────────────────────────────────────────────────────────────────

    private void guardarEquipoBase(Personaje personaje, CrearPersonajeMorkBorgRequest req) {
        // Arma
        if (req.armaIdx() != null) {
            objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc("ArmaIdx;" + req.armaIdx())
                    .stream().findFirst().ifPresent(o -> guardarItem(personaje, o, 1, true));
        }
        // Armadura
        if (req.armaduraNivel() != null && req.armaduraNivel() > 0) {
            objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc("ArmaduraNivel;" + req.armaduraNivel())
                    .stream().findFirst().ifPresent(o -> guardarItem(personaje, o, 1, true));
        }
        // Equipo básico (contenedor y dos objetos de tabla)
        if (req.contenedorResult() != null && req.contenedorResult() > 2) {
            String contenedorTag = "ContenedorSinClase;" + req.contenedorResult();
            if (req.contenedorResult() == 6) {
                // Burro → compañero animal, se guarda como habilidad
                habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc(contenedorTag)
                        .stream().findFirst().ifPresent(h -> personaje.getHabilidades().add(h));
            } else {
                objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc(contenedorTag)
                        .stream().findFirst().ifPresent(o -> guardarItem(personaje, o, 1, false));
            }
        }
        if (req.item1Result() != null) {
            final int modPres = req.modPresencia() != null ? req.modPresencia() : 0;
            final int cantidad1 = switch (req.item1Result()) {
                case 2 -> Math.max(1, modPres + 4); // Antorchas: mod Presencia + 4
                case 3 -> Math.max(1, modPres + 6); // Farol: mod Presencia + 6 horas de aceite
                case 7 -> Math.max(1, modPres + 4); // Botiquín: mod Presencia + 4 usos
                default -> 1;
            };
            objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc("ItemSinClase1;" + req.item1Result())
                    .stream().findFirst().ifPresent(o -> guardarItem(personaje, o, cantidad1, false));
        }
        if (req.item2Result() != null) {
            String item2Tag = "ItemSinClase2;" + req.item2Result();
            if (req.item2Result() == 3 || req.item2Result() == 4) {
                // Perro (3) y Monos (4) → compañeros animales, se guardan como habilidades
                habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc(item2Tag)
                        .stream().findFirst().ifPresent(h -> personaje.getHabilidades().add(h));
            } else {
                objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc(item2Tag)
                        .stream().findFirst().ifPresent(o -> guardarItem(personaje, o, 1, false));
            }
        }
    }

    private void guardarItem(Personaje personaje, Objeto objeto, int cantidad, boolean equipado) {
        mochilaRepository.save(Mochila.builder()
                .personaje(personaje).objeto(objeto).cantidad(cantidad).equipado(equipado).build());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Estadísticas
    // ─────────────────────────────────────────────────────────────────────────

    private void guardarEstadisticas(Personaje personaje, CrearPersonajeMorkBorgRequest req) {
        List<Estadistica> stats = new ArrayList<>();
        addStat(stats, personaje, "MB_Fuerza",          req.fuerza());
        addStat(stats, personaje, "MB_ModFuerza",        req.modFuerza());
        addStat(stats, personaje, "MB_Agilidad",         req.agilidad());
        addStat(stats, personaje, "MB_ModAgilidad",      req.modAgilidad());
        addStat(stats, personaje, "MB_Presencia",        req.presencia());
        addStat(stats, personaje, "MB_ModPresencia",     req.modPresencia());
        addStat(stats, personaje, "MB_Resistencia",      req.resistencia());
        addStat(stats, personaje, "MB_ModResistencia",   req.modResistencia());
        addStat(stats, personaje, "MB_VidaMaxima",       req.vida());
        addStat(stats, personaje, "MB_VidaActual",       req.vida());
        addStat(stats, personaje, "MB_Presagios",        req.presagios());
        addStat(stats, personaje, "MB_PresagiosActuales",req.presagios());
        addStat(stats, personaje, "MB_Carga",            req.carga());
        addStat(stats, personaje, "MB_Plata",            req.plata());
        addStat(stats, personaje, "MB_Comida",           req.comida());
        estadisticaRepository.saveAll(stats);
    }

    private void addStat(List<Estadistica> list, Personaje personaje, String nombre, Integer valor) {
        if (valor == null) return;
        list.add(Estadistica.builder().nombre(nombre).valor(valor).personaje(personaje).build());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private String pergaminoTag(Integer tipo, Integer idx) {
        return tipo == 1
                ? "PergaminoSagradoIdx;" + idx
                : "PergaminoImpuroIdx;" + idx;
    }

    private PersonajeResumenResponse toResumen(Personaje p) {
        return new PersonajeResumenResponse(
                p.getId(), p.getNombre(), p.getRetrato(),
                p.getSistemaDeJuego().getDisplayName(),
                p.getUsado(), "personaje", false, false, false
        );
    }
}
