package com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils;

import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.HabilidadRepository;
import com.fosteriaVTT.fosteriaVTT_backend.InformacionDnd.DndSubclassService;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.PersonajeRepository;
import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import com.fosteriaVTT.fosteriaVTT_backend.common.dnd.DndCharacterRules;
import com.fosteriaVTT.fosteriaVTT_backend.common.dnd.DndPatterns;
import com.fosteriaVTT.fosteriaVTT_backend.common.dnd.DndSpellParsingRules;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CatalogoDndEleccion;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndSubclaseResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndSubclaseRasgoResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndRasgoResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.SubrazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.TrasfondoDndDetalleResponse;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import org.springframework.stereotype.Service;

@Service
public class DndAbilityUtils {
	private static final String SKILL_EXPERTISE_CHOICE_PREFIX = "class-expertise-skill-";
	private static final String TOOL_EXPERTISE_CHOICE_PREFIX = "class-expertise-tool-";

	private final HabilidadRepository habilidadRepository;
	private final DndSubclassService dndSubclassService;


	public DndAbilityUtils(
			HabilidadRepository habilidadRepository,
			PersonajeRepository personajeRepository,
			DndSubclassService dndSubclassService
	) {
		this.habilidadRepository = habilidadRepository;
		this.dndSubclassService = dndSubclassService;
	}

	public List<Habilidad> resolverHabilidadesIniciales(
			ClaseDndDetalleResponse clase,
			ClaseDndSubclaseResponse subclaseClase,
			RazaDndDetalleResponse raza,
			SubrazaDndDetalleResponse subraza,
			TrasfondoDndDetalleResponse trasfondo,
			Map<String, List<String>> eleccionesClase,
			Map<String, List<String>> eleccionesRaza,
			Map<String, List<String>> eleccionesTrasfondo
	) {
		Map<String, Habilidad> habilidades = new LinkedHashMap<>();
		List<Habilidad> catalogoHabilidades = habilidadRepository.findAll();
		List<ClaseDndSubclaseResponse> subclasesClase = clase.subclases() == null ? List.of() : clase.subclases();

		catalogoHabilidades.stream()
				.filter(habilidad -> DndCharacterCheckers.esRasgoGenericoDeClaseNivelUno(habilidad, clase.nombre(), subclasesClase))
				.filter(habilidad -> !debeOmitirPericiaDePicaro(habilidad, clase))
				.forEach(habilidad -> agregarHabilidadConMagiaVinculada(habilidades, habilidad));

		if (subclaseClase != null && subclaseClase.nivelDesbloqueo() <= 1) {
			boolean hasPersistedInitialSubclassFeatures = catalogoHabilidades.stream()
					.anyMatch(habilidad -> DndCharacterCheckers.esRasgoInicialDeSubclase(habilidad, clase.id(), clase.nombre(), subclaseClase));
			catalogoHabilidades.stream()
					.filter(habilidad -> DndCharacterCheckers.esRasgoInicialDeSubclase(habilidad, clase.id(), clase.nombre(), subclaseClase))
					.forEach(habilidad -> agregarHabilidadConMagiaVinculada(habilidades, habilidad));
			if (!hasPersistedInitialSubclassFeatures) {
				agregarRasgosSinteticosSubclase(habilidades, clase, subclaseClase, 1);
			}
			agregarConjurosDeSubclasePorTablas(habilidades, subclaseClase, 1);
		}

		agregarCompetenciasDeClaseComoHabilidades(habilidades, clase, 1);
		agregarEleccionesClaseComoHabilidades(habilidades, clase, eleccionesClase, "DND,CLASE," + clase.id());
		agregarHabilidad(habilidades, resolverOCrearHabilidad(trasfondo.nombreRasgo(), trasfondo.descripcionRasgo(), null, "DND,TRASFONDO," + trasfondo.id()));
		agregarEntradasComoHabilidades(habilidades, trasfondo.competenciasHabilidades(), "Competencia: ", "Competencia inicial de trasfondo", "DND,TRASFONDO," + trasfondo.id());
		agregarEntradasComoHabilidades(habilidades, trasfondo.competenciasHerramientas(), "Competencia: ", "Competencia inicial de trasfondo", "DND,TRASFONDO," + trasfondo.id());
		agregarEntradasComoHabilidades(habilidades, raza.idiomas(), "Idioma: ", "Idioma racial", "DND,RAZA," + raza.id());
		agregarEntradasComoHabilidades(habilidades, raza.competencias(), "Competencia: ", "Competencia racial", "DND,RAZA," + raza.id());
		agregarRasgos(habilidades, raza.rasgos(), "DND,RAZA," + raza.id());

		if (subraza != null) {
			agregarEntradasComoHabilidades(habilidades, subraza.competencias(), "Competencia: ", "Competencia de subraza", "DND,SUBRAZA," + subraza.id());
			agregarRasgos(habilidades, subraza.rasgos(), "DND,SUBRAZA," + subraza.id());
		}

		agregarEleccionesComoHabilidades(habilidades, raza.elecciones(), eleccionesRaza, "DND,RAZA," + raza.id(), eleccion -> !DndCharacterRules.normalizeChoiceCatalogId(eleccion.catalogo()).equalsIgnoreCase("puntuacionesCaracteristica"));
		if (subraza != null) {
			agregarEleccionesComoHabilidades(habilidades, subraza.elecciones(), eleccionesRaza, "DND,SUBRAZA," + subraza.id(), eleccion -> !DndCharacterRules.normalizeChoiceCatalogId(eleccion.catalogo()).equalsIgnoreCase("puntuacionesCaracteristica"));
		}
		agregarEleccionesComoHabilidades(habilidades, trasfondo.elecciones(), eleccionesTrasfondo, "DND,TRASFONDO," + trasfondo.id(), eleccion -> true);
		agregarMagiaRacialPorNivelInicial(habilidades, raza, 1);
		return new ArrayList<>(habilidades.values());
	}

