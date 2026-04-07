package com.fosteriaVTT.fosteriaVTT_backend.Mapa;

import java.util.ArrayList;
import java.util.List;

import com.fosteriaVTT.fosteriaVTT_backend.Capa.Capa;
import com.fosteriaVTT.fosteriaVTT_backend.Posicion.Posicion;
import com.fosteriaVTT.fosteriaVTT_backend.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
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
public class Mapa extends BaseEntity {

    @Column(nullable = false, columnDefinition = "TEXT")
    private String mapa;

    @Column(nullable = false)
    private boolean esPublico;

    private String tags;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "posicion_id")
    private Posicion posicion;

    @ManyToMany
    @JoinTable(
        name = "mapa_capa",
        joinColumns = @JoinColumn(name = "mapa_id"),
        inverseJoinColumns = @JoinColumn(name = "capa_id")
    )
    @Builder.Default
    private List<Capa> capas = new ArrayList<>();
}