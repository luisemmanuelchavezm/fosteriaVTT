package com.fosteriaVTT.fosteriaVTT_backend.Capa;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CapaRepository extends JpaRepository<Capa, Long> {
	List<Capa> findByPestañaIdOrderByNivelDeCapaAsc(Long pestañaId);
	Optional<Capa> findByPestañaIdAndNivelDeCapa(Long pestañaId, Integer nivelDeCapa);
}