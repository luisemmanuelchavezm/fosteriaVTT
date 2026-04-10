package com.fosteriaVTT.fosteriaVTT_backend.Jugador;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JugadorRepository extends JpaRepository<Jugador, Long> {

    List<Jugador> findTop5ByUsuarioIdOrderByUltimaVezAccedidoDesc(Long usuarioId);

    List<Jugador> findByUsuarioIdOrderByUltimaVezAccedidoDesc(Long usuarioId);
}