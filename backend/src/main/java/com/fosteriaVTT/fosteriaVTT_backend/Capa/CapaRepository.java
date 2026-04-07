package com.fosteriaVTT.fosteriaVTT_backend.Capa;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CapaRepository extends JpaRepository<Capa, Long> {
}