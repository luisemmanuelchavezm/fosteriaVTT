package com.fosteriaVTT.fosteriaVTT_backend.Punto;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PuntoRepository extends JpaRepository<Punto, Long> {
}