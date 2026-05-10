package com.fosteriaVTT.fosteriaVTT_backend.Chat;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatRepository extends JpaRepository<Chat, Long> {
	List<Chat> findByPersonajeIdAndMensajeLogTrueOrderByIdDesc(Long personajeId);

	@Query(
			"""
			select c from Chat c
			join fetch c.jugador j
			join fetch j.usuario u
			where c.campaña.id = :campaniaId
			and c.mensajeLog = false
			order by c.id asc
			"""
	)
	List<Chat> findMensajesNormalesPorCampania(@Param("campaniaId") Long campaniaId);
}