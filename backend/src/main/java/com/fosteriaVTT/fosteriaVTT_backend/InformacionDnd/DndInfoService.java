package com.fosteriaVTT.fosteriaVTT_backend.InformacionDnd;

import com.fosteriaVTT.fosteriaVTT_backend.ContenidoSistemaJson.ContenidoSistemaJsonService;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.HabilidadRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.Objeto;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.ObjetoRepository;
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
import com.fosteriaVTT.fosteriaVTT_backend.dto.EquipamientoDndGrupoResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.EquipamientoDndOpcionResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.EquipamientoDndResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ObjetoInicialResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndEleccionResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.SubrazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.TrasfondoDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.TrasfondoDndEleccionResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.TrasfondoDndResumenResponse;
import java.util.Arrays;
import java.util.Comparator;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

@Service
public class DndInfoService {

        private static final String DND_ARTISAN_TOOL_CATALOG_TAG = "CatalogoHerramientasArtesanoDnd";
        private static final String DND_GAME_CATALOG_TAG = "CatalogoJuegosDnd";
        private static final String DND_INSTRUMENT_CATALOG_TAG = "CatalogoInstrumentosDnd";
        private static final String DND_SKILL_CATALOG_TAG = "CatalogoHabilidadDnd";
        private static final String DND_WEAPON_ARMOR_COMPETENCY_CATALOG_TAG = "CatalogoCompetenciasArmasArmadurasDnd";
        private static final String DND_TOOL_COMPETENCY_CATALOG_TAG = "CatalogoCompetenciasHerramientasDnd";
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

    private static final Map<String, List<String>> CATALOGOS = Map.of(
            "puntuacionesCaracteristica", List.of("Fuerza", "Destreza", "Constitucion", "Inteligencia", "Sabiduria", "Carisma")
    );

    private final ObjetoRepository objetoRepository;
        private final HabilidadRepository habilidadRepository;
    private final ContenidoSistemaJsonService contenidoSistemaJsonService;

