package com.fosteriaVTT.fosteriaVTT_backend.InformacionDnd;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.Objeto;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.ObjetoRepository;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.EquipamientoDndGrupoResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.EquipamientoDndOpcionResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.EquipamientoDndResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ObjetoInicialResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndEleccionResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndRasgoResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.SubrazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.TrasfondoDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.TrasfondoDndEleccionResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.TrasfondoDndResumenResponse;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

@Service
public class DndInfoService {

    private static final Map<String, List<String>> CATALOGOS = Map.of(
            "languages", List.of(
                    "Abisal",
                    "Celestial",
                    "Comun",
                    "Draconico",
                    "Enano",
                    "Elfico",
                    "Gigante",
                    "Gnomo",
                    "Goblin",
                    "Halfling (Mediano)",
                    "Infernal",
                    "Orco",
                    "Primordial",
                    "Silvano",
                    "Infracomun"
            ),
            "artisanTools", List.of(
                    "Herramientas de herrero",
                    "Suministros de cervecero",
                    "Herramientas de albanil",
                    "Herramientas de alfarero",
                    "Herramientas de carpintero",
                    "Herramientas de cartografo",
                    "Herramientas de cocinero",
                    "Herramientas de cristalero",
                    "Herramientas de curtidor",
                    "Herramientas de encuadernador",
                    "Herramientas de joyero",
                    "Herramientas de soplador de vidrio",
                    "Herramientas de tallador de madera",
                    "Herramientas de zapatero",
                    "Suministros de alquimista",
                    "Suministros de caligrafo",
                    "Suministros de pintor",
                    "Utensilios de tejedor"
            ),
            "games", List.of(
                    "Baraja de cartas",
                    "Set de dados",
                    "Ajedrez de Dragon (Dragonchess)",
                    "Tres Dragones (Three-Dragon Ante)"
            ),
            "instruments", List.of(
                    "Gaita",
                    "Tambor",
                    "Dulceleme",
                    "Flauta",
                    "Laud",
                    "Lira",
                    "Cuerno",
                    "Panflauta",
                    "Chirimia",
                    "Viola"
            ),
            "skills", List.of(
                    "Acrobacias",
                    "Arcanos",
                    "Atletismo",
                    "Engano",
                    "Historia",
                    "Indagacion",
                    "Interpretacion",
                    "Intimidacion",
                    "Juego de Manos",
                    "Medicina",
                    "Naturaleza",
                    "Percepcion",
                    "Perspicacia",
                    "Persuasion",
                    "Religion",
                    "Sigilo",
                    "Supervivencia",
                    "Trato con Animales"
            ),
            "wizardCantrips", List.of(
                    "Amistad",
                    "Aprestidigitacion",
                    "Descarga de fuego",
                    "Ilusion menor",
                    "Impacto verdadero",
                    "Luz",
                    "Mano de mago",
                    "Mensaje",
                    "Prestidigitacion",
                    "Rayo de escarcha",
                    "Reparar",
                    "Rociada venenosa",
                    "Toque electrico",
                    "Toque helado",
                    "Truco de la cuerda"
            ),
            "draconicAncestors", List.of(
                    "Blanco | Frio | Cono de 15 pies (Salv. Con)",
                    "Plateado | Frio | Cono de 15 pies (Salv. Con)",
                    "Azul | Relampago | Linea de 5 x 30 pies (Salv. Des)",
                    "Bronce | Relampago | Linea de 5 x 30 pies (Salv. Des)",
                    "Negro | Acido | Linea de 5 x 30 pies (Salv. Des)",
                    "Cobre | Acido | Linea de 5 x 30 pies (Salv. Des)",
                    "Laton | Fuego | Linea de 5 x 30 pies (Salv. Des)",
                    "Oro | Fuego | Cono de 15 pies (Salv. Des)",
                    "Rojo | Fuego | Cono de 15 pies (Salv. Des)",
                    "Verde | Veneno | Cono de 15 pies (Salv. Con)"
            ),
            "abilityScores", List.of("Fuerza", "Destreza", "Constitucion", "Inteligencia", "Sabiduria", "Carisma")
    );

    private final ObjetoRepository objetoRepository;
    private final DndInfoCatalogo infoCatalogo;
    private final DndRazasCatalogo razasCatalogo;

    public DndInfoService(ObjectMapper objectMapper, ResourceLoader resourceLoader, ObjetoRepository objetoRepository) {
        this.objetoRepository = objetoRepository;
        this.infoCatalogo = cargarCatalogo(objectMapper, resourceLoader, "classpath:dnd-info.json", DndInfoCatalogo.class);
        this.razasCatalogo = cargarCatalogo(objectMapper, resourceLoader, "classpath:dnd-races.json", DndRazasCatalogo.class);
    }

