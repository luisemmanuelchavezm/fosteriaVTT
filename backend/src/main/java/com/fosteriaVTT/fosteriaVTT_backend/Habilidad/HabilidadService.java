package com.fosteriaVTT.fosteriaVTT_backend.Habilidad;

import com.fosteriaVTT.fosteriaVTT_backend.InformacionDnd.DndSubclassService;
import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndSubclaseResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndSubclaseRasgoResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.HabilidadNivelResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.HabilidadResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class HabilidadService {

	private final HabilidadRepository habilidadRepository;
	private final DndSubclassService dndSubclassService;

	public HabilidadService(HabilidadRepository habilidadRepository, DndSubclassService dndSubclassService) {
		this.habilidadRepository = habilidadRepository;
		this.dndSubclassService = dndSubclassService;
	}

	public List<HabilidadNivelResponse> obtenerHabilidadesPorClase(String clase) {
		List<Habilidad> habilidades = habilidadRepository.findAll(Sort.by(Sort.Direction.ASC, "id"));
		Map<Integer, List<HabilidadResponse>> habilidadesPorNivel = new TreeMap<>();
		List<ClaseDndSubclaseResponse> subclases = dndSubclassService.obtenerSubclasesPorClase(clase);

		for (Habilidad habilidad : habilidades) {
			Integer nivel = TagUtils.extractClassLevel(habilidad.getTags(), clase);
			if (nivel == null) {
				continue;
			}
			if (esRasgoDeSubclase(habilidad.getTags(), subclases)) {
				continue;
			}

			habilidadesPorNivel
					.computeIfAbsent(nivel, ignored -> new ArrayList<>())
					.add(new HabilidadResponse(
							habilidad.getId(),
							habilidad.getNombre(),
							null,
							habilidad.getFormula(),
							habilidad.getDescripcion()
							, habilidad.getTags()
					));
		}

		return habilidadesPorNivel.entrySet().stream()
				.map(entry -> new HabilidadNivelResponse(entry.getKey(), entry.getValue()))
				.toList();
	}

	public Optional<HabilidadResponse> buscarDetalleDeHechizoOTruco(String nombre) {
		String cleanName = TagUtils.cleanValue(nombre);
		if (cleanName.isBlank()) {
			return Optional.empty();
		}

		return habilidadRepository.findByNombreIgnoreCaseOrderByIdAsc(cleanName).stream()
				.findFirst()
				.map(item -> new HabilidadResponse(
						item.getId(),
						item.getNombre(),
						null,
						item.getFormula(),
						item.getDescripcion(),
						item.getTags()
				));
	}

	public List<HabilidadResponse> buscarConjurosYTrucos(String nombre, Integer nivel, String clase) {
		String nombreNormalizado = nombre == null ? "" : nombre.trim();
		String claseNormalizada = TagUtils.normalizeText(clase);

		return habilidadRepository.findAll(Sort.by(Sort.Direction.ASC, "nombre")).stream()
				.filter(this::esHechizoOTruco)
				.filter(item -> nombreNormalizado.isBlank()
						|| item.getNombre().toLowerCase(java.util.Locale.ROOT).contains(nombreNormalizado.toLowerCase(java.util.Locale.ROOT)))
				.filter(item -> nivel == null || extraerNivelConjuro(item) == nivel)
				.filter(item -> clase == null || clase.isBlank() || TagUtils.normalizeText(item.getTags()).contains(claseNormalizada))
				.map(item -> new HabilidadResponse(
						item.getId(),
						item.getNombre(),
						null,
						item.getFormula(),
						item.getDescripcion(),
						item.getTags()
				))
				.toList();
	}

	public List<HabilidadResponse> buscarCatalogoHabilidades(String clase, String subclase, String etiqueta) {
		return habilidadRepository.findAll(Sort.by(Sort.Direction.ASC, "nombre")).stream()
				.filter(item -> contieneTag(item.getTags(), clase))
				.filter(item -> contieneTag(item.getTags(), subclase))
				.filter(item -> contieneTag(item.getTags(), etiqueta))
				.map(item -> new HabilidadResponse(
						item.getId(),
						item.getNombre(),
						null,
						item.getFormula(),
						item.getDescripcion(),
						item.getTags()
				))
				.toList();
	}

	public List<HabilidadNivelResponse> obtenerHabilidadesPorSubclase(String clase, String subclaseId) {
		ClaseDndSubclaseResponse subclase = dndSubclassService.buscarSubclase(clase, subclaseId)
				.orElse(null);
		if (subclase == null) {
			return List.of();
		}

		List<Habilidad> habilidades = habilidadRepository.findAll(Sort.by(Sort.Direction.ASC, "id"));
		Map<Integer, List<HabilidadResponse>> habilidadesPorNivel = new TreeMap<>();

		for (Habilidad habilidad : habilidades) {
			Integer nivel = TagUtils.extractClassLevel(habilidad.getTags(), clase);
			if (nivel == null) {
				continue;
			}
			if (!esRasgoDeSubclase(habilidad.getTags(), subclase)) {
				continue;
			}

			habilidadesPorNivel
					.computeIfAbsent(nivel, ignored -> new ArrayList<>())
					.add(new HabilidadResponse(
							habilidad.getId(),
							habilidad.getNombre(),
							null,
							habilidad.getFormula(),
							habilidad.getDescripcion(),
							habilidad.getTags()
					));
		}

		if (habilidadesPorNivel.isEmpty()) {
			List<ClaseDndSubclaseRasgoResponse> syntheticFeatures = dndSubclassService.obtenerRasgosSubclase(clase, subclaseId);
			if (syntheticFeatures.isEmpty()) {
				habilidadesPorNivel.computeIfAbsent(subclase.nivelDesbloqueo(), ignored -> new ArrayList<>())
						.add(new HabilidadResponse(
								null,
								subclase.nombre(),
								null,
								null,
								buildSubclassSummaryDescription(subclase),
								"Subclase;" + subclase.id() + ",Sintetica"
						));
			} else {
				for (ClaseDndSubclaseRasgoResponse feature : syntheticFeatures) {
					habilidadesPorNivel.computeIfAbsent(feature.nivel(), ignored -> new ArrayList<>())
							.add(new HabilidadResponse(
									null,
									feature.nombre(),
									null,
									feature.formula(),
									feature.descripcion(),
									"Subclase;" + subclase.id() + ",Sintetica"
							));
				}
			}
		}

		return habilidadesPorNivel.entrySet().stream()
				.map(entry -> new HabilidadNivelResponse(entry.getKey(), entry.getValue()))
				.toList();
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

	private boolean esRasgoDeSubclase(String tags, List<ClaseDndSubclaseResponse> subclases) {
		if (tags == null || tags.isBlank() || subclases == null || subclases.isEmpty()) {
			return false;
		}

		List<String> tokens = extractNormalizedTokens(tags);

		for (ClaseDndSubclaseResponse subclase : subclases) {
			boolean matched = matchesSubclassTokens(tokens, subclase);
			if (matched) {
				return true;
			}
		}

		return false;
	}

	private boolean esRasgoDeSubclase(String tags, ClaseDndSubclaseResponse subclase) {
		if (tags == null || tags.isBlank() || subclase == null) {
			return false;
		}

		return matchesSubclassTokens(extractNormalizedTokens(tags), subclase);
	}

	private List<String> extractNormalizedTokens(String tags) {
		return java.util.Arrays.stream(tags.split(","))
				.map(String::trim)
				.filter(token -> !token.isBlank())
				.map(TagUtils::normalizeText)
				.toList();
	}

	private boolean matchesSubclassTokens(List<String> tokens, ClaseDndSubclaseResponse subclase) {
		String normalizedId = TagUtils.normalizeText(subclase.id());
		String normalizedName = TagUtils.normalizeText(subclase.nombre());
		return tokens.stream().anyMatch(token -> token.equals(normalizedId) || token.equals(normalizedName));
	}

	private boolean esHechizoOTruco(Habilidad habilidad) {
		String tags = habilidad.getTags() == null ? "" : habilidad.getTags().toLowerCase(java.util.Locale.ROOT);
		return tags.contains("truco") || tags.contains("hechizo;");
	}

	private boolean contieneTag(String tags, String value) {
		if (value == null || value.isBlank()) {
			return true;
		}
		return TagUtils.normalizeText(tags).contains(TagUtils.normalizeText(value));
	}

	private int extraerNivelConjuro(Habilidad habilidad) {
		String tags = habilidad.getTags() == null ? "" : habilidad.getTags();
		if (tags.toLowerCase(java.util.Locale.ROOT).contains("truco")) {
			return 0;
		}

		for (String token : tags.split(",")) {
			String valor = token.trim();
			if (!valor.toLowerCase(java.util.Locale.ROOT).startsWith("hechizo;")) {
				continue;
			}
			String[] partes = valor.split(";", 2);
			if (partes.length == 2) {
				try {
					return Integer.parseInt(partes[1]);
				} catch (NumberFormatException ignored) {
					return -1;
				}
			}
		}
		return -1;
	}

}