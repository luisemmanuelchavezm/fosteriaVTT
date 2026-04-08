package com.fosteriaVTT.fosteriaVTT_backend.Pestaña;

import com.fosteriaVTT.fosteriaVTT_backend.Campaña.Campaña;
import com.fosteriaVTT.fosteriaVTT_backend.common.NamedEntity;
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
public class Pestaña extends NamedEntity {

    @Column(nullable = false)
    private Integer nCuadriculasX;

    @Column(nullable = false)
    private Integer nCuadriculasY;

    @Column(nullable = false)
    private Integer distanciaCasilla;

    @Column(nullable = false)
    private String nieblaDeGuerra;

    @Column(nullable = false)
    private String sistemaMetrico;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaña_id", nullable = false)
    private Campaña campaña;
}