	public void sincronizarIdiomasEditables(Personaje personaje, String languagesText) {
		Set<String> languages = new LinkedHashSet<>();
		for (String value : (languagesText == null ? "" : languagesText).split("[,\n;]")) {
			String cleaned = TagUtils.cleanValue(value);
			if (!cleaned.isBlank()) {
				languages.add(cleaned);
			}
		}

		personaje.getHabilidades().removeIf(habilidad -> TagUtils.normalizeText(habilidad.getNombre()).startsWith(TagUtils.normalizeText("Idioma: ")));
		for (String language : languages) {
			agregarHabilidadAPersonaje(personaje, resolverOCrearHabilidad("Idioma: " + language, "Idioma editable del personaje", null, "DND,IDIOMA,EDITABLE"));
		}
	}

	public void sincronizarCompetenciasEditables(Personaje personaje, List<String> competenciasArmasArmaduras, List<String> competenciasHerramientas) {
		if (competenciasArmasArmaduras == null && competenciasHerramientas == null) {
			return;
		}

		Set<String> competenciasEditables = DndCharacterNormalizers.combinarCompetenciasEditables(competenciasArmasArmaduras, competenciasHerramientas);
		personaje.getHabilidades().removeIf(habilidad -> DndCharacterCheckers.esCompetenciaGeneralEditable(habilidad.getNombre()));
		for (String competencia : competenciasEditables) {
			agregarHabilidadAPersonaje(personaje, resolverOCrearHabilidad("Competencia: " + competencia, "Competencia editable del personaje", null, "DND,COMPETENCIA,EDITABLE"));
		}
	}

