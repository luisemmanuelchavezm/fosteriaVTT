package com.fosteriaVTT.fosteriaVTT_backend.Habilidad;

import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import com.fosteriaVTT.fosteriaVTT_backend.dto.HabilidadNivelResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.HabilidadResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class HabilidadService {

	private final HabilidadRepository habilidadRepository;

	public HabilidadService(HabilidadRepository habilidadRepository) {
		this.habilidadRepository = habilidadRepository;
	}

	public List<HabilidadNivelResponse> obtenerHabilidadesPorClase(String clase) {
		List<Habilidad> habilidades = habilidadRepository.findAll(Sort.by(Sort.Direction.ASC, "id"));
		Map<Integer, List<HabilidadResponse>> habilidadesPorNivel = new TreeMap<>();

		for (Habilidad habilidad : habilidades) {
			Integer nivel = TagUtils.extractClassLevel(habilidad.getTags(), clase);
			if (nivel == null) {
				continue;
			}

			habilidadesPorNivel
					.computeIfAbsent(nivel, ignored -> new ArrayList<>())
					.add(new HabilidadResponse(
							habilidad.getId(),
							habilidad.getNombre(),
							habilidad.getFormula(),
							habilidad.getDescripcion()
							, habilidad.getTags()
					));
		}

		return habilidadesPorNivel.entrySet().stream()
				.map(entry -> new HabilidadNivelResponse(entry.getKey(), entry.getValue()))
				.toList();
	}

}