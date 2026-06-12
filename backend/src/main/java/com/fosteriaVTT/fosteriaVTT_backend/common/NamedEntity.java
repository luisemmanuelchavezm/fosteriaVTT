package com.fosteriaVTT.fosteriaVTT_backend.common;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.*;
import lombok.experimental.SuperBuilder;

@MappedSuperclass
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder 
public abstract class NamedEntity extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String nombre;
}