	public void agregarHabilidadesDeClasePorNivel(
			Personaje personaje,
			ClaseDndDetalleResponse clase,
			ClaseDndSubclaseResponse subclase,
			int nivel,
			Map<String, List<String>> eleccionesClase,
			boolean incluirEleccionesIniciales
	) {
		Map<String, Habilidad> habilidades = new LinkedHashMap<>();
		List<ClaseDndSubclaseResponse> subclasesClase = clase.subclases() == null ? List.of() : clase.subclases();
		habilidadRepository.findAll().stream()
				.filter(habilidad -> Integer.valueOf(nivel).equals(TagUtils.extractClassLevel(habilidad.getTags(), clase.nombre())))
				.filter(habilidad -> !DndCharacterCheckers.esRasgoDeAlgunaSubclase(habilidad.getTags(), subclasesClase))
				.filter(habilidad -> !debeOmitirPericiaDePicaro(habilidad, clase))
				.forEach(habilidad -> agregarHabilidadConMagiaVinculada(habilidades, habilidad));

		if (subclase != null) {
			habilidadRepository.findAll().stream()
					.filter(habilidad -> Integer.valueOf(nivel).equals(TagUtils.extractClassLevel(habilidad.getTags(), clase.nombre())))
					.filter(habilidad -> DndCharacterCheckers.contieneSubclase(habilidad.getTags(), subclase))
					.filter(habilidad -> !debeOmitirPericiaDePicaro(habilidad, clase))
					.forEach(habilidad -> agregarHabilidadConMagiaVinculada(habilidades, habilidad));
		}

		if (incluirEleccionesIniciales) {
			agregarCompetenciasDeClaseComoHabilidades(habilidades, clase, nivel);
			agregarEleccionesClaseComoHabilidades(habilidades, clase, DndCharacterRules.safeMap(eleccionesClase), "DND,CLASE," + clase.id());
		}

		if (subclase != null && TagUtils.normalizeText(subclase.id()).equals("embaucadorarcano")) {
			if (nivel == subclase.nivelDesbloqueo()) {
				resolverHechizoPorNombre("Mano de mago").ifPresent(habilidad -> agregarHabilidad(habilidades, habilidad));
			}
			Map<String, List<String>> elections = DndCharacterRules.safeMap(eleccionesClase);
			for (String valor : elections.getOrDefault("ea-cantrip", List.of())) {
				resolverHechizoPorNombre(valor).ifPresent(habilidad -> agregarHabilidad(habilidades, habilidad));
			}
			for (String valor : elections.getOrDefault("ea-spell", List.of())) {
				resolverHechizoPorNombre(valor).ifPresent(habilidad -> agregarHabilidad(habilidades, habilidad));
			}
		}

		if (subclase != null && TagUtils.normalizeText(subclase.id()).equals("caballeroarcano")) {
			Map<String, List<String>> elections = DndCharacterRules.safeMap(eleccionesClase);
			for (String valor : elections.getOrDefault("ek-cantrip", List.of())) {
				resolverHechizoPorNombre(valor).ifPresent(habilidad -> agregarHabilidad(habilidades, habilidad));
			}
			for (String valor : elections.getOrDefault("ek-spell", List.of())) {
				resolverHechizoPorNombre(valor).ifPresent(habilidad -> agregarHabilidad(habilidades, habilidad));
			}
		}

		if (subclase != null && TagUtils.normalizeText(subclase.id()).equals("maestrobatalla")) {
			for (String valor : DndCharacterRules.safeMap(eleccionesClase).getOrDefault("bm-maneuver", List.of())) {
				resolverHabilidadPorNombre(valor).ifPresent(habilidad -> agregarHabilidad(habilidades, habilidad));
			}
		}

		for (String valor : DndCharacterRules.safeMap(eleccionesClase).getOrDefault("class-cantrip-upgrade", List.of())) {
			resolverHechizoPorNombre(valor).ifPresent(habilidad -> agregarHabilidad(habilidades, habilidad));
		}

		habilidades.values().forEach(habilidad -> agregarHabilidadAPersonaje(personaje, habilidad));
	}

	public void removerHabilidadesDeClasePorNivel(Personaje personaje, ClaseDndDetalleResponse clase, ClaseDndSubclaseResponse subclase, int level) {
		personaje.getHabilidades().removeIf(habilidad -> {
			Integer classLevel = TagUtils.extractClassLevel(habilidad.getTags(), clase.nombre());
			if (!Integer.valueOf(level).equals(classLevel)) {
				return false;
			}
			if (DndCharacterCheckers.esHabilidadElegidaUsuario(habilidad)) {
				return false;
			}
			return subclase == null
					|| !DndCharacterCheckers.esRasgoDeAlgunaSubclase(habilidad.getTags(), clase.subclases() == null ? List.of() : clase.subclases())
					|| DndCharacterCheckers.contieneSubclase(habilidad.getTags(), subclase);
		});
	}

	public void sincronizarMagiaRacialPorNivel(Personaje personaje, RazaDndDetalleResponse raza, int nivelTotal) {
		if (personaje == null || raza == null || !TagUtils.normalizeText(raza.id()).equals(TagUtils.normalizeText(DndPatterns.TIEFLING_RACE_ID))) {
			return;
		}

		sincronizarConjuroRacial(personaje, raza.id(), "Taumaturgia", nivelTotal >= 1);
		sincronizarConjuroRacial(personaje, raza.id(), "Reprensión infernal", nivelTotal >= 3);
		sincronizarConjuroRacial(personaje, raza.id(), "Oscuridad", nivelTotal >= 5);
	}

