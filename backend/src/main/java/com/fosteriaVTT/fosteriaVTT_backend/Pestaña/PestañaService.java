package com.fosteriaVTT.fosteriaVTT_backend.Pestaña;

import com.fosteriaVTT.fosteriaVTT_backend.Campaña.Campaña;
import com.fosteriaVTT.fosteriaVTT_backend.Campaña.CampañaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Capa.Capa;
import com.fosteriaVTT.fosteriaVTT_backend.Capa.CapaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Dibujo.Dibujo;
import com.fosteriaVTT.fosteriaVTT_backend.Dibujo.DibujoRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Jugador.JugadorRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Posicion.PosicionRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Punto.PuntoRepository;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PestañaCampañaResponse;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class PestañaService {

	private static final int NIVEL_CAPA_MAPA = 2;

	private final PestañaRepository pestañaRepository;
	private final CapaRepository capaRepository;
	private final JugadorRepository jugadorRepository;
	private final CampañaRepository campañaRepository;
	private final DibujoRepository dibujoRepository;
	private final PuntoRepository puntoRepository;
	private final PosicionRepository posicionRepository;

	public PestañaService(
			PestañaRepository pestañaRepository,
			CapaRepository capaRepository,
			JugadorRepository jugadorRepository,
			CampañaRepository campañaRepository,
			DibujoRepository dibujoRepository,
			PuntoRepository puntoRepository,
			PosicionRepository posicionRepository
	) {
		this.pestañaRepository = pestañaRepository;
		this.capaRepository = capaRepository;
		this.jugadorRepository = jugadorRepository;
		this.campañaRepository = campañaRepository;
		this.dibujoRepository = dibujoRepository;
		this.puntoRepository = puntoRepository;
		this.posicionRepository = posicionRepository;
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

		Campaña campaña = campañaRepository.findById(campañaId)
				.orElse(null);
		String dmUsername = campaña == null || campaña.getDm() == null ? null : campaña.getDm().getUsername();

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
				pestañaActualizada.getUltimaVezUsada(),
				dmUsername
		);
	}

	@Transactional(readOnly = true)
	public List<PestañaCampañaResponse> listarPestañas(Long campañaId, String username) {
		jugadorRepository.buscarPorUsuarioYCampaniaId(username, campañaId)
				.orElseThrow(() -> new ResponseStatusException(FORBIDDEN, "No tienes acceso a esta campaña"));

		return pestañaRepository.findByCampañaIdOrderByUltimaVezUsadaDesc(campañaId).stream()
				.map(p -> {
					String mapaCapaUrl = capaRepository.findByPestañaIdAndNivelDeCapa(p.getId(), NIVEL_CAPA_MAPA)
							.map(capa -> capa.getMapa() == null ? null : capa.getMapa().getMapa())
							.orElse(null);
					return new PestañaCampañaResponse(
							p.getId(), p.getNombre(),
							p.getNCuadriculasX(), p.getNCuadriculasY(),
							p.getDistanciaCasilla(), p.getSistemaMetrico(),
							p.getNieblaDeGuerra(), p.getImagenBaseUrl(),
							mapaCapaUrl, p.getUltimaVezUsada(), null);
				})
				.toList();
	}

	@Transactional
	public PestañaCampañaResponse abrirPestañaEspecifica(Long campañaId, Long pestañaId, String username) {
		jugadorRepository.buscarPorUsuarioYCampaniaId(username, campañaId)
				.orElseThrow(() -> new ResponseStatusException(FORBIDDEN, "No tienes acceso a esta campaña"));

		Pestaña pestaña = pestañaRepository.findById(pestañaId)
				.filter(p -> p.getCampaña() != null && campañaId.equals(p.getCampaña().getId()))
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "La pestaña no existe en esta campaña"));

		asegurarCapasBase(pestaña);
		pestaña.setUltimaVezUsada(LocalDateTime.now());
		Pestaña updated = pestañaRepository.save(pestaña);

		String mapaCapaUrl = capaRepository.findByPestañaIdAndNivelDeCapa(updated.getId(), NIVEL_CAPA_MAPA)
				.map(capa -> capa.getMapa() == null ? null : capa.getMapa().getMapa())
				.orElse(null);

		Campaña campaña = campañaRepository.findById(campañaId).orElse(null);
		String dmUsername = campaña == null || campaña.getDm() == null ? null : campaña.getDm().getUsername();

		return new PestañaCampañaResponse(
				updated.getId(), updated.getNombre(),
				updated.getNCuadriculasX(), updated.getNCuadriculasY(),
				updated.getDistanciaCasilla(), updated.getSistemaMetrico(),
				updated.getNieblaDeGuerra(), updated.getImagenBaseUrl(),
				mapaCapaUrl, updated.getUltimaVezUsada(), dmUsername);
	}

	@Transactional
	public PestañaCampañaResponse actualizarConfiguracion(Long campañaId, Long pestañaId, ConfiguracionCasillasRequest request, String username) {
		Campaña campaña = campañaRepository.findById(campañaId)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "La campaña no existe"));
		if (campaña.getDm() == null || !campaña.getDm().getUsername().equals(username)) {
			throw new ResponseStatusException(FORBIDDEN, "Solo el DM puede configurar las casillas");
		}

		Pestaña pestaña = pestañaRepository.findById(pestañaId)
				.filter(p -> p.getCampaña() != null && campañaId.equals(p.getCampaña().getId()))
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "La pestaña no existe en esta campaña"));

		if (request.nCuadriculasX() != null) pestaña.setNCuadriculasX(request.nCuadriculasX());
		if (request.nCuadriculasY() != null) pestaña.setNCuadriculasY(request.nCuadriculasY());
		if (request.distanciaCasilla() != null) pestaña.setDistanciaCasilla(request.distanciaCasilla());
		if (request.sistemaMetrico() != null) pestaña.setSistemaMetrico(request.sistemaMetrico());

		Pestaña updated = pestañaRepository.save(pestaña);
		String mapaCapaUrl = capaRepository.findByPestañaIdAndNivelDeCapa(updated.getId(), NIVEL_CAPA_MAPA)
				.map(capa -> capa.getMapa() == null ? null : capa.getMapa().getMapa())
				.orElse(null);
		String dmUsername = campaña.getDm() == null ? null : campaña.getDm().getUsername();
		return new PestañaCampañaResponse(
				updated.getId(), updated.getNombre(),
				updated.getNCuadriculasX(), updated.getNCuadriculasY(),
				updated.getDistanciaCasilla(), updated.getSistemaMetrico(),
				updated.getNieblaDeGuerra(), updated.getImagenBaseUrl(),
				mapaCapaUrl, updated.getUltimaVezUsada(), dmUsername);
	}

	@Transactional
	public PestañaCampañaResponse crearNuevaPestaña(Long campañaId, String username) {
		jugadorRepository.buscarPorUsuarioYCampaniaId(username, campañaId)
				.orElseThrow(() -> new ResponseStatusException(FORBIDDEN, "No tienes acceso a esta campaña"));

		Campaña campaña = campañaRepository.findById(campañaId)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "La campaña no existe"));

		long count = pestañaRepository.countByCampañaId(campañaId);
		String nombre = count == 0 ? "Pestaña principal" : "Pestaña " + (count + 1);

		Pestaña nueva = Pestaña.builder()
				.nombre(nombre)
				.nCuadriculasX(20)
				.nCuadriculasY(20)
				.distanciaCasilla(5)
				.sistemaMetrico("ft")
				.nieblaDeGuerra("true")
				.imagenBaseUrl("https://res.cloudinary.com/doxqtmi46/image/upload/v1778449741/imagen_base_pesta%C3%B1a_xgtcmo.jpg")
				.ultimaVezUsada(LocalDateTime.now())
				.campaña(campaña)
				.build();

		Pestaña guardada = pestañaRepository.save(nueva);
		crearCapasBase(guardada);

		String dmUsername = campaña.getDm() == null ? null : campaña.getDm().getUsername();
		return new PestañaCampañaResponse(
				guardada.getId(), guardada.getNombre(),
				guardada.getNCuadriculasX(), guardada.getNCuadriculasY(),
				guardada.getDistanciaCasilla(), guardada.getSistemaMetrico(),
				guardada.getNieblaDeGuerra(), guardada.getImagenBaseUrl(),
				null, guardada.getUltimaVezUsada(), dmUsername);
	}

	@Transactional
	public void eliminarPestaña(Long campañaId, Long pestañaId, String username) {
		// Solo el DM puede borrar pestañas
		Campaña campaña = campañaRepository.findById(campañaId)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "La campaña no existe"));
		if (campaña.getDm() == null || !campaña.getDm().getUsername().equals(username)) {
			throw new ResponseStatusException(FORBIDDEN, "Solo el DM puede borrar pestañas");
		}

		// La pestaña debe existir y pertenecer a la campaña
		Pestaña pestaña = pestañaRepository.findById(pestañaId)
				.filter(p -> p.getCampaña() != null && campañaId.equals(p.getCampaña().getId()))
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "La pestaña no existe en esta campaña"));

		// No se puede borrar la única pestaña
		long total = pestañaRepository.countByCampañaId(campañaId);
		if (total <= 1) {
			throw new ResponseStatusException(BAD_REQUEST, "No puedes borrar la única pestaña de la campaña");
		}

		// 1. Puntos de los dibujos de esta pestaña
		List<Dibujo> dibujos = dibujoRepository.findByCapaPestañaIdOrderByIdAsc(pestañaId);
		List<Long> dibujoIds = dibujos.stream().map(Dibujo::getId).toList();
		if (!dibujoIds.isEmpty()) {
			puntoRepository.deleteByDibujoIdIn(dibujoIds);
		}

		// 2. Dibujos
		dibujoRepository.deleteAll(dibujos);

		// 3. Posiciones
		posicionRepository.deleteAll(posicionRepository.findByCapaPestañaIdOrderByIdAsc(pestañaId));

		// 4. Capas
		capaRepository.deleteAll(capaRepository.findByPestañaIdOrderByNivelDeCapaAsc(pestañaId));

		// 5. Pestaña
		pestañaRepository.delete(pestaña);
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