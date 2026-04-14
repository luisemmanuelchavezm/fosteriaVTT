package com.fosteriaVTT.fosteriaVTT_backend.Habilidad;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HabilidadRepository extends JpaRepository<Habilidad, Long> {
    List<Habilidad> findByClaseOrderByNivelAscIdAsc(String clase);
}