	public Optional<Habilidad> resolverHechizoPorNombre(String nombre) {
		String limpio = TagUtils.cleanValue(nombre);
		if (limpio.isBlank()) {
			return Optional.empty();
		}

		return habilidadRepository.findByNombreIgnoreCaseOrderByIdAsc(limpio).stream()
				.findFirst()
				.filter(DndCharacterCheckers::esHechizoOTruco);
	}

	public Optional<Habilidad> resolverHabilidadPorNombre(String nombre) {
		String limpio = TagUtils.cleanValue(nombre);
		if (limpio.isBlank()) {
			return Optional.empty();
		}

		return habilidadRepository.findByNombreIgnoreCaseOrderByIdAsc(limpio).stream()
				.findFirst();
	}

	public Habilidad resolverORegistrarHabilidad(String nombre, String descripcion, String formula, String tags) {
		return resolverOCrearHabilidad(nombre, descripcion, formula, tags);
	}

	public boolean agregarHabilidadSiNoExiste(Personaje personaje, Habilidad habilidad) {
		return agregarHabilidadAPersonaje(personaje, habilidad);
	}

	public Habilidad crearHabilidadArmaExclusiva(String nombre, String descripcion, String formula, String tags) {
		return habilidadRepository.save(
				Habilidad.builder()
						.nombre(nombre)
						.descripcion(descripcion)
						.formula(formula)
						.tags(tags)
						.build()
		);
	}

