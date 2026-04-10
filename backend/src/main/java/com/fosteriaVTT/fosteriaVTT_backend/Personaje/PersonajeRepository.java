package com.fosteriaVTT.fosteriaVTT_backend.Personaje;

import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PersonajeRepository extends JpaRepository<Personaje, Long> {
	List<Personaje> findByUsuarioUsernameOrderByUsadoDesc(String username);
	Optional<Personaje> findByIdAndUsuarioUsername(Long id, String username);

	@Query("""
			select p from Personaje p
			where p.usuario.username = :username
			and (:nombre = '' or lower(p.nombre) like concat('%', :nombre, '%'))
			and (:sinSistemas = true or p.sistemaDeJuego in :sistemas)
			order by p.usado desc
			""")
	Page<Personaje> buscarPorFiltros(
			@Param("username") String username,
			@Param("nombre") String nombre,
			@Param("sistemas") List<SistemaDeJuego> sistemas,
			@Param("sinSistemas") boolean sinSistemas,
			Pageable pageable
	);
}