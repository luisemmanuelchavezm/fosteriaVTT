package com.fosteriaVTT.fosteriaVTT_backend.Posicion;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PosicionRepository extends JpaRepository<Posicion, Long> {
	List<Posicion> findByCapaPestañaIdOrderByIdAsc(Long pestañaId);
	Optional<Posicion> findByPersonajeId(Long personajeId);
}