    public List<ClaseDndResumenResponse> obtenerClases() {
        return listaSegura(infoCatalogo.clases()).stream()
                .map(clase -> new ClaseDndResumenResponse(clase.id(), clase.nombre(), clase.insignia()))
                .toList();
    }

    public Optional<ClaseDndDetalleResponse> obtenerClasePorId(String id) {
        if (id == null || id.isBlank()) {
            return Optional.empty();
        }

        return listaSegura(infoCatalogo.clases()).stream()
                .filter(clase -> clase.id().equalsIgnoreCase(id))
                .map(clase -> new ClaseDndDetalleResponse(
                        clase.id(),
                        clase.nombre(),
                        clase.insignia(),
                        clase.descripcion(),
                        clase.puntosGolpe(),
                        clase.competencias(),
                        resolverEquipamiento(clase.equipamiento())
                ))
                .findFirst();
    }

    public List<TrasfondoDndResumenResponse> obtenerTrasfondos() {
        return listaSegura(infoCatalogo.trasfondos()).stream()
                .map(trasfondo -> new TrasfondoDndResumenResponse(trasfondo.id(), trasfondo.nombre()))
                .toList();
    }

    public Optional<TrasfondoDndDetalleResponse> obtenerTrasfondoPorId(String id) {
        if (id == null || id.isBlank()) {
            return Optional.empty();
        }

        return listaSegura(infoCatalogo.trasfondos()).stream()
                .filter(trasfondo -> trasfondo.id().equalsIgnoreCase(id))
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
                ))
                .findFirst();
    }

    public List<RazaDndResumenResponse> obtenerRazas() {
        return listaSegura(razasCatalogo.razas()).stream()
                .map(raza -> new RazaDndResumenResponse(raza.id(), raza.nombre()))
                .toList();
    }

    public Optional<RazaDndDetalleResponse> obtenerRazaPorId(String id) {
        if (id == null || id.isBlank()) {
            return Optional.empty();
        }

        return listaSegura(razasCatalogo.razas()).stream()
                .filter(raza -> raza.id().equalsIgnoreCase(id))
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
                        listaSegura(raza.subrazas()).stream()
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
                ))
                .findFirst();
    }

    private List<TrasfondoDndEleccionResponse> enriquecerEleccionesTrasfondo(List<TrasfondoDndEleccionResponse> elecciones) {
        return listaSegura(elecciones).stream()
                .map(eleccion -> new TrasfondoDndEleccionResponse(
                        eleccion.id(),
                        eleccion.etiqueta(),
                        eleccion.resumen(),
                        eleccion.catalogo(),
                        eleccion.cantidad(),
                        resolverCatalogoTexto(eleccion.catalogo())
                ))
                .toList();
    }

    private List<RazaDndEleccionResponse> enriquecerEleccionesRaza(List<RazaDndEleccionResponse> elecciones) {
        return listaSegura(elecciones).stream()
                .map(eleccion -> new RazaDndEleccionResponse(
                        eleccion.id(),
                        eleccion.etiqueta(),
                        eleccion.resumen(),
                        eleccion.catalogo(),
                        eleccion.cantidad(),
                        eleccion.adjuntarATitulo(),
                        listaSegura(eleccion.opciones()).isEmpty()
                                ? resolverCatalogoTexto(eleccion.catalogo())
                                : listaSegura(eleccion.opciones()),
                        listaSegura(eleccion.excluirOpciones())
                ))
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

        return CATALOGOS.getOrDefault(catalogo, List.of());
    }

    private <T> T cargarCatalogo(ObjectMapper objectMapper, ResourceLoader resourceLoader, String path, Class<T> type) {
        try (InputStream inputStream = resourceLoader.getResource(path).getInputStream()) {
            return objectMapper.readValue(inputStream, type);
        } catch (IOException exception) {
            throw new IllegalStateException("No se pudo cargar el catalogo DnD: " + path, exception);
        }
    }

    private <T> List<T> listaSegura(List<T> items) {
        if (items == null) {
            return List.of();
        }

        return Collections.unmodifiableList(items);
    }

    private record DndInfoCatalogo(
            List<ClaseDndDetalleResponse> clases,
            List<TrasfondoDndDetalleResponse> trasfondos
    ) {
    }

    private record DndRazasCatalogo(
            List<RazaDndDetalleResponse> razas
    ) {
    }
}
