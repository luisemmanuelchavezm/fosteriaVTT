package com.fosteriaVTT.fosteriaVTT_backend.Jugador;

import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface JugadorRepository extends JpaRepository<Jugador, Long> {

    List<Jugador> findTop5ByUsuarioIdOrderByUltimaVezAccedidoDesc(Long usuarioId);

    List<Jugador> findByUsuarioIdOrderByUltimaVezAccedidoDesc(Long usuarioId);

        @Query(
            value = """
                select j from Jugador j
                join j.campaña c
                join c.dm dm
                where j.usuario.username = :username
                and (:nombre = '' or lower(c.nombre) like concat('%', :nombre, '%'))
                and (:sinSistemas = true or c.sistemaDeJuego in :sistemas)
                and (:dm = '' or lower(dm.username) like concat('%', :dm, '%'))
                order by j.ultimaVezAccedido desc
                """,
            countQuery = """
                select count(j) from Jugador j
                join j.campaña c
                join c.dm dm
                where j.usuario.username = :username
                and (:nombre = '' or lower(c.nombre) like concat('%', :nombre, '%'))
                and (:sinSistemas = true or c.sistemaDeJuego in :sistemas)
                and (:dm = '' or lower(dm.username) like concat('%', :dm, '%'))
                """
        )
        Page<Jugador> buscarPorFiltros(
            @Param("username") String username,
            @Param("nombre") String nombre,
            @Param("sistemas") List<SistemaDeJuego> sistemas,
            @Param("sinSistemas") boolean sinSistemas,
            @Param("dm") String dm,
            Pageable pageable
        );
}