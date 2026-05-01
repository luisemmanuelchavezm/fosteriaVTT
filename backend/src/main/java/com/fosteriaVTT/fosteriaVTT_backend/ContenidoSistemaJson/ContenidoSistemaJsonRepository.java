package com.fosteriaVTT.fosteriaVTT_backend.ContenidoSistemaJson;

import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContenidoSistemaJsonRepository extends JpaRepository<ContenidoSistemaJson, Long> {

    Optional<ContenidoSistemaJson> findBySistemaAndPaquete(SistemaDeJuego sistema, String paquete);
}