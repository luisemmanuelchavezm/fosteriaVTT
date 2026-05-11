package com.fosteriaVTT.fosteriaVTT_backend.Punto;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PuntoRepository extends JpaRepository<Punto, Long> {
	List<Punto> findByDibujoIdInOrderByIdAsc(List<Long> dibujoIds);
	void deleteByDibujoId(Long dibujoId);
}