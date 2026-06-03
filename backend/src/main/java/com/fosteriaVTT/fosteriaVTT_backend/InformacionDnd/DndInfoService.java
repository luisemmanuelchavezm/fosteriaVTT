package com.fosteriaVTT.fosteriaVTT_backend.InformacionDnd;

import com.fosteriaVTT.fosteriaVTT_backend.ContenidoSistemaJson.ContenidoSistemaJsonService;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.HabilidadRepository;
import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import com.fosteriaVTT.fosteriaVTT_backend.common.dnd.DndCharacterRules;
import com.fosteriaVTT.fosteriaVTT_backend.common.dnd.DndCharacterValidationUtils;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndCompetenciasResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndEleccionResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndLanzamientoConjurosResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndSubclaseResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.DndCompetencyCatalogResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndEleccionResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.SubrazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.TrasfondoDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.TrasfondoDndEleccionResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.TrasfondoDndResumenResponse;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

@Service
public class DndInfoService {

    private static final List<String> FIGHTER_COMBAT_STYLE_OPTIONS = List.of(
            "Combate con armas a dos manos",
            "Combate con dos armas",
            "Defensa",
            "Duelo",
            "Protección",
            "Tiro con arco"
    );
    private static final Pattern CLASS_SKILL_CHOICE_PATTERN = Pattern.compile("elige\\s+(\\d+|una|uno|dos|tres|cuatro|cinco|seis)\\s+entre\\s+(.+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern CLASS_ANY_SKILL_CHOICE_PATTERN = Pattern.compile("elige\\s+(\\d+|una|uno|dos|tres|cuatro|cinco|seis)\\s+habilidades?\\s+cualesquiera", Pattern.CASE_INSENSITIVE);
    private static final Pattern CLASS_TOOL_CHOICE_PATTERN = Pattern.compile("(\\d+|una|uno|dos|tres|cuatro|cinco|seis)\\s+(.+?)\\s+a\\s+elecci[oó]n", Pattern.CASE_INSENSITIVE);

    private final HabilidadRepository habilidadRepository;
    private final ContenidoSistemaJsonService contenidoSistemaJsonService;
    private final DndEquipamientoResolver equipamientoResolver;
    private final DndCatalogoResolver catalogoResolver;

    public DndInfoService(
            HabilidadRepository habilidadRepository,
            ContenidoSistemaJsonService contenidoSistemaJsonService,
            DndEquipamientoResolver equipamientoResolver,
            DndCatalogoResolver catalogoResolver
    ) {
        this.habilidadRepository = habilidadRepository;
        this.contenidoSistemaJsonService = contenidoSistemaJsonService;
        this.equipamientoResolver = equipamientoResolver;
        this.catalogoResolver = catalogoResolver;
    }

    // ─────────────────────────────────────────────
    // Clases
    // ─────────────────────────────────────────────

    public List<ClaseDndResumenResponse> obtenerClases() {
        return contenidoSistemaJsonService.obtenerClasesDnd();
    }

    public Optional<ClaseDndDetalleResponse> obtenerClasePorId(String id) {
        if (id == null || id.isBlank()) {
            return Optional.empty();
        }

        return contenidoSistemaJsonService.obtenerClaseDndPorId(id)
                .map(clase -> new ClaseDndDetalleResponse(
                        clase.id(),
                        clase.nombre(),
                        clase.insignia(),
                        clase.descripcion(),
                        clase.puntosGolpe(),
                        clase.competencias(),
                        clase.lanzamientoConjuros(),
                        resolverSubclasesClase(clase.id(), contenidoSistemaJsonService.obtenerSubclasesClaseDnd(clase.id())),
                        resolverEleccionesClase(clase.id(), clase.nombre(), clase.competencias(), clase.lanzamientoConjuros()),
                        equipamientoResolver.resolverEquipamiento(clase.equipamiento())
                ));
    }

    public List<ClaseDndSubclaseResponse> obtenerSubclasesClase(String id) {
        if (id == null || id.isBlank()) {
            return List.of();
        }
        return resolverSubclasesClase(id, contenidoSistemaJsonService.obtenerSubclasesClaseDnd(id));
    }

    public DndCompetencyCatalogResponse obtenerCatalogoCompetencias() {
        return new DndCompetencyCatalogResponse(
                catalogoResolver.resolverCatalogoHabilidades(),
                catalogoResolver.resolverCatalogoArmasArmaduras(),
                catalogoResolver.resolverCatalogoHerramientas()
        );
    }

    // ─────────────────────────────────────────────
    // Trasfondos
    // ─────────────────────────────────────────────

    public List<TrasfondoDndResumenResponse> obtenerTrasfondos() {
        return contenidoSistemaJsonService.obtenerTrasfondosDnd();
    }

    public Optional<TrasfondoDndDetalleResponse> obtenerTrasfondoPorId(String id) {
        if (id == null || id.isBlank()) {
            return Optional.empty();
        }

        return contenidoSistemaJsonService.obtenerTrasfondoDndPorId(id)
                .map(trasfondo -> new TrasfondoDndDetalleResponse(
                        trasfondo.id(),
                        trasfondo.nombre(),
                        trasfondo.descripcion(),
                        listaSegura(trasfondo.competenciasHabilidades()),
                        listaSegura(trasfondo.competenciasHerramientas()),
                        listaSegura(trasfondo.resumenIdiomas()),
                        trasfondo.nombreRasgo(),
                        trasfondo.descripcionRasgo(),
                        enriquecerEleccionesTrasfondo(trasfondo.elecciones()),
                        equipamientoResolver.resolverEquipamiento(trasfondo.equipamiento())
                ));
    }

    // ─────────────────────────────────────────────
    // Razas
    // ─────────────────────────────────────────────

    public List<RazaDndResumenResponse> obtenerRazas() {
        return contenidoSistemaJsonService.obtenerRazasDnd();
    }

    public Optional<RazaDndDetalleResponse> obtenerRazaPorId(String id) {
        if (id == null || id.isBlank()) {
            return Optional.empty();
        }

        return contenidoSistemaJsonService.obtenerRazaDndPorId(id)
                .map(raza -> new RazaDndDetalleResponse(
                        raza.id(),
                        raza.nombre(),
                        raza.descripcion(),
                        listaSegura(raza.aumentoCaracteristicas()),
                        raza.edad(),
                        raza.tamano(),
                        raza.velocidad(),
                        listaSegura(raza.idiomas()),
                        listaSegura(raza.competencias()),
                        listaSegura(raza.rasgos()),
                        enriquecerEleccionesRaza(raza.elecciones()),
                        contenidoSistemaJsonService.obtenerSubrazasRazaDnd(raza.id()).stream()
                                .map(subraza -> new SubrazaDndDetalleResponse(
                                        subraza.id(),
                                        subraza.nombre(),
                                        subraza.descripcion(),
                                        listaSegura(subraza.aumentoCaracteristicas()),
                                        listaSegura(subraza.competencias()),
                                        listaSegura(subraza.rasgos()),
                                        enriquecerEleccionesRaza(subraza.elecciones())
                                ))
                                .toList()
                ));
    }

    public List<SubrazaDndDetalleResponse> obtenerSubrazasRaza(String id) {
        if (id == null || id.isBlank()) {
            return List.of();
        }

        return contenidoSistemaJsonService.obtenerSubrazasRazaDnd(id).stream()
                .map(subraza -> new SubrazaDndDetalleResponse(
                        subraza.id(),
                        subraza.nombre(),
                        subraza.descripcion(),
                        listaSegura(subraza.aumentoCaracteristicas()),
                        listaSegura(subraza.competencias()),
                        listaSegura(subraza.rasgos()),
                        enriquecerEleccionesRaza(subraza.elecciones())
                ))
                .toList();
    }

    // ─────────────────────────────────────────────
    // Helpers privados — enriquecimiento de elecciones
    // ─────────────────────────────────────────────

    private List<ClaseDndSubclaseResponse> resolverSubclasesClase(String claseId, List<ClaseDndSubclaseResponse> catalogSubclasses) {
        return listaSegura(catalogSubclasses);
    }

    private List<ClaseDndEleccionResponse> resolverEleccionesClase(
            String claseId,
            String nombreClase,
            ClaseDndCompetenciasResponse competencias,
            ClaseDndLanzamientoConjurosResponse lanzamientoConjuros
    ) {
        List<ClaseDndEleccionResponse> result = new java.util.ArrayList<>();
        List<String> skillDescriptions = competencias == null ? List.of() : listaSegura(competencias.habilidades());
        List<String> toolDescriptions = competencias == null ? List.of() : listaSegura(competencias.herramientas());

        for (int index = 0; index < skillDescriptions.size(); index++) {
            ClaseDndEleccionResponse choice = extraerEleccionHabilidadClase(skillDescriptions.get(index), index);
            if (choice != null) {
                result.add(choice);
            }
        }

        for (int index = 0; index < toolDescriptions.size(); index++) {
            ClaseDndEleccionResponse choice = extraerEleccionHerramientaClase(toolDescriptions.get(index), index);
            if (choice != null) {
                result.add(choice);
            }
        }

        if (TagUtils.normalizeText(claseId).equals(TagUtils.normalizeText("guerrero"))) {
            result.add(new ClaseDndEleccionResponse(
                    "class-combat-style-0",
                    "Estilo de combate",
                    "Elige un estilo de combate para tu guerrero de nivel 1.",
                    "estilosCombate",
                    1,
                    FIGHTER_COMBAT_STYLE_OPTIONS
            ));
        }

        result.addAll(resolverEleccionesHechizosClase(claseId, nombreClase, lanzamientoConjuros));
        return result;
    }

    private List<ClaseDndEleccionResponse> resolverEleccionesHechizosClase(
            String claseId,
            String nombreClase,
            ClaseDndLanzamientoConjurosResponse lanzamientoConjuros
    ) {
        if (lanzamientoConjuros == null || lanzamientoConjuros.niveles() == null) {
            return List.of();
        }

        var firstLevel = lanzamientoConjuros.niveles().stream()
                .filter(entry -> entry.nivel() == 1)
                .findFirst()
                .orElse(null);
        if (firstLevel == null) {
            return List.of();
        }

        List<Habilidad> habilidades = habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc("ClaseInicial;" + claseId);
        if (habilidades.isEmpty()) {
            return List.of();
        }

        List<String> cantripOptions = habilidades.stream()
                .filter(this::esTruco)
                .map(Habilidad::getNombre)
                .toList();
        List<String> spellOptions = habilidades.stream()
                .filter(this::esConjuroNivelUno)
                .map(Habilidad::getNombre)
                .toList();

        List<ClaseDndEleccionResponse> result = new java.util.ArrayList<>();
        if (firstLevel.trucosConocidos() != null && firstLevel.trucosConocidos() > 0 && !cantripOptions.isEmpty()) {
            result.add(new ClaseDndEleccionResponse(
                    "class-cantrip-0",
                    "Trucos iniciales",
                    "Elige " + firstLevel.trucosConocidos() + " truco" + (firstLevel.trucosConocidos() == 1 ? "" : "s") + " de " + nombreClase,
                    "trucos",
                    firstLevel.trucosConocidos(),
                    cantripOptions
            ));
        }

        int initialSpellCount = firstLevel.conjurosConocidos() != null
                ? firstLevel.conjurosConocidos()
                : firstLevel.conjurosEnLibro() != null ? firstLevel.conjurosEnLibro() : 0;
        if (initialSpellCount > 0 && !spellOptions.isEmpty()) {
            result.add(new ClaseDndEleccionResponse(
                    "class-spell-0",
                    "Conjuros iniciales",
                    "Elige " + initialSpellCount + " conjuro" + (initialSpellCount == 1 ? "" : "s") + " de nivel 1 de " + nombreClase,
                    "conjuros",
                    initialSpellCount,
                    spellOptions
            ));
        }

        return result;
    }

    private ClaseDndEleccionResponse extraerEleccionHabilidadClase(String description, int index) {
        String value = description == null ? "" : description.trim();
        if (value.isBlank()) {
            return null;
        }

        Matcher anySkillMatcher = CLASS_ANY_SKILL_CHOICE_PATTERN.matcher(value);
        if (anySkillMatcher.matches()) {
            return new ClaseDndEleccionResponse(
                    "class-skill-" + index,
                    "Competencias de clase",
                    value,
                    "habilidades",
                    parseChoiceAmount(anySkillMatcher.group(1)),
                    catalogoResolver.resolverCatalogoHabilidades()
            );
        }

        Matcher matcher = CLASS_SKILL_CHOICE_PATTERN.matcher(value);
        if (!matcher.matches()) {
            return null;
        }

        return new ClaseDndEleccionResponse(
                "class-skill-" + index,
                "Competencias de clase",
                value,
                "habilidades",
                parseChoiceAmount(matcher.group(1)),
                extractSkillChoiceOptions(matcher.group(2))
        );
    }

    private ClaseDndEleccionResponse extraerEleccionHerramientaClase(String description, int index) {
        String value = description == null ? "" : description.trim();
        if (value.isBlank()) {
            return null;
        }

        Matcher matcher = CLASS_TOOL_CHOICE_PATTERN.matcher(value);
        if (!matcher.matches()) {
            return null;
        }

        if (!TagUtils.normalizeText(matcher.group(2)).contains("instrumentos")) {
            return null;
        }

        return new ClaseDndEleccionResponse(
                "class-tool-" + index,
                "Herramientas de clase",
                value,
                "instrumentos",
                parseChoiceAmount(matcher.group(1)),
                catalogoResolver.resolverOpcionesInstrumentos()
        );
    }

    private List<TrasfondoDndEleccionResponse> enriquecerEleccionesTrasfondo(List<TrasfondoDndEleccionResponse> elecciones) {
        return listaSegura(elecciones).stream()
                .map(eleccion -> {
                    String catalogo = DndCharacterRules.normalizeChoiceCatalogId(eleccion.catalogo());
                    return new TrasfondoDndEleccionResponse(
                            eleccion.id(),
                            eleccion.etiqueta(),
                            eleccion.resumen(),
                            catalogo,
                            eleccion.cantidad(),
                            catalogoResolver.resolverCatalogoTexto(catalogo)
                    );
                })
                .toList();
    }

    private List<RazaDndEleccionResponse> enriquecerEleccionesRaza(List<RazaDndEleccionResponse> elecciones) {
        return listaSegura(elecciones).stream()
                .map(eleccion -> {
                    String catalogo = DndCharacterRules.normalizeChoiceCatalogId(eleccion.catalogo());
                    return new RazaDndEleccionResponse(
                            eleccion.id(),
                            eleccion.etiqueta(),
                            eleccion.resumen(),
                            catalogo,
                            eleccion.cantidad(),
                            eleccion.adjuntarATitulo(),
                            listaSegura(eleccion.opciones()).isEmpty()
                                    ? catalogoResolver.resolverCatalogoTexto(catalogo)
                                    : listaSegura(eleccion.opciones()),
                            listaSegura(eleccion.excluirOpciones())
                    );
                })
                .toList();
    }

    private int parseChoiceAmount(String value) {
        return DndCharacterValidationUtils.parseChoiceAmount(value);
    }

    private List<String> extractSkillChoiceOptions(String value) {
        String list = value == null ? "" : value.trim();
        if (list.endsWith(".")) {
            list = list.substring(0, list.length() - 1);
        }
        return List.of(list.replaceAll("(?i)\\s+y\\s+", ", ").split(","))
                .stream()
                .map(TagUtils::cleanValue)
                .map(String::trim)
                .filter(item -> !item.isBlank())
                .map(item -> DndCharacterRules.normalizeCanonicalSkill(item).orElse(item))
                .toList();
    }

    private boolean esTruco(Habilidad habilidad) {
        String tags = habilidad.getTags() == null ? "" : habilidad.getTags();
        return tags.toLowerCase().contains("truco");
    }

    private boolean esConjuroNivelUno(Habilidad habilidad) {
        String tags = habilidad.getTags() == null ? "" : habilidad.getTags();
        return tags.toLowerCase().contains("hechizo;1");
    }

    private <T> List<T> listaSegura(List<T> items) {
        if (items == null) {
            return List.of();
        }
        return Collections.unmodifiableList(items);
    }
}
