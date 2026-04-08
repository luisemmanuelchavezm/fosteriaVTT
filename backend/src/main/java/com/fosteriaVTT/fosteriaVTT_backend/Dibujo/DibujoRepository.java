package com.fosteriaVTT.fosteriaVTT_backend.Dibujo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DibujoRepository extends JpaRepository<Dibujo, Long> {
}