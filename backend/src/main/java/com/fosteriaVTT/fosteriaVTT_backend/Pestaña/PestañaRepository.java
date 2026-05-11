package com.fosteriaVTT.fosteriaVTT_backend.Pestaña;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PestañaRepository extends JpaRepository<Pestaña, Long> {
	Optional<Pestaña> findTopByCampañaIdOrderByUltimaVezUsadaDesc(Long campañaId);
}