package com.fosteriaVTT.fosteriaVTT_backend.Objeto;

import com.fosteriaVTT.fosteriaVTT_backend.dto.ObjetoInicialResponse;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class ObjetoService {

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
			return objetoExistente.get();
		}

		return objetoRepository.save(Objeto.builder()
				.nombre(objetoInicial.nombre().trim())
				.descripcion(objetoInicial.descripcion() == null || objetoInicial.descripcion().isBlank()
						? "Objeto inicial generado automaticamente durante la creacion del personaje"
						: objetoInicial.descripcion())
				.formula(objetoInicial.formula())
				.indice(objetoInicial.indice() == null ? "dnd-inicial" : objetoInicial.indice())
				.tipoObjeto(objetoInicial.tipoObjeto() == null ? TipoObjeto.MISCELANEO : objetoInicial.tipoObjeto())
				.build());
	}
}