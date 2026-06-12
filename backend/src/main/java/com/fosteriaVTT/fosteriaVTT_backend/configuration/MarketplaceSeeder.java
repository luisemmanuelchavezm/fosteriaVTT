package com.fosteriaVTT.fosteriaVTT_backend.configuration;

import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.Estadistica;
import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.EstadisticaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.HabilidadRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Mapa.Mapa;
import com.fosteriaVTT.fosteriaVTT_backend.Mapa.MapaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Mochila.Mochila;
import com.fosteriaVTT.fosteriaVTT_backend.Mochila.MochilaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.Objeto;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.ObjetoRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.TipoObjeto;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.PersonajeRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Rol;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.UserRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario;
import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class MarketplaceSeeder {

    @Bean
    @Order(6)
    CommandLineRunner seedSistemaAndLaBestia(
            UserRepository userRepository,
            PersonajeRepository personajeRepository,
            EstadisticaRepository estadisticaRepository,
            HabilidadRepository habilidadRepository,
            ObjetoRepository objetoRepository,
            MochilaRepository mochilaRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            Usuario sistema = userRepository.findByUsername("sistema")
                .orElseGet(() -> userRepository.save(buildUser(
                    "sistema",
                    "sistema@fosteria.vtt",
                    passwordEncoder.encode("Sistema2024!"),
                    null
                )));

            boolean laBestiaExists = personajeRepository
                .findByUsuarioUsernameOrderByUsadoDesc("sistema").stream()
                .anyMatch(p -> p.getNombre().equalsIgnoreCase("La Bestia"));

            if (!laBestiaExists) {
                String biografia =
                    "Aberración feérica grande, Neutral Malvada\n\n" +
                    "Una presencia ancestral que acecha los bosques perdidos entre la desesperación y el olvido. " +
                    "La Bestia rara vez se muestra por completo: adopta formas imposibles hechas de ramas, sombras, " +
                    "cuernos y rostros apenas visibles entre la oscuridad. Su verdadera fuerza no reside en el combate " +
                    "físico, sino en quebrar lentamente la voluntad de los viajeros hasta convertirlos en árboles de " +
                    "Edelwood para alimentar su linterna eterna.";

                Personaje laBestia = personajeRepository.save(Personaje.builder()
                    .nombre("La Bestia")
                    .tags("enemigo,vd;8 (3.900 PX)")
                    .sistemaDeJuego(SistemaDeJuego.DND)
                    .retrato("https://res.cloudinary.com/doxqtmi46/image/upload/v1778970458/la_bestia_jfv00t.jpg")
                    .biografia(biografia)
                    .esPublico(true)
                    .usuario(sistema)
                    .build());

                estadisticaRepository.saveAll(List.of(
                    Estadistica.builder().nombre("Fuerza").valor(18).personaje(laBestia).build(),
                    Estadistica.builder().nombre("Destreza").valor(18).personaje(laBestia).build(),
                    Estadistica.builder().nombre("Constitucion").valor(16).personaje(laBestia).build(),
                    Estadistica.builder().nombre("Inteligencia").valor(14).personaje(laBestia).build(),
                    Estadistica.builder().nombre("Sabiduria").valor(17).personaje(laBestia).build(),
                    Estadistica.builder().nombre("Carisma").valor(20).personaje(laBestia).build(),
                    Estadistica.builder().nombre("CA").valor(17).personaje(laBestia).build(),
                    Estadistica.builder().nombre("Puntos de vida").valor(136).personaje(laBestia).build(),
                    Estadistica.builder().nombre("Vida actual").valor(136).personaje(laBestia).build(),
                    Estadistica.builder().nombre("Vida temporal").valor(0).personaje(laBestia).build(),
                    Estadistica.builder().nombre("Movimiento").valor(40).personaje(laBestia).build(),
                    Estadistica.builder().nombre("Iniciativa").valor(4).personaje(laBestia).build(),
                    Estadistica.builder().nombre("Engano").valor(8).personaje(laBestia).build(),
                    Estadistica.builder().nombre("Intimidacion").valor(8).personaje(laBestia).build(),
                    Estadistica.builder().nombre("Percepcion").valor(6).personaje(laBestia).build(),
                    Estadistica.builder().nombre("Sigilo").valor(7).personaje(laBestia).build()
                ));

                List<Habilidad> pasivas = habilidadRepository.saveAll(List.of(
                    buildSkill("Inmunidad a estados", null,
                        "Asustado, hechizado.",
                        "NPC,PASIVA"),
                    buildSkill("Resistencias al daño", null,
                        "Frío, necrótico; daño contundente, cortante y perforante de ataques no mágicos.",
                        "NPC,PASIVA"),
                    buildSkill("Sentidos", null,
                        "Visión en la oscuridad 120 pies, Percepción pasiva 16.",
                        "NPC,PASIVA"),
                    buildSkill("Presencia Devoradora", null,
                        "Las criaturas a 30 pies de La Bestia tienen desventaja en tiradas de salvación contra miedo. " +
                        "Las llamas no mágicas dentro de ese rango se atenúan o se extinguen.",
                        "NPC,PASIVA"),
                    buildSkill("Amo del Bosque Perdido", null,
                        "Mientras esté en bosques o zonas oscuras, La Bestia puede intentar esconderse incluso " +
                        "estando parcialmente visible.",
                        "NPC,PASIVA"),
                    buildSkill("Susurros de Desesperación", null,
                        "Al inicio de cada turno de una criatura que pueda oír a La Bestia, esta debe superar una " +
                        "salvación de Sabiduría CD 16 o sufrir desventaja en su siguiente tirada de ataque.",
                        "NPC,PASIVA"),
                    buildSkill("Forma Incierta", null,
                        "La Bestia puede atravesar criaturas y objetos como si fueran terreno difícil. " +
                        "Recibe (1d10) de daño de fuerza si termina su turno dentro de un objeto.",
                        "NPC,PASIVA")
                ));

                Objeto garras = objetoRepository.save(Objeto.builder()
                    .nombre("Garras de Edelwood")
                    .indice("BONO_ATAQUE=7")
                    .formula("2d10 + 4 + 2d6")
                    .descripcion("Garras primigenias de madera Edelwood que desgarran la carne y el alma.")
                    .tipoObjeto(TipoObjeto.ARMA)
                    .build());

                Objeto consumirEsperanzaObj = objetoRepository.save(Objeto.builder()
                    .nombre("Consumir Esperanza")
                    .indice("BONO_ATAQUE=7")
                    .formula("6d6")
                    .descripcion("La Bestia drena la esperanza de una criatura asustada o inconsciente, causando daño psíquico y recuperando vida.")
                    .tipoObjeto(TipoObjeto.ARMA)
                    .build());

                List<Habilidad> acciones = habilidadRepository.saveAll(List.of(
                    buildSkill("Garras de Edelwood", "2d10 + 4 + 2d6",
                        "Ataque de arma cuerpo a cuerpo: +7 al ataque, alcance 10 pies, un objetivo.\n" +
                        "Impacto: (2d10 + 4) puntos de daño cortante más (2d6) de daño necrótico.",
                        "NPC,ACCION,DND,ARMA,OBJETO," + garras.getId()),
                    buildSkill("Mirada del Extraviado (Recarga 5)", null,
                        "La Bestia fija sus innumerables ojos sobre una criatura a 60 pies.\n\n" +
                        "El objetivo debe realizar una tirada de salvación de Sabiduría CD 16.\n\n" +
                        "- Si falla, queda asustado durante 1 minuto.\n" +
                        "- Mientras esté asustado de esta manera, la criatura cree escuchar voces de seres queridos " +
                        "o promesas de descanso.\n" +
                        "- Puede repetir la salvación al final de cada turno.",
                        "NPC,ACCION"),
                    buildSkill("Consumir Esperanza", "6d6",
                        "La Bestia elige una criatura asustada o inconsciente a 5 pies.\n\n" +
                        "El objetivo recibe (6d6) de daño psíquico y La Bestia recupera una cantidad de puntos " +
                        "de golpe igual al daño causado.",
                        "NPC,ACCION,DND,ARMA,OBJETO," + consumirEsperanzaObj.getId()),
                    buildSkill("Deslizarse entre Sombras (acción adicional)", null,
                        "La Bestia se teletransporta hasta 30 pies a un espacio en penumbra u oscuridad que pueda ver.",
                        "NPC,ACCION")
                ));

                List<Habilidad> idiomasBestia = habilidadRepository.saveAll(List.of(
                    buildSkill("Idioma: Común", null, null, "NPC,IDIOMA"),
                    buildSkill("Idioma: Silvano", null, null, "NPC,IDIOMA"),
                    buildSkill("Idioma: Telepatía 120 pies", null, null, "NPC,IDIOMA")
                ));

                List<Habilidad> todasHabilidades = new ArrayList<>();
                todasHabilidades.addAll(pasivas);
                todasHabilidades.addAll(acciones);
                todasHabilidades.addAll(idiomasBestia);
                laBestia.getHabilidades().addAll(todasHabilidades);
                personajeRepository.save(laBestia);

                mochilaRepository.saveAll(List.of(
                    Mochila.builder().objeto(garras).personaje(laBestia).cantidad(1).equipado(true).build(),
                    Mochila.builder().objeto(consumirEsperanzaObj).personaje(laBestia).cantidad(1).equipado(true).build()
                ));
            }
        };
    }

    @Bean
    @Order(7)
    CommandLineRunner seedMarketplaceEnemigos(
            UserRepository userRepository,
            PersonajeRepository personajeRepository,
            EstadisticaRepository estadisticaRepository,
            HabilidadRepository habilidadRepository,
            ObjetoRepository objetoRepository,
            MochilaRepository mochilaRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            Usuario sistema = userRepository.findByUsername("sistema")
                .orElseGet(() -> userRepository.save(buildUser(
                    "sistema",
                    "sistema@fosteria.vtt",
                    passwordEncoder.encode("Sistema2024!"),
                    null
                )));

            // ── 1. GOLEM DE PETRICITA ──────────────────────────────────
            boolean golemExists = personajeRepository
                .findByUsuarioUsernameOrderByUsadoDesc("sistema").stream()
                .anyMatch(p -> p.getNombre().equalsIgnoreCase("Golem de Petricita"));

            if (!golemExists) {
                String bioGolem =
                    "Constructo mediano, sin alineamiento\n\n" +
                    "Este monstruoso golem de piedra blanca con vetas doradas fue creado para custodiar ruinas antiguas y templos olvidados. " +
                    "Sus pasos hacen temblar el suelo y su cuerpo parece tallado directamente de mármol sagrado.";

                Personaje golem = personajeRepository.save(Personaje.builder()
                    .nombre("Golem de Petricita")
                    .tags("enemigo,vd;2 (450 PX)")
                    .sistemaDeJuego(SistemaDeJuego.DND)
                    .retrato("https://res.cloudinary.com/doxqtmi46/image/upload/v1779714223/golem_de_petricita_myvsot.png")
                    .biografia(bioGolem)
                    .esPublico(true)
                    .usuario(sistema)
                    .build());

                estadisticaRepository.saveAll(List.of(
                    Estadistica.builder().nombre("Fuerza").valor(18).personaje(golem).build(),
                    Estadistica.builder().nombre("Destreza").valor(8).personaje(golem).build(),
                    Estadistica.builder().nombre("Constitucion").valor(16).personaje(golem).build(),
                    Estadistica.builder().nombre("Inteligencia").valor(3).personaje(golem).build(),
                    Estadistica.builder().nombre("Sabiduria").valor(10).personaje(golem).build(),
                    Estadistica.builder().nombre("Carisma").valor(5).personaje(golem).build(),
                    Estadistica.builder().nombre("CA").valor(14).personaje(golem).build(),
                    Estadistica.builder().nombre("Puntos de vida").valor(52).personaje(golem).build(),
                    Estadistica.builder().nombre("Vida actual").valor(52).personaje(golem).build(),
                    Estadistica.builder().nombre("Vida temporal").valor(0).personaje(golem).build(),
                    Estadistica.builder().nombre("Movimiento").valor(30).personaje(golem).build()
                ));

                List<Habilidad> pasivasGolem = habilidadRepository.saveAll(List.of(
                    buildSkill("Tirada de salvación", null, "Constitución +5", "NPC,PASIVA"),
                    buildSkill("Resistencias al daño", null,
                        "Perforante y cortante de ataques no mágicos.",
                        "NPC,PASIVA"),
                    buildSkill("Inmunidades a condiciones", null,
                        "Envenenado, agotamiento, asustado, encantado.",
                        "NPC,PASIVA"),
                    buildSkill("Sentidos", null,
                        "Visión en la oscuridad 60 pies, Percepción pasiva 10.",
                        "NPC,PASIVA"),
                    buildSkill("Cuerpo de Petricita", null,
                        "El golem tiene ventaja en tiradas de salvación contra efectos que alterarían su forma física o lo moverían contra su voluntad.",
                        "NPC,PASIVA"),
                    buildSkill("Guardián Incansable", null,
                        "El golem no necesita dormir, comer ni respirar.",
                        "NPC,PASIVA")
                ));

                Objeto golpePiedraObj = objetoRepository.save(Objeto.builder()
                    .nombre("Golpe de Piedra")
                    .indice("BONO_ATAQUE=6")
                    .formula("1d8+4")
                    .descripcion("Golpe contundente del golem de petricita.")
                    .tipoObjeto(TipoObjeto.ARMA)
                    .build());

                List<Habilidad> accionesGolem = habilidadRepository.saveAll(List.of(
                    buildSkill("Multiataque", null,
                        "El golem realiza dos ataques de Golpe de Piedra.",
                        "NPC,ACCION"),
                    buildSkill("Golpe de Piedra", "1d8+4",
                        "Ataque de arma cuerpo a cuerpo: +6 al ataque, alcance 5 pies, un objetivo.\n\n" +
                        "Daño: 1d8 + 4 de daño contundente.",
                        "NPC,ACCION,DND,ARMA,OBJETO," + golpePiedraObj.getId()),
                    buildSkill("Pisotón Sísmico (Recarga 3)", null,
                        "El golem golpea el suelo violentamente. Todas las criaturas a 10 pies deben superar una tirada de salvación de Destreza CD 13 o recibir 3d6 de daño contundente y quedar derribadas. Si superan la salvación, reciben la mitad del daño y no caen.",
                        "NPC,ACCION")
                ));

                List<Habilidad> idiomasGolem = habilidadRepository.saveAll(List.of(
                    buildSkill("Idioma: Entiende los idiomas de su creador pero no puede hablar", null, null, "NPC,IDIOMA")
                ));

                List<Habilidad> todasGolem = new ArrayList<>();
                todasGolem.addAll(pasivasGolem);
                todasGolem.addAll(accionesGolem);
                todasGolem.addAll(idiomasGolem);
                golem.getHabilidades().addAll(todasGolem);
                personajeRepository.save(golem);

                mochilaRepository.save(
                    Mochila.builder().objeto(golpePiedraObj).personaje(golem).cantidad(1).equipado(true).build()
                );
            }

            // ── 2. CULTISTA ───────────────────────────────────────────
            boolean cultistaExists = personajeRepository
                .findByUsuarioUsernameOrderByUsadoDesc("sistema").stream()
                .anyMatch(p -> p.getNombre().equalsIgnoreCase("Cultista"));

            if (!cultistaExists) {
                String bioCultista =
                    "Humanoide mediano (humano), caótico maligno\n\n" +
                    "Cubierto con túnicas oscuras y símbolos prohibidos, este cultista dedica su vida a rituales oscuros y sacrificios secretos. " +
                    "Sus ojos reflejan una fe enfermiza y una devoción absoluta a entidades antiguas.";

                Personaje cultista = personajeRepository.save(Personaje.builder()
                    .nombre("Cultista")
                    .tags("enemigo,vd;1 (200 PX)")
                    .sistemaDeJuego(SistemaDeJuego.DND)
                    .retrato("https://res.cloudinary.com/doxqtmi46/image/upload/v1779730313/Cultista_piy4hc.jpg")
                    .biografia(bioCultista)
                    .esPublico(true)
                    .usuario(sistema)
                    .build());

                estadisticaRepository.saveAll(List.of(
                    Estadistica.builder().nombre("Fuerza").valor(10).personaje(cultista).build(),
                    Estadistica.builder().nombre("Destreza").valor(14).personaje(cultista).build(),
                    Estadistica.builder().nombre("Constitucion").valor(12).personaje(cultista).build(),
                    Estadistica.builder().nombre("Inteligencia").valor(11).personaje(cultista).build(),
                    Estadistica.builder().nombre("Sabiduria").valor(13).personaje(cultista).build(),
                    Estadistica.builder().nombre("Carisma").valor(12).personaje(cultista).build(),
                    Estadistica.builder().nombre("CA").valor(13).personaje(cultista).build(),
                    Estadistica.builder().nombre("Puntos de vida").valor(24).personaje(cultista).build(),
                    Estadistica.builder().nombre("Vida actual").valor(24).personaje(cultista).build(),
                    Estadistica.builder().nombre("Vida temporal").valor(0).personaje(cultista).build(),
                    Estadistica.builder().nombre("Movimiento").valor(30).personaje(cultista).build()
                ));

                List<Habilidad> pasivasCultista = habilidadRepository.saveAll(List.of(
                    buildSkill("Tirada de salvación", null, "Sabiduría +3", "NPC,PASIVA"),
                    buildSkill("Devoción Fanática", null,
                        "El cultista tiene ventaja en tiradas de salvación contra ser asustado.",
                        "NPC,PASIVA"),
                    buildSkill("Sentidos", null,
                        "Percepción pasiva 11.",
                        "NPC,PASIVA"),
                    buildSkill("Reservas de Divinidad", null,
                        "El cultista comienza el combate con 0 puntos de divinidad. Algunas habilidades requieren gastar divinidad.",
                        "NPC,PASIVA")
                ));

                Objeto dagaSacrificialObj = objetoRepository.save(Objeto.builder()
                    .nombre("Daga Sacrificial")
                    .indice("BONO_ATAQUE=4")
                    .formula("1d4+2")
                    .descripcion("Daga ceremonial cubierta de sangre seca y runas oscuras.")
                    .tipoObjeto(TipoObjeto.ARMA)
                    .build());

                List<Habilidad> accionesCultista = habilidadRepository.saveAll(List.of(
                    buildSkill("Daga Sacrificial", "1d4+2",
                        "Ataque de arma cuerpo a cuerpo o a distancia: +4 al ataque, alcance 5 pies.\n\n" +
                        "El cultista realiza un corte rápido con una daga ceremonial cubierta de sangre seca y runas oscuras.\n\n" +
                        "Daño: 1d4 + 2 de daño perforante.",
                        "NPC,ACCION,DND,ARMA,OBJETO," + dagaSacrificialObj.getId()),
                    buildSkill("Sacrificio Profano", null,
                        "El cultista sacrifica su propia carne o la de un aliado voluntario a 5 pies.\n\n" +
                        "El objetivo pierde la mitad de sus puntos de golpe actuales y el cultista obtiene 2 puntos de divinidad.\n\n" +
                        "Si una criatura muere mediante este efecto, el cultista obtiene ventaja en su siguiente tirada de ataque.",
                        "NPC,ACCION"),
                    buildSkill("Llama del Eclipse (Consume 1 Divinidad)", null,
                        "El cultista invoca fuego oscuro desde sus manos hacia una criatura a 30 pies.\n\n" +
                        "El objetivo debe realizar una tirada de salvación de Destreza CD 12. Si falla, recibe 3d6 de daño necrótico y no puede recuperar puntos de golpe hasta el inicio del próximo turno del cultista.\n\n" +
                        "Si supera la salvación, recibe la mitad del daño.",
                        "NPC,ACCION"),
                    buildSkill("Marca del Hereje (Consume 1 Divinidad)", null,
                        "El cultista señala a una criatura que pueda ver a 30 pies mientras pronuncia una plegaria maldita.\n\n" +
                        "Hasta el final del siguiente turno del cultista, la criatura marcada tiene desventaja en tiradas de salvación de Sabiduría y recibe 1d4 de daño necrótico cada vez que realiza un ataque.",
                        "NPC,ACCION")
                ));

                List<Habilidad> idiomasCultista = habilidadRepository.saveAll(List.of(
                    buildSkill("Idioma: Común", null, null, "NPC,IDIOMA"),
                    buildSkill("Idioma: Infernal", null, null, "NPC,IDIOMA")
                ));

                List<Habilidad> todasCultista = new ArrayList<>();
                todasCultista.addAll(pasivasCultista);
                todasCultista.addAll(accionesCultista);
                todasCultista.addAll(idiomasCultista);
                cultista.getHabilidades().addAll(todasCultista);
                personajeRepository.save(cultista);

                mochilaRepository.save(
                    Mochila.builder().objeto(dagaSacrificialObj).personaje(cultista).cantidad(1).equipado(true).build()
                );
            }

            // ── 3. CULTISTA CORRUPTO ──────────────────────────────────
            boolean cultistaCorruptoExists = personajeRepository
                .findByUsuarioUsernameOrderByUsadoDesc("sistema").stream()
                .anyMatch(p -> p.getNombre().equalsIgnoreCase("Cultista Corrupto"));

            if (!cultistaCorruptoExists) {
                String bioCultistaCorrupto =
                    "Humanoide mediano (humano mutado), caótico maligno\n\n" +
                    "La corrupción consumió lentamente su cuerpo hasta deformarlo por completo. Su piel ennegrecida se agrieta dejando escapar energía oscura, " +
                    "mientras sus brazos mutados se transformaron en armas letales.";

                Personaje cultistaCorrupto = personajeRepository.save(Personaje.builder()
                    .nombre("Cultista Corrupto")
                    .tags("enemigo,vd;2 (450 PX)")
                    .sistemaDeJuego(SistemaDeJuego.DND)
                    .retrato("https://res.cloudinary.com/doxqtmi46/image/upload/v1779730317/Cultista_mutado_rjaii2.jpg")
                    .biografia(bioCultistaCorrupto)
                    .esPublico(true)
                    .usuario(sistema)
                    .build());

                estadisticaRepository.saveAll(List.of(
                    Estadistica.builder().nombre("Fuerza").valor(16).personaje(cultistaCorrupto).build(),
                    Estadistica.builder().nombre("Destreza").valor(12).personaje(cultistaCorrupto).build(),
                    Estadistica.builder().nombre("Constitucion").valor(16).personaje(cultistaCorrupto).build(),
                    Estadistica.builder().nombre("Inteligencia").valor(8).personaje(cultistaCorrupto).build(),
                    Estadistica.builder().nombre("Sabiduria").valor(12).personaje(cultistaCorrupto).build(),
                    Estadistica.builder().nombre("Carisma").valor(13).personaje(cultistaCorrupto).build(),
                    Estadistica.builder().nombre("CA").valor(14).personaje(cultistaCorrupto).build(),
                    Estadistica.builder().nombre("Puntos de vida").valor(46).personaje(cultistaCorrupto).build(),
                    Estadistica.builder().nombre("Vida actual").valor(46).personaje(cultistaCorrupto).build(),
                    Estadistica.builder().nombre("Vida temporal").valor(0).personaje(cultistaCorrupto).build(),
                    Estadistica.builder().nombre("Movimiento").valor(30).personaje(cultistaCorrupto).build()
                ));

                List<Habilidad> pasivasCultistaCorrupto = habilidadRepository.saveAll(List.of(
                    buildSkill("Tirada de salvación", null, "Constitución +5", "NPC,PASIVA"),
                    buildSkill("Resistencia Oscura", null,
                        "Resistencia al daño necrótico.",
                        "NPC,PASIVA"),
                    buildSkill("Inmunidades a condiciones", null,
                        "Asustado.",
                        "NPC,PASIVA"),
                    buildSkill("Sentidos", null,
                        "Visión en la oscuridad 60 pies, Percepción pasiva 11.",
                        "NPC,PASIVA"),
                    buildSkill("Reservas de Divinidad", null,
                        "El cultista comienza el combate con 0 puntos de divinidad. Algunas habilidades requieren gastar divinidad.",
                        "NPC,PASIVA"),
                    buildSkill("Sangre Corrupta", null,
                        "Cuando una criatura golpea al cultista corrupto con un ataque cuerpo a cuerpo estando a 5 pies, recibe 2 de daño necrótico.",
                        "NPC,PASIVA")
                ));

                Objeto garraCorruptaObj = objetoRepository.save(Objeto.builder()
                    .nombre("Garra Corrupta")
                    .indice("BONO_ATAQUE=5")
                    .formula("1d10+3")
                    .descripcion("Brazo mutado cubierto de venas negras y energía maldita.")
                    .tipoObjeto(TipoObjeto.ARMA)
                    .build());

                List<Habilidad> accionesCultistaCorrupto = habilidadRepository.saveAll(List.of(
                    buildSkill("Garra Corrupta", "1d10+3",
                        "Ataque de arma cuerpo a cuerpo: +5 al ataque, alcance 5 pies, un objetivo.\n\n" +
                        "El cultista ataca con su brazo mutado cubierto de venas negras y energía maldita, desgarrando carne y drenando vitalidad.\n\n" +
                        "Daño: 1d10 + 3 de daño cortante más 1d4 de daño necrótico.",
                        "NPC,ACCION,DND,ARMA,OBJETO," + garraCorruptaObj.getId()),
                    buildSkill("Sacrificio de Carne", null,
                        "El cultista desgarra parte de su propio cuerpo o consume la esencia vital de un aliado voluntario a 5 pies.\n\n" +
                        "El objetivo pierde la mitad de sus puntos de golpe actuales y el cultista obtiene 2 puntos de divinidad.\n\n" +
                        "Hasta el final de su siguiente turno, el cultista obtiene +2 a las tiradas de daño.",
                        "NPC,ACCION"),
                    buildSkill("Terreno Profano (Consume 1 Divinidad)", null,
                        "El cultista golpea el suelo liberando corrupción oscura que cubre un área de 15 pies centrada en él durante 3 turnos.\n\n" +
                        "El área se considera terreno difícil para criaturas que no adoren a la entidad del cultista.\n\n" +
                        "Además, cualquier criatura hostil que comience su turno dentro del área recibe 1d6 de daño necrótico.",
                        "NPC,ACCION"),
                    buildSkill("Mirada del Abismo (Consume 1 Divinidad)", null,
                        "El cultista fija sus ojos deformados en una criatura a 30 pies.\n\n" +
                        "El objetivo debe superar una tirada de salvación de Sabiduría CD 13 o quedar asustado hasta el final de su siguiente turno.\n\n" +
                        "Mientras esté asustado de esta forma, su velocidad se reduce en 10 pies.",
                        "NPC,ACCION")
                ));

                List<Habilidad> idiomasCultistaCorrupto = habilidadRepository.saveAll(List.of(
                    buildSkill("Idioma: Común", null, null, "NPC,IDIOMA"),
                    buildSkill("Idioma: Infernal", null, null, "NPC,IDIOMA")
                ));

                List<Habilidad> todasCultistaCorrupto = new ArrayList<>();
                todasCultistaCorrupto.addAll(pasivasCultistaCorrupto);
                todasCultistaCorrupto.addAll(accionesCultistaCorrupto);
                todasCultistaCorrupto.addAll(idiomasCultistaCorrupto);
                cultistaCorrupto.getHabilidades().addAll(todasCultistaCorrupto);
                personajeRepository.save(cultistaCorrupto);

                mochilaRepository.save(
                    Mochila.builder().objeto(garraCorruptaObj).personaje(cultistaCorrupto).cantidad(1).equipado(true).build()
                );
            }

            // ── 4. ESQUELETO ERRANTE ──────────────────────────────────
            boolean esqueletoExists = personajeRepository
                .findByUsuarioUsernameOrderByUsadoDesc("sistema").stream()
                .anyMatch(p -> p.getNombre().equalsIgnoreCase("Esqueleto Errante"));

            if (!esqueletoExists) {
                String bioEsqueleto =
                    "No muerto mediano, legal maligno\n\n" +
                    "Los restos animados de un antiguo guerrero se levantan una vez más para servir a fuerzas oscuras. " +
                    "Sus huesos rechinan al moverse y un tenue brillo verdoso arde en sus cuencas vacías.";

                Personaje esqueleto = personajeRepository.save(Personaje.builder()
                    .nombre("Esqueleto Errante")
                    .tags("enemigo,vd;1/4 (50 PX)")
                    .sistemaDeJuego(SistemaDeJuego.DND)
                    .retrato("https://res.cloudinary.com/doxqtmi46/image/upload/v1779731502/skeleton_xwmojs.jpg")
                    .biografia(bioEsqueleto)
                    .esPublico(true)
                    .usuario(sistema)
                    .build());

                estadisticaRepository.saveAll(List.of(
                    Estadistica.builder().nombre("Fuerza").valor(10).personaje(esqueleto).build(),
                    Estadistica.builder().nombre("Destreza").valor(14).personaje(esqueleto).build(),
                    Estadistica.builder().nombre("Constitucion").valor(15).personaje(esqueleto).build(),
                    Estadistica.builder().nombre("Inteligencia").valor(6).personaje(esqueleto).build(),
                    Estadistica.builder().nombre("Sabiduria").valor(8).personaje(esqueleto).build(),
                    Estadistica.builder().nombre("Carisma").valor(5).personaje(esqueleto).build(),
                    Estadistica.builder().nombre("CA").valor(13).personaje(esqueleto).build(),
                    Estadistica.builder().nombre("Puntos de vida").valor(13).personaje(esqueleto).build(),
                    Estadistica.builder().nombre("Vida actual").valor(13).personaje(esqueleto).build(),
                    Estadistica.builder().nombre("Vida temporal").valor(0).personaje(esqueleto).build(),
                    Estadistica.builder().nombre("Movimiento").valor(30).personaje(esqueleto).build()
                ));

                List<Habilidad> pasivasEsqueleto = habilidadRepository.saveAll(List.of(
                    buildSkill("Tirada de salvación", null, "Destreza +4", "NPC,PASIVA"),
                    buildSkill("Vulnerabilidad", null,
                        "Daño contundente.",
                        "NPC,PASIVA"),
                    buildSkill("Inmunidades a condiciones", null,
                        "Agotamiento, envenenado.",
                        "NPC,PASIVA"),
                    buildSkill("Sentidos", null,
                        "Visión en la oscuridad 60 pies, Percepción pasiva 9.",
                        "NPC,PASIVA"),
                    buildSkill("Naturaleza No Muerta", null,
                        "El esqueleto no necesita dormir, comer ni respirar.",
                        "NPC,PASIVA")
                ));

                Objeto espadaOxidadaObj = objetoRepository.save(Objeto.builder()
                    .nombre("Espada Oxidada")
                    .indice("BONO_ATAQUE=4")
                    .formula("1d6+2")
                    .descripcion("Espada corroída por el tiempo, usada con precisión antinatural.")
                    .tipoObjeto(TipoObjeto.ARMA)
                    .build());

                Objeto arcoQuebradoObj = objetoRepository.save(Objeto.builder()
                    .nombre("Arco Quebrado")
                    .indice("BONO_ATAQUE=4")
                    .formula("1d6+2")
                    .descripcion("Arco antiguo cubierto de polvo y grietas.")
                    .tipoObjeto(TipoObjeto.ARMA)
                    .build());

                List<Habilidad> accionesEsqueleto = habilidadRepository.saveAll(List.of(
                    buildSkill("Espada Oxidada", "1d6+2",
                        "Ataque de arma cuerpo a cuerpo: +4 al ataque, alcance 5 pies, un objetivo.\n\n" +
                        "El esqueleto corta con una espada corroída por el tiempo, moviéndose con precisión antinatural.\n\n" +
                        "Daño: 1d6 + 2 de daño cortante.",
                        "NPC,ACCION,DND,ARMA,OBJETO," + espadaOxidadaObj.getId()),
                    buildSkill("Arco Quebrado", "1d6+2",
                        "Ataque de arma a distancia: +4 al ataque, alcance 80/320 pies, un objetivo.\n\n" +
                        "El esqueleto dispara una flecha astillada desde un arco antiguo cubierto de polvo y grietas.\n\n" +
                        "Daño: 1d6 + 2 de daño perforante.",
                        "NPC,ACCION,DND,ARMA,OBJETO," + arcoQuebradoObj.getId())
                ));

                List<Habilidad> idiomasEsqueleto = habilidadRepository.saveAll(List.of(
                    buildSkill("Idioma: Entiende los idiomas que conoció en vida pero no puede hablar", null, null, "NPC,IDIOMA")
                ));

                List<Habilidad> todasEsqueleto = new ArrayList<>();
                todasEsqueleto.addAll(pasivasEsqueleto);
                todasEsqueleto.addAll(accionesEsqueleto);
                todasEsqueleto.addAll(idiomasEsqueleto);
                esqueleto.getHabilidades().addAll(todasEsqueleto);
                personajeRepository.save(esqueleto);

                mochilaRepository.saveAll(List.of(
                    Mochila.builder().objeto(espadaOxidadaObj).personaje(esqueleto).cantidad(1).equipado(true).build(),
                    Mochila.builder().objeto(arcoQuebradoObj).personaje(esqueleto).cantidad(1).equipado(true).build()
                ));
            }

            // ── 5. ZOMBIE PUTREFACTO ──────────────────────────────────
            boolean zombieExists = personajeRepository
                .findByUsuarioUsernameOrderByUsadoDesc("sistema").stream()
                .anyMatch(p -> p.getNombre().equalsIgnoreCase("Zombie Putrefacto"));

            if (!zombieExists) {
                String bioZombie =
                    "No muerto mediano, neutral maligno\n\n" +
                    "Este cadáver ambulante avanza lentamente impulsado por magia oscura. " +
                    "Trozos de carne podrida cuelgan de su cuerpo y un hedor insoportable lo rodea.";

                Personaje zombie = personajeRepository.save(Personaje.builder()
                    .nombre("Zombie Putrefacto")
                    .tags("enemigo,vd;1/4 (50 PX)")
                    .sistemaDeJuego(SistemaDeJuego.DND)
                    .retrato("https://res.cloudinary.com/doxqtmi46/image/upload/v1779731509/zombie_ztrcop.jpg")
                    .biografia(bioZombie)
                    .esPublico(true)
                    .usuario(sistema)
                    .build());

                estadisticaRepository.saveAll(List.of(
                    Estadistica.builder().nombre("Fuerza").valor(13).personaje(zombie).build(),
                    Estadistica.builder().nombre("Destreza").valor(6).personaje(zombie).build(),
                    Estadistica.builder().nombre("Constitucion").valor(16).personaje(zombie).build(),
                    Estadistica.builder().nombre("Inteligencia").valor(3).personaje(zombie).build(),
                    Estadistica.builder().nombre("Sabiduria").valor(6).personaje(zombie).build(),
                    Estadistica.builder().nombre("Carisma").valor(5).personaje(zombie).build(),
                    Estadistica.builder().nombre("CA").valor(8).personaje(zombie).build(),
                    Estadistica.builder().nombre("Puntos de vida").valor(22).personaje(zombie).build(),
                    Estadistica.builder().nombre("Vida actual").valor(22).personaje(zombie).build(),
                    Estadistica.builder().nombre("Vida temporal").valor(0).personaje(zombie).build(),
                    Estadistica.builder().nombre("Movimiento").valor(20).personaje(zombie).build()
                ));

                List<Habilidad> pasivasZombie = habilidadRepository.saveAll(List.of(
                    buildSkill("Tirada de salvación", null, "Constitución +5", "NPC,PASIVA"),
                    buildSkill("Fortaleza No Muerta", null,
                        "Cuando el zombie es reducido a 0 puntos de golpe, debe realizar una tirada de salvación de Constitución CD 5 + el daño recibido, a menos que el daño sea radiante o de un golpe crítico. Si tiene éxito, cae a 1 punto de golpe en lugar de 0.",
                        "NPC,PASIVA"),
                    buildSkill("Inmunidades a condiciones", null,
                        "Agotamiento, envenenado.",
                        "NPC,PASIVA"),
                    buildSkill("Sentidos", null,
                        "Visión en la oscuridad 60 pies, Percepción pasiva 8.",
                        "NPC,PASIVA"),
                    buildSkill("Hediondez Cadavérica", null,
                        "Las criaturas que comiencen su turno a 5 pies del zombie deben superar una tirada de salvación de Constitución CD 10 o tener desventaja en su siguiente tirada de ataque debido al nauseabundo olor.",
                        "NPC,PASIVA")
                ));

                Objeto golpePudridoObj = objetoRepository.save(Objeto.builder()
                    .nombre("Golpe Podrido")
                    .indice("BONO_ATAQUE=3")
                    .formula("1d6+1")
                    .descripcion("Lento pero brutal golpe con brazos putrefactos y cubiertos de sangre seca.")
                    .tipoObjeto(TipoObjeto.ARMA)
                    .build());

                Objeto morditaInfectaObj = objetoRepository.save(Objeto.builder()
                    .nombre("Mordita Infecta")
                    .indice("BONO_ATAQUE=3")
                    .formula("1d8+1")
                    .descripcion("Dientes ennegrecidos que desgarran y propagan corrupción.")
                    .tipoObjeto(TipoObjeto.ARMA)
                    .build());

                List<Habilidad> accionesZombie = habilidadRepository.saveAll(List.of(
                    buildSkill("Golpe Podrido", "1d6+1",
                        "Ataque de arma cuerpo a cuerpo: +3 al ataque, alcance 5 pies, un objetivo.\n\n" +
                        "El zombie lanza un lento pero brutal golpe con sus brazos putrefactos y cubiertos de sangre seca.\n\n" +
                        "Daño: 1d6 + 1 de daño contundente.",
                        "NPC,ACCION,DND,ARMA,OBJETO," + golpePudridoObj.getId()),
                    buildSkill("Mordida Infecta", "1d8+1",
                        "Ataque de arma cuerpo a cuerpo: +3 al ataque, alcance 5 pies, un objetivo derribado o incapacitado.\n\n" +
                        "El zombie clava sus dientes ennegrecidos en la carne de la víctima intentando desgarrarla y propagar su corrupción.\n\n" +
                        "Daño: 1d8 + 1 de daño perforante.\n\n" +
                        "Si el objetivo es una criatura viva, no puede recuperar puntos de golpe hasta el inicio del siguiente turno del zombie.",
                        "NPC,ACCION,DND,ARMA,OBJETO," + morditaInfectaObj.getId())
                ));

                List<Habilidad> idiomasZombie = habilidadRepository.saveAll(List.of(
                    buildSkill("Idioma: Entiende los idiomas que conoció en vida pero no puede hablar", null, null, "NPC,IDIOMA")
                ));

                List<Habilidad> todasZombie = new ArrayList<>();
                todasZombie.addAll(pasivasZombie);
                todasZombie.addAll(accionesZombie);
                todasZombie.addAll(idiomasZombie);
                zombie.getHabilidades().addAll(todasZombie);
                personajeRepository.save(zombie);

                mochilaRepository.saveAll(List.of(
                    Mochila.builder().objeto(golpePudridoObj).personaje(zombie).cantidad(1).equipado(true).build(),
                    Mochila.builder().objeto(morditaInfectaObj).personaje(zombie).cantidad(1).equipado(true).build()
                ));
            }
        };
    }

    @Bean
    @Order(8)
    CommandLineRunner seedMarketplaceMaps(
            UserRepository userRepository,
            MapaRepository mapaRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            Usuario sistema = userRepository.findByUsername("sistema")
                .orElseGet(() -> userRepository.save(buildUser(
                    "sistema",
                    "sistema@fosteria.vtt",
                    passwordEncoder.encode("Sistema2024!"),
                    null
                )));

            seedMapIfMissing(mapaRepository,
                "mapa_base",
                "https://res.cloudinary.com/doxqtmi46/image/upload/v1778449741/imagen_base_pesta%C3%B1a_xgtcmo.jpg",
                false, "sistema,base", sistema);

            seedMapIfMissing(mapaRepository,
                "Templo Druídico",
                "https://res.cloudinary.com/doxqtmi46/image/upload/v1779733235/templo_druidico_ms4xjw.jpg",
                true, "templo,druida,naturaleza", sistema);

            seedMapIfMissing(mapaRepository,
                "Camino en el Bosque",
                "https://res.cloudinary.com/doxqtmi46/image/upload/v1779733235/camino_en_el_bosque_pmlywc.png",
                true, "bosque,camino,naturaleza", sistema);

            seedMapIfMissing(mapaRepository,
                "Santuario del Dios Antiguo",
                "https://res.cloudinary.com/doxqtmi46/image/upload/v1779733236/templo_del_dios_antiguo_ddizmt.png",
                true, "templo,santuario,antiguo", sistema);
        };
    }

    private void seedMapIfMissing(MapaRepository mapaRepository, String nombre, String url, boolean esPublico, String tags, Usuario usuario) {
        boolean exists = mapaRepository.findAll().stream()
            .anyMatch(m -> m.getNombre().equals(nombre) && m.getUsuario().getId().equals(usuario.getId()));
        if (!exists) {
            mapaRepository.save(Mapa.builder()
                .nombre(nombre)
                .mapa(url)
                .esPublico(esPublico)
                .tags(tags)
                .usuario(usuario)
                .build());
        }
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

    private Habilidad buildSkill(String nombre, String formula, String descripcion, String tags) {
        return SeederUtils.buildSkill(nombre, formula, descripcion, tags);
    }
}
