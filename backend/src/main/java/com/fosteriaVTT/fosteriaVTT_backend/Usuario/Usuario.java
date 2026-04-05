package com.fosteriaVTT.fosteriaVTT_backend.Usuario;

import java.util.ArrayList;
import java.util.List;

import com.fosteriaVTT.fosteriaVTT_backend.Campaña.Campaña;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Builder.Default
    @Column
    private String avatar = "https://res.cloudinary.com/doxqtmi46/image/upload/w_400,h_400,c_fill,g_auto,f_auto/v1775176044/Dame_el_personaje_202604030019_jop3pc.jpg";
    
    @ManyToMany(mappedBy = "jugadores") 
    @Builder.Default
    private List<Campaña> campañasParticipadas = new ArrayList<>();

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Rol role = Rol.USER;
}
