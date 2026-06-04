package com.fosteriaVTT.fosteriaVTT_backend.Personaje;

import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PersonajeRepository extends JpaRepository<Personaje, Long> {
	List<Personaje> findByUsuarioUsernameOrderByUsadoDesc(String username);
	Optional<Personaje> findByIdAndUsuarioUsername(Long id, String username);

	/** Comprueba si el usuario ya tiene una copia del personaje con id {@code sourceId} (usando tag fuenteId). */
	@Query("""
			select count(p) > 0 from Personaje p
			where p.usuario.username = :username
			and (lower(p.tags) like concat('%fuenteid;', :sourceId, ',%')
			     or lower(p.tags) like concat('%fuenteid;', :sourceId))
			""")
	boolean existsByFuenteTagAndUsuarioUsername(@Param("sourceId") String sourceId, @Param("username") String username);

	@Query("""
			select p from Personaje p
			where p.usuario.username = :username
			and (:nombre = '' or lower(p.nombre) like concat('%', :nombre, '%'))
			and (:sinSistemas = true or p.sistemaDeJuego in :sistemas)
			and (:incluirTodos = true
			     or p.tags is null
			     or (lower(p.tags) not like '%enemigo%' and lower(p.tags) not like '%pnj%'))
			and not (p.esPublico = true and lower(p.tags) like '%fuenteid;%')
			order by p.usado desc
			""")
	Page<Personaje> buscarPorFiltros(
			@Param("username") String username,
			@Param("nombre") String nombre,
			@Param("sistemas") List<SistemaDeJuego> sistemas,
			@Param("sinSistemas") boolean sinSistemas,
			@Param("incluirTodos") boolean incluirTodos,
			Pageable pageable
	);

	long countByUsuarioUsername(String username);

	@Query("""
			select p from Personaje p
			where p.usuario.username = :username
			and p.esPublico = true
			and (lower(p.tags) like '%enemigo%' or lower(p.tags) like '%pnj%')
			order by p.usado desc
			""")
	List<Personaje> findPublicNpcEnemiesByUsuarioUsername(@Param("username") String username);

	@Query("""
			select p from Personaje p
			where p.esPublico = true
			and (lower(p.tags) like '%enemigo%' or lower(p.tags) like '%pnj%')
			order by p.usado desc
			""")
	List<Personaje> findAllPublicNpcEnemies();

	@Modifying
	@Query(value = "DELETE FROM personaje_habilidad WHERE personaje_id = :personajeId", nativeQuery = true)
	void deleteHabilidadesByPersonajeId(@Param("personajeId") Long personajeId);

	@Query("""
			select p from Personaje p
			where p.esPublico = true
			and (lower(p.tags) like '%enemigo%' or lower(p.tags) like '%pnj%')
			and (:nombre = '' or lower(p.nombre) like concat('%', lower(:nombre), '%'))
			and (:tipo = '' or lower(p.tags) like concat('%', lower(:tipo), '%'))
			order by p.usado desc
			""")
	Page<Personaje> buscarMarketplace(
			@Param("nombre") String nombre,
			@Param("tipo") String tipo,
			Pageable pageable
	);
}