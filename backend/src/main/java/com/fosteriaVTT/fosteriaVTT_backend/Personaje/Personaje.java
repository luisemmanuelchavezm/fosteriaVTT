package com.fosteriaVTT.fosteriaVTT_backend.Personaje;

import java.util.ArrayList;
import java.time.LocalDateTime;
import java.util.List;

import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Posicion.Posicion;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario;
import com.fosteriaVTT.fosteriaVTT_backend.common.NamedEntity;
import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "personajes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Personaje extends NamedEntity {

    @Column(columnDefinition = "TEXT")
    private String biografia;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SistemaDeJuego sistemaDeJuego;

    @Builder.Default
    @Column(nullable = false)
    private boolean esPublico = false;

    @Column(length = 80)
    private String tags;

    @Column(length = 500)
    private String retrato;

    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime usado = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Builder.Default
    @ManyToMany
    @JoinTable(
        name = "personaje_habilidad",
        joinColumns = @JoinColumn(name = "personaje_id"),
        inverseJoinColumns = @JoinColumn(name = "habilidad_id")
    )
    private List<Habilidad> habilidades = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "posicion_id")
    private Posicion posicion;

    @PrePersist
    void assignUsadoIfMissing() {
        if (usado == null) {
            usado = LocalDateTime.now();
        }
    }
}