                public DndInfoService(
                                                ObjetoRepository objetoRepository,
                                                HabilidadRepository habilidadRepository,
                                                ContenidoSistemaJsonService contenidoSistemaJsonService
                ) {
        this.objetoRepository = objetoRepository;
                this.habilidadRepository = habilidadRepository;
                this.contenidoSistemaJsonService = contenidoSistemaJsonService;
    }

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
                        resolverEquipamiento(clase.equipamiento())
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
                                resolverCatalogoHabilidades(),
                                resolverCatalogoArmasArmaduras(),
                                resolverCatalogoHerramientas()
                );
        }

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
                                        resolverCatalogoHabilidades()
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
                                resolverOpcionesInstrumentos()
                );
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
                        resolverEquipamiento(trasfondo.equipamiento())
                ));
    }

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
                                resolverCatalogoTexto(catalogo)
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
                                        ? resolverCatalogoTexto(catalogo)
                                        : listaSegura(eleccion.opciones()),
                                listaSegura(eleccion.excluirOpciones())
                        );
                })
                .toList();
    }

    private EquipamientoDndResponse resolverEquipamiento(EquipamientoDndResponse equipamiento) {
        if (equipamiento == null) {
            return new EquipamientoDndResponse(List.of(), List.of());
        }

        List<EquipamientoDndOpcionResponse> fijos = listaSegura(equipamiento.fijos()).stream()
                .map(this::resolverOpcionEquipamiento)
                .toList();

        List<EquipamientoDndGrupoResponse> grupos = listaSegura(equipamiento.gruposEleccion()).stream()
                .map(grupo -> new EquipamientoDndGrupoResponse(
                        grupo.id(),
                        grupo.etiqueta(),
                        listaSegura(grupo.opciones()).stream()
                                .map(this::resolverOpcionEquipamiento)
                                .toList()
                ))
                .toList();

        return new EquipamientoDndResponse(fijos, grupos);
    }

    private EquipamientoDndOpcionResponse resolverOpcionEquipamiento(EquipamientoDndOpcionResponse opcion) {
        String nombreObjeto = opcion.objeto() != null ? opcion.objeto().nombre() : null;
        ObjetoInicialResponse objeto = nombreObjeto == null ? null : resolverObjetoPorNombre(nombreObjeto, opcion.cantidad());
        List<ObjetoInicialResponse> catalogo = opcion.catalogo() == null ? List.of() : resolverCatalogoObjetos(opcion.catalogo());

        return new EquipamientoDndOpcionResponse(
                opcion.id(),
                opcion.etiqueta(),
                opcion.cantidad(),
                objeto,
                opcion.catalogo(),
                catalogo
        );
    }

    private ObjetoInicialResponse resolverObjetoPorNombre(String nombre, Integer cantidad) {
        return objetoRepository.findByNombreIgnoreCaseOrderByIdAsc(nombre).stream()
                .findFirst()
                .map(objeto -> mapearObjeto(objeto, cantidad == null ? 1 : cantidad))
                .orElse(new ObjetoInicialResponse(
                        null,
                        nombre,
                        null,
                        null,
                        null,
                        "",
                        cantidad == null ? 1 : cantidad
                ));
    }

    private List<ObjetoInicialResponse> resolverCatalogoObjetos(String catalogo) {
        return objetoRepository.findAll().stream()
                .filter(objeto -> contieneEtiquetaExacta(objeto.getIndice(), catalogo))
                .map(objeto -> mapearObjeto(objeto, 1))
                .toList();
    }

    private boolean contieneEtiquetaExacta(String indice, String etiqueta) {
        if (indice == null || indice.isBlank()) {
            return false;
        }

        return Arrays.stream(indice.split(","))
                .map(String::trim)
                .anyMatch(parte -> parte.equalsIgnoreCase(etiqueta));
    }

    private ObjetoInicialResponse mapearObjeto(Objeto objeto, int cantidad) {
        return new ObjetoInicialResponse(
                objeto.getId(),
                objeto.getNombre(),
                objeto.getDescripcion(),
                objeto.getFormula(),
                objeto.getTipoObjeto(),
                objeto.getIndice(),
                cantidad
        );
    }

    private List<String> resolverCatalogoTexto(String catalogo) {
        if (catalogo == null || catalogo.isBlank()) {
            return List.of();
        }

        String catalogoNormalizado = DndCharacterRules.normalizeChoiceCatalogId(catalogo);

        if ("instrumentos".equalsIgnoreCase(catalogoNormalizado)) {
                return resolverOpcionesObjetos(DND_INSTRUMENT_CATALOG_TAG);
        }
        if ("juegos".equalsIgnoreCase(catalogoNormalizado)) {
                return resolverOpcionesObjetos(DND_GAME_CATALOG_TAG);
        }
        if ("herramientasArtesano".equalsIgnoreCase(catalogoNormalizado)) {
                return resolverOpcionesObjetos(DND_ARTISAN_TOOL_CATALOG_TAG);
        }
        if ("habilidades".equalsIgnoreCase(catalogoNormalizado)) {
                return resolverCatalogoHabilidades();
        }
        if ("idiomas".equalsIgnoreCase(catalogoNormalizado) || "ancestrosDraconicos".equalsIgnoreCase(catalogoNormalizado)) {
                return resolverCatalogoRazas(catalogoNormalizado);
        }
        if (catalogoNormalizado.regionMatches(true, 0, "classCantrips:", 0, "classCantrips:".length())) {
                return resolverTrucosClase(catalogoNormalizado.substring("classCantrips:".length()));
        }

        return CATALOGOS.getOrDefault(catalogoNormalizado, List.of());
    }

        private List<String> resolverCatalogoHabilidades() {
                return ordenarValores(new LinkedHashSet<>(
                                habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc(DND_SKILL_CATALOG_TAG).stream()
                                                .map(Habilidad::getNombre)
                                                .toList()
                ));
        }

        private List<String> resolverCatalogoRazas(String catalogo) {
                return ordenarValores(new LinkedHashSet<>(contenidoSistemaJsonService.obtenerCatalogoRazaDnd(catalogo)));
        }

        private List<String> resolverCatalogoArmasArmaduras() {
                return resolverCompetenciasObjetos(DND_WEAPON_ARMOR_COMPETENCY_CATALOG_TAG);
        }

        private List<String> resolverCatalogoHerramientas() {
                return resolverCompetenciasObjetos(DND_TOOL_COMPETENCY_CATALOG_TAG);
        }

        private List<String> resolverCompetenciasObjetos(String catalogoTag) {
                return ordenarValores(new LinkedHashSet<>(
                                objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc(catalogoTag).stream()
                                                .filter(objeto -> contieneEtiquetaExacta(objeto.getIndice(), catalogoTag))
                                                .map(Objeto::getNombre)
                                                .filter(nombre -> nombre != null && !nombre.isBlank())
                                                .toList()
                ));
        }

        private List<String> ordenarValores(Set<String> values) {
                return values.stream()
                                .map(TagUtils::cleanValue)
                                .filter(value -> !value.isBlank())
                                .sorted(Comparator.comparing(TagUtils::normalizeText))
                                .toList();
        }

        private List<String> resolverOpcionesInstrumentos() {
                return resolverOpcionesObjetos(DND_INSTRUMENT_CATALOG_TAG);
        }

        private List<String> resolverOpcionesObjetos(String catalogoTag) {
                return objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc(catalogoTag).stream()
                                .filter(objeto -> contieneEtiquetaExacta(objeto.getIndice(), catalogoTag))
                                .map(Objeto::getNombre)
                                .toList();
        }

        private List<String> resolverTrucosClase(String claseId) {
                String claseNormalizada = TagUtils.cleanValue(claseId);
                if (claseNormalizada.isBlank()) {
                        return List.of();
                }

                return habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc("ClaseInicial;" + claseNormalizada).stream()
                                .filter(this::esTruco)
                                .map(Habilidad::getNombre)
                                .collect(java.util.stream.Collectors.collectingAndThen(
                                                java.util.stream.Collectors.toCollection(LinkedHashSet::new),
                                                this::ordenarValores
                                ));
        }

    private <T> List<T> listaSegura(List<T> items) {
        if (items == null) {
            return List.of();
        }

        return Collections.unmodifiableList(items);
    }
}
