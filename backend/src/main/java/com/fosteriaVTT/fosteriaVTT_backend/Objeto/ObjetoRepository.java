package com.fosteriaVTT.fosteriaVTT_backend.Objeto;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ObjetoRepository extends JpaRepository<Objeto, Long> {
	List<Objeto> findByIndiceContainingIgnoreCaseOrderByIdAsc(String tag);
	List<Objeto> findByNombreIgnoreCaseOrderByIdAsc(String nombre);
}