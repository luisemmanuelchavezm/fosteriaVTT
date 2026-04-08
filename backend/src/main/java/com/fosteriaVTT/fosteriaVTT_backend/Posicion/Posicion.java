package com.fosteriaVTT.fosteriaVTT_backend.Posicion;

import com.fosteriaVTT.fosteriaVTT_backend.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
public class Posicion extends BaseEntity {

    @Column(nullable = false)
    private Integer posicionX;

    @Column(nullable = false)
    private Integer posicionY;

    @Column(nullable = false)
    private Integer largo;

    @Column(nullable = false)
    private Integer ancho;
}