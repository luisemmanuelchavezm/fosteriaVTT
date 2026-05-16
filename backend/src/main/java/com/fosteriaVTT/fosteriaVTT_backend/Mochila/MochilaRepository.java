package com.fosteriaVTT.fosteriaVTT_backend.Mochila;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MochilaRepository extends JpaRepository<Mochila, Long> {
	List<Mochila> findByPersonajeIdOrderByIdAsc(Long personajeId);

	@Query("""
			select m
			from Mochila m
			join fetch m.objeto o
			where m.personaje.id = :personajeId
			order by m.id asc
			""")
	List<Mochila> findByPersonajeIdWithObjetoOrderByIdAsc(@Param("personajeId") Long personajeId);

	Optional<Mochila> findByIdAndPersonajeId(Long id, Long personajeId);
}