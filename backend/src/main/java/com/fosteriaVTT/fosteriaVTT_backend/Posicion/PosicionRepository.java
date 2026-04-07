package com.fosteriaVTT.fosteriaVTT_backend.Posicion;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PosicionRepository extends JpaRepository<Posicion, Long> {
}