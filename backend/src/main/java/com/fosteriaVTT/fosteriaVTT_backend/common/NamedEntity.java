package com.fosteriaVTT.fosteriaVTT_backend.common;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.*;import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;

@MappedSuperclass
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder // Fundamental para que el Builder arrastre el ID y el Nombre
public abstract class NamedEntity extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String nombre;
}