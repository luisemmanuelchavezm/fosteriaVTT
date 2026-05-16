package com.fosteriaVTT.fosteriaVTT_backend.Mapa;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MapaRepository extends JpaRepository<Mapa, Long> {
    @Query("""
	    select m from Mapa m
	    where m.usuario.username = :username
	    and (:nombre = '' or lower(m.nombre) like concat('%', :nombre, '%'))
	    order by m.updatedAt desc
	    """)
    Page<Mapa> buscarMapasPorUsuario(
	    @Param("username") String username,
	    @Param("nombre") String nombre,
	    Pageable pageable
    );

    Optional<Mapa> findByIdAndUsuarioUsername(Long id, String username);
}