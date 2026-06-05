package com.fosteriaVTT.fosteriaVTT_backend.Usuario;

import com.fosteriaVTT.fosteriaVTT_backend.common.BaseEntity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Usuario extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Builder.Default
    @Column
    private String avatar = "https://res.cloudinary.com/doxqtmi46/image/upload/w_400,h_400,c_fill,g_auto,f_auto/v1775176044/Dame_el_personaje_202604030019_jop3pc.jpg";

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Rol role = Rol.USER;

    @Column
    private String recoverCode;

    @Column
    private LocalDateTime expiration;
}
