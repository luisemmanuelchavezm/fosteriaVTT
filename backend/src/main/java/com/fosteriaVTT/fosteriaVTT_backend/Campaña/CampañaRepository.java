package com.fosteriaVTT.fosteriaVTT_backend.Campaña;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CampañaRepository extends JpaRepository<Campaña, Long> {
}