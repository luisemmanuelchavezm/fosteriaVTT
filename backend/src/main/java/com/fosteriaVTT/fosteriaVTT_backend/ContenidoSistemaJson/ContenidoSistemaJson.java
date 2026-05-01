package com.fosteriaVTT.fosteriaVTT_backend.ContenidoSistemaJson;

import com.fosteriaVTT.fosteriaVTT_backend.common.BaseEntity;
import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(
        name = "contenido_sistema_json",
        uniqueConstraints = @UniqueConstraint(columnNames = {"sistema", "paquete"})
)
public class ContenidoSistemaJson extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SistemaDeJuego sistema;

    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String paquete;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "json_b", nullable = false, columnDefinition = "jsonb")
    private String jsonB;
}