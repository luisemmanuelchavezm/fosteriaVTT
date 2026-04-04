package com.fosteriaVTT.fosteriaVTT_backend.Campaña;

import com.fosteriaVTT.fosteriaVTT_backend.common.NamedEntity;
import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;

import java.util.ArrayList;
import java.util.List;

import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Campaña extends NamedEntity {

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "usuario_campaña",
        joinColumns = @JoinColumn(name = "campaña_id"), 
        inverseJoinColumns = @JoinColumn(name = "usuario_id")
    )
    @Builder.Default 
    private List<Usuario> jugadores = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SistemaDeJuego sistemaDeJuego;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dm_id", nullable = false)
    private Usuario dm;

    @Column(length = 500, nullable = false)
    @Builder.Default
    private String portadaUrl = "https://res.cloudinary.com/doxqtmi46/image/upload/f_auto,q_auto,w_1200,c_limit/v1775178243/campa%C3%B1aPlaceHolder_fhrfx2.png";
}