	public Habilidad obtenerHabilidadPorId(Long habilidadId) {
		return habilidadRepository.findById(habilidadId)
				.orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
						org.springframework.http.HttpStatus.NOT_FOUND, "Habilidad no encontrada"));
	}

	public Habilidad actualizarHabilidadArma(Long habilidadId, String nombre, String formula, String tags) {
		Habilidad h = obtenerHabilidadPorId(habilidadId);
		if (nombre != null && !nombre.isBlank()) h.setNombre(nombre.trim());
		if (formula != null) h.setFormula(formula); // Only overwrite formula if explicitly provided
		h.setTags(tags);
		return habilidadRepository.save(h);
	}

	private void agregarRasgos(Map<String, Habilidad> habilidades, List<RazaDndRasgoResponse> rasgos, String tags) {
		for (RazaDndRasgoResponse rasgo : rasgos) {
			agregarHabilidad(habilidades, resolverOCrearHabilidad(rasgo.titulo(), rasgo.descripcion(), null, tags));
			if (!DndCharacterCheckers.esLegadoInfernal(tags, rasgo.titulo())) {
				agregarMagiaInnataDesdeDescripcion(habilidades, rasgo.descripcion(), tags);
			}
		}
	}

	private void agregarMagiaRacialPorNivelInicial(Map<String, Habilidad> habilidades, RazaDndDetalleResponse raza, int nivelTotal) {
		if (raza == null || !TagUtils.normalizeText(raza.id()).equals(TagUtils.normalizeText(DndPatterns.TIEFLING_RACE_ID))) {
			return;
		}
		agregarLegadoInfernal(habilidades, nivelTotal, raza.id());
	}

	private void agregarEleccionesClaseComoHabilidades(
			Map<String, Habilidad> habilidades,
			ClaseDndDetalleResponse clase,
			Map<String, List<String>> eleccionesClase,
			String tags
	) {
		if (clase.competencias() != null) {
			for (int index = 0; index < clase.competencias().habilidades().size(); index++) {
				for (String valor : eleccionesClase.getOrDefault("class-skill-" + index, List.of())) {
					agregarHabilidad(habilidades, resolverOCrearHabilidad("Competencia: " + valor, "Seleccion inicial de clase", null, tags));
				}
			}

			for (int index = 0; index < clase.competencias().herramientas().size(); index++) {
				for (String valor : eleccionesClase.getOrDefault("class-tool-" + index, List.of())) {
					agregarHabilidad(habilidades, resolverOCrearHabilidad("Competencia: " + valor, "Seleccion inicial de clase", null, tags));
				}
			}
		}

		for (String valor : eleccionesClase.getOrDefault("class-cantrip-0", List.of())) {
			resolverHechizoPorNombre(valor).ifPresent(habilidad -> agregarHabilidad(habilidades, habilidad));
		}
		for (String valor : eleccionesClase.getOrDefault("class-spell-0", List.of())) {
			resolverHechizoPorNombre(valor).ifPresent(habilidad -> agregarHabilidad(habilidades, habilidad));
		}
		for (String valor : eleccionesClase.getOrDefault("class-combat-style-0", List.of())) {
			String estilo = TagUtils.cleanValue(valor);
			if (!estilo.isBlank()) {
				agregarHabilidad(habilidades, resolverOCrearHabilidad("Estilo de combate: " + estilo, describirEstiloCombate(estilo), null, TagUtils.mergeTags(tags, "ESTILOCOMBATE")));
			}
		}

		eleccionesClase.entrySet().stream()
				.filter(entry -> entry.getKey() != null
						&& (entry.getKey().startsWith(SKILL_EXPERTISE_CHOICE_PREFIX)
						|| entry.getKey().startsWith(TOOL_EXPERTISE_CHOICE_PREFIX)))
				.flatMap(entry -> entry.getValue() == null ? java.util.stream.Stream.<String>empty() : entry.getValue().stream())
				.map(TagUtils::cleanValue)
				.filter(valor -> !valor.isBlank())
				.forEach(valor -> agregarHabilidad(
						habilidades,
						resolverOCrearHabilidad("Pericia: " + valor, "Seleccion de pericia al subir de nivel", null, tags)
				));
	}

	private String describirEstiloCombate(String estilo) {
		String valor = TagUtils.cleanValue(estilo);
		return switch (TagUtils.normalizeText(valor)) {
			case "defensa" -> "Recibes un +1 a la CA cuando lleves puesta cualquier armadura.";
			default -> "Estilo de combate seleccionado durante la creación del personaje.";
		};
	}

	private boolean debeOmitirPericiaDePicaro(Habilidad habilidad, ClaseDndDetalleResponse clase) {
		return TagUtils.normalizeText(clase.id()).equals(TagUtils.normalizeText("picaro"))
				&& TagUtils.normalizeText(habilidad.getNombre()).equals(TagUtils.normalizeText("Pericia"));
	}

	private void agregarEntradasComoHabilidades(Map<String, Habilidad> habilidades, Collection<String> entradas, String prefijo, String descripcion, String tags) {
		for (String entrada : entradas) {
			String valor = TagUtils.cleanValue(entrada);
			if (!valor.isBlank()) {
				agregarHabilidad(habilidades, resolverOCrearHabilidad(prefijo + valor, descripcion, null, tags));
			}
		}
	}

	private <T extends CatalogoDndEleccion> void agregarEleccionesComoHabilidades(
			Map<String, Habilidad> habilidades,
			List<T> elecciones,
			Map<String, List<String>> seleccionadas,
			String tags,
			Function<T, Boolean> debeIncluirse
	) {
		for (T eleccion : elecciones) {
			if (!debeIncluirse.apply(eleccion)) {
				continue;
			}
			for (String valor : seleccionadas.getOrDefault(eleccion.id(), List.of())) {
				resolverHechizoPorNombre(valor).ifPresentOrElse(
						habilidad -> agregarHabilidad(habilidades, habilidad),
						() -> agregarHabilidad(habilidades, resolverOCrearHabilidad(DndCharacterNormalizers.nombreHabilidadDesdeEleccion(eleccion.catalogo(), eleccion.etiqueta(), valor), "Seleccion inicial de personaje", null, tags))
				);
			}
		}
	}

	private void agregarCompetenciasDeClaseComoHabilidades(Map<String, Habilidad> habilidades, ClaseDndDetalleResponse clase, int nivel) {
		if (clase.competencias() == null) {
			return;
		}
		String tags = "C" + TagUtils.normalizeTagValue(clase.nombre()) + ";" + nivel + ",DND,COMPETENCIAGENERAL";
		agregarEntradasComoHabilidades(habilidades, clase.competencias().armaduras() == null ? List.of() : clase.competencias().armaduras(), "Competencia: ", "Competencia de clase", tags);
		agregarEntradasComoHabilidades(habilidades, clase.competencias().armas() == null ? List.of() : clase.competencias().armas(), "Competencia: ", "Competencia de clase", tags);
		agregarEntradasComoHabilidades(habilidades, clase.competencias().herramientas() == null ? List.of() : clase.competencias().herramientas(), "Competencia: ", "Competencia de clase", tags);
	}

	private void agregarRasgosSinteticosSubclase(
			Map<String, Habilidad> habilidades,
			ClaseDndDetalleResponse clase,
			ClaseDndSubclaseResponse subclase,
			int nivelMaximo
	) {
		String tagsBase = TagUtils.mergeTags(
				"C" + TagUtils.normalizeTagValue(clase.nombre()) + ";" + nivelMaximo,
				"DND,CLASE," + clase.id(),
				"Subclase;" + TagUtils.normalizeTagValue(subclase.id()),
				"Subclase;" + TagUtils.normalizeTagValue(subclase.nombre()),
				"Sintetica"
		);

		List<ClaseDndSubclaseRasgoResponse> rasgos = dndSubclassService.obtenerRasgosSubclase(clase.id(), subclase.id()).stream()
				.filter(rasgo -> rasgo.nivel() <= nivelMaximo)
				.toList();

		if (rasgos.isEmpty()) {
			agregarHabilidad(habilidades, resolverOCrearHabilidad(subclase.nombre(), buildSubclassSummaryDescription(subclase), null, tagsBase));
			return;
		}

		for (ClaseDndSubclaseRasgoResponse rasgo : rasgos) {
			String tags = TagUtils.mergeTags(
					"C" + TagUtils.normalizeTagValue(clase.nombre()) + ";" + rasgo.nivel(),
					tagsBase
			);
			agregarHabilidadConMagiaVinculada(habilidades, resolverOCrearHabilidad(rasgo.nombre(), rasgo.descripcion(), rasgo.formula(), tags));
		}
	}

	private void agregarConjurosDeSubclasePorTablas(
			Map<String, Habilidad> habilidades,
			ClaseDndSubclaseResponse subclase,
			int nivelMaximoConjuro
	) {
		for (var tabla : subclase.tablas()) {
			boolean tablaDeConjuros = TagUtils.normalizeText(tabla.titulo()).contains("conjurosadicionales");
			if (!tablaDeConjuros) {
				continue;
			}

			for (var fila : tabla.filas()) {
				if (fila.size() < 2) {
					continue;
				}

				Integer nivelConjuro;
				try {
					nivelConjuro = Integer.parseInt(fila.getFirst().trim());
				} catch (NumberFormatException exception) {
					continue;
				}

				if (nivelConjuro > nivelMaximoConjuro) {
					continue;
				}

				for (String nombreConjuro : fila.get(1).split(",")) {
					resolverHechizoPorNombre(nombreConjuro).ifPresent(habilidad -> agregarHabilidad(habilidades, habilidad));
				}
			}
		}
	}

	private String buildSubclassSummaryDescription(ClaseDndSubclaseResponse subclase) {
		StringBuilder description = new StringBuilder(subclase.descripcion() == null ? "" : subclase.descripcion().trim());
		for (var table : subclase.tablas()) {
			if (!description.isEmpty()) {
				description.append("\n\n");
			}
			description.append(table.titulo()).append(':');
			for (var row : table.filas()) {
				description.append("\n- ").append(String.join(" | ", row));
			}
		}
		return description.toString();
	}

	private void agregarHabilidad(Map<String, Habilidad> habilidades, Habilidad habilidad) {
		habilidades.putIfAbsent(TagUtils.normalizeText(habilidad.getNombre()), habilidad);
	}

	private void agregarHabilidadConMagiaVinculada(Map<String, Habilidad> habilidades, Habilidad habilidad) {
		agregarHabilidad(habilidades, habilidad);
		agregarMagiaInnataDesdeDescripcion(habilidades, habilidad.getDescripcion(), habilidad.getTags());
		agregarMagiaInnataDesdeFormula(habilidades, habilidad.getFormula(), habilidad.getTags());
	}

	private boolean agregarHabilidadAPersonaje(Personaje personaje, Habilidad habilidad) {
		boolean alreadyPresent = personaje.getHabilidades().stream().anyMatch(item -> item.getId().equals(habilidad.getId()));
		if (alreadyPresent) {
			return false;
		}
		personaje.getHabilidades().add(habilidad);
		return true;
	}

	private void agregarMagiaInnataDesdeDescripcion(Map<String, Habilidad> habilidades, String descripcion, String tags) {
		for (String nombre : DndSpellParsingRules.extractSpellNames(descripcion)) {
			resolverHechizoPorNombre(nombre).ifPresent(habilidad -> agregarHabilidad(habilidades, habilidad));
		}
	}

	private void agregarMagiaInnataDesdeFormula(Map<String, Habilidad> habilidades, String formula, String tags) {
		for (String nombre : DndSpellParsingRules.extractSpellNamesFromFormula(formula, tags)) {
			resolverHechizoPorNombre(nombre).ifPresent(habilidad -> agregarHabilidad(habilidades, habilidad));
		}
	}

	private Habilidad resolverOCrearHabilidad(String nombre, String descripcion, String formula, String tags) {
		String nombreLimpio = DndCharacterRules.requireText(nombre, "La habilidad generada no tiene nombre");
		return habilidadRepository.findByNombreIgnoreCaseOrderByIdAsc(nombreLimpio).stream()
				.findFirst()
				.orElseGet(() -> habilidadRepository.save(Habilidad.builder().nombre(nombreLimpio).descripcion(descripcion).formula(formula).tags(tags).build()));
	}

	private Habilidad resolverOCrearHabilidadRacial(String nombre, String descripcion, String formula, String tags) {
		String nombreLimpio = DndCharacterRules.requireText(nombre, "La habilidad generada por una raza no tiene nombre");
		return habilidadRepository.findByNombreIgnoreCaseOrderByIdAsc(nombreLimpio).stream()
				.filter(habilidad -> TagUtils.normalizeText(habilidad.getTags()).contains(TagUtils.normalizeText(DndPatterns.RACIAL_SPELL_TAG)))
				.findFirst()
				.orElseGet(() -> habilidadRepository.save(Habilidad.builder().nombre(nombreLimpio).descripcion(descripcion).formula(formula).tags(tags).build()));
	}

	private void sincronizarConjuroRacial(Personaje personaje, String razaId, String nombreConjuro, boolean debeTenerlo) {
		String nombreNormalizado = TagUtils.normalizeText(nombreConjuro);
		personaje.getHabilidades().removeIf(habilidad -> DndCharacterCheckers.esConjuroRacialDeRaza(habilidad, razaId)
				&& TagUtils.normalizeText(habilidad.getNombre()).equals(nombreNormalizado)
				&& !debeTenerlo);
		if (!debeTenerlo) {
			return;
		}

		if (personaje.getHabilidades().stream().anyMatch(habilidad -> DndCharacterCheckers.esConjuroRacialDeRaza(habilidad, razaId)
				&& TagUtils.normalizeText(habilidad.getNombre()).equals(nombreNormalizado))) {
			return;
		}

		resolverHechizoPorNombre(nombreConjuro).ifPresent(conjuroBase -> agregarHabilidadAPersonaje(
				personaje,
				resolverOCrearHabilidadRacial(conjuroBase.getNombre(), conjuroBase.getDescripcion(), conjuroBase.getFormula(), TagUtils.mergeTags(conjuroBase.getTags(), DndPatterns.RACIAL_SPELL_TAG + "," + razaId))
		));
	}

	private void agregarLegadoInfernal(Map<String, Habilidad> habilidades, int nivelTotal, String razaId) {
		agregarConjuroRacialSiProcede(habilidades, razaId, "Taumaturgia", nivelTotal >= 1);
		agregarConjuroRacialSiProcede(habilidades, razaId, "Reprensión infernal", nivelTotal >= 3);
		agregarConjuroRacialSiProcede(habilidades, razaId, "Oscuridad", nivelTotal >= 5);
	}

	private void agregarConjuroRacialSiProcede(Map<String, Habilidad> habilidades, String razaId, String nombreConjuro, boolean debeTenerlo) {
		if (!debeTenerlo) {
			return;
		}
		resolverHechizoPorNombre(nombreConjuro).ifPresent(conjuroBase -> agregarHabilidad(habilidades, resolverOCrearHabilidadRacial(conjuroBase.getNombre(), conjuroBase.getDescripcion(), conjuroBase.getFormula(), TagUtils.mergeTags(conjuroBase.getTags(), DndPatterns.RACIAL_SPELL_TAG + "," + razaId))));
	}

}