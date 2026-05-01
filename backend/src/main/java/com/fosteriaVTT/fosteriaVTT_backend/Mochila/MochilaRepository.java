package com.fosteriaVTT.fosteriaVTT_backend.Mochila;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MochilaRepository extends JpaRepository<Mochila, Long> {
	List<Mochila> findByPersonajeIdOrderByIdAsc(Long personajeId);
	Optional<Mochila> findByIdAndPersonajeId(Long id, Long personajeId);
}