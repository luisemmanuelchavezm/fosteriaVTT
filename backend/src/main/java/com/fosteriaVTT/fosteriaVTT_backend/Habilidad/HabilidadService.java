package com.fosteriaVTT.fosteriaVTT_backend.Habilidad;

import com.fosteriaVTT.fosteriaVTT_backend.dto.HabilidadNivelResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.HabilidadResponse;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class HabilidadService {

	private final HabilidadRepository habilidadRepository;

	public HabilidadService(HabilidadRepository habilidadRepository) {
		this.habilidadRepository = habilidadRepository;
	}

	public List<HabilidadNivelResponse> obtenerHabilidadesPorClase(String clase) {
		List<Habilidad> habilidades = habilidadRepository.findByClaseOrderByNivelAscIdAsc(clase);
		Map<Integer, List<HabilidadResponse>> habilidadesPorNivel = new LinkedHashMap<>();

		for (Habilidad habilidad : habilidades) {
			habilidadesPorNivel
					.computeIfAbsent(habilidad.getNivel(), ignored -> new ArrayList<>())
					.add(new HabilidadResponse(
							habilidad.getId(),
							habilidad.getNombre(),
							habilidad.getDescripcion()
					));
		}

		return habilidadesPorNivel.entrySet().stream()
				.map(entry -> new HabilidadNivelResponse(entry.getKey(), entry.getValue()))
				.toList();
	}
}