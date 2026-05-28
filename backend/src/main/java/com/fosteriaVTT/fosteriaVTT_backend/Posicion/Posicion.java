package com.fosteriaVTT.fosteriaVTT_backend.Posicion;

import com.fosteriaVTT.fosteriaVTT_backend.Capa.Capa;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
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

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "personaje_id", nullable = false, unique = true)
    private Personaje personaje;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "capa_id", nullable = false)
    private Capa capa;
}