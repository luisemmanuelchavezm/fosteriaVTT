package com.fosteriaVTT.fosteriaVTT_backend.configuration;

import com.fosteriaVTT.fosteriaVTT_backend.Campaña.Campaña;
import com.fosteriaVTT.fosteriaVTT_backend.Campaña.CampañaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Jugador.Jugador;
import com.fosteriaVTT.fosteriaVTT_backend.Jugador.JugadorRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.PersonajeRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Rol;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.UserRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario;
import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DevelopmentDataSeeder {

    private static final String CHARACTER_IMAGE_ONE = "https://res.cloudinary.com/doxqtmi46/image/upload/v1775754806/nagyunn___unbnqi.jpg";
    private static final String CHARACTER_IMAGE_TWO = "https://res.cloudinary.com/doxqtmi46/image/upload/v1775754823/Adam___Lotm_fawd24.jpg";
    private static final String CHARACTER_IMAGE_THREE = "https://res.cloudinary.com/doxqtmi46/image/upload/v1775754871/Tower_of_God_Ep_13_-_Rachel_s_Side_-_I_drink_and_watch_anime_fsnuhe.jpg";
    private static final String CAMPAIGN_IMAGE_ONE = "https://res.cloudinary.com/doxqtmi46/image/upload/v1775754940/Stensia_Masquerade_MtG_Art_by_Willian_Murai_oqlyd7.jpg";
    private static final String CAMPAIGN_IMAGE_TWO = "https://res.cloudinary.com/doxqtmi46/image/upload/v1775754952/Lord_of_Mysteries_qthqex.jpg";

    @Bean
    CommandLineRunner seedDevelopmentData(
            UserRepository userRepository,
            PersonajeRepository personajeRepository,
            CampañaRepository campañaRepository,
            JugadorRepository jugadorRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            if (userRepository.count() > 0 || personajeRepository.count() > 0 || campañaRepository.count() > 0) {
                return;
            }

            String encodedPassword = passwordEncoder.encode("123456789");

            Usuario sai = userRepository.save(buildUser("sai", "sai@fosteria.dev", encodedPassword, "https://res.cloudinary.com/doxqtmi46/image/upload/w_400,h_400,c_fill,g_auto,f_auto/v1775176044/Dame_el_personaje_202604030019_jop3pc.jpg"));
            Usuario luna = userRepository.save(buildUser("luna", "luna@fosteria.dev", encodedPassword, CHARACTER_IMAGE_ONE));
            Usuario eris = userRepository.save(buildUser("eris", "eris@fosteria.dev", encodedPassword, CHARACTER_IMAGE_TWO));
            Usuario kael = userRepository.save(buildUser("kael", "kael@fosteria.dev", encodedPassword, CHARACTER_IMAGE_THREE));
            Usuario noa = userRepository.save(buildUser("noa", "noa@fosteria.dev", encodedPassword, CHARACTER_IMAGE_ONE));
            Usuario mira = userRepository.save(buildUser("mira", "mira@fosteria.dev", encodedPassword, CHARACTER_IMAGE_TWO));

                Campaña sombrasArkham = campañaRepository.save(buildCampaign("Sombras de Arkham", SistemaDeJuego.COC, sai, CAMPAIGN_IMAGE_ONE));
                Campaña dragonFall = campañaRepository.save(buildCampaign("Dragonfall", SistemaDeJuego.DND, sai, CAMPAIGN_IMAGE_TWO));
                Campaña mascaradaRoja = campañaRepository.save(buildCampaign("Mascarada Roja", SistemaDeJuego.VAMPIRE, sai, CAMPAIGN_IMAGE_ONE));
                Campaña ecosProfundos = campañaRepository.save(buildCampaign("Ecos Profundos", SistemaDeJuego.COC, sai, CAMPAIGN_IMAGE_TWO));
                Campaña tronoDeCeniza = campañaRepository.save(buildCampaign("Trono de Ceniza", SistemaDeJuego.DND, sai, CAMPAIGN_IMAGE_ONE));
                Campaña vigiliaGris = campañaRepository.save(buildCampaign("Vigilia Gris", SistemaDeJuego.VAMPIRE, sai, CAMPAIGN_IMAGE_TWO));
                Campaña misteriosDeLoen = campañaRepository.save(buildCampaign("Misterios de Loen", SistemaDeJuego.VAMPIRE, luna, CAMPAIGN_IMAGE_TWO));

            personajeRepository.saveAll(List.of(
                    buildCharacter("Amon", SistemaDeJuego.COC, CHARACTER_IMAGE_TWO, sai, LocalDateTime.now().minusHours(1)),
                    buildCharacter("Nagyun", SistemaDeJuego.DND, CHARACTER_IMAGE_ONE, sai, LocalDateTime.now().minusDays(1)),
                    buildCharacter("Rachel", SistemaDeJuego.VAMPIRE, CHARACTER_IMAGE_THREE, sai, LocalDateTime.now().minusDays(3)),
                    buildCharacter("Vera", SistemaDeJuego.COC, CHARACTER_IMAGE_ONE, sai, LocalDateTime.now().minusMinutes(25)),
                    buildCharacter("Caín", SistemaDeJuego.VAMPIRE, CHARACTER_IMAGE_TWO, sai, LocalDateTime.now().minusHours(6)),
                    buildCharacter("Orpheus", SistemaDeJuego.DND, CHARACTER_IMAGE_THREE, sai, LocalDateTime.now().minusHours(12)),
                    buildCharacter("Mirage", SistemaDeJuego.COC, CHARACTER_IMAGE_ONE, sai, LocalDateTime.now().minusDays(2)),
                    buildCharacter("Rowan", SistemaDeJuego.DND, CHARACTER_IMAGE_TWO, sai, LocalDateTime.now().minusDays(4)),
                    buildCharacter("Talia", SistemaDeJuego.VAMPIRE, CHARACTER_IMAGE_THREE, sai, LocalDateTime.now().minusDays(5)),
                    buildCharacter("Soren", SistemaDeJuego.COC, CHARACTER_IMAGE_ONE, sai, LocalDateTime.now().minusDays(6)),
                    buildCharacter("Dante", SistemaDeJuego.DND, CHARACTER_IMAGE_TWO, sai, LocalDateTime.now().minusDays(7)),
                    buildCharacter("Nyra", SistemaDeJuego.VAMPIRE, CHARACTER_IMAGE_THREE, sai, LocalDateTime.now().minusDays(8)),
                    buildCharacter("Lilith", SistemaDeJuego.VAMPIRE, CHARACTER_IMAGE_ONE, luna, LocalDateTime.now().minusHours(5)),
                    buildCharacter("Ciel", SistemaDeJuego.COC, CHARACTER_IMAGE_THREE, luna, LocalDateTime.now().minusDays(2)),
                    buildCharacter("Ezra", SistemaDeJuego.DND, CHARACTER_IMAGE_TWO, luna, LocalDateTime.now().minusDays(4)),
                    buildCharacter("Selene", SistemaDeJuego.COC, CHARACTER_IMAGE_ONE, luna, LocalDateTime.now().minusMinutes(40))
            ));

            jugadorRepository.saveAll(List.of(
                    buildPlayer(sai, sombrasArkham, LocalDateTime.now().minusMinutes(20)),
                    buildPlayer(luna, sombrasArkham, LocalDateTime.now().minusHours(10)),
                    buildPlayer(eris, sombrasArkham, LocalDateTime.now().minusDays(2)),
                    buildPlayer(kael, sombrasArkham, LocalDateTime.now().minusDays(3)),
                    buildPlayer(sai, dragonFall, LocalDateTime.now().minusHours(2)),
                    buildPlayer(noa, dragonFall, LocalDateTime.now().minusHours(12)),
                    buildPlayer(mira, dragonFall, LocalDateTime.now().minusDays(1)),
                    buildPlayer(sai, mascaradaRoja, LocalDateTime.now().minusHours(7)),
                    buildPlayer(luna, mascaradaRoja, LocalDateTime.now().minusDays(2)),
                    buildPlayer(eris, mascaradaRoja, LocalDateTime.now().minusDays(4)),
                    buildPlayer(noa, mascaradaRoja, LocalDateTime.now().minusDays(6)),
                    buildPlayer(sai, ecosProfundos, LocalDateTime.now().minusHours(8)),
                    buildPlayer(mira, ecosProfundos, LocalDateTime.now().minusDays(2)),
                    buildPlayer(sai, tronoDeCeniza, LocalDateTime.now().minusHours(4)),
                    buildPlayer(kael, tronoDeCeniza, LocalDateTime.now().minusDays(3)),
                    buildPlayer(noa, tronoDeCeniza, LocalDateTime.now().minusDays(5)),
                    buildPlayer(sai, vigiliaGris, LocalDateTime.now().minusHours(11)),
                    buildPlayer(luna, vigiliaGris, LocalDateTime.now().minusDays(1)),
                    buildPlayer(mira, vigiliaGris, LocalDateTime.now().minusDays(4)),
                    buildPlayer(luna, misteriosDeLoen, LocalDateTime.now().minusHours(3)),
                    buildPlayer(eris, misteriosDeLoen, LocalDateTime.now().minusDays(1)),
                    buildPlayer(kael, misteriosDeLoen, LocalDateTime.now().minusDays(3))
            ));
        };
    }

    private Usuario buildUser(String username, String email, String password, String avatar) {
        return Usuario.builder()
                .username(username)
                .email(email)
                .password(password)
                .avatar(avatar)
                .role(Rol.USER)
                .build();
    }

    private Campaña buildCampaign(String nombre, SistemaDeJuego sistema, Usuario dm, String portadaUrl) {
        return Campaña.builder()
                .nombre(nombre)
                .sistemaDeJuego(sistema)
                .dm(dm)
                .portadaUrl(portadaUrl)
                .build();
    }

    private Personaje buildCharacter(
            String nombre,
            SistemaDeJuego sistema,
            String retrato,
            Usuario usuario,
            LocalDateTime usado
    ) {
        return Personaje.builder()
                .nombre(nombre)
                .sistemaDeJuego(sistema)
                .retrato(retrato)
                .usuario(usuario)
                .usado(usado)
                .biografia("Personaje de prueba generado automaticamente")
                .build();
    }

    private Jugador buildPlayer(Usuario usuario, Campaña campaña, LocalDateTime ultimaVezAccedido) {
        return Jugador.builder()
                .usuario(usuario)
                .campaña(campaña)
                .ultimaVezAccedido(ultimaVezAccedido)
                .build();
    }
}