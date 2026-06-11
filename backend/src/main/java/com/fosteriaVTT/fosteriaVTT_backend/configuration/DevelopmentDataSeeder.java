package com.fosteriaVTT.fosteriaVTT_backend.configuration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fosteriaVTT.fosteriaVTT_backend.Campaña.Campaña;
import com.fosteriaVTT.fosteriaVTT_backend.Campaña.CampañaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Capa.Capa;
import com.fosteriaVTT.fosteriaVTT_backend.Capa.CapaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.ContenidoSistemaJson.ContenidoSistemaJsonService;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.HabilidadRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Jugador.Jugador;
import com.fosteriaVTT.fosteriaVTT_backend.Jugador.JugadorRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Mapa.Mapa;
import com.fosteriaVTT.fosteriaVTT_backend.Mapa.MapaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.Objeto;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.ObjetoRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.TipoObjeto;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.PersonajeRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils.DndCharacterCreationUtils;
import com.fosteriaVTT.fosteriaVTT_backend.Pestaña.Pestaña;
import com.fosteriaVTT.fosteriaVTT_backend.Pestaña.PestañaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Rol;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.UserRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario;
import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CrearPersonajeDndRequest;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DevelopmentDataSeeder {

    @Value("${admin.username:}")
    private String adminUsername;

    @Value("${admin.password:}")
    private String adminPassword;

    private static final String CHARACTER_IMAGE_ONE = "https://res.cloudinary.com/doxqtmi46/image/upload/v1775754806/nagyunn___unbnqi.jpg";
    private static final String CHARACTER_IMAGE_TWO = "https://res.cloudinary.com/doxqtmi46/image/upload/v1775754823/Adam___Lotm_fawd24.jpg";
    private static final String CHARACTER_IMAGE_THREE = "https://res.cloudinary.com/doxqtmi46/image/upload/v1775754871/Tower_of_God_Ep_13_-_Rachel_s_Side_-_I_drink_and_watch_anime_fsnuhe.jpg";

    @Bean
    @Order(0)
    CommandLineRunner seedSystemJsonContent(
            ObjectMapper objectMapper,
            ResourceLoader resourceLoader,
            ContenidoSistemaJsonService contenidoSistemaJsonService
    ) {
        return args -> CompletableFuture.runAsync(() -> {
            seedDndContentPackages(objectMapper, resourceLoader, contenidoSistemaJsonService);
            seedMorkBorgContentPackages(objectMapper, resourceLoader, contenidoSistemaJsonService);
        });
    }

    // NOTE: seedDndSpellCatalog (@Order 2) moved to DndSpellSeeder.java
    // NOTE: seedDndInstrumentCatalog (@Order 3), seedDndEquipmentCatalog (@Order 4),
    //       syncRequestedDndSkillTexts (@Order 5), syncWeaponAttacksPostSeeder (@Order 7)
    //       moved to DndEquipmentSeeder.java
    // NOTE: seedSistemaAndLaBestia (@Order 6), seedMarketplaceEnemigos (@Order 7),
    //       seedMarketplaceMaps (@Order 8) moved to MarketplaceSeeder.java

    @Bean
    @Order(0)
    CommandLineRunner seedAdminUser(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            if (adminUsername == null || adminUsername.isBlank() ||
                adminPassword == null || adminPassword.isBlank()) return;
            userRepository.findByUsername(adminUsername).orElseGet(() ->
                userRepository.save(Usuario.builder()
                    .username(adminUsername)
                    .email("fosteriavtt@gmail.com")
                    .password(passwordEncoder.encode(adminPassword))
                    .role(Rol.ADMIN)
                    .build())
            );
        };
    }

    @Bean
    @Order(1)
    CommandLineRunner seedDevelopmentData(
            UserRepository userRepository,
            PersonajeRepository personajeRepository,
            HabilidadRepository habilidadRepository,
            ObjetoRepository objetoRepository,
            MapaRepository mapaRepository,
            DndCharacterCreationUtils dndCharacterCreationUtils,
            PasswordEncoder passwordEncoder,
            CampañaRepository campañaRepository,
            JugadorRepository jugadorRepository,
            PestañaRepository pestañaRepository,
            CapaRepository capaRepository
    ) {
        return args -> {
            String encodedPassword = passwordEncoder.encode("123456789");

                Usuario sai = userRepository.findByUsername("sai")
                    .orElseGet(() -> userRepository.save(buildUser(
                        "sai",
                        "sai@fosteria.dev",
                        encodedPassword,
                        "https://res.cloudinary.com/doxqtmi46/image/upload/w_400,h_400,c_fill,g_auto,f_auto/v1775176044/Dame_el_personaje_202604030019_jop3pc.jpg"
                    )));

                habilidadRepository.saveAll(List.of(
                    buildSkill(
                        "Furia",
                        "Daño de furia: nivel 1-8 +2; nivel 9-15 +3; nivel 16-20 +4",
                        "puedes imbuirte de un poder primigenio llamado furia, una fuerza que te otorga una resistencia y potencia extraordinarias. puedes entrar en furia como acción adicional si no llevas armadura pesada.\n\n"
                            + "**Usos:** tienes un número limitado de usos, que recuperas al completar un descanso largo.\n\n"
                            + "mientras está activa:\n\n"
                            + "* **Resistencia al daño:** contundente, perforante y cortante\n"
                            + "* **Daño adicional:** al impactar con ataques basados en fuerza\n"
                            + "* **Ventaja en fuerza:** en pruebas y salvaciones\n"
                            + "* **Restricciones:** no puedes lanzar conjuros ni mantener concentración\n\n"
                            + "**Duración:** hasta 1 minuto. termina antes si no atacas ni recibes daño en un turno o si quedas inconsciente.",
						"CBarbaro;1,ResContundente+,ResPerforante+,ResCortante+,PruebaFuerza+,SalvacionFuerza+"
                    ),
                    buildSkill(
                        "Defensa sin armadura",
                        "10 + DES + CON",
                        "mientras no lleves armadura:\n\n"
                            + "**CA = 10 + destreza + constitución**\n\n"
                            + "puedes usar escudo.",
						"CBarbaro;1,Escudo"
                    ),
                    buildSkill(
                        "Ataque temerario",
                        null,
                        "puedes atacar con ferocidad descuidando tu defensa.\n\n"
                            + "* ventaja en ataques cuerpo a cuerpo con fuerza\n"
                            + "* los enemigos tienen ventaja contra ti hasta tu siguiente turno",
						"CBarbaro;2,Ataque+,Defensa-"
                    ),
                    buildSkill("Sentir el peligro", null, "tienes ventaja en las tiradas de salvación de destreza contra efectos que puedas ver, como trampas y conjuros, siempre que no estés cegado, ensordecido o incapacitado.", "CBarbaro;2,SalvacionDestreza+,Percepcion"),
                    buildSkill("Senda primordial", null, "eliges una senda primordial que moldea tu furia. Puedes seguir la senda del berserker o la senda del guerrero totémico.", "CBarbaro;3,Subclase"),
                    buildSkill("Frenesí", null, "cuando entras en furia puedes hacerlo con frenesí. mientras dure, puedes realizar un ataque con arma cuerpo a cuerpo como acción adicional en cada uno de tus turnos. al terminar la furia, sufres un nivel de agotamiento.", "CBarbaro;3,Berserker,Furia,Agotamiento"),
                    buildSkill("Buscador espiritual", null, "adquieres la capacidad de lanzar comunion con la naturaleza y hablar con los animales como rituales, aunque solo para comunicarte con espiritus totémicos.", "CBarbaro;3,Totemico,Conjuro,Ritual"),
                    buildSkill("Espiritu totemico", null, "eliges un espiritu totemico que te acompaña mientras estas en furia. oso: obtienes resistencia a todo el daño salvo psiquico. aguila: mientras no lleves armadura pesada, otras criaturas tienen desventaja en ataques de oportunidad contra ti. lobo: mientras estas en furia, tus aliados tienen ventaja en ataques cuerpo a cuerpo contra criaturas hostiles a 5 pies de ti.", "CBarbaro;3,Totemico,Defensa,Movimiento"),
                    buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CBarbaro;4,MejoraCaracteristica"),
                    buildSkill("Ataque adicional", "2 ataques por acción de atacar", "puedes atacar dos veces, en lugar de una, cada vez que realices la acción de atacar en tu turno.", "CBarbaro;5,Multiataque"),
                    buildSkill("Movimiento rápido", "+10 pies de velocidad", "tu velocidad aumenta en 10 pies mientras no lleves armadura pesada.", "CBarbaro;5,Velocidad+,Movimiento"),
                    buildSkill("Furia sin mente", null, "no puedes ser hechizado ni asustado mientras estés en furia. si ya lo estabas al entrar en furia, el efecto queda suspendido mientras dure.", "CBarbaro;6,Berserker,InmunidadHechizado,InmunidadAsustado"),
                    buildSkill("Aspecto de la bestia", null, "el animal de tu totem deja su huella fuera de la furia. oso: tu capacidad de carga se duplica y tienes ventaja en pruebas para empujar, arrastrar, levantar o romper objetos. aguila: puedes ver hasta una milla sin dificultad y distingues detalles diminutos a gran distancia. lobo: puedes seguir rastros a gran velocidad y moverte con sigilo normal mientras sigues a otras criaturas.", "CBarbaro;6,Totemico,Exploracion,Movimiento"),
                    buildSkill("Instinto salvaje", null, "tienes ventaja en las tiradas de iniciativa. además, si te sorprenden y no estás incapacitado, puedes actuar con normalidad en tu primer turno si entras en furia antes de hacer cualquier otra cosa.", "CBarbaro;7,Iniciativa+,Sorpresa"),
                    buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CBarbaro;8,MejoraCaracteristica"),
                    buildSkill("Crítico brutal (1 dado)", "+1 dado de daño en crítico", "puedes tirar un dado adicional de daño del arma al determinar el daño extra de un golpe crítico cuerpo a cuerpo.", "CBarbaro;9,Critico+,Daño+"),
                    buildSkill("Presencia intimidante", "CD = 8 + competencia + carisma", "puedes usar tu acción para aterrorizar a una criatura que esté a 30 pies o menos y pueda verte u oírte. debe superar una salvación de sabiduría o quedar asustada hasta el final de tu próximo turno. puedes usar tu acción en turnos siguientes para prolongar el efecto.", "CBarbaro;10,Berserker,Miedo,Control"),
                    buildSkill("Caminante espiritual", null, "puedes lanzar comunion con la naturaleza como ritual para entrar en contacto con tus espiritus totemicos y extraer guia del entorno.", "CBarbaro;10,Totemico,Conjuro,Ritual"),
                    buildSkill("Rabia implacable", "CD 10 + 5 por uso adicional", "si tus puntos de golpe caen a 0 mientras estás en furia y no mueres en el acto, puedes hacer una tirada de salvación de constitución con CD 10. si tienes éxito, te quedas con 1 punto de golpe. la CD aumenta en 5 cada vez que vuelves a usar este rasgo hasta que completes un descanso corto o largo.", "CBarbaro;11,Supervivencia,Constitucion"),
                    buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CBarbaro;12,MejoraCaracteristica"),
                    buildSkill("Crítico brutal (2 dados)", "+2 dados de daño en crítico", "al determinar el daño adicional de un golpe crítico cuerpo a cuerpo, añades dos dados extra de daño del arma en lugar de uno.", "CBarbaro;13,Critico+,Daño+"),
                    buildSkill("Represalia", "Reacción: 1 ataque cuerpo a cuerpo", "cuando una criatura que esté a 5 pies de ti te haga daño, puedes usar tu reacción para realizar un ataque con arma cuerpo a cuerpo contra esa criatura.", "CBarbaro;14,Berserker,Reaccion,Contraataque"),
                    buildSkill("Sintonia totemica", null, "tu vínculo con el espíritu totémico alcanza su punto máximo mientras estas en furia. oso: las criaturas hostiles a 5 pies de ti tienen desventaja al atacar a objetivos distintos de ti o de otro barbaro con este rasgo. aguila: obtienes una velocidad de vuelo igual a tu velocidad al caminar durante tu turno. lobo: cuando impactas con un ataque cuerpo a cuerpo puedes derribar a una criatura grande o menor, dejandola tumbada si falla una salvación de Fuerza.", "CBarbaro;14,Totemico,Control,Daño+"),
                    buildSkill("Rabia persistente", null, "tu furia ya no termina de forma anticipada solo porque no hayas atacado a una criatura hostil o no hayas recibido daño desde tu último turno.", "CBarbaro;15,Furia"),
                    buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CBarbaro;16,MejoraCaracteristica"),
                    buildSkill("Crítico brutal (3 dados)", "+3 dados de daño en crítico", "al determinar el daño adicional de un golpe crítico cuerpo a cuerpo, añades tres dados extra de daño del arma.", "CBarbaro;17,Critico+,Daño+"),
                    buildSkill("Poder indomable", null, "si el total de una prueba de fuerza es menor que tu puntuación de fuerza, puedes usar tu puntuación de fuerza en lugar del resultado del dado.", "CBarbaro;18,Fuerza,Pruebas"),
                    buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CBarbaro;19,MejoraCaracteristica"),
                    buildSkill("Campeón", "FUE +4, CON +4, máximo 24", "tus puntuaciones de fuerza y constitución aumentan en 4. además, el máximo de ambas puntuaciones pasa a ser 24.", "CBarbaro;20,Fuerza+,Constitucion+"),
                        buildSkill("Conjuro bardico", "CAR para conjuros; foco: instrumento", "accedes al lanzamiento de conjuros bardicos, lanzas con carisma y puedes usar un instrumento musical como foco.", "CBardo;1,Conjuro,Carisma"),
                        buildSkill("Inspiracion bardica (d6)", "usos = mod. CAR; dado d6", "como accion adicional inspiras a una criatura a 60 pies o menos para que sume un dado a una prueba, ataque o salvacion dentro de los 10 minutos siguientes.", "CBardo;1,Apoyo,Inspiracion,Carisma"),
                        buildSkill("Jack of All Trades", "+1/2 competencia a pruebas sin competencia", "sumas la mitad de tu bonificador de competencia, redondeando hacia abajo, a cualquier prueba de caracteristica en la que no seas competente.", "CBardo;2,Pruebas,Competencia"),
                        buildSkill("Cancion de descanso (d6)", "curacion extra 1d6", "durante un descanso corto, las criaturas aliadas que te oigan recuperan puntos de golpe extra al gastar dados de golpe.", "CBardo;2,Descanso,Curacion"),
                        buildSkill("Colegio bardico", null, "eliges un colegio bardico. Entre las opciones disponibles están el colegio del saber y el colegio del valor.", "CBardo;3,Subclase"),
                        buildSkill("Pericia", "doblas competencia en 2 habilidades", "eliges dos competencias en habilidades y duplicas tu bonificador de competencia en las pruebas que las usen.", "CBardo;3,Pericia,Habilidades"),
                        buildSkill("Competencias adicionales", "+3 habilidades", "al unirte al colegio del saber obtienes competencia en tres habilidades adicionales a tu eleccion.", "CBardo;3,Lore,Habilidades"),
                        buildSkill("Palabras hirientes", "Reaccion: resta dado de inspiracion", "puedes gastar una inspiracion bardica para reducir la tirada de ataque, dano o prueba de una criatura que te oiga.", "CBardo;3,Lore,Reaccion,Control"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CBardo;4,MejoraCaracteristica"),
                        buildSkill("Inspiracion bardica (d8)", "dado d8", "tu dado de inspiracion bardica mejora a d8.", "CBardo;5,Inspiracion,Escalado"),
                        buildSkill("Fuente de inspiracion", "recuperas usos en descanso corto o largo", "recuperas todos los usos de inspiracion bardica al terminar un descanso corto o largo.", "CBardo;5,Inspiracion,Descanso"),
                        buildSkill("Contracanto", "Ventaja contra hechizado y miedo", "puedes iniciar una interpretacion que da ventaja en salvaciones contra estar hechizado o asustado a ti y a tus aliados cercanos que te oigan.", "CBardo;6,Apoyo,Salvacion,Miedo,Hechizado"),
                        buildSkill("Secretos magicos adicionales", "+2 conjuros de cualquier clase", "el colegio del saber te permite aprender dos conjuros de cualquier lista sin que cuenten para tus conjuros bardicos conocidos.", "CBardo;6,Lore,Conjuro"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CBardo;8,MejoraCaracteristica"),
                        buildSkill("Cancion de descanso (d8)", "curacion extra 1d8", "la curacion adicional de tu cancion de descanso aumenta a 1d8.", "CBardo;9,Descanso,Curacion"),
                        buildSkill("Inspiracion bardica (d10)", "dado d10", "tu dado de inspiracion bardica mejora a d10.", "CBardo;10,Inspiracion,Escalado"),
                        buildSkill("Pericia", "doblas competencia en 2 habilidades mas", "eliges otras dos competencias en habilidades para duplicar tu bonificador de competencia.", "CBardo;10,Pericia,Habilidades"),
                        buildSkill("Secretos magicos", "+2 conjuros de cualquier clase", "aprendes dos conjuros de cualquier clase que cuenten como conjuros bardicos para ti.", "CBardo;10,Conjuro"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CBardo;12,MejoraCaracteristica"),
                        buildSkill("Cancion de descanso (d10)", "curacion extra 1d10", "la curacion adicional de tu cancion de descanso aumenta a 1d10.", "CBardo;13,Descanso,Curacion"),
                        buildSkill("Secretos magicos", "+2 conjuros de cualquier clase", "aprendes otros dos conjuros de cualquier clase que cuentan como bardicos para ti.", "CBardo;14,Conjuro"),
                        buildSkill("Habilidad sin par", "gastas inspiracion para mejorar una prueba", "puedes gastar una inspiracion bardica para sumar su dado a una prueba de caracteristica despues de tirar, antes de conocer el resultado.", "CBardo;14,Lore,Pruebas,Inspiracion"),
                        buildSkill("Inspiracion bardica (d12)", "dado d12", "tu dado de inspiracion bardica mejora a d12.", "CBardo;15,Inspiracion,Escalado"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CBardo;16,MejoraCaracteristica"),
                        buildSkill("Cancion de descanso (d12)", "curacion extra 1d12", "la curacion adicional de tu cancion de descanso aumenta a 1d12.", "CBardo;17,Descanso,Curacion"),
                        buildSkill("Secretos magicos", "+2 conjuros de cualquier clase", "aprendes dos conjuros adicionales de cualquier lista.", "CBardo;18,Conjuro"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CBardo;19,MejoraCaracteristica"),
                        buildSkill("Inspiracion superior", "recuperas 1 uso al tirar iniciativa si no te quedan", "si inicias combate sin usos de inspiracion bardica, recuperas uno al tirar iniciativa.", "CBardo;20,Inspiracion,Iniciativa"),
                        buildSkill("Conjuro clerical", "SAB para conjuros; foco: simbolo sagrado", "accedes al lanzamiento de conjuros clericales, preparas tus plegarias y usas sabiduria como caracteristica de conjuro.", "CClerigo;1,Conjuro,Sabiduria"),
                        buildSkill("Dominio divino", null, "eliges un dominio divino. Entre las opciones disponibles están conocimiento, vida, luz, naturaleza, tempestad, engaño y guerra.", "CClerigo;1,Subclase"),
                        buildSkill("Competencia adicional", "armadura pesada", "el dominio de la vida te concede competencia con armadura pesada.", "CClerigo;1,Vida,ArmaduraPesada"),
                        buildSkill("Discipulo de la vida", "+2 + nivel del conjuro a la curacion", "cuando lanzas un conjuro de nivel 1 o superior que cure puntos de golpe, la criatura recupera curacion adicional.", "CClerigo;1,Vida,Curacion"),
                        buildSkill("Canalizar divinidad", "1 uso por descanso", "canalizas energia divina para activar efectos de tu clase y de tu dominio.", "CClerigo;2,CanalDivino"),
                        buildSkill("Expulsar no muertos", null, "presentas tu simbolo sagrado para obligar a los no muertos cercanos a huir de ti durante un tiempo.", "CClerigo;2,CanalDivino,NoMuertos,Control"),
                        buildSkill("Preservar la vida", "cura total = 5 x nivel de clerigo", "como canal divino repartes curacion entre criaturas cercanas sin superar la mitad de sus puntos de golpe maximos.", "CClerigo;2,Vida,CanalDivino,Curacion"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CClerigo;4,MejoraCaracteristica"),
                        buildSkill("Destruir no muertos (CR 1/2)", "afecta a no muertos de CR 1/2 o menor", "cuando un no muerto falla contra expulsar no muertos, queda destruido si su desafio es lo bastante bajo.", "CClerigo;5,NoMuertos,CanalDivino,Daño+"),
                        buildSkill("Canalizar divinidad mejorado", "2 usos por descanso", "puedes usar canalizar divinidad dos veces entre descansos.", "CClerigo;6,CanalDivino"),
                        buildSkill("Sanador bendito", "te curas 2 + nivel del conjuro", "cuando curas a otra criatura con un conjuro de nivel 1 o superior, recuperas puntos de golpe.", "CClerigo;6,Vida,Curacion"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CClerigo;8,MejoraCaracteristica"),
                        buildSkill("Destruir no muertos (CR 1)", "afecta a no muertos de CR 1 o menor", "tu expulsar no muertos destruye automaticamente a no muertos mas poderosos.", "CClerigo;8,NoMuertos,CanalDivino,Daño+"),
                        buildSkill("Golpe divino", "+1d8 radiante al golpear; +2d8 al 14", "una vez por turno, al impactar con un arma puedes anadir dano radiante extra.", "CClerigo;8,Vida,Daño+,Radiante"),
                        buildSkill("Intervencion divina", "exito si sacas <= nivel en d100", "puedes implorar la ayuda directa de tu deidad para obtener un milagro apropiado a la situacion.", "CClerigo;10,IntervencionDivina"),
                        buildSkill("Destruir no muertos (CR 2)", "afecta a no muertos de CR 2 o menor", "tu umbral para destruir no muertos vuelve a mejorar.", "CClerigo;11,NoMuertos,CanalDivino,Daño+"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CClerigo;12,MejoraCaracteristica"),
                        buildSkill("Destruir no muertos (CR 3)", "afecta a no muertos de CR 3 o menor", "tu umbral para destruir no muertos vuelve a aumentar.", "CClerigo;14,NoMuertos,CanalDivino,Daño+"),
                        buildSkill("Destruir no muertos (CR 4)", "afecta a no muertos de CR 4 o menor", "tu expulsar no muertos puede aniquilar no muertos todavia mas poderosos.", "CClerigo;17,NoMuertos,CanalDivino,Daño+"),
                        buildSkill("Curacion suprema", "maximizas los dados de curacion", "cuando un conjuro te haria tirar dados para curar, usas el valor maximo de cada dado.", "CClerigo;17,Vida,Curacion"),
                        buildSkill("Canalizar divinidad superior", "3 usos por descanso", "puedes usar canalizar divinidad tres veces entre descansos.", "CClerigo;18,CanalDivino"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CClerigo;19,MejoraCaracteristica"),
                        buildSkill("Intervencion divina mejorada", "exito automatico", "tu deidad responde siempre a tu intervencion divina.", "CClerigo;20,IntervencionDivina"),
                        buildSkill("Druidico", null, "aprendes el lenguaje secreto de los druidas y puedes dejar mensajes ocultos para otros que lo conozcan.", "CDruida;1,Idioma,Druidico"),
                        buildSkill("Conjuro druida", "SAB para conjuros; foco: foco druida", "accedes al lanzamiento de conjuros druida y preparas conjuros usando sabiduria.", "CDruida;1,Conjuro,Sabiduria"),
                        buildSkill("Forma salvaje", "2 usos por descanso corto o largo", "puedes transformarte en bestias vistas anteriormente. la forma disponible mejora con tu nivel.", "CDruida;2,Transformacion,Bestia"),
                        buildSkill("Circulo druida", null, "eliges un círculo druida. Puedes seguir el círculo de la tierra o el círculo de la luna.", "CDruida;2,Subclase"),
                        buildSkill("Truco adicional", "+1 truco druida", "el circulo de la tierra te concede un truco druida extra que no cuenta para tu limite habitual.", "CDruida;2,Tierra,Truco"),
                        buildSkill("Recuperacion natural", "recuperas espacios con nivel total <= la mitad de tu nivel", "durante un descanso corto puedes recuperar parte de tu energia magica en forma de espacios de conjuro.", "CDruida;2,Tierra,Conjuro,Descanso"),
                        buildSkill("Mejora de forma salvaje", "CR 1/2; sin velocidad de vuelo", "tu forma salvaje admite bestias mas poderosas y quita parte de sus restricciones iniciales.", "CDruida;4,Transformacion,Bestia"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CDruida;4,MejoraCaracteristica"),
                        buildSkill("Paso por la tierra", null, "ignoras terreno dificil no magico por plantas y tienes ventaja contra efectos vegetales magicos que dificulten el movimiento.", "CDruida;6,Tierra,Movimiento,Salvacion"),
                        buildSkill("Mejora de forma salvaje", "CR 1; con velocidad de vuelo", "tu forma salvaje ahora puede adoptar bestias aun mas fuertes, incluidas formas con velocidad de vuelo.", "CDruida;8,Transformacion,Bestia"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CDruida;8,MejoraCaracteristica"),
                        buildSkill("Proteccion de la naturaleza", "inmune a veneno y enfermedad; inmune a hechizado y miedo de feericos y elementales", "la magia de la tierra te protege contra enfermedades, venenos y la influencia de ciertos seres sobrenaturales.", "CDruida;10,Tierra,InmunidadVeneno,InmunidadEnfermedad,InmunidadHechizado,InmunidadAsustado"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CDruida;12,MejoraCaracteristica"),
                        buildSkill("Santuario de la naturaleza", "salvacion SAB o cambian de objetivo", "bestias y plantas dudan en atacarte y pueden verse forzadas a fallar o a elegir otro objetivo.", "CDruida;14,Tierra,Defensa,Control"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CDruida;16,MejoraCaracteristica"),
                        buildSkill("Cuerpo intemporal", "envejeces 1 ano por cada 10 anos", "la magia primigenia ralentiza tu envejecimiento fisico.", "CDruida;18,Defensa,Longevidad"),
                        buildSkill("Conjuros bestiales", null, "puedes lanzar muchos de tus conjuros de druida mientras estas en forma salvaje.", "CDruida;18,Conjuro,Transformacion"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CDruida;19,MejoraCaracteristica"),
                        buildSkill("Archidruida", "forma salvaje ilimitada", "puedes usar forma salvaje sin limite y omitir muchos componentes de tus conjuros.", "CDruida;20,Transformacion,Conjuro"),
                        buildSkill("Estilo de combate", null, "eliges un estilo de combate que mejora un aspecto concreto de tu forma de luchar.", "CGuerrero;1,Combate"),
                        buildSkill("Segundo aliento", "Cura 1d10 + nivel de guerrero", "como accion adicional recuperas puntos de golpe gracias a tu reserva de aguante.", "CGuerrero;1,Curacion,Supervivencia"),
                        buildSkill("Arrebato de accion", "1 accion adicional", "en tu turno puedes realizar una accion adicional aparte de tu accion normal y posible accion adicional.", "CGuerrero;2,AccionExtra"),
                        buildSkill("Arquetipo marcial", null, "eliges un arquetipo marcial. Entre las opciones disponibles están campeón, maestro de batalla y caballero arcano.", "CGuerrero;3,Subclase"),
                        buildSkill("Critico mejorado", "critico con 19-20", "tus ataques con arma logran golpe critico con 19 o 20 en el d20.", "CGuerrero;3,Campeon,Critico+"),
                        buildSkill("Dados de supremacía", "4 dados d8; recuperas todo en descanso corto o largo", "aprendes a usar dados de supremacia para potenciar maniobras marciales. comienzas con cuatro dados de d8 y recuperas todos tus usos al terminar un descanso corto o largo.", "CGuerrero;3,MaestroDeBatalla,Combate,Descanso"),
                        buildSkill("Maniobras", "3 maniobras al nivel 3; +2 al 7, 10 y 15", "aprendes maniobras especiales que consumen tus dados de supremacia y mejoran tus ataques, defensa o apoyo tactico.", "CGuerrero;3,MaestroDeBatalla,Combate,Tactica"),
                        buildSkill("Lanzamiento de conjuros", "INT para conjuros", "aprendes magia arcana para complementar tu estilo de combate. lanzas conjuros de mago usando inteligencia como caracteristica de conjuro.", "CGuerrero;3,CaballeroArcano,Conjuro,Inteligencia"),
                        buildSkill("Vínculo con arma", "no te pueden desarmar; invocas el arma como accion adicional", "realizas un ritual con hasta dos armas para vincularte a ellas. mientras esten en tu mismo plano no puedes ser desarmado de ellas voluntariamente y puedes invocar una de las armas vinculadas a tu mano como accion adicional.", "CGuerrero;3,CaballeroArcano,Arma,AccionExtra"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CGuerrero;4,MejoraCaracteristica"),
                        buildSkill("Ataque extra", "2 ataques por accion de atacar", "puedes atacar dos veces cuando realizas la accion de atacar.", "CGuerrero;5,Multiataque"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CGuerrero;6,MejoraCaracteristica"),
                        buildSkill("Atleta notable", "+1/2 competencia a pruebas de FUE, DES y CON sin competencia", "sumas la mitad de tu competencia a ciertas pruebas fisicas y mejoras tus saltos con carrera.", "CGuerrero;7,Campeon,Pruebas,Movimiento"),
                        buildSkill("Magia de Guerra", "accion adicional: un ataque tras lanzar un truco", "cuando usas tu accion para lanzar un truco, puedes realizar un ataque con arma como accion adicional.", "CGuerrero;7,CaballeroArcano,Conjuro,AccionExtra,Ataque+"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CGuerrero;8,MejoraCaracteristica"),
                        buildSkill("Indomable", "repite 1 salvacion fallida por descanso largo", "puedes repetir una tirada de salvacion fallida, pero debes usar el nuevo resultado.", "CGuerrero;9,Salvacion"),
                        buildSkill("Estilo de combate adicional", null, "el campeon aprende un segundo estilo de combate.", "CGuerrero;10,Campeon,Combate"),
                        buildSkill("Golpe Sobrenatural", "los golpes con arma reducen la ventaja en salvaciones contra tus conjuros", "cuando impactas a una criatura con un ataque con arma, esa criatura tiene desventaja en la siguiente tirada de salvacion que haga contra un conjuro que lances antes de que acabe tu siguiente turno.", "CGuerrero;10,CaballeroArcano,Conjuro,Control"),
                        buildSkill("Ataque extra (2)", "3 ataques por accion de atacar", "ahora realizas tres ataques cuando usas la accion de atacar.", "CGuerrero;11,Multiataque"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CGuerrero;12,MejoraCaracteristica"),
                        buildSkill("Indomable", "2 usos por descanso largo", "puedes usar indomable dos veces entre descansos largos.", "CGuerrero;13,Salvacion"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CGuerrero;14,MejoraCaracteristica"),
                        buildSkill("Critico superior", "critico con 18-20", "tus ataques con arma hacen critico con 18, 19 o 20.", "CGuerrero;15,Campeon,Critico+"),
                        buildSkill("Carga Arcana", "teletransporte 30 pies al usar arrebato de accion", "si usas arrebato de accion puedes teletransportarte hasta 30 pies a un espacio que veas antes o despues de tu accion adicional.", "CGuerrero;15,CaballeroArcano,Movimiento,Teleportacion,AccionExtra"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CGuerrero;16,MejoraCaracteristica"),
                        buildSkill("Arrebato de accion mejorado", "2 usos por descanso", "puedes usar arrebato de accion dos veces entre descansos, aunque solo una vez por turno.", "CGuerrero;17,AccionExtra"),
                        buildSkill("Indomable", "3 usos por descanso largo", "puedes usar indomable tres veces entre descansos largos.", "CGuerrero;17,Salvacion"),
                        buildSkill("Magia de Guerra Mejorada", "ataque como accion adicional tras lanzar cualquier conjuro", "cuando usas tu accion para lanzar un conjuro, puedes realizar un ataque con arma como accion adicional.", "CGuerrero;18,CaballeroArcano,Conjuro,AccionExtra,Ataque+"),
                        buildSkill("Superviviente", "recuperas 5 + CON PG por turno si estas a mitad de vida o menos", "si estas herido pero no a 0 puntos de golpe, recuperas vida al inicio de cada turno.", "CGuerrero;18,Campeon,Curacion,Supervivencia"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CGuerrero;19,MejoraCaracteristica"),
                        buildSkill("Ataque extra (3)", "4 ataques por accion de atacar", "alcanzas cuatro ataques por cada accion de atacar.", "CGuerrero;20,Multiataque"),
                        buildSkill("Arremetida", "al impactar, gastas un dado para anadir dano y empujar", "cuando impactas con un ataque con arma puedes gastar un dado de supremacia para infligir dano adicional e intentar empujar al objetivo hacia atras.", "DND,Guerrero,MaestroDeBatalla,Maniobra"),
                        buildSkill("Ataque Amenazador", "al impactar, anades dano y puedes asustar", "cuando impactas con un ataque con arma puedes gastar un dado de supremacia para anadir dano e intentar asustar al objetivo.", "DND,Guerrero,MaestroDeBatalla,Maniobra"),
                        buildSkill("Ataque de Barrido", "al impactar, anades dano a otro objetivo cercano", "cuando impactas con un ataque cuerpo a cuerpo puedes gastar un dado de supremacia para herir tambien a otra criatura cercana.", "DND,Guerrero,MaestroDeBatalla,Maniobra"),
                        buildSkill("Ataque Preciso", "anades el dado a la tirada de ataque", "puedes gastar un dado de supremacia para mejorar una tirada de ataque antes o despues de tirar, pero antes de saber si impacta.", "DND,Guerrero,MaestroDeBatalla,Maniobra"),
                        buildSkill("Ataque Provocador", "al impactar, anades dano y marcas al objetivo", "cuando impactas puedes gastar un dado de supremacia para infligir dano adicional y dificultar que el objetivo ataque a tus aliados.", "DND,Guerrero,MaestroDeBatalla,Maniobra"),
                        buildSkill("Ataque y Derribo", "al impactar, anades dano y puedes derribar", "cuando impactas con un arma puedes gastar un dado de supremacia para anadir dano e intentar dejar tumbado al objetivo.", "DND,Guerrero,MaestroDeBatalla,Maniobra"),
                        buildSkill("Ataque y Desarme", "al impactar, anades dano y puedes desarmar", "cuando impactas puedes gastar un dado de supremacia para anadir dano e intentar que el objetivo suelte un objeto que sostenga.", "DND,Guerrero,MaestroDeBatalla,Maniobra"),
                        buildSkill("Ataque y Distracción", "al impactar, anades dano y das ventaja a un aliado", "cuando impactas puedes gastar un dado de supremacia para distraer al objetivo y abrir una oportunidad de ataque para un aliado.", "DND,Guerrero,MaestroDeBatalla,Maniobra"),
                        buildSkill("Ataque y Empujón", "al impactar, anades dano y puedes empujar lateralmente", "cuando impactas puedes gastar un dado de supremacia para desplazar al objetivo a otra posicion cercana.", "DND,Guerrero,MaestroDeBatalla,Maniobra"),
                        buildSkill("Ataque y Maniobra", "al impactar, anades dano y mueves a un aliado", "cuando impactas puedes gastar un dado de supremacia para que un aliado se mueva usando su reaccion sin provocar ataques de oportunidad del objetivo.", "DND,Guerrero,MaestroDeBatalla,Maniobra"),
                        buildSkill("Contraataque", "reaccion tras fallo enemigo", "cuando una criatura falla un ataque cuerpo a cuerpo contra ti puedes usar tu reaccion y gastar un dado de supremacia para hacer un ataque de respuesta con dano adicional.", "DND,Guerrero,MaestroDeBatalla,Maniobra,Reaccion"),
                        buildSkill("Finta", "accion adicional para ganar ventaja y dano", "puedes gastar un dado de supremacia como accion adicional para fintar contra una criatura y obtener ventaja en tu siguiente ataque contra ella este turno, anadiendo dano extra si impactas.", "DND,Guerrero,MaestroDeBatalla,Maniobra,AccionExtra"),
                        buildSkill("Juego de Pies Evasivo", "anades el dado a tu CA al moverte", "cuando te mueves puedes gastar un dado de supremacia para aumentar tu CA hasta que dejes de moverte.", "DND,Guerrero,MaestroDeBatalla,Maniobra,Defensa"),
                        buildSkill("Orden de Ataque", "renuncias a un ataque para que un aliado ataque", "cuando realizas la accion de atacar puedes renunciar a uno de tus ataques y gastar un dado de supremacia para dirigir a un aliado a que ataque usando su reaccion.", "DND,Guerrero,MaestroDeBatalla,Maniobra,Tactica"),
                        buildSkill("Parada", "reaccion para reducir dano", "cuando una criatura te causa dano con un ataque cuerpo a cuerpo puedes usar tu reaccion y gastar un dado de supremacia para reducir ese dano.", "DND,Guerrero,MaestroDeBatalla,Maniobra,Defensa,Reaccion"),
                        buildSkill("Reagrupar", "accion adicional para dar PG temporales", "como accion adicional puedes gastar un dado de supremacia para infundir resistencia a un aliado, otorgandole puntos de golpe temporales.", "DND,Guerrero,MaestroDeBatalla,Maniobra,AccionExtra,Supervivencia"),
                        buildSkill("Defensa sin armadura", "10 + DES + SAB", "mientras no lleves armadura ni escudo, tu CA se calcula con destreza y sabiduria.", "CMonje;1,Defensa"),
                        buildSkill("Artes marciales", "dado marcial inicial 1d4", "puedes usar destreza con tus golpes desarmados y armas de monje, mejorar su dano y realizar un golpe desarmado adicional.", "CMonje;1,Ataque+,Daño+,Destreza"),
                        buildSkill("Ki", "puntos de ki = nivel de monje", "empleas puntos de ki para rafaga de golpes, defensa paciente y paso del viento, y otros rasgos que aprendas.", "CMonje;2,Ki"),
                        buildSkill("Movimiento sin armadura", "+10 pies de velocidad", "tu velocidad aumenta mientras no lleves armadura ni escudo.", "CMonje;2,Velocidad+,Movimiento"),
                        buildSkill("Tradicion monastica", null, "eliges una tradición monástica. Puedes seguir la vía de la mano abierta, la vía de la sombra o la vía de los cuatro elementos.", "CMonje;3,Subclase"),
                        buildSkill("Desviar proyectiles", "reduce dano = 1d10 + DES + nivel", "puedes usar tu reaccion para reducir o incluso atrapar un proyectil que te impacte.", "CMonje;3,Reaccion,Defensa"),
                        buildSkill("Tecnica de mano abierta", null, "tras una rafaga de golpes puedes derribar, empujar o impedir reacciones a tu objetivo.", "CMonje;3,ManoAbierta,Control"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CMonje;4,MejoraCaracteristica"),
                        buildSkill("Caida lenta", "reduce dano de caida = 5 x nivel", "puedes usar tu reaccion para reducir mucho el dano por caida.", "CMonje;4,Reaccion,Defensa"),
                        buildSkill("Ataque extra", "2 ataques por accion de atacar", "puedes atacar dos veces cuando realizas la accion de atacar.", "CMonje;5,Multiataque"),
                        buildSkill("Golpe aturdidor", "gastas 1 ki; salvacion de CON o aturdido", "al impactar con un ataque cuerpo a cuerpo puedes intentar aturdir a tu objetivo.", "CMonje;5,Ki,Control,Aturdido"),
                        buildSkill("Golpes potenciados por ki", null, "tus golpes desarmados cuentan como magicos para superar resistencias e inmunidades.", "CMonje;6,Ki,Daño+"),
                        buildSkill("Plenitud corporal", "cura = 3 x nivel de monje", "como accion te curas a ti mismo y recuperas una buena cantidad de puntos de golpe.", "CMonje;6,ManoAbierta,Curacion"),
                        buildSkill("Evasion", null, "cuando una salvacion de destreza te permitiria medio dano, no sufres dano al superar la tirada y solo la mitad al fallarla.", "CMonje;7,Salvacion,Defensa"),
                        buildSkill("Quietud mental", null, "puedes terminar con una accion un efecto que te tenga hechizado o asustado.", "CMonje;7,Control,Hechizado,Asustado"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CMonje;8,MejoraCaracteristica"),
                        buildSkill("Movimiento sin armadura mejorado", "puedes correr por paredes y sobre liquidos durante el turno", "tu movilidad alcanza un nivel sobrenatural y te permite moverte por superficies imposibles mientras te desplazas.", "CMonje;9,Movimiento,Velocidad+"),
                        buildSkill("Pureza corporal", "inmune a enfermedad y veneno", "tu dominio del ki te vuelve inmune a las enfermedades y al veneno.", "CMonje;10,InmunidadEnfermedad,InmunidadVeneno"),
                        buildSkill("Tranquilidad", "santuario tras descanso largo", "tras meditar, quedas protegido por un efecto similar a santuario hasta tu siguiente descanso largo.", "CMonje;11,ManoAbierta,Defensa"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CMonje;12,MejoraCaracteristica"),
                        buildSkill("Lengua del sol y la luna", null, "entiendes todos los idiomas hablados y cualquier criatura que conozca un idioma puede entenderte.", "CMonje;13,Idioma,Comunicacion"),
                        buildSkill("Alma diamante", "competencia en todas las salvaciones", "ganas competencia en todas las tiradas de salvacion y puedes repetir una fallida gastando ki.", "CMonje;14,Salvacion,Ki"),
                        buildSkill("Cuerpo intemporal", null, "no sufres el desgaste de la vejez y dejas de necesitar comida y agua.", "CMonje;15,Defensa,Longevidad"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CMonje;16,MejoraCaracteristica"),
                        buildSkill("Palma vibrante", "3 ki; CON o 0 PG, si salva 10d10 necrotico", "dejas vibraciones letales en el cuerpo de una criatura y puedes detonarlas mas adelante.", "CMonje;17,ManoAbierta,Ki,Daño+,Control"),
                        buildSkill("Cuerpo vacio", "4 ki invisible; 8 ki proyeccion astral", "puedes volverte invisible con resistencia a casi todo el dano o proyectarte astralmente.", "CMonje;18,Ki,Defensa,Invisibilidad"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CMonje;19,MejoraCaracteristica"),
                        buildSkill("Ser perfecto", "recuperas 4 ki al tirar iniciativa si estabas a 0", "si empiezas un combate sin ki, recuperas parte de tu reserva.", "CMonje;20,Ki,Iniciativa"),
                        buildSkill("Sentido divino", "usos = 1 + mod. CAR", "detectas celestiales, infernales, no muertos y lugares consagrados o profanados cercanos.", "CPaladin;1,Deteccion,Carisma"),
                        buildSkill("Imposición de manos", "reserva de curacion = nivel x 5", "usas una reserva de energia sagrada para curar heridas o neutralizar enfermedades y venenos al tocar.", "CPaladin;1,Curacion,Apoyo"),
                        buildSkill("Estilo de combate", null, "eliges un estilo de combate propio del paladin.", "CPaladin;2,Combate"),
                        buildSkill("Lanzamiento de conjuros", "CAR para conjuros; foco: simbolo sagrado", "preparas conjuros de paladin y usas carisma para lanzarlos.", "CPaladin;2,Conjuro,Carisma"),
                        buildSkill("Castigo divino", "2d8 base; +1d8 por nivel de espacio; +1d8 contra infernales o no muertos", "cuando impactas cuerpo a cuerpo puedes gastar un espacio de conjuro para infligir daño radiante adicional.", "CPaladin;2,Daño+,Radiante"),
                        buildSkill("Salud divina", "inmune a enfermedad", "la energia sagrada te protege por completo contra las enfermedades.", "CPaladin;3,InmunidadEnfermedad"),
                        buildSkill("Juramento sagrado", null, "eliges un juramento sagrado que define el ideal que guiará tus poderes. las opciones actuales son devocion, antiguos y venganza.", "CPaladin;3,Subclase"),
                        buildSkill("Conjuros de juramento", "Protección contra el bien y el mal, Santuario", "el juramento de devocion te concede estos conjuros, que siempre se consideran preparados y no cuentan para tu limite habitual.", "CPaladin;3,Devocion,Conjuro"),
                        buildSkill("Arma sagrada", "+CAR a tiradas de ataque durante 1 minuto", "usas canal divino para imbuir un arma con energia sagrada y volverla mas precisa y luminosa.", "CPaladin;3,Devocion,CanalDivino,Ataque+"),
                        buildSkill("Expulsar lo impio", null, "usas canal divino para condenar a infernales y muertos vivientes, obligandolos a huir de ti.", "CPaladin;3,Devocion,CanalDivino,Control"),
                        buildSkill("Conjuros de juramento", "Golpe apresador, Hablar con los animales", "el juramento de los antiguos te concede estos conjuros, que siempre se consideran preparados y no cuentan para tu limite habitual.", "CPaladin;3,Antiguos,Conjuro"),
                        buildSkill("Ira de la naturaleza", "apresa a un objetivo con una salvacion de Fuerza o Destreza", "puedes usar canalizar divinidad para invocar enredaderas espectrales que apresan a un enemigo cercano.", "CPaladin;3,Antiguos,CanalDivino,Control"),
                        buildSkill("Expulsar infieles", "expulsa feericos e infernales durante 1 minuto", "usas canalizar divinidad para pronunciar palabras ancestrales que hacen huir a feericos e infernales.", "CPaladin;3,Antiguos,CanalDivino,Control"),
                        buildSkill("Conjuros de juramento", "Marca del cazador, Perdicion", "el juramento de venganza te concede estos conjuros, que siempre se consideran preparados y no cuentan para tu limite habitual.", "CPaladin;3,Venganza,Conjuro"),
                        buildSkill("Abjurar enemigo", "asusta o ralentiza a un objetivo", "usas canalizar divinidad para denunciar a una criatura visible, asustandola o frenandola si resiste.", "CPaladin;3,Venganza,CanalDivino,Control"),
                        buildSkill("Voto de enemistad", "ventaja contra un objetivo durante 1 minuto", "como accion adicional puedes emplear canalizar divinidad para obtener ventaja contra un enemigo jurado cercano.", "CPaladin;3,Venganza,CanalDivino,Ataque+"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CPaladin;4,MejoraCaracteristica"),
                        buildSkill("Ataque adicional", "2 ataques por accion de atacar", "puedes atacar dos veces cuando realizas la accion de atacar.", "CPaladin;5,Multiataque"),
                        buildSkill("Conjuros de juramento", "Restablecimiento menor, Zona de la verdad", "la devocion amplía su lista de conjuros de juramento siempre preparados.", "CPaladin;5,Devocion,Conjuro"),
                        buildSkill("Conjuros de juramento", "Paso brumoso, Rayo de luna", "los antiguos amplían su lista de conjuros de juramento siempre preparados.", "CPaladin;5,Antiguos,Conjuro"),
                        buildSkill("Conjuros de juramento", "Inmovilizar persona, Paso brumoso", "la venganza amplía su lista de conjuros de juramento siempre preparados.", "CPaladin;5,Venganza,Conjuro"),
                        buildSkill("Aura de proteccion", "+CAR a salvaciones en 10 pies; 30 pies al 18", "tu y tus aliados cercanos sumais tu modificador de carisma a las tiradas de salvacion mientras estes consciente.", "CPaladin;6,Aura,Salvacion,Carisma"),
                        buildSkill("Aura de devocion", "inmunidad a hechizado en 10 pies; 30 pies al 18", "tu y tus aliados cercanos no podeis ser hechizados mientras estes consciente.", "CPaladin;7,Devocion,Aura,InmunidadHechizado"),
                        buildSkill("Aura de salvaguarda", "resistencia al daño de conjuros en 10 pies; 30 pies al 18", "la magia antigua te ha impregnado tanto que tu y tus aliados cercanos teneis resistencia al daño proveniente de conjuros.", "CPaladin;7,Antiguos,Aura,Resistencia"),
                        buildSkill("Vengador implacable", "te mueves hasta la mitad de tu velocidad tras un ataque de oportunidad", "cuando impactas a una criatura con un ataque de oportunidad, puedes moverte hasta la mitad de tu velocidad como parte de la misma reaccion sin provocar ataques de oportunidad.", "CPaladin;7,Venganza,Reaccion,Movimiento"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CPaladin;8,MejoraCaracteristica"),
                        buildSkill("Conjuros de juramento", "Disipar magia, Señal de esperanza", "la devocion sigue ampliando su lista de conjuros de juramento siempre preparados.", "CPaladin;9,Devocion,Conjuro"),
                        buildSkill("Conjuros de juramento", "Crecimiento vegetal, Proteccion contra energia", "los antiguos siguen ampliando su lista de conjuros de juramento siempre preparados.", "CPaladin;9,Antiguos,Conjuro"),
                        buildSkill("Conjuros de juramento", "Acelerar, Proteccion contra energia", "la venganza sigue ampliando su lista de conjuros de juramento siempre preparados.", "CPaladin;9,Venganza,Conjuro"),
                        buildSkill("Aura de coraje", "inmunidad a miedo en 10 pies; 30 pies al 18", "tu y tus aliados cercanos no podeis ser asustados mientras estes consciente.", "CPaladin;10,Aura,InmunidadAsustado"),
                        buildSkill("Castigo divino mejorado", "+1d8 radiante en cada golpe cuerpo a cuerpo", "todos tus ataques cuerpo a cuerpo quedan cargados con dano radiante adicional.", "CPaladin;11,Daño+,Radiante"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CPaladin;12,MejoraCaracteristica"),
                        buildSkill("Conjuros de juramento", "Guardian de la fe, Libertad de movimiento", "la devocion alcanza el cuarto tramo de conjuros de juramento siempre preparados.", "CPaladin;13,Devocion,Conjuro"),
                        buildSkill("Conjuros de juramento", "Piel petrea, Tormenta de hielo", "los antiguos alcanzan el cuarto tramo de conjuros de juramento siempre preparados.", "CPaladin;13,Antiguos,Conjuro"),
                        buildSkill("Conjuros de juramento", "Destierro, Puerta dimensional", "la venganza alcanza el cuarto tramo de conjuros de juramento siempre preparados.", "CPaladin;13,Venganza,Conjuro"),
                        buildSkill("Toque purificador", "usos = mod. CAR", "puedes tocar a una criatura voluntaria o a ti mismo para terminar un conjuro que la afecte.", "CPaladin;14,Apoyo,Carisma"),
                        buildSkill("Pureza de espiritu", null, "estas siempre bajo los efectos de un conjuro de proteccion contra el bien y el mal.", "CPaladin;15,Devocion,Defensa"),
                        buildSkill("Centinela imperecedero", "si caes a 0 PG vuelves a 1 PG una vez por descanso largo", "si tus puntos de golpe se reducen a 0 sin morir al instante, puedes volver a tener 1 punto de golpe. ademas, no sufres los inconvenientes de la edad y no puedes envejecer por medios magicos.", "CPaladin;15,Antiguos,Supervivencia,Longevidad"),
                        buildSkill("Espiritu vengativo", "reaccion para atacar al objetivo de tu voto de enemistad", "cuando una criatura bajo los efectos de tu voto de enemistad ataque, puedes usar tu reaccion para realizar un ataque con arma cuerpo a cuerpo contra ella si esta a tu alcance.", "CPaladin;15,Venganza,Reaccion,Ataque+"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CPaladin;16,MejoraCaracteristica"),
                        buildSkill("Conjuros de juramento", "Comunion, Golpe flamigero", "la devocion completa su lista de conjuros de juramento siempre preparados.", "CPaladin;17,Devocion,Conjuro"),
                        buildSkill("Conjuros de juramento", "Comunion con la naturaleza, Paso arboreo", "los antiguos completan su lista de conjuros de juramento siempre preparados.", "CPaladin;17,Antiguos,Conjuro"),
                        buildSkill("Conjuros de juramento", "Escudriñar, Inmovilizar monstruo", "la venganza completa su lista de conjuros de juramento siempre preparados.", "CPaladin;17,Venganza,Conjuro"),
                        buildSkill("Auras mejoradas", "radio de 30 pies", "tus auras principales extienden su alcance hasta 30 pies.", "CPaladin;18,Aura"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CPaladin;19,MejoraCaracteristica"),
                        buildSkill("Halo sagrado", "1 minuto; 10 de daño radiante por turno a enemigos cercanos", "como accion emanas un aura de luz solar durante 1 minuto. los enemigos que empiecen su turno en tu luz brillante sufren daño radiante y tu tienes ventaja en salvaciones contra conjuros de infernales o muertos vivientes.", "CPaladin;20,Devocion,Radiante,Aura,Daño+"),
                        buildSkill("Campeon ancestral", "1 minuto; regeneracion, accion adicional para ciertos conjuros y aura debilitadora", "asumes la forma de una antigua fuerza de la naturaleza. al comienzo de cada turno recuperas 10 puntos de golpe, puedes lanzar ciertos conjuros de paladin como accion adicional y los enemigos cercanos tienen desventaja en sus salvaciones contra tus conjuros y tu canalizar divinidad.", "CPaladin;20,Antiguos,Curacion,Aura,Conjuro"),
                        buildSkill("Angel vengador", "1 hora; alas y aura de amenaza", "adoptas la forma de un angel vengador, con alas de vuelo y un aura que asusta a los enemigos cercanos.", "CPaladin;20,Venganza,Vuelo,Aura,Control"),
                        buildSkill("Enemigo predilecto", null, "eliges tipos de enemigos sobre los que tienes ventaja para rastrear y recordar informacion. aprendes idiomas asociados y amplias la lista a niveles superiores.", "CExplorador;1,Rastreo,Conocimiento"),
                        buildSkill("Explorador nato", null, "eliges un terreno favorito y obtienes ventajas de viaje, exploracion y supervivencia en ese entorno. amplias terrenos a niveles superiores.", "CExplorador;1,Exploracion,Movimiento"),
                        buildSkill("Estilo de combate", null, "eliges un estilo de combate adaptado a tu forma de cazar y combatir.", "CExplorador;2,Combate"),
                        buildSkill("Conjuro explorador", "SAB para conjuros", "aprendes conjuros de explorador orientados a la caza, el sigilo y la naturaleza.", "CExplorador;2,Conjuro,Sabiduria"),
                        buildSkill("Arquetipo de explorador", null, "eliges un arquetipo de explorador. Entre las opciones disponibles están cazador y maestro de bestias.", "CExplorador;3,Subclase"),
                        buildSkill("Conciencia primigenia", "gastas un espacio para detectar ciertos tipos de criaturas", "puedes sentir si hay aberraciones, celestiales, dragones, elementales, feericos, infernales o no muertos en la region.", "CExplorador;3,Deteccion,Conjuro"),
                        buildSkill("Presa del cazador", null, "eliges una tecnica ofensiva del cazador para desgastar, castigar gigantes o golpear una segunda presa cercana.", "CExplorador;3,Cazador,Combate"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CExplorador;4,MejoraCaracteristica"),
                        buildSkill("Ataque extra", "2 ataques por accion de atacar", "puedes atacar dos veces cuando realizas la accion de atacar.", "CExplorador;5,Multiataque"),
                        buildSkill("Mejoras de enemigo predilecto y explorador nato", null, "anades un nuevo enemigo predilecto, un idioma asociado y un nuevo terreno favorito.", "CExplorador;6,Rastreo,Exploracion"),
                        buildSkill("Tacticas defensivas", null, "eliges una opcion defensiva del cazador para resistir hordas, cadenas de ataques o el miedo.", "CExplorador;7,Cazador,Defensa"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CExplorador;8,MejoraCaracteristica"),
                        buildSkill("Paso por la tierra", null, "ignoras terreno dificil no magico por plantas y tienes ventaja contra plantas magicas que dificulten el movimiento.", "CExplorador;8,Movimiento,Salvacion"),
                        buildSkill("Mejora de explorador nato", null, "anades otro terreno favorito para extender tus ventajas de viaje y exploracion.", "CExplorador;10,Exploracion"),
                        buildSkill("Esconderse a plena vista", "+10 a sigilo mientras permanezcas inmovil y camuflado", "puedes preparar camuflaje natural para ocultarte mejor en entornos apropiados.", "CExplorador;10,Sigilo,Defensa"),
                        buildSkill("Multiataque", null, "eliges entre una andanada a distancia o un ataque giratorio cuerpo a cuerpo contra varios enemigos.", "CExplorador;11,Cazador,Multiataque"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CExplorador;12,MejoraCaracteristica"),
                        buildSkill("Mejora de enemigo predilecto", null, "anades un enemigo predilecto adicional y el idioma asociado.", "CExplorador;14,Rastreo,Conocimiento"),
                        buildSkill("Desaparecer", "esconderse como accion adicional", "puedes usar ocultarte como accion adicional y resulta muy dificil seguirte sin magia.", "CExplorador;14,Sigilo,AccionExtra"),
                        buildSkill("Defensa superior del cazador", null, "eliges una tecnica avanzada de defensa como evasion, desviar ataques o reducir dano.", "CExplorador;15,Cazador,Defensa"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CExplorador;16,MejoraCaracteristica"),
                        buildSkill("Sentidos ferales", null, "puedes combatir mejor contra enemigos invisibles o que no ves directamente.", "CExplorador;18,Percepcion,Combate"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CExplorador;19,MejoraCaracteristica"),
                        buildSkill("Matanza de enemigos", "1 vez por turno anades SAB a ataque o dano contra enemigo predilecto", "te conviertes en un cazador supremo de tus enemigos escogidos.", "CExplorador;20,Daño+,Ataque+,Sabiduria"),
                        buildSkill("Pericia", "doblas competencia en 2 competencias", "eliges dos competencias en habilidades o una habilidad y herramientas de ladron para duplicar tu bonificador de competencia.", "CPicaro;1,Pericia,Habilidades"),
                        buildSkill("Ataque furtivo", "1d6 al nivel 1; progresa hasta 10d6", "una vez por turno infliges dano extra con armas sutiles o a distancia cuando tienes ventaja o un aliado amenaza al objetivo.", "CPicaro;1,Daño+,Sigilo"),
                        buildSkill("Jerga de ladrones", null, "conoces un codigo secreto verbal y simbolico que te permite comunicar mensajes ocultos a otros criminales.", "CPicaro;1,Idioma,Codigo"),
                        buildSkill("Accion astuta", "Desplazarse, retirarse u ocultarse como accion adicional", "tu rapidez te permite moverte y reposicionarte con gran facilidad en combate.", "CPicaro;2,AccionExtra,Movimiento,Sigilo"),
                        buildSkill("Arquetipo de picaro", null, "eliges un arquetipo de picaro. las opciones actuales son ladron, asesino y embaucador arcano.", "CPicaro;3,Subclase"),
                        buildSkill("Manos rapidas", null, "puedes usar la accion adicional de accion astuta para ciertas maniobras de juego de manos, abrir cerraduras, desarmar trampas o utilizar objetos.", "CPicaro;3,Ladron,AccionExtra"),
                        buildSkill("Balconero", "trepar no cuesta movimiento extra", "trepar ya no te cuesta movimiento adicional y, cuando saltas con carrerilla, aumentas tu distancia de salto en tantos pies como tu modificador por destreza.", "CPicaro;3,Ladron,Movimiento"),
                        buildSkill("Competencias adicionales", "competencia con utiles para disfrazarse y utiles de envenenador", "ganas competencia con los utiles para disfrazarse y los utiles de envenenador.", "CPicaro;3,Asesino,Competencia"),
                        buildSkill("Asesinar", "ventaja contra criaturas que aun no han actuado; critico automatico contra sorprendidos", "tienes ventaja en las tiradas de ataque contra cualquier criatura que aun no haya llevado a cabo ningun turno en el combate actual y cualquier impacto contra una criatura sorprendida sera automaticamente un critico.", "CPicaro;3,Asesino,Ataque+,Critico+"),
                        buildSkill("Lanzamiento de conjuros", "INT para conjuros; mano de mago obligatoria", "obtienes la capacidad de lanzar conjuros de mago. aprendes mano de mago y otros conjuros de encantamiento e ilusion propios del embaucador arcano.", "CPicaro;3,EmbaucadorArcano,Conjuro,Inteligencia"),
                        buildSkill("Destreza con mano de mago", "mano invisible; guardar o sacar objetos; abrir cerraduras y desarmar trampas a distancia", "cuando lanzas mano de mago puedes hacer que la mano espectral sea invisible, guardar o sacar objetos de otras criaturas y usar herramientas de ladron a distancia. ademas, puedes utilizar la accion adicional de accion astuta para controlarla.", "CPicaro;3,EmbaucadorArcano,Conjuro,AccionExtra"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CPicaro;4,MejoraCaracteristica"),
                        buildSkill("Esquiva asombrosa", "Reaccion: mitad del dano de un ataque", "cuando un atacante visible te golpea puedes usar tu reaccion para reducir a la mitad el dano.", "CPicaro;5,Reaccion,Defensa"),
                        buildSkill("Pericia", "doblas competencia en 2 competencias mas", "eliges dos competencias adicionales para aplicar pericia.", "CPicaro;6,Pericia,Habilidades"),
                        buildSkill("Evasion", null, "cuando una salvacion de destreza te permitiria medio dano, no sufres dano al superarla y solo la mitad al fallarla.", "CPicaro;7,Salvacion,Defensa"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CPicaro;8,MejoraCaracteristica"),
                        buildSkill("Sigilo supremo", "Ventaja a sigilo si te mueves a media velocidad o menos", "el ladron se vuelve especialmente dificil de detectar cuando se desplaza con cuidado.", "CPicaro;9,Ladron,Sigilo"),
                        buildSkill("Pericia en infiltrarse", "creas identidades falsas", "puedes crearte identidades falsas completas, con historia, profesion y afiliaciones, para infiltrarte con credibilidad.", "CPicaro;9,Asesino,Infiltracion,Engaño"),
                        buildSkill("Emboscada magica", "desventaja en salvaciones si lanzas oculto", "si estas escondido de una criatura cuando lanzas un conjuro sobre ella, el objetivo tendra desventaja en cualquier tirada de salvacion que deba hacer contra el conjuro este turno.", "CPicaro;9,EmbaucadorArcano,Conjuro,Control"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CPicaro;10,MejoraCaracteristica"),
                        buildSkill("Talentos fiables", "un d20 de 9 o menos cuenta como 10", "cuando hagas una prueba de caracteristica que te permita añadir tu bonificador por competencia, puedes considerar cualquier resultado de 9 o menos en el d20 como si fuera un 10.", "CPicaro;11,Pruebas,Pericia"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CPicaro;12,MejoraCaracteristica"),
                        buildSkill("Usar objetos magicos", null, "ignoras todas las restricciones de clase, raza y nivel a la hora de emplear objetos magicos.", "CPicaro;13,Ladron,ObjetoMagico"),
                        buildSkill("Impostor", null, "adquieres la capacidad para imitar de forma convincente el habla, la caligrafia y el comportamiento de otra persona tras estudiarla.", "CPicaro;13,Asesino,Engaño,Infiltracion"),
                        buildSkill("Embaucador versatil", null, "como accion adicional puedes usar tu mano de mago para distraer a un objetivo y obtener ventaja en tus ataques contra el hasta el final del turno.", "CPicaro;13,EmbaucadorArcano,Conjuro,Ataque+"),
                        buildSkill("Sentir sin ver", "detectas criaturas ocultas o invisibles a 10 pies", "si eres capaz de oir, eres consciente de la ubicacion de cualquier criatura escondida o invisible a 10 pies o menos de ti.", "CPicaro;14,Percepcion"),
                        buildSkill("Mente escurridiza", "competencia en salvaciones de sabiduria", "ganas mayor fortaleza mental frente a efectos que atacan tu voluntad.", "CPicaro;15,Salvacion,Sabiduria"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CPicaro;16,MejoraCaracteristica"),
                        buildSkill("Reflejos de ladron", "2 turnos en la primera ronda si no estas sorprendido", "puedes actuar dos veces al inicio del combate, lo que te permite abrir con gran ventaja.", "CPicaro;17,Ladron,Iniciativa"),
                        buildSkill("Golpe mortal", null, "cuando atacas e impactas a una criatura sorprendida, debe superar una salvacion de constitucion o el daño del ataque contra ella se duplica.", "CPicaro;17,Asesino,Daño+,Critico+"),
                        buildSkill("Ladron de conjuros", null, "inmediatamente despues de que una criatura lance un conjuro que te tenga como objetivo o incluya tu area, puedes usar tu reaccion para anular su efecto sobre ti y robar temporalmente el conocimiento de ese conjuro.", "CPicaro;17,EmbaucadorArcano,Conjuro,Reaccion"),
                        buildSkill("Elusivo", null, "ninguna tirada de ataque hecha contra ti tendra ventaja mientras no estes incapacitado.", "CPicaro;18,Defensa"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CPicaro;19,MejoraCaracteristica"),
                        buildSkill("Golpe de suerte", "convierte un fallo en exito", "puedes transformar un ataque fallido en impacto o una prueba fallida en un 20 natural.", "CPicaro;20,Pruebas,Ataque+"),
                        buildSkill("Conjuro de hechicero", "CAR para conjuros; foco: foco arcano", "accedes a la magia innata del hechicero y usas carisma para lanzar tus conjuros.", "CHechicero;1,Conjuro,Carisma"),
                        buildSkill("Origen sobrenatural", null, "eliges el origen de tu poder. Puedes manifestar un linaje dracónico o magia salvaje.", "CHechicero;1,Subclase"),
                        buildSkill("Ancestro draconico", null, "eliges un tipo de dragón ancestral que determina tus afinidades de daño futuras; además aprendes dracónico y destacas al tratar con dragones.", "CHechicero;1,Draconico,Dragon,Idioma"),
                        buildSkill("Resiliencia draconica", "+1 PG por nivel; CA 13 + DES sin armadura", "tu herencia draconica refuerza tu cuerpo con mas aguante y escamas protectoras.", "CHechicero;1,Draconico,Defensa,Constitucion"),
                        buildSkill("Fuente de magia", "puntos de hechiceria = nivel indicado", "obtienes puntos de hechiceria para crear espacios de conjuro o convertir espacios en puntos.", "CHechicero;2,Hechiceria,Conjuro"),
                        buildSkill("Metamagia", "2 opciones al 3; otra al 10 y 17", "aprendes a modificar el alcance, duracion, objetivos o forma de tus conjuros usando puntos de hechiceria.", "CHechicero;3,Metamagia,Conjuro"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CHechicero;4,MejoraCaracteristica"),
                        buildSkill("Afinidad elemental", "+CAR a una tirada de dano del tipo de tu dragon; 1 punto para resistencia", "tus conjuros del tipo asociado a tu linaje son mas intensos y puedes ganar resistencia temporal a ese tipo de dano.", "CHechicero;6,Draconico,Daño+,Resistencia,Carisma"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CHechicero;8,MejoraCaracteristica"),
                        buildSkill("Metamagia", "+1 opcion", "aprendes una opcion adicional de metamagia.", "CHechicero;10,Metamagia,Conjuro"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CHechicero;12,MejoraCaracteristica"),
                        buildSkill("Alas draconicas", "velocidad de vuelo = tu velocidad", "puedes manifestar alas de dragon y obtener velocidad de vuelo mientras no lleves armadura incompatible.", "CHechicero;14,Draconico,Vuelo,Movimiento"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CHechicero;16,MejoraCaracteristica"),
                        buildSkill("Metamagia", "+1 opcion", "aprendes una nueva opcion de metamagia.", "CHechicero;17,Metamagia,Conjuro"),
                        buildSkill("Presencia draconica", "5 puntos de hechiceria; aura de miedo o fascinacion", "puedes irradiar majestuosidad draconica para hechizar o asustar a enemigos hostiles cercanos.", "CHechicero;18,Draconico,Control,Miedo,Hechizado"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CHechicero;19,MejoraCaracteristica"),
                        buildSkill("Restauracion sobrenatural", "recuperas 4 puntos de hechiceria en descanso corto", "cada descanso corto te devuelve parte de tu reserva de hechiceria.", "CHechicero;20,Hechiceria,Descanso"),
                        buildSkill("Patrono sobrenatural", null, "eliges la fuente de tu pacto. Entre las opciones disponibles están el señor feérico, el infernal y el primigenio.", "CBrujo;1,Subclase"),
                        buildSkill("Magia de pacto", "CAR para conjuros; espacios se recuperan en descanso corto", "tu magia usa pocos espacios pero se recargan rapido y todos comparten el mismo nivel.", "CBrujo;1,Conjuro,Carisma,Descanso"),
                        buildSkill("Bendicion del oscuro", "PG temporales = CAR + nivel de brujo", "cuando reduces a un enemigo hostil a 0 puntos de golpe, obtienes puntos de golpe temporales.", "CBrujo;1,Infernal,Supervivencia,Curacion"),
                        buildSkill("Invocaciones misticas", null, "aprendes invocaciones que alteran tus capacidades con efectos permanentes o lanzamientos especiales.", "CBrujo;2,Invocacion"),
                        buildSkill("Don del pacto", null, "eliges entre pacto de la cadena, la hoja o el tomo para definir una parte central de tu estilo.", "CBrujo;3,Pacto"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CBrujo;4,MejoraCaracteristica"),
                        buildSkill("Suerte del oscuro", "1d10 a una prueba o salvacion", "puedes invocar a tu patron para sumar un d10 a una prueba de caracteristica o salvacion despues de ver la tirada.", "CBrujo;6,Infernal,Pruebas,Salvacion"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CBrujo;8,MejoraCaracteristica"),
                        buildSkill("Resistencia infernal", "eliges 1 tipo de dano por descanso", "al terminar un descanso eliges un tipo de dano al que resistes hasta cambiarlo de nuevo.", "CBrujo;10,Infernal,Resistencia"),
                        buildSkill("Arcano mistico (6)", "1 conjuro de nivel 6 por descanso largo", "aprendes un conjuro de nivel 6 que puedes lanzar una vez por descanso largo sin gastar espacios de magia de pacto.", "CBrujo;11,Conjuro,ArcanoMistico"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CBrujo;12,MejoraCaracteristica"),
                        buildSkill("Arcano mistico (7)", "1 conjuro de nivel 7 por descanso largo", "obtienes un conjuro de nivel 7 utilizable una vez por descanso largo.", "CBrujo;13,Conjuro,ArcanoMistico"),
                        buildSkill("Arrojar al infierno", "10d10 psiquico al volver si no es infernal", "cuando golpeas a una criatura puedes desterrarla brevemente a una vision infernal devastadora.", "CBrujo;14,Infernal,Control,Daño+"),
                        buildSkill("Arcano mistico (8)", "1 conjuro de nivel 8 por descanso largo", "obtienes un conjuro de nivel 8 utilizable una vez por descanso largo.", "CBrujo;15,Conjuro,ArcanoMistico"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CBrujo;16,MejoraCaracteristica"),
                        buildSkill("Arcano mistico (9)", "1 conjuro de nivel 9 por descanso largo", "obtienes un conjuro de nivel 9 utilizable una vez por descanso largo.", "CBrujo;17,Conjuro,ArcanoMistico"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CBrujo;19,MejoraCaracteristica"),
                        buildSkill("Maestro eldritch", "recuperas todos los espacios tras 1 minuto de suplica", "puedes pedir ayuda a tu patron para restaurar todos tus espacios de magia de pacto.", "CBrujo;20,Conjuro,Descanso"),
                        buildSkill("Conjuro de mago", "INT para conjuros; foco: foco arcano", "dominas el lanzamiento de conjuros arcanos mediante estudio y memoria.", "CMago;1,Conjuro,Inteligencia"),
                        buildSkill("Libro de conjuros", "empiezas con 6 conjuros de nivel 1", "tu grimorio contiene los conjuros que conoces y puedes ampliarlo con aprendizaje y copia.", "CMago;1,Conjuro,Grimorio"),
                        buildSkill("Recuperacion arcana", "recuperas espacios con nivel total <= la mitad de tu nivel", "una vez al dia, tras un descanso corto, recuperas parte de tu energia magica.", "CMago;1,Conjuro,Descanso"),
                        buildSkill("Tradicion arcana", null, "eliges una escuela de magia. Entre las opciones disponibles están abjuración, conjuración, adivinación, encantamiento, evocación, ilusión, nigromancia y transmutación.", "CMago;2,Subclase"),
                        buildSkill("Erudito de evocacion", "copiar conjuros de evocacion cuesta la mitad", "reducen a la mitad el tiempo y el oro necesarios para copiar conjuros de evocacion en tu libro.", "CMago;2,Evocacion,Grimorio"),
                        buildSkill("Esculpir conjuros", null, "puedes proteger a criaturas visibles dentro de tus conjuros de evocacion para que eviten el peor efecto.", "CMago;2,Evocacion,Conjuro,Apoyo"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CMago;4,MejoraCaracteristica"),
                        buildSkill("Truco potente", null, "tus trucos ofensivos siguen afectando parcialmente a objetivos que superan su salvacion.", "CMago;6,Evocacion,Truco,Daño+"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CMago;8,MejoraCaracteristica"),
                        buildSkill("Evocacion potenciada", "+INT a una tirada de dano de evocacion", "anades tu modificador de inteligencia a una tirada de dano de un conjuro de evocacion de mago.", "CMago;10,Evocacion,Daño+,Inteligencia"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CMago;12,MejoraCaracteristica"),
                        buildSkill("Sobrecanalizar", "maximizas dano de conjuros de nivel 1-5", "puedes lanzar ciertos conjuros ofensivos de forma sobrecargada para infligir su dano maximo, a costa de desgaste si repites.", "CMago;14,Evocacion,Daño+"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CMago;16,MejoraCaracteristica"),
                        buildSkill("Dominio de conjuros", "1 conjuro de nivel 1 y 1 de nivel 2 a voluntad", "eliges conjuros menores que puedes lanzar repetidamente sin gastar espacios, siempre que los tengas preparados.", "CMago;18,Conjuro"),
                        buildSkill("Mejora de puntuación de característica", null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CMago;19,MejoraCaracteristica"),
                        buildSkill("Conjuros distintivos", "2 conjuros de nivel 3 con 1 uso gratis por descanso corto o largo", "dominas dos conjuros de nivel 3 que siempre tienes preparados y puedes lanzar con especial facilidad.", "CMago;20,Conjuro")));

                objetoRepository.saveAll(List.of(
                    buildInitialObject("CatalogoAMCuerpo", "Arma marcial cuerpo a cuerpo", "varía según el arma elegida", "**Objeto genérico de elección**.\n\n* representa cualquier arma marcial cuerpo a cuerpo permitida por el equipo inicial\n* su perfil final depende de la elección del jugador", TipoObjeto.OBJETO_INTERNO),
                    buildInitialObject("CatalogoASimple", "Arma simple", "varía según el arma elegida", "**Objeto genérico de elección**.\n\n* representa cualquier arma simple permitida por el equipo inicial\n* su perfil final depende de la elección del jugador", TipoObjeto.OBJETO_INTERNO),
                    buildInitialObject("", "Devocionario o rueda de oraciones", null, "**Objeto de devoción** usado en lecturas, rezos o meditaciones prolongadas.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Vara de incienso", null, "**Consumible ritual** para ceremonias, ofrendas y ambientes sagrados.", TipoObjeto.CONSUMIBLE),
                    buildInitialObject("", "Vestiduras", null, "**Indumentaria ceremonial** propia del servicio religioso.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Ropa comun", null, "**Ropa sencilla** para el día a día fuera de los ritos.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Piezas de oro", null, "**Reserva inicial de dinero** para gastos básicos de viaje o manutención.", TipoObjeto.DINERO),

                    buildInitialObject("", "Palanca", null, "**Herramienta resistente** para forzar accesos o mover obstáculos pesados.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Ropa comun oscura con capucha", null, "**Ropa discreta** pensada para pasar desapercibido en callejones y tejados.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Kit de falsificacion", null, "**Conjunto de útiles** para copiar sellos, firmas y documentos.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Herramientas de timo", null, "**Material de estafa callejera**.\n\n* copas precintadas\n* cartas marcadas\n* dados cargados", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Instrumento musical", null, "**Herramienta principal de actuación** para música, interpretación o puesta en escena.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Objeto de un admirador", null, "**Recuerdo sentimental** recibido de alguien fascinado por tus actuaciones.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Disfraz", null, "**Vestuario de escena** para adoptar papeles y apariencias distintas.", TipoObjeto.MISCELANEO),

                    buildInitialObject("", "Juego de herramientas de artesano", null, "**Herramientas de oficio** ligadas al origen humilde del personaje.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Pala", null, "**Útil de trabajo** resistente y práctico para tierra y escombros.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Olla de hierro", null, "**Recipiente robusto** para cocinar en casa o en campamento.", TipoObjeto.MISCELANEO),

                    buildInitialObject("", "Juego de herramientas de artesano", null, "**Herramientas profesionales** ligadas a tu especialidad dentro del gremio.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Carta de presentacion del gremio", null, "**Documento acreditativo** que prueba tu pertenencia y reputación profesional.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Ropa de viaje", null, "**Ropa práctica** para desplazamientos y jornadas de trabajo.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Estuche de pergaminos con notas", null, "**Colección de apuntes personales** fruto de años de retiro y estudio.\n\n* observaciones\n* reflexiones\n* descubrimientos", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Manta de invierno", null, "**Manta gruesa** preparada para resistir el frío y las noches al raso.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Kit de herborista", null, "**Conjunto de útiles** para recolectar, preparar y clasificar hierbas.", TipoObjeto.MISCELANEO),

                    buildInitialObject("", "Ropa elegante", null, "**Atuendo distinguido** propio de alguien de alta cuna.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Anillo de sello", null, "**Sello familiar** usado para autenticar cartas y documentos.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Pergamino de pedigrí", null, "**Prueba documental del linaje** y la posición de tu familia.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Baston de viaje", null, "**Bastón robusto** para marcha, apoyo o defensa improvisada.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Trampa de caza", null, "**Mecanismo simple** para capturar presas pequeñas.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Trofeo de un animal cazado", null, "**Recuerdo de supervivencia** tomado de una presa importante del pasado.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Ropa de viaje", null, "**Ropa resistente** para la intemperie y el movimiento constante.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Frasco de tinta negra", null, "**Suministro de escritura** para copias, notas y anotaciones.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Pluma", null, "**Herramienta de escritura** para trabajo académico o documental.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Cuchillo pequeño", null, "**Útil ligero** para tareas menores de viaje o estudio.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Carta de un colega fallecido", null, "**Mensaje inconcluso** que impulsa nuevas investigaciones y preguntas.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Amuleto de la suerte", null, "**Talismán personal** al que atribuyes tu supervivencia en el mar.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Cuerda de seda", "15 metros", "**Cuerda resistente y flexible** útil a bordo, en escaladas o maniobras.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Insignia de rango", null, "**Señal militar** de la posición que ocupaste en tu unidad.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Trofeo de un enemigo caido", null, "**Recuerdo bélico** tomado a un adversario derrotado.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Juego de dados o cartas", null, "**Pasatiempo de campaña** habitual entre soldados durante los descansos.", TipoObjeto.MISCELANEO),

                    buildInitialObject("", "Cuchillo pequeño", null, "**Herramienta discreta** para sobrevivir en callejones y azoteas.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Mapa de la ciudad", null, "**Mapa urbano** con rutas, callejones y atajos clave.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Raton mascota", null, "**Pequeño compañero callejero** que ha sobrevivido contigo.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Recuerdo de tus padres", null, "**Objeto sentimental** conservado como vínculo con tu pasado.", TipoObjeto.MISCELANEO),
                    buildInitialObject("ASimple,ASCuerpo,Ligera", "Garrote", "1d4 contundente", "**Arma simple cuerpo a cuerpo** rudimentaria pero efectiva.\n\n* fácil de encontrar\n* útil en manos poco entrenadas", TipoObjeto.ARMA),
                    buildInitialObject("ASimple,ASCuerpo,Sutil,Ligera,Arrojadiza,Alcance20/60", "Daga", "1d4 perforante", "**Arma simple cuerpo a cuerpo** pequeña y muy versátil.\n\n* sirve tanto en combate cercano como al lanzarla\n* favorece estilos ágiles", TipoObjeto.ARMA),
                    buildInitialObject("ASimple,ASCuerpo,ADosManos", "Gran garrote", "1d8 contundente", "**Arma simple cuerpo a cuerpo** pesada y directa.\n\n* requiere ambas manos\n* prima la fuerza sobre la técnica", TipoObjeto.ARMA),
                    buildInitialObject("ASimple,ASCuerpo,Ligera,Arrojadiza,Alcance20/60", "Hacha de mano", "1d6 cortante", "**Arma simple cuerpo a cuerpo** compacta y contundente.\n\n* puede blandirse con soltura\n* también puede lanzarse", TipoObjeto.ARMA),
                    buildInitialObject("ASimple,ASCuerpo,Arrojadiza,Alcance30/120", "Jabalina", "1d6 perforante", "**Arma simple cuerpo a cuerpo** pensada para hostigar y mantener distancia.\n\n* se puede usar en mano\n* funciona bien al lanzarla", TipoObjeto.ARMA),
                    buildInitialObject("ASimple,ASCuerpo,Ligera,Arrojadiza,Alcance20/60", "Martillo ligero", "1d4 contundente", "**Arma simple cuerpo a cuerpo** manejable y fiable.\n\n* útil en combate cercano\n* puede lanzarse con facilidad", TipoObjeto.ARMA),
                    buildInitialObject("ASimple,ASCuerpo", "Maza", "1d6 contundente", "**Arma simple cuerpo a cuerpo** sólida y directa.\n\n* no requiere técnica compleja\n* concentra su fuerza en impactos brutales", TipoObjeto.ARMA),
                    buildInitialObject("ASimple,ASCuerpo,Ligera", "Hoz", "1d4 cortante", "**Arma simple cuerpo a cuerpo** curva y ligera.\n\n* adecuada para cortes rápidos\n* fácil de transportar", TipoObjeto.ARMA),
                    buildInitialObject("ASimple,ASCuerpo,Arrojadiza,Alcance20/60,Versatil1d8", "Lanza", "1d6 perforante", "**Arma simple cuerpo a cuerpo** clásica y polivalente.\n\n* puede lanzarse a corta distancia\n* mejora al usarla con dos manos", TipoObjeto.ARMA),

                    buildInitialObject("ASimple,ASRango,Municion,Alcance80/320,Recarga,ADosManos", "Ballesta ligera", "1d8 perforante", "**Arma simple a distancia** fiable y extendida.\n\n* usa virotes como munición\n* requiere recarga entre disparos", TipoObjeto.ARMA),
                    buildInitialObject("ASimple,ASRango,Sutil,Arrojadiza,Alcance20/60", "Dardo", "1d4 perforante", "**Arma simple a distancia** pequeña y precisa.\n\n* puede usarse con sutileza\n* se lanza con facilidad", TipoObjeto.ARMA),
                    buildInitialObject("ASimple,ASRango,Municion,Alcance80/320,ADosManos", "Arco corto", "1d6 perforante", "**Arma simple a distancia** ligera y común entre exploradores.\n\n* usa munición\n* necesita dos manos para disparar", TipoObjeto.ARMA),
                    buildInitialObject("ASimple,ASRango,Municion,Alcance30/120", "Honda", "1d4 contundente", "**Arma simple a distancia** barata y fácil de transportar.\n\n* usa proyectiles simples\n* ideal para hostigar a corta distancia", TipoObjeto.ARMA),

                    buildInitialObject("AMCuerpo,Versatil1d10", "Hacha de batalla", "1d8 cortante", "**Arma marcial cuerpo a cuerpo** equilibrada entre fuerza y control.\n\n* puede blandirse con una o dos manos", TipoObjeto.ARMA),
                    buildInitialObject("AMCuerpo", "Mangual", "1d8 contundente", "**Arma marcial cuerpo a cuerpo** de cadena y cabeza pesada.\n\n* castiga con golpes difíciles de bloquear", TipoObjeto.ARMA),
                    buildInitialObject("AMCuerpo,Pesada,Alcance,ADosManos", "Guja", "1d10 cortante", "**Arma marcial cuerpo a cuerpo** de asta larga.\n\n* ofrece mayor distancia de amenaza\n* exige ambas manos", TipoObjeto.ARMA),
                    buildInitialObject("AMCuerpo,Pesada,ADosManos", "Gran hacha", "1d12 cortante", "**Arma marcial cuerpo a cuerpo** brutal y devastadora.\n\n* maximiza el daño a costa de maniobrabilidad", TipoObjeto.ARMA),
                    buildInitialObject("AMCuerpo,Pesada,ADosManos", "Mandoble", "2d6 cortante", "**Arma marcial cuerpo a cuerpo** imponente y de gran pegada.\n\n* requiere fuerza y ambas manos", TipoObjeto.ARMA),
                    buildInitialObject("AMCuerpo,Pesada,Alcance,ADosManos", "Alabarda", "1d10 cortante", "**Arma marcial cuerpo a cuerpo** versátil en formaciones y guardias.\n\n* combina alcance y potencia", TipoObjeto.ARMA),
                    buildInitialObject("AMCuerpo,Alcance,Especial", "Lanza de caballería", "1d12 perforante", "**Arma marcial cuerpo a cuerpo** pensada para cargas montadas.\n\n* gana valor en combate a caballo", TipoObjeto.ARMA),
                    buildInitialObject("AMCuerpo,Versatil1d10", "Espada larga", "1d8 cortante", "**Arma marcial cuerpo a cuerpo** clásica y flexible.\n\n* eficaz con una mano\n* mejora al usar dos", TipoObjeto.ARMA),
                    buildInitialObject("AMCuerpo,Pesada,ADosManos", "Gran maza", "2d6 contundente", "**Arma marcial cuerpo a cuerpo** de impacto masivo.\n\n* castiga armaduras y escudos con fuerza bruta", TipoObjeto.ARMA),
                    buildInitialObject("AMCuerpo", "Lucero del alba", "1d8 perforante", "**Arma marcial cuerpo a cuerpo** compacta y letal.\n\n* combina facilidad de uso y buen daño", TipoObjeto.ARMA),
                    buildInitialObject("AMCuerpo,Pesada,Alcance,ADosManos", "Pica", "1d10 perforante", "**Arma marcial cuerpo a cuerpo** de asta muy larga.\n\n* domina espacios abiertos\n* es torpe a corta distancia", TipoObjeto.ARMA),
                    buildInitialObject("AMCuerpo,Sutil", "Estoque", "1d8 perforante", "**Arma marcial cuerpo a cuerpo** precisa y elegante.\n\n* destaca por la sutileza y rapidez", TipoObjeto.ARMA),
                    buildInitialObject("AMCuerpo,Sutil,Ligera", "Cimitarra", "1d6 cortante", "**Arma marcial cuerpo a cuerpo** curva y veloz.\n\n* ideal para combatientes ágiles", TipoObjeto.ARMA),
                    buildInitialObject("AMCuerpo,Sutil,Ligera", "Espada corta", "1d6 perforante", "**Arma marcial cuerpo a cuerpo** rápida y manejable.\n\n* funciona bien en estilos ágiles o con dos armas", TipoObjeto.ARMA),
                    buildInitialObject("AMCuerpo,Arrojadiza,Alcance20/60,Versatil1d8", "Tridente", "1d6 perforante", "**Arma marcial cuerpo a cuerpo** útil tanto en mano como arrojada.\n\n* puede lanzarse a corta distancia\n* mejora con dos manos", TipoObjeto.ARMA),
                    buildInitialObject("AMCuerpo", "Pico de guerra", "1d8 perforante", "**Arma marcial cuerpo a cuerpo** pensada para perforar defensas duras.\n\n* concentra el impacto en una punta rígida", TipoObjeto.ARMA),
                    buildInitialObject("AMCuerpo,Versatil1d10", "Martillo de guerra", "1d8 contundente", "**Arma marcial cuerpo a cuerpo** sólida y fiable.\n\n* puede usarse con una o dos manos", TipoObjeto.ARMA),
                    buildInitialObject("AMCuerpo,Sutil,Alcance", "Látigo", "1d4 cortante", "**Arma marcial cuerpo a cuerpo** flexible y difícil de anticipar.\n\n* destaca por la sutileza y el alcance", TipoObjeto.ARMA),

                    buildInitialObject("AMRango,Municion,Alcance25/100,Recarga", "Cerbatana", "1 perforante", "**Arma marcial a distancia** discreta y ligera.\n\n* pensada para disparos silenciosos\n* requiere munición y recarga tras cada disparo", TipoObjeto.ARMA),
                    buildInitialObject("AMRango,Municion,Alcance30/120,Ligera,Recarga", "Ballesta de mano", "1d6 perforante", "**Arma marcial a distancia** compacta y fácil de ocultar.\n\n* se maneja con una mano\n* requiere munición y recarga", TipoObjeto.ARMA),
                    buildInitialObject("AMRango,Municion,Alcance100/400,Pesada,Recarga,ADosManos", "Ballesta pesada", "1d10 perforante", "**Arma marcial a distancia** potente pero aparatosa.\n\n* diseñada para impactos contundentes\n* necesita dos manos para usarse con eficacia", TipoObjeto.ARMA),
                    buildInitialObject("AMRango,Municion,Alcance150/600,Pesada,ADosManos", "Arco largo", "1d8 perforante", "**Arma marcial a distancia** de gran alcance.\n\n* sobresale en disparos lejanos\n* exige ambas manos para disparar", TipoObjeto.ARMA),
                    buildInitialObject("AMRango,Especial,Arrojadiza,Alcance5/15", "Red", null, "**Arma marcial a distancia** orientada al control.\n\n* no inflige daño directo\n* se lanza para inmovilizar o entorpecer", TipoObjeto.ARMA)
                ));

        CrearPersonajeDndRequest saiWizardCharacter = buildSeededWizardRequest();
        CrearPersonajeDndRequest saiClericCharacter = buildSeededClericRequest();
        seedCharacterIfMissing(personajeRepository, dndCharacterCreationUtils, sai, saiWizardCharacter, CHARACTER_IMAGE_TWO);
        seedCharacterIfMissing(personajeRepository, dndCharacterCreationUtils, sai, saiClericCharacter, CHARACTER_IMAGE_THREE);

        seedMapIfMissing(mapaRepository, "Bosque nevado", "https://res.cloudinary.com/doxqtmi46/image/upload/v1778687906/Snowy_Forest_River_ksjtvg.jpg", true, "nevado,naturaleza", sai);
        seedMapIfMissing(mapaRepository, "Catedral en ruinas", "https://res.cloudinary.com/doxqtmi46/image/upload/v1778687939/Catedral_en_ruinas_hemqac.jpg", true, "ruinas", sai);

        Usuario tav = userRepository.findByUsername("tav")
            .orElseGet(() -> userRepository.save(buildUser(
                "tav",
                "tav@fosteria.dev",
                encodedPassword,
                "https://res.cloudinary.com/doxqtmi46/image/upload/w_400,h_400,c_fill,g_auto,f_auto/v1775176044/Dame_el_personaje_202604030019_jop3pc.jpg"
            )));

        boolean campañaExists = campañaRepository.findAll().stream()
            .anyMatch(c -> c.getNombre().equals("Campaña de Sai"));

        if (!campañaExists) {
            Campaña campaña = campañaRepository.save(Campaña.builder()
                .nombre("Campaña de Sai")
                .sistemaDeJuego(SistemaDeJuego.DND)
                .dm(sai)
                .build());

            jugadorRepository.save(Jugador.builder().usuario(sai).campaña(campaña).build());
            jugadorRepository.save(Jugador.builder().usuario(tav).campaña(campaña).build());

            Pestaña pestaña = pestañaRepository.save(Pestaña.crearPorDefecto(campaña));

            capaRepository.save(Capa.builder().nombre("capa de fichas").nivelDeCapa(1).pestaña(pestaña).build());
            capaRepository.save(Capa.builder().nombre("capa de mapa").nivelDeCapa(2).pestaña(pestaña).build());
            capaRepository.save(Capa.builder().nombre("capa de DM").nivelDeCapa(3).pestaña(pestaña).build());
        }

        boolean mbCampañaExists = campañaRepository.findAll().stream()
            .anyMatch(c -> c.getNombre().equals("Campaña MB de Sai"));

        if (!mbCampañaExists) {
            Campaña mbCampaña = campañaRepository.save(Campaña.builder()
                .nombre("Campaña MB de Sai")
                .sistemaDeJuego(SistemaDeJuego.MORK_BORG)
                .dm(sai)
                .portadaUrl("https://res.cloudinary.com/doxqtmi46/image/upload/f_auto,q_auto,w_1200,c_limit/v1775178243/campa%C3%B1aPlaceHolder_fhrfx2.png")
                .build());

            jugadorRepository.save(Jugador.builder().usuario(sai).campaña(mbCampaña).build());

            Pestaña mbPestaña = pestañaRepository.save(Pestaña.crearPorDefecto(mbCampaña));

            capaRepository.save(Capa.builder().nombre("capa de fichas").nivelDeCapa(1).pestaña(mbPestaña).build());
            capaRepository.save(Capa.builder().nombre("capa de mapa").nivelDeCapa(2).pestaña(mbPestaña).build());
            capaRepository.save(Capa.builder().nombre("capa de DM").nivelDeCapa(3).pestaña(mbPestaña).build());
        }
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

            private void seedCharacterIfMissing(
                PersonajeRepository personajeRepository,
                DndCharacterCreationUtils dndCharacterCreationUtils,
                Usuario usuario,
                CrearPersonajeDndRequest request,
                String imageUrl
            ) {
            boolean alreadyExists = personajeRepository.findByUsuarioUsernameOrderByUsadoDesc(usuario.getUsername()).stream()
                .anyMatch(personaje -> personaje.getNombre().equalsIgnoreCase(request.nombre()));
            if (alreadyExists) {
                return;
            }

            dndCharacterCreationUtils.crearPersonajeDnd(request, imageUrl, usuario.getUsername());
            }

        private CrearPersonajeDndRequest buildSeededWizardRequest() {
        return new CrearPersonajeDndRequest(
            "Iria Vael",
            "mago",
            null,
            "sabio",
            "elf",
            "high-elf",
            "Neutral bueno",
            "Archivista arcana que viaja de biblioteca en biblioteca reuniendo grimorios y teorías sobre portales antiguos.",
            Map.of(
                "strength", 8,
                "dexterity", 14,
                "constitution", 13,
                "intelligence", 17,
                "wisdom", 12,
                "charisma", 10
            ),
            List.of("Arcano", "Investigacion"),
            Map.of(
                "class-skill-0", List.of("Arcano", "Investigacion")
            ),
            Map.of(
                "sage-languages", List.of("Celestial", "Draconico")
            ),
            Map.of(
                "high-elf-cantrip", List.of("Luz"),
                "high-elf-language", List.of("Gnomo")
            ),
            Map.of(
                "class:mago-arma", 0,
                "class:mago-foco", 1,
                "class:mago-pack", 0
            ),
            Map.of()
        );
        }

        private CrearPersonajeDndRequest buildSeededClericRequest() {
        return new CrearPersonajeDndRequest(
            "Maelis Dorn",
            "clerigo",
            "vida",
            "acolito",
            "human",
            null,
            "Legal bueno",
            "Sanadora itinerante formada en un santuario fronterizo, dedicada a sostener expediciones y aldeas aisladas.",
            Map.of(
                "strength", 13,
                "dexterity", 10,
                "constitution", 14,
                "intelligence", 12,
                "wisdom", 16,
                "charisma", 15
            ),
            List.of("Historia", "Medicina"),
            Map.of(
                "class-skill-0", List.of("Historia", "Medicina")
            ),
            Map.of(
                "acolyte-languages", List.of("Celestial", "Draconico")
            ),
            Map.of(
                "human-language", List.of("Enano")
            ),
            Map.of(
                "class:clerigo-arma-principal", 0,
                "class:clerigo-armadura", 2,
                "class:clerigo-arma-secundaria", 0,
                "class:clerigo-pack", 0
            ),
            Map.of()
        );
        }

    private Habilidad buildSkill(
            String nombre,
            String formula,
            String descripcion,
            String tags
    ) {
        return SeederUtils.buildSkill(nombre, formula, descripcion, tags);
    }

    private JsonNode cargarNodoJson(ObjectMapper objectMapper, Resource resource) {
        try {
            return objectMapper.readTree(resource.getInputStream());
        } catch (Exception exception) {
            throw new IllegalStateException("No se pudo cargar el contenido JSON de sistema: " + resource.getDescription(), exception);
        }
    }

    private String serializarNodo(ObjectMapper objectMapper, JsonNode node) {
        try {
            return objectMapper.writeValueAsString(node == null || node.isMissingNode() ? objectMapper.createObjectNode() : node);
        } catch (Exception exception) {
            throw new IllegalStateException("No se pudo serializar el contenido JSON de sistema", exception);
        }
    }

    private void seedDndContentPackages(
            ObjectMapper objectMapper,
            ResourceLoader resourceLoader,
            ContenidoSistemaJsonService contenidoSistemaJsonService
    ) {
        ResourcePatternResolver resolver = new PathMatchingResourcePatternResolver(resourceLoader.getClassLoader());

        try {
            Resource[] resources = resolver.getResources("classpath*:dnd-content/dnd/**/*.json");
            Arrays.sort(resources, Comparator.comparing(resource -> relativeDndContentPath(resource, "dnd-content/dnd/")));

            for (Resource resource : resources) {
                String relativePath = relativeDndContentPath(resource, "dnd-content/dnd/");
                String packageName = packageNameFromDndContentPath(relativePath);
                JsonNode contentNode = cargarNodoJson(objectMapper, resource);

                contenidoSistemaJsonService.guardarPaquete(
                        SistemaDeJuego.DND,
                        packageName,
                        serializarNodo(objectMapper, contentNode)
                );
            }
        } catch (Exception exception) {
            throw new IllegalStateException("No se pudo sembrar el contenido DND granular desde dnd-content", exception);
        }
    }

    private void seedMorkBorgContentPackages(
            ObjectMapper objectMapper,
            ResourceLoader resourceLoader,
            ContenidoSistemaJsonService contenidoSistemaJsonService
    ) {
        ResourcePatternResolver resolver = new PathMatchingResourcePatternResolver(resourceLoader.getClassLoader());

        try {
            Resource[] resources = resolver.getResources("classpath*:dnd-content/morkborg/**/*.json");
            Arrays.sort(resources, Comparator.comparing(resource -> relativeDndContentPath(resource, "dnd-content/morkborg/")));

            for (Resource resource : resources) {
                String relativePath = relativeDndContentPath(resource, "dnd-content/morkborg/");
                String packageName = packageNameFromDndContentPath(relativePath);
                JsonNode contentNode = cargarNodoJson(objectMapper, resource);

                contenidoSistemaJsonService.guardarPaquete(
                        SistemaDeJuego.MORK_BORG,
                        packageName,
                        serializarNodo(objectMapper, contentNode)
                );
            }
        } catch (Exception exception) {
            throw new IllegalStateException("No se pudo sembrar el contenido Mork Borg granular desde dnd-content", exception);
        }
    }

    private String relativeDndContentPath(Resource resource, String basePath) {
        try {
            String normalizedPath = resource.getURL().toString().replace('\\', '/');
            int basePathIndex = normalizedPath.indexOf(basePath);
            if (basePathIndex < 0) {
                throw new IllegalStateException("Ruta base no encontrada en el recurso: " + normalizedPath);
            }

            return normalizedPath.substring(basePathIndex + basePath.length());
        } catch (Exception exception) {
            throw new IllegalStateException("No se pudo resolver la ruta relativa del recurso DND: " + resource.getDescription(), exception);
        }
    }

    private String packageNameFromDndContentPath(String relativePath) {
        String normalizedPath = relativePath.replace('\\', '/');
        if (!normalizedPath.endsWith(".json")) {
            throw new IllegalStateException("El recurso DND no es un archivo JSON valido: " + normalizedPath);
        }

        return normalizedPath.substring(0, normalizedPath.length() - 5).replace('/', ':');
    }

    private Objeto buildInitialObject(
            String indice,
            String nombre,
            String formula,
            String descripcion,
            TipoObjeto tipoObjeto
    ) {
        return SeederUtils.buildInitialObject(indice, nombre, formula, descripcion, tipoObjeto);
    }
}
