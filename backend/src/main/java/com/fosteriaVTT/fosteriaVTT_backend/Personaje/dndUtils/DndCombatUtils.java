package com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils;

import com.fosteriaVTT.fosteriaVTT_backend.InformacionDnd.DndInfoService;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Mochila.Mochila;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.Objeto;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.ObjetoRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.TipoObjeto;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.PersonajeRepository;
import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import com.fosteriaVTT.fosteriaVTT_backend.common.dnd.DndCharacterRules;
import com.fosteriaVTT.fosteriaVTT_backend.common.dnd.DndPatterns;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.RazaDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.SubrazaDndDetalleResponse;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class DndCombatUtils {

	private final PersonajeRepository personajeRepository;
	private final ObjetoRepository objetoRepository;
	private final DndInfoService dndInfoService;
	private final DndAbilityUtils dndAbilityUtils;
	private final DndCharacterStatsUtils dndCharacterStatsUtils;

	public DndCombatUtils(
			PersonajeRepository personajeRepository,
			ObjetoRepository objetoRepository,
			DndInfoService dndInfoService,
			DndAbilityUtils dndAbilityUtils,
			DndCharacterStatsUtils dndCharacterStatsUtils
	) {
		this.personajeRepository = personajeRepository;
		this.objetoRepository = objetoRepository;
		this.dndInfoService = dndInfoService;
		this.dndAbilityUtils = dndAbilityUtils;
		this.dndCharacterStatsUtils = dndCharacterStatsUtils;
	}

	public void agregarHabilidadesDeCombate(
			Personaje personaje,
			List<Mochila> mochilaInicial,
			RazaDndDetalleResponse raza,
			SubrazaDndDetalleResponse subraza,
			Map<String, List<String>> eleccionesRaza
	) {
		boolean changed = false;
		for (Mochila item : mochilaInicial) {
			Objeto objeto = item.getObjeto();
			if (objeto == null || objeto.getTipoObjeto() != TipoObjeto.ARMA) {
				continue;
			}
			Habilidad habilidadArma = dndAbilityUtils.resolverORegistrarHabilidad(objeto.getNombre(), objeto.getDescripcion(), objeto.getFormula(), "DND,ARMA,OBJETO," + objeto.getId());
			changed |= dndAbilityUtils.agregarHabilidadSiNoExiste(personaje, habilidadArma);
		}

		changed |= agregarAtaqueSinArmas(personaje);
		changed |= agregarArmaDeAliento(personaje, raza, subraza, eleccionesRaza);

		if (changed) {
			personajeRepository.save(personaje);
		}
	}

	public void sincronizarAtaquesArma(Personaje personaje, List<Mochila> mochila) {
		Set<Long> weaponObjectIds = mochila.stream()
				.filter(item -> item.getCantidad() > 0)
				.map(Mochila::getObjeto)
				.filter(objeto -> objeto != null && objeto.getTipoObjeto() == TipoObjeto.ARMA && objeto.getId() != null)
				.map(Objeto::getId)
				.collect(java.util.stream.Collectors.toSet());

		boolean changed = personaje.getHabilidades().removeIf(habilidad -> {
			Long objectId = extraerIdObjetoArma(habilidad.getTags());
			return objectId != null && !weaponObjectIds.contains(objectId);
		});

		for (Mochila item : mochila) {
			Objeto objeto = item.getObjeto();
			if (item.getCantidad() <= 0 || objeto == null || objeto.getTipoObjeto() != TipoObjeto.ARMA) {
				continue;
			}
			Habilidad habilidadArma = dndAbilityUtils.resolverORegistrarHabilidad(objeto.getNombre(), objeto.getDescripcion(), objeto.getFormula(), "DND,ARMA,OBJETO," + objeto.getId());
			changed |= dndAbilityUtils.agregarHabilidadSiNoExiste(personaje, habilidadArma);
		}

		changed |= agregarAtaqueSinArmas(personaje);
		if (changed) {
			personajeRepository.save(personaje);
		}
	}

	public DndWeaponProficiencies resolverCompetenciasArma(Personaje personaje) {
		DndWeaponProficiencies result = new DndWeaponProficiencies();
		boolean tieneCompetenciasGeneralesPersistidas = personaje.getHabilidades().stream().anyMatch(habilidad -> DndCharacterCheckers.esCompetenciaGeneralEditable(habilidad.getNombre()));

		if (!tieneCompetenciasGeneralesPersistidas) {
			dndCharacterStatsUtils.resolverClasesPersonaje(personaje).forEach(clase -> dndInfoService.obtenerClases().stream()
					.filter(item -> TagUtils.normalizeText(item.nombre()).equals(TagUtils.normalizeText(clase.nombre())))
					.findFirst()
					.flatMap(item -> dndInfoService.obtenerClasePorId(item.id()))
					.map(ClaseDndDetalleResponse::competencias)
					.map(competencias -> competencias == null ? List.<String>of() : competencias.armas())
					.ifPresent(result::agregarEntradas));
		}

		for (Habilidad habilidad : personaje.getHabilidades()) {
			if (TagUtils.normalizeText(habilidad.getNombre()).startsWith(TagUtils.normalizeText("Competencia"))) {
				result.agregarEntrada(habilidad.getNombre());
			}
		}

		return result;
	}

	public Integer resolverBonificacionHabilidad(Personaje personaje, Habilidad habilidad, Map<String, Integer> estadisticas) {
		return resolverBonificacionHabilidad(
				personaje,
				habilidad,
				estadisticas,
				resolverCompetenciasArma(personaje),
				Map.of()
		);
	}

	public Map<Long, Objeto> resolverObjetosArmaPorHabilidades(List<Habilidad> habilidades) {
		Set<Long> weaponObjectIds = new HashSet<>();
		for (Habilidad habilidad : habilidades == null ? List.<Habilidad>of() : habilidades) {
			Long weaponObjectId = extraerIdObjetoArma(habilidad == null ? null : habilidad.getTags());
			if (weaponObjectId != null) {
				weaponObjectIds.add(weaponObjectId);
			}
		}

		if (weaponObjectIds.isEmpty()) {
			return Map.of();
		}

		Map<Long, Objeto> objectsById = new HashMap<>();
		for (Objeto objeto : objetoRepository.findAllById(weaponObjectIds)) {
			if (objeto.getId() != null) {
				objectsById.put(objeto.getId(), objeto);
			}
		}

		return objectsById;
	}

	public Integer resolverBonificacionHabilidad(
			Personaje personaje,
			Habilidad habilidad,
			Map<String, Integer> estadisticas,
			DndWeaponProficiencies weaponProficiencies,
			Map<Long, Objeto> weaponObjectsById
	) {
		DndWeaponProficiencies effectiveWeaponProficiencies =
				weaponProficiencies == null ? resolverCompetenciasArma(personaje) : weaponProficiencies;
		int proficiencyBonus = DndCharacterRules.calculateProficiencyBonus(dndCharacterStatsUtils.resolverNivelTotalPersonaje(personaje));
		if (DndCharacterCheckers.esAtaqueSinArmas(habilidad)) {
			int fuerza = DndCharacterRules.calculateModifier(estadisticas.getOrDefault("Fuerza", 10));
			int destreza = DndCharacterRules.calculateModifier(estadisticas.getOrDefault("Destreza", 10));
			return esClasePersonaje(personaje, "Monje") ? Math.max(fuerza, destreza) + proficiencyBonus : fuerza + proficiencyBonus;
		}

		Long weaponObjectId = extraerIdObjetoArma(habilidad.getTags());
		if (weaponObjectId == null) {
			return null;
		}

		Objeto objeto = weaponObjectsById == null ? null : weaponObjectsById.get(weaponObjectId);
		if (objeto == null) {
			objeto = objetoRepository.findById(weaponObjectId).orElse(null);
		}
		if (objeto == null || objeto.getTipoObjeto() != TipoObjeto.ARMA) {
			return null;
		}

		int fuerza = DndCharacterRules.calculateModifier(estadisticas.getOrDefault("Fuerza", 10));
		int destreza = DndCharacterRules.calculateModifier(estadisticas.getOrDefault("Destreza", 10));
		int modificadorCaracteristica = resolverModificadorArma(objeto, fuerza, destreza);
		int competencia = effectiveWeaponProficiencies.aplicaA(objeto) || esArmaCustomCompetente(objeto) ? proficiencyBonus : 0;
		if (tieneEstiloTiroConArco(personaje, objeto)) {
			competencia += 2;
		}
		return competencia + modificadorCaracteristica;
	}

	private boolean agregarAtaqueSinArmas(Personaje personaje) {
		Habilidad ataqueSinArmas = dndAbilityUtils.resolverORegistrarHabilidad(
				"Ataque sin armas",
				"Golpe basico cuerpo a cuerpo. Los monjes pueden usar Fuerza o Destreza y aumentan el daño con artes marciales.",
				"1 contundente",
				"DND,ACCION,ATAQUE,ATAQUESINARMAS"
		);
		return dndAbilityUtils.agregarHabilidadSiNoExiste(personaje, ataqueSinArmas);
	}

	private boolean agregarArmaDeAliento(Personaje personaje, RazaDndDetalleResponse raza, SubrazaDndDetalleResponse subraza, Map<String, List<String>> eleccionesRaza) {
		String ancestro = resolverAncestroDraconicoSeleccionado(raza, subraza, eleccionesRaza);
		if (ancestro == null || ancestro.isBlank()) {
			return false;
		}

		DraconicBreathProfile profile = DraconicBreathProfile.fromChoice(ancestro);
		Habilidad armaDeAliento = dndAbilityUtils.resolverORegistrarHabilidad(
				"Arma de aliento dracónica (" + profile.damageType() + ")",
				"Exhalas energía " + profile.damageType().toLowerCase(Locale.ROOT) + " en " + profile.area() + ". CD = 8 + modificador de Constitución + competencia. Se recarga tras descanso corto o largo.",
				"2d6 " + profile.damageType().toLowerCase(Locale.ROOT),
				"DND,ACCION,ATAQUE,ALIENTODRACONICO"
		);
		return dndAbilityUtils.agregarHabilidadSiNoExiste(personaje, armaDeAliento);
	}

	private String resolverAncestroDraconicoSeleccionado(RazaDndDetalleResponse raza, SubrazaDndDetalleResponse subraza, Map<String, List<String>> eleccionesRaza) {
		for (var eleccion : eleccionesDeRazaYSubraza(raza, subraza)) {
			if (!"ancestrosDraconicos".equalsIgnoreCase(DndCharacterRules.normalizeChoiceCatalogId(eleccion.catalogo()))) {
				continue;
			}
			String valor = eleccionesRaza.getOrDefault(eleccion.id(), List.of()).stream().map(TagUtils::cleanValue).filter(item -> !item.isBlank()).findFirst().orElse(null);
			if (valor != null) {
				return valor;
			}
		}
		return null;
	}

	private List<com.fosteriaVTT.fosteriaVTT_backend.dto.CatalogoDndEleccion> eleccionesDeRazaYSubraza(RazaDndDetalleResponse raza, SubrazaDndDetalleResponse subraza) {
		List<com.fosteriaVTT.fosteriaVTT_backend.dto.CatalogoDndEleccion> elecciones = new ArrayList<>();
		elecciones.addAll(raza.elecciones());
		if (subraza != null) {
			elecciones.addAll(subraza.elecciones());
		}
		return elecciones;
	}

	private boolean esArmaCustomCompetente(Objeto objeto) {
		return TagUtils.normalizeText(objeto.getIndice()).contains(TagUtils.normalizeText("COMPETENTE_POR_DEFECTO"));
	}

	private boolean tieneEstiloTiroConArco(Personaje personaje, Objeto objeto) {
		if (!personaje.getHabilidades().stream().anyMatch(habilidad -> TagUtils.normalizeText(habilidad.getNombre()).equals(TagUtils.normalizeText("Estilo de combate: Tiro con arco")))) {
			return false;
		}
		String indiceNormalizado = TagUtils.normalizeText(objeto.getIndice());
		return indiceNormalizado.contains(TagUtils.normalizeText("ASRango")) || indiceNormalizado.contains(TagUtils.normalizeText("AMRango"));
	}

	private boolean esClasePersonaje(Personaje personaje, String nombreClase) {
		String normalizedClassName = TagUtils.normalizeText(nombreClase);
		return dndCharacterStatsUtils.resolverClasesPersonaje(personaje).stream().anyMatch(clase -> TagUtils.normalizeText(clase.nombre()).equals(normalizedClassName));
	}

	private int resolverModificadorArma(Objeto objeto, int fuerza, int destreza) {
		String indiceNormalizado = TagUtils.normalizeText(objeto.getIndice());
		if (indiceNormalizado.contains(TagUtils.normalizeText("Sutil"))) {
			return Math.max(fuerza, destreza);
		}
		if (indiceNormalizado.contains(TagUtils.normalizeText("ASRango")) || indiceNormalizado.contains(TagUtils.normalizeText("AMRango"))) {
			return destreza;
		}
		return fuerza;
	}

	private Long extraerIdObjetoArma(String tags) {
		if (tags == null || tags.isBlank()) {
			return null;
		}
		String[] partes = tags.split(",");
		for (int index = 0; index < partes.length - 1; index++) {
			if (!TagUtils.normalizeText(partes[index]).equals(TagUtils.normalizeText(DndPatterns.WEAPON_OBJECT_TAG))) {
				continue;
			}
			try {
				return Long.parseLong(partes[index + 1].trim());
			} catch (NumberFormatException ignored) {
				return null;
			}
		}
		return null;
	}

	private record DraconicBreathProfile(String damageType, String area) {
		private static DraconicBreathProfile fromChoice(String choice) {
			String[] parts = java.util.Arrays.stream(choice.split("\\|"))
					.map(String::trim)
					.toArray(String[]::new);
			String damageType = parts.length > 1 ? parts[1] : "energía";
			String area = parts.length > 2 ? parts[2] : "un área cercana";
			return new DraconicBreathProfile(damageType, area);
		}
	}
}