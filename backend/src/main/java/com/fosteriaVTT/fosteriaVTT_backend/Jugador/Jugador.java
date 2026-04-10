package com.fosteriaVTT.fosteriaVTT_backend.Jugador;

import com.fosteriaVTT.fosteriaVTT_backend.Campaña.Campaña;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario;
import com.fosteriaVTT.fosteriaVTT_backend.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(
        name = "jugadores",
        uniqueConstraints = @UniqueConstraint(columnNames = {"usuario_id", "campaña_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Jugador extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaña_id", nullable = false)
    private Campaña campaña;

    @Builder.Default
    @Column(name = "ultima_vez_accedido", nullable = false)
    private LocalDateTime ultimaVezAccedido = LocalDateTime.now();

    @PrePersist
    void prePersist() {
        if (ultimaVezAccedido == null) {
            ultimaVezAccedido = LocalDateTime.now();
        }
    }
}