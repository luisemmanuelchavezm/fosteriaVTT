package com.fosteriaVTT.fosteriaVTT_backend.Punto;

import com.fosteriaVTT.fosteriaVTT_backend.Dibujo.Dibujo;
import com.fosteriaVTT.fosteriaVTT_backend.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
public class Punto extends BaseEntity {

    @Column(nullable = false)
    private Integer posicionX;

    @Column(nullable = false)
    private Integer posicionY;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dibujo_id", nullable = false)
    private Dibujo dibujo;
}