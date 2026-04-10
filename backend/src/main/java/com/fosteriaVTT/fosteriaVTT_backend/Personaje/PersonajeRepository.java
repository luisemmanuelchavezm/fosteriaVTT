package com.fosteriaVTT.fosteriaVTT_backend.Personaje;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PersonajeRepository extends JpaRepository<Personaje, Long> {
	List<Personaje> findByUsuarioUsernameOrderByUsadoDesc(String username);
	Optional<Personaje> findByIdAndUsuarioUsername(Long id, String username);
}