package com.fosteriaVTT.fosteriaVTT_backend.Campaña;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CampañaRepository extends JpaRepository<Campaña, Long> {
    List<Campaña> findByDmId(Long dmId);
}