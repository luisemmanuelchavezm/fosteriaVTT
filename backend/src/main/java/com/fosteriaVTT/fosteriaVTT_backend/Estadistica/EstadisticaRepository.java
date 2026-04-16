package com.fosteriaVTT.fosteriaVTT_backend.Estadistica;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EstadisticaRepository extends JpaRepository<Estadistica, Long> {
	List<Estadistica> findByPersonajeIdOrderByIdAsc(Long personajeId);
}