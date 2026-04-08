package com.fosteriaVTT.fosteriaVTT_backend.Habilidad;

import java.util.ArrayList;
import java.util.List;

import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.common.NamedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinTable;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToMany;
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

    @ManyToMany
    @JoinTable(
        name = "personaje_habilidad",
        joinColumns = @JoinColumn(name = "habilidad_id"),
        inverseJoinColumns = @JoinColumn(name = "personaje_id")
    )
    @Builder.Default
    private List<Personaje> personajes = new ArrayList<>();
}