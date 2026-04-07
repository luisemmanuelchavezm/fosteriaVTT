package com.fosteriaVTT.fosteriaVTT_backend.Pestaña;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PestañaRepository extends JpaRepository<Pestaña, Long> {
}