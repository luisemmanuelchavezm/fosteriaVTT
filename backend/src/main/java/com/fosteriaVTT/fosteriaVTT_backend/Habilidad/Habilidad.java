package com.fosteriaVTT.fosteriaVTT_backend.Habilidad;

import com.fosteriaVTT.fosteriaVTT_backend.common.NamedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Habilidad extends NamedEntity {

    @Column(length = 500)
    private String imagen;

    @Column(nullable = false)
    private String formula;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descripcion;
}