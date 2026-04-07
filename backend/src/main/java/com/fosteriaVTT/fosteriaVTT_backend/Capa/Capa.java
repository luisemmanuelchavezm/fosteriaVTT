package com.fosteriaVTT.fosteriaVTT_backend.Capa;

import com.fosteriaVTT.fosteriaVTT_backend.Pestaña.Pestaña;
import com.fosteriaVTT.fosteriaVTT_backend.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
public class Capa extends BaseEntity {

    @Column(nullable = false)
    private Integer nivelDeCapa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pestaña_id", nullable = false)
    private Pestaña pestaña;
}