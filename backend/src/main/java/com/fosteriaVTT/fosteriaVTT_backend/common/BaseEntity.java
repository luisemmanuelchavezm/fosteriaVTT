package com.fosteriaVTT.fosteriaVTT_backend.common;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@MappedSuperclass
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public abstract class BaseEntity {

    @Id
    // Definimos el generador de secuencia
    @SequenceGenerator(
        name = "fosteria_gen", 
        sequenceName = "fosteria_sequence", 
        initialValue = 500, // <--- AQUÍ pones que empiece en 500
        allocationSize = 1   // Incrementa de 1 en 1
    )
    // Le decimos al ID que use ese generador
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "fosteria_gen")
    private Long id;
}