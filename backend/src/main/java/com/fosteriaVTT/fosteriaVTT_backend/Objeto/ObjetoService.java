package com.fosteriaVTT.fosteriaVTT_backend.Objeto;

import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ObjetoInicialResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ObjetoCatalogoResponse;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class ObjetoService {

	private static final String VISIBILITY_TAG = "VISIBILIDAD";
	private static final String OWNER_TAG = "PROPIETARIO";
	private static final String OFFICIAL_VISIBILITY = "oficial";
	private static final String PRIVATE_VISIBILITY = "privado";

	private final ObjetoRepository objetoRepository;

	public ObjetoService(ObjetoRepository objetoRepository) {
		this.objetoRepository = objetoRepository;
	}

	public Objeto resolverOCrearObjeto(ObjetoInicialResponse objetoInicial) {
		if (objetoInicial == null || objetoInicial.nombre() == null || objetoInicial.nombre().isBlank()) {
			throw new ResponseStatusException(BAD_REQUEST, "No se pudo resolver un objeto inicial del personaje");
		}

		Optional<Objeto> objetoExistente = Optional.empty();
		if (objetoInicial.id() != null) {
			objetoExistente = objetoRepository.findById(objetoInicial.id());
		}

		if (objetoExistente.isEmpty()) {
			objetoExistente = objetoRepository.findByNombreIgnoreCaseOrderByIdAsc(objetoInicial.nombre()).stream().findFirst();
		}

		if (objetoExistente.isPresent()) {
			Objeto existente = objetoExistente.get();
			// If the caller declares an explicit type and the stored object is still
			// the MISCELANEO fallback, promote it so weapon attacks are created correctly.
			if (objetoInicial.tipoObjeto() != null
					&& existente.getTipoObjeto() == TipoObjeto.MISCELANEO) {
				existente.setTipoObjeto(objetoInicial.tipoObjeto());
				return objetoRepository.save(existente);
			}
			return existente;
		}

		return objetoRepository.save(Objeto.builder()
				.nombre(objetoInicial.nombre().trim())
				.descripcion(objetoInicial.descripcion() == null || objetoInicial.descripcion().isBlank()
						? "Objeto inicial generado automaticamente durante la creacion del personaje"
						: objetoInicial.descripcion())
				.formula(objetoInicial.formula())
				.indice(anexarMetadato(objetoInicial.indice() == null ? "dnd-inicial" : objetoInicial.indice(), VISIBILITY_TAG, OFFICIAL_VISIBILITY))
				.tipoObjeto(objetoInicial.tipoObjeto() == null ? TipoObjeto.MISCELANEO : objetoInicial.tipoObjeto())
				.build());
	}

	public Optional<Objeto> obtenerObjetoPorId(Long objetoId) {
		return objetoRepository.findById(objetoId);
	}

	public Optional<Objeto> obtenerObjetoVisibleParaUsuario(Long objetoId, String username) {
		return objetoRepository.findById(objetoId)
				.filter(objeto -> esVisibleParaUsuario(objeto, username));
	}

	public Objeto crearObjetoPersonalizado(
			String nombre,
			String descripcion,
			String formula,
			TipoObjeto tipoObjeto,
			String indice,
			String username
	) {
		String indiceConVisibilidad = anexarMetadato(
				anexarMetadato(indice == null ? "personalizado" : indice, VISIBILITY_TAG, PRIVATE_VISIBILITY),
				OWNER_TAG,
				username
		);

		return objetoRepository.save(Objeto.builder()
				.nombre(nombre.trim())
				.descripcion(descripcion == null || descripcion.isBlank()
						? "Objeto personalizado creado por el usuario"
						: descripcion)
				.formula(formula)
				.indice(indiceConVisibilidad)
				.tipoObjeto(tipoObjeto == null ? TipoObjeto.MISCELANEO : tipoObjeto)
				.build());
	}

	public ObjetoCatalogoResponse crearObjetoDeCatalogo(
			String nombre, String formula, String descripcion,
			TipoObjeto tipoObjeto, String sistema) {
		String sistemaTag = "MORK_BORG".equalsIgnoreCase(sistema) ? "MORK_BORG,AdminCreado" : "DND,AdminCreado";
		String indice = sistemaTag + "," + VISIBILITY_TAG + ";" + OFFICIAL_VISIBILITY;
		Objeto obj = objetoRepository.save(Objeto.builder()
				.nombre(nombre.trim())
				.formula(formula == null || formula.isBlank() ? null : formula.trim())
				.descripcion(descripcion == null || descripcion.isBlank() ? "" : descripcion.trim())
				.tipoObjeto(tipoObjeto)
				.indice(indice)
				.build());
		return new ObjetoCatalogoResponse(obj.getId(), obj.getNombre(), obj.getFormula(),
				obj.getDescripcion(), obj.getTipoObjeto().name(), obj.getIndice());
	}

	public List<ObjetoCatalogoResponse> obtenerTodoElCatalogo() {
		return objetoRepository.findAll().stream()
				.filter(objeto -> {
					String vis = TagUtils.extractTagValue(objeto.getIndice(), VISIBILITY_TAG);
					return !PRIVATE_VISIBILITY.equalsIgnoreCase(vis != null ? vis.trim() : null);
				})
				.filter(objeto -> objeto.getTipoObjeto() != TipoObjeto.OBJETO_INTERNO)
				.filter(objeto -> tieneTagsDeCatalogo(objeto.getIndice()))
				.sorted(java.util.Comparator.comparing(Objeto::getNombre, String.CASE_INSENSITIVE_ORDER))
				.map(objeto -> new ObjetoCatalogoResponse(
						objeto.getId(),
						objeto.getNombre(),
						objeto.getFormula(),
						objeto.getDescripcion(),
						objeto.getTipoObjeto().name(),
						objeto.getIndice()
				))
				.toList();
	}

	public void eliminarObjetoDeCatalogo(Long id) {
		Objeto obj = objetoRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(
						org.springframework.http.HttpStatus.NOT_FOUND, "Objeto no encontrado"));
		String indice = obj.getIndice() == null ? "" : obj.getIndice();
		boolean esDeAdmin = java.util.Arrays.stream(indice.split(","))
				.map(String::trim)
				.anyMatch(t -> t.equalsIgnoreCase("AdminCreado"));
		if (!esDeAdmin) {
			throw new ResponseStatusException(
					org.springframework.http.HttpStatus.FORBIDDEN,
					"Solo se pueden eliminar objetos creados por administradores");
		}
		objetoRepository.deleteById(id);
	}

	public List<ObjetoCatalogoResponse> buscarObjetos(String nombre, String tipo, String username) {
		String nombreNormalizado = nombre == null ? "" : nombre.trim();
		String tipoNormalizado = tipo == null ? "" : tipo.trim();

		return objetoRepository.findAll().stream()
				.filter(objeto -> esVisibleParaUsuario(objeto, username))
				.filter(objeto -> objeto.getTipoObjeto() != TipoObjeto.OBJETO_INTERNO)
				.filter(objeto -> tieneTagsDeCatalogo(objeto.getIndice()))
				.filter(objeto -> nombreNormalizado.isBlank()
						|| objeto.getNombre().toLowerCase(java.util.Locale.ROOT).contains(nombreNormalizado.toLowerCase(java.util.Locale.ROOT)))
				.filter(objeto -> tipoNormalizado.isBlank()
						|| objeto.getTipoObjeto().name().equalsIgnoreCase(tipoNormalizado))
				.sorted(java.util.Comparator.comparing(Objeto::getNombre, String.CASE_INSENSITIVE_ORDER))
				.map(objeto -> new ObjetoCatalogoResponse(
						objeto.getId(),
						objeto.getNombre(),
						objeto.getFormula(),
						objeto.getDescripcion(),
						objeto.getTipoObjeto().name(),
						objeto.getIndice()
				))
				.toList();
	}

	private boolean esVisibleParaUsuario(Objeto objeto, String username) {
		if (objeto == null) {
			return false;
		}

		String visibility = TagUtils.extractTagValue(objeto.getIndice(), VISIBILITY_TAG);
		if (visibility == null || TagUtils.normalizeText(visibility).equals(TagUtils.normalizeText(OFFICIAL_VISIBILITY))) {
			return true;
		}

		String owner = TagUtils.extractTagValue(objeto.getIndice(), OWNER_TAG);
		return owner != null && TagUtils.normalizeText(owner).equals(TagUtils.normalizeText(username));
	}

	private boolean tieneTagsDeCatalogo(String indice) {
		if (indice == null || indice.isBlank()) return false;
		return java.util.Arrays.stream(indice.split(","))
				.map(String::trim)
				.anyMatch(tag -> !tag.isBlank()
						&& !tag.startsWith("VISIBILIDAD;")
						&& !tag.startsWith("PROPIETARIO;")
						&& !tag.startsWith("BONO_ATAQUE=")
						&& !tag.startsWith("BONO_DAÑO=")
						&& !tag.equalsIgnoreCase("dnd-inicial")
				);
	}

	private String anexarMetadato(String indice, String key, String value) {
		String base = indice == null ? "" : indice.trim();
		if (TagUtils.extractTagValue(base, key) != null) {
			return base;
		}
		if (base.isBlank()) {
			return key + ";" + value;
		}
		return base + "," + key + ";" + value;
	}
}