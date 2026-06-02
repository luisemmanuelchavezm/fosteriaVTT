package com.fosteriaVTT.fosteriaVTT_backend.InformacionDnd;

import com.fosteriaVTT.fosteriaVTT_backend.ContenidoSistemaJson.ContenidoSistemaJsonService;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.HabilidadRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.ObjetoRepository;
import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import com.fosteriaVTT.fosteriaVTT_backend.common.dnd.DndCharacterRules;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
class DndCatalogoResolver {

    private static final String DND_ARTISAN_TOOL_CATALOG_TAG = "CatalogoHerramientasArtesanoDnd";
    private static final String DND_GAME_CATALOG_TAG = "CatalogoJuegosDnd";
    private static final String DND_INSTRUMENT_CATALOG_TAG = "CatalogoInstrumentosDnd";
    private static final String DND_SKILL_CATALOG_TAG = "CatalogoHabilidadDnd";
    private static final String DND_WEAPON_ARMOR_COMPETENCY_CATALOG_TAG = "CatalogoCompetenciasArmasArmadurasDnd";
    private static final String DND_TOOL_COMPETENCY_CATALOG_TAG = "CatalogoCompetenciasHerramientasDnd";

    private static final Map<String, List<String>> CATALOGOS = Map.of(
            "puntuacionesCaracteristica", List.of("Fuerza", "Destreza", "Constitucion", "Inteligencia", "Sabiduria", "Carisma")
    );

    private final ObjetoRepository objetoRepository;
    private final HabilidadRepository habilidadRepository;
    private final ContenidoSistemaJsonService contenidoSistemaJsonService;

    DndCatalogoResolver(
            ObjetoRepository objetoRepository,
            HabilidadRepository habilidadRepository,
            ContenidoSistemaJsonService contenidoSistemaJsonService
    ) {
        this.objetoRepository = objetoRepository;
        this.habilidadRepository = habilidadRepository;
        this.contenidoSistemaJsonService = contenidoSistemaJsonService;
    }

    List<String> resolverCatalogoTexto(String catalogo) {
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

    List<String> resolverCatalogoHabilidades() {
        return ordenarValores(new LinkedHashSet<>(
                habilidadRepository.findByTagsContainingIgnoreCaseOrderByNombreAsc(DND_SKILL_CATALOG_TAG).stream()
                        .map(Habilidad::getNombre)
                        .toList()
        ));
    }

    List<String> resolverOpcionesInstrumentos() {
        return resolverOpcionesObjetos(DND_INSTRUMENT_CATALOG_TAG);
    }

    List<String> resolverCatalogoArmasArmaduras() {
        return resolverCompetenciasObjetos(DND_WEAPON_ARMOR_COMPETENCY_CATALOG_TAG);
    }

    List<String> resolverCatalogoHerramientas() {
        return resolverCompetenciasObjetos(DND_TOOL_COMPETENCY_CATALOG_TAG);
    }

    private List<String> resolverCatalogoRazas(String catalogo) {
        return ordenarValores(new LinkedHashSet<>(contenidoSistemaJsonService.obtenerCatalogoRazaDnd(catalogo)));
    }

    private List<String> resolverCompetenciasObjetos(String catalogoTag) {
        return ordenarValores(new LinkedHashSet<>(
                objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc(catalogoTag).stream()
                        .filter(objeto -> contieneEtiquetaExacta(objeto.getIndice(), catalogoTag))
                        .map(com.fosteriaVTT.fosteriaVTT_backend.Objeto.Objeto::getNombre)
                        .filter(nombre -> nombre != null && !nombre.isBlank())
                        .toList()
        ));
    }

    private List<String> resolverOpcionesObjetos(String catalogoTag) {
        return objetoRepository.findByIndiceContainingIgnoreCaseOrderByIdAsc(catalogoTag).stream()
                .filter(objeto -> contieneEtiquetaExacta(objeto.getIndice(), catalogoTag))
                .map(com.fosteriaVTT.fosteriaVTT_backend.Objeto.Objeto::getNombre)
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

    private List<String> ordenarValores(Set<String> values) {
        return values.stream()
                .map(TagUtils::cleanValue)
                .filter(value -> !value.isBlank())
                .sorted(Comparator.comparing(TagUtils::normalizeText))
                .toList();
    }

    private boolean esTruco(Habilidad habilidad) {
        String tags = habilidad.getTags() == null ? "" : habilidad.getTags();
        return tags.toLowerCase().contains("truco");
    }

    private boolean contieneEtiquetaExacta(String indice, String etiqueta) {
        if (indice == null || indice.isBlank()) {
            return false;
        }
        return Arrays.stream(indice.split(","))
                .map(String::trim)
                .anyMatch(parte -> parte.equalsIgnoreCase(etiqueta));
    }
}
