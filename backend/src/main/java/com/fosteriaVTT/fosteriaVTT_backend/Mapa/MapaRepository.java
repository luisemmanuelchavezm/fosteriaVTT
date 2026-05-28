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
	    and not (m.esPublico = true and lower(m.tags) like '%fuenteid;%')
	    order by m.updatedAt desc
	    """)
    Page<Mapa> buscarMapasPorUsuario(
	    @Param("username") String username,
	    @Param("nombre") String nombre,
	    Pageable pageable
    );

    Optional<Mapa> findByIdAndUsuarioUsername(Long id, String username);

    /** Comprueba si el usuario ya tiene una copia del mapa con id {@code sourceId} (usando tag fuenteId). */
    @Query("""
	    select count(m) > 0 from Mapa m
	    where m.usuario.username = :username
	    and (lower(m.tags) like concat('%fuenteid;', :sourceId, ',%')
	         or lower(m.tags) like concat('%fuenteid;', :sourceId))
	    """)
    boolean existsByFuenteTagAndUsuarioUsername(@Param("sourceId") String sourceId, @Param("username") String username);

    @Query("""
        select m from Mapa m
        where m.esPublico = true
        and (:nombre = '' or lower(m.nombre) like concat('%', lower(:nombre), '%'))
        order by m.updatedAt desc
        """)
    Page<Mapa> buscarMapasPublicos(
        @Param("nombre") String nombre,
        Pageable pageable
    );
}
