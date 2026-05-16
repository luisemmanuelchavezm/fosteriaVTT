package com.fosteriaVTT.fosteriaVTT_backend.Pestaña;

import com.fosteriaVTT.fosteriaVTT_backend.Campaña.Campaña;
import com.fosteriaVTT.fosteriaVTT_backend.Campaña.CampañaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Capa.Capa;
import com.fosteriaVTT.fosteriaVTT_backend.Capa.CapaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Jugador.JugadorRepository;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PestañaCampañaResponse;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class PestañaService {

	private static final int NIVEL_CAPA_MAPA = 2;

	private final PestañaRepository pestañaRepository;
	private final CapaRepository capaRepository;
	private final JugadorRepository jugadorRepository;
	private final CampañaRepository campañaRepository;

	public PestañaService(
			PestañaRepository pestañaRepository,
			CapaRepository capaRepository,
			JugadorRepository jugadorRepository,
			CampañaRepository campañaRepository
	) {
		this.pestañaRepository = pestañaRepository;
		this.capaRepository = capaRepository;
		this.jugadorRepository = jugadorRepository;
		this.campañaRepository = campañaRepository;
	}

	@Transactional
	public PestañaCampañaResponse abrirOCrearUltimaPestaña(Long campañaId, String username) {
		jugadorRepository.buscarPorUsuarioYCampaniaId(username, campañaId)
				.orElseThrow(() -> new ResponseStatusException(FORBIDDEN, "No tienes acceso a esta campaña"));

		Pestaña pestaña = pestañaRepository.findTopByCampañaIdOrderByUltimaVezUsadaDesc(campañaId)
				.orElseGet(() -> crearPestañaPorDefecto(campañaId));

		asegurarCapasBase(pestaña);

		pestaña.setUltimaVezUsada(LocalDateTime.now());
		Pestaña pestañaActualizada = pestañaRepository.save(pestaña);
		String mapaCapaUrl = capaRepository.findByPestañaIdAndNivelDeCapa(pestañaActualizada.getId(), NIVEL_CAPA_MAPA)
				.map(capa -> capa.getMapa() == null ? null : capa.getMapa().getMapa())
				.orElse(null);

		return new PestañaCampañaResponse(
				pestañaActualizada.getId(),
				pestañaActualizada.getNombre(),
				pestañaActualizada.getNCuadriculasX(),
				pestañaActualizada.getNCuadriculasY(),
				pestañaActualizada.getDistanciaCasilla(),
				pestañaActualizada.getSistemaMetrico(),
				pestañaActualizada.getNieblaDeGuerra(),
				pestañaActualizada.getImagenBaseUrl(),
				mapaCapaUrl,
				pestañaActualizada.getUltimaVezUsada()
		);
	}

	private Pestaña crearPestañaPorDefecto(Long campañaId) {
		Campaña campaña = campañaRepository.findById(campañaId)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "La campaña no existe"));

		Pestaña nuevaPestaña = Pestaña.crearPorDefecto(campaña);
		Pestaña guardada = pestañaRepository.save(nuevaPestaña);
		crearCapasBase(guardada);
		return guardada;
	}

	private void asegurarCapasBase(Pestaña pestaña) {
		List<Capa> capas = capaRepository.findByPestañaIdOrderByNivelDeCapaAsc(pestaña.getId());
		if (capas.size() >= 3
				&& capas.stream().anyMatch(capa -> Integer.valueOf(1).equals(capa.getNivelDeCapa()))
				&& capas.stream().anyMatch(capa -> Integer.valueOf(2).equals(capa.getNivelDeCapa()))
				&& capas.stream().anyMatch(capa -> Integer.valueOf(3).equals(capa.getNivelDeCapa()))) {
			return;
		}

		if (capas.stream().noneMatch(capa -> Integer.valueOf(1).equals(capa.getNivelDeCapa()))) {
			crearCapa(pestaña, 1, "capa de fichas");
		}

		if (capas.stream().noneMatch(capa -> Integer.valueOf(2).equals(capa.getNivelDeCapa()))) {
			crearCapa(pestaña, 2, "capa de mapa");
		}

		if (capas.stream().noneMatch(capa -> Integer.valueOf(3).equals(capa.getNivelDeCapa()))) {
			crearCapa(pestaña, 3, "capa de DM");
		}
	}

	private void crearCapasBase(Pestaña pestaña) {
		crearCapa(pestaña, 1, "capa de fichas");
		crearCapa(pestaña, 2, "capa de mapa");
		crearCapa(pestaña, 3, "capa de DM");
	}

	private void crearCapa(Pestaña pestaña, int nivel, String nombre) {
		Capa capa = Capa.builder()
				.nombre(nombre)
				.nivelDeCapa(nivel)
				.pestaña(pestaña)
				.build();
		capaRepository.save(capa);
	}
}