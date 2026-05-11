package com.fosteriaVTT.fosteriaVTT_backend.Capa;

import java.util.ArrayList;
import java.util.List;

import com.fosteriaVTT.fosteriaVTT_backend.Mapa.Mapa;
import com.fosteriaVTT.fosteriaVTT_backend.Pestaña.Pestaña;
import com.fosteriaVTT.fosteriaVTT_backend.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
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
public class Capa extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false)
    private Integer nivelDeCapa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pestaña_id", nullable = false)
    private Pestaña pestaña;

    @Builder.Default
    @ManyToMany
    @JoinTable(
        name = "mapa_capa",
        joinColumns = @JoinColumn(name = "capa_id"),
        inverseJoinColumns = @JoinColumn(name = "mapa_id")
    )
    private List<Mapa> mapas = new ArrayList<>();
}