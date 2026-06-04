package com.fosteriaVTT.fosteriaVTT_backend.Pestaña;

import com.fosteriaVTT.fosteriaVTT_backend.Campaña.Campaña;
import com.fosteriaVTT.fosteriaVTT_backend.common.NamedEntity;
import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Builder;
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
    @Builder.Default
    private Integer nCuadriculasX = 20;

    @Column(nullable = false)
    @Builder.Default
    private Integer nCuadriculasY = 20;

    @Column(nullable = false)
    @Builder.Default
    private Integer distanciaCasilla = 5;

    @Column(columnDefinition = "TEXT")
    private String nieblaDeGuerra;

    @Column(nullable = false)
    @Builder.Default
    private String sistemaMetrico = "ft";

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime ultimaVezUsada = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaña_id", nullable = false)
    private Campaña campaña;

    public static Pestaña crearPorDefecto(Campaña campaña) {
        return Pestaña.builder()
                .nombre("Pestaña principal")
                .nCuadriculasX(20)
                .nCuadriculasY(20)
                .distanciaCasilla(5)
                .sistemaMetrico("ft")
                .ultimaVezUsada(LocalDateTime.now())
                .campaña(campaña)
                .build();
    }
}