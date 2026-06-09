package com.fosteriaVTT.fosteriaVTT_backend.common;

import java.time.LocalDateTime;

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
    @SequenceGenerator(
        name = "fosteria_gen", 
        sequenceName = "fosteria_sequence", 
        initialValue = 500, 
        allocationSize = 1 
    )
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "fosteria_gen")
    private Long id;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}