package com.fosteriaVTT.fosteriaVTT_backend.Mochila;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MochilaRepository extends JpaRepository<Mochila, Long> {
}