package com.fosteriaVTT.fosteriaVTT_backend.Habilidad;

import com.fosteriaVTT.fosteriaVTT_backend.common.NamedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
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

    @Column(length = 50)
    private String clase;

    private Integer nivel;

    @Column(length = 500)
    private String imagen;

    private String formula;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Size(max = 300)
    @Column(length = 300)
    private String tags;
}