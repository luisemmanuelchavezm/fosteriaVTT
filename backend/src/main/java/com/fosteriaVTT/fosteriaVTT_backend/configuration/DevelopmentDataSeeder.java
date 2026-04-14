package com.fosteriaVTT.fosteriaVTT_backend.configuration;

import com.fosteriaVTT.fosteriaVTT_backend.Campaña.Campaña;
import com.fosteriaVTT.fosteriaVTT_backend.Campaña.CampañaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.HabilidadRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Jugador.Jugador;
import com.fosteriaVTT.fosteriaVTT_backend.Jugador.JugadorRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.Objeto;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.ObjetoRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.TipoObjeto;
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
            HabilidadRepository habilidadRepository,
                ObjetoRepository objetoRepository,
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

                habilidadRepository.saveAll(List.of(
                    buildSkill(
                        "barbaro",
                        1,
                        "Furia",
                        null,
                        "Daño de furia: nivel 1-8 +2; nivel 9-15 +3; nivel 16-20 +4",
                        "puedes imbuirte de un poder primigenio llamado furia, una fuerza que te otorga una resistencia y potencia extraordinarias. puedes entrar en furia como acción adicional si no llevas armadura pesada.\n\n"
                            + "**Usos:** tienes un número limitado de usos, que recuperas al completar un descanso largo.\n\n"
                            + "mientras está activa:\n\n"
                            + "* **Resistencia al daño:** contundente, perforante y cortante\n"
                            + "* **Daño adicional:** al impactar con ataques basados en fuerza\n"
                            + "* **Ventaja en fuerza:** en pruebas y salvaciones\n"
                            + "* **Restricciones:** no puedes lanzar conjuros ni mantener concentración\n\n"
                            + "**Duración:** hasta 1 minuto. termina antes si no atacas ni recibes daño en un turno o si quedas inconsciente.",
                        "ResContundente+,ResPerforante+,ResCortante+,PruebaFuerza+,SalvacionFuerza+,"
                    ),
                    buildSkill(
                        "barbaro",
                        1,
                        "Defensa sin armadura",
                        null,
                        "10 + DES + CON",
                        "mientras no lleves armadura:\n\n"
                            + "**CA = 10 + destreza + constitución**\n\n"
                            + "puedes usar escudo.",
                        "Escudo"
                    ),
                    buildSkill(
                        "barbaro",
                        2,
                        "Ataque temerario",
                        null,
                        null,
                        "puedes atacar con ferocidad descuidando tu defensa.\n\n"
                            + "* ventaja en ataques cuerpo a cuerpo con fuerza\n"
                            + "* los enemigos tienen ventaja contra ti hasta tu siguiente turno",
                        "Ataque+, Defensa-"
                    ),
                    buildSkill("barbaro", 2, "Sentido del peligro", null, null, "tienes ventaja en las tiradas de salvación de destreza contra efectos que puedas ver, como trampas y conjuros. no debes estar cegado, ensordecido o incapacitado.", "SalvacionDestreza+,Percepcion"),
                    buildSkill("barbaro", 3, "Senda primal", null, null, "eliges una senda que moldea tu rabia. en esta implementación, la senda disponible es la senda del berserker.", "Subclase,Berserker"),
                    buildSkill("barbaro", 3, "Frenesí", null, null, "cuando entras en furia puedes hacerlo con frenesí. mientras dure, puedes realizar un ataque con arma cuerpo a cuerpo como acción adicional en cada uno de tus turnos. al terminar la furia, sufres un nivel de agotamiento.", "Berserker,AtaqueExtra,Agotamiento"),
                    buildSkill("barbaro", 4, "Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "MejoraCaracteristica"),
                    buildSkill("barbaro", 5, "Ataque extra", null, "2 ataques por acción de atacar", "puedes atacar dos veces, en lugar de una, cada vez que realices la acción de atacar en tu turno.", "Multiataque"),
                    buildSkill("barbaro", 5, "Movimiento rápido", null, "+10 pies de velocidad", "tu velocidad aumenta en 10 pies mientras no lleves armadura pesada.", "Velocidad+,Movimiento"),
                    buildSkill("barbaro", 6, "Mente sin miedo", null, null, "no puedes ser hechizado ni asustado mientras estés en furia. si ya lo estabas al entrar en furia, el efecto queda suspendido mientras dure.", "Berserker,InmunidadHechizado,InmunidadAsustado"),
                    buildSkill("barbaro", 7, "Instinto salvaje", null, null, "tienes ventaja en las tiradas de iniciativa. además, si te sorprenden y no estás incapacitado, puedes actuar con normalidad en tu primer turno si entras en furia antes de hacer cualquier otra cosa.", "Iniciativa+,Sorpresa"),
                    buildSkill("barbaro", 8, "Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "MejoraCaracteristica"),
                    buildSkill("barbaro", 9, "Crítico brutal (1 dado)", null, "+1 dado de daño en crítico", "puedes tirar un dado adicional de daño del arma al determinar el daño extra de un golpe crítico cuerpo a cuerpo.", "Critico+,Daño+"),
                    buildSkill("barbaro", 10, "Presencia intimidante", null, "CD = 8 + competencia + carisma", "puedes usar tu acción para aterrorizar a una criatura que esté a 30 pies o menos y pueda verte u oírte. debe superar una salvación de sabiduría o quedar asustada hasta el final de tu próximo turno. puedes usar tu acción en turnos siguientes para prolongar el efecto.", "Berserker,Miedo,Control"),
                    buildSkill("barbaro", 11, "Rabia implacable", null, "CD 10 + 5 por uso adicional", "si tus puntos de golpe caen a 0 mientras estás en furia y no mueres en el acto, puedes hacer una tirada de salvación de constitución con CD 10. si tienes éxito, te quedas con 1 punto de golpe. la CD aumenta en 5 cada vez que vuelves a usar este rasgo hasta que completes un descanso corto o largo.", "Supervivencia,Constitucion"),
                    buildSkill("barbaro", 12, "Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "MejoraCaracteristica"),
                    buildSkill("barbaro", 13, "Crítico brutal (2 dados)", null, "+2 dados de daño en crítico", "al determinar el daño adicional de un golpe crítico cuerpo a cuerpo, añades dos dados extra de daño del arma en lugar de uno.", "Critico+,Daño+"),
                    buildSkill("barbaro", 14, "Represalia", null, "Reacción: 1 ataque cuerpo a cuerpo", "cuando una criatura que esté a 5 pies de ti te haga daño, puedes usar tu reacción para realizar un ataque con arma cuerpo a cuerpo contra esa criatura.", "Berserker,Reaccion,Contraataque"),
                    buildSkill("barbaro", 15, "Rabia persistente", null, null, "tu furia ya no termina de forma anticipada solo porque no hayas atacado a una criatura hostil o no hayas recibido daño desde tu último turno.", "Furia"),
                    buildSkill("barbaro", 16, "Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "MejoraCaracteristica"),
                    buildSkill("barbaro", 17, "Crítico brutal (3 dados)", null, "+3 dados de daño en crítico", "al determinar el daño adicional de un golpe crítico cuerpo a cuerpo, añades tres dados extra de daño del arma.", "Critico+,Daño+"),
                    buildSkill("barbaro", 18, "Poder indomable", null, null, "si el total de una prueba de fuerza es menor que tu puntuación de fuerza, puedes usar tu puntuación de fuerza en lugar del resultado del dado.", "Fuerza,Pruebas"),
                    buildSkill("barbaro", 19, "Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "MejoraCaracteristica"),
                    buildSkill("barbaro", 20, "Campeón primal", null, "FUE +4, CON +4, máximo 24", "tus puntuaciones de fuerza y constitución aumentan en 4. además, el máximo de ambas puntuaciones pasa a ser 24.", "Fuerza+,Constitucion+")));

                objetoRepository.saveAll(List.of(
                    buildInitialObject("Pesada,ADosManos", "Gran hacha", "1d12 cortante", "**Arma marcial cuerpo a cuerpo** de filo brutal.\n\n* opción del equipo inicial del bárbaro\n* pensada para maximizar daño en golpes pesados", TipoObjeto.ARMA),
                    buildInitialObject("CatalogoAMCuerpo", "Arma marcial cuerpo a cuerpo", "varía según el arma elegida", "**Objeto genérico de elección**.\n\n* representa cualquier arma marcial cuerpo a cuerpo permitida por el equipo inicial\n* su perfil final depende de la elección del jugador", TipoObjeto.ARMA),
                    buildInitialObject("Ligera,Arrojadiza,Alcance20/60", "Hacha de mano", "1d6 cortante", "**Arma ligera y versátil**.\n\n* opción del armamento secundario del bárbaro\n* útil en combate cercano o para lanzamiento", TipoObjeto.ARMA),
                    buildInitialObject("CatalogoASimple", "Arma simple", "varía según el arma elegida", "**Objeto genérico de elección**.\n\n* representa cualquier arma simple permitida por el equipo inicial\n* su perfil final depende de la elección del jugador", TipoObjeto.ARMA),
                    buildInitialObject("", "Pack de explorador", "kit de aventura", "**Equipo de viaje** preparado para expediciones.\n\n* incluye suministros básicos de travesía\n* pensado para supervivencia y desplazamiento", TipoObjeto.MISCELANEO),
                    buildInitialObject("Arrojadiza,Alcance30/120", "Jabalina", "1d6 perforante", "**Arma arrojadiza** equilibrada para hostigar a distancia corta o media.", TipoObjeto.ARMA),

                    buildInitialObject("", "Simbolo sagrado", null, "**Foco devocional** ligado a la fe del personaje.\n\n* se emplea en ritos, plegarias y ceremonias", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Devocionario o rueda de oraciones", null, "**Objeto de devoción** usado en lecturas, rezos o meditaciones prolongadas.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Vara de incienso", null, "**Consumible ritual** para ceremonias, ofrendas y ambientes sagrados.", TipoObjeto.CONSUMIBLE),
                    buildInitialObject("", "Vestiduras", null, "**Indumentaria ceremonial** propia del servicio religioso.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Ropa comun", null, "**Ropa sencilla** para el día a día fuera de los ritos.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Piezas de oro", null, "**Reserva inicial de dinero** para gastos básicos de viaje o manutención.", TipoObjeto.DINERO),

                    buildInitialObject("", "Palanca", null, "**Herramienta resistente** para forzar accesos o mover obstáculos pesados.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Ropa comun oscura con capucha", null, "**Ropa discreta** pensada para pasar desapercibido en callejones y tejados.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Piezas de oro", null, "**Reserva inicial de dinero** procedente del oficio o del último golpe.", TipoObjeto.DINERO),

                    buildInitialObject("", "Ropa elegante", null, "**Atuendo vistoso** para dar una imagen convincente y llamativa.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Kit de falsificacion", null, "**Conjunto de útiles** para copiar sellos, firmas y documentos.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Herramientas de timo", null, "**Material de estafa callejera**.\n\n* copas precintadas\n* cartas marcadas\n* dados cargados", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Piezas de oro", null, "**Reserva inicial de dinero** para mantener apariencias o preparar el siguiente engaño.", TipoObjeto.DINERO),

                    buildInitialObject("", "Instrumento musical", null, "**Herramienta principal de actuación** para música, interpretación o puesta en escena.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Objeto de un admirador", null, "**Recuerdo sentimental** recibido de alguien fascinado por tus actuaciones.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Disfraz", null, "**Vestuario de escena** para adoptar papeles y apariencias distintas.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Piezas de oro", null, "**Reserva inicial de dinero** ganada con actuaciones o favores del público.", TipoObjeto.DINERO),

                    buildInitialObject("", "Juego de herramientas de artesano", null, "**Herramientas de oficio** ligadas al origen humilde del personaje.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Pala", null, "**Útil de trabajo** resistente y práctico para tierra y escombros.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Olla de hierro", null, "**Recipiente robusto** para cocinar en casa o en campamento.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Ropa comun", null, "**Ropa cotidiana** propia de la gente llana.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Piezas de oro", null, "**Reserva inicial de dinero** modesta pero útil para el viaje.", TipoObjeto.DINERO),

                    buildInitialObject("", "Juego de herramientas de artesano", null, "**Herramientas profesionales** ligadas a tu especialidad dentro del gremio.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Carta de presentacion del gremio", null, "**Documento acreditativo** que prueba tu pertenencia y reputación profesional.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Ropa de viaje", null, "**Ropa práctica** para desplazamientos y jornadas de trabajo.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Piezas de oro", null, "**Reserva inicial de dinero** para manutención, materiales o cuotas.", TipoObjeto.DINERO),

                    buildInitialObject("", "Estuche de pergaminos con notas", null, "**Colección de apuntes personales** fruto de años de retiro y estudio.\n\n* observaciones\n* reflexiones\n* descubrimientos", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Manta de invierno", null, "**Manta gruesa** preparada para resistir el frío y las noches al raso.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Ropa comun", null, "**Ropa sencilla** para una vida sobria y austera.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Kit de herborista", null, "**Conjunto de útiles** para recolectar, preparar y clasificar hierbas.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Piezas de oro", null, "**Reserva inicial de dinero** muy contenida.", TipoObjeto.DINERO),

                    buildInitialObject("", "Ropa elegante", null, "**Atuendo distinguido** propio de alguien de alta cuna.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Anillo de sello", null, "**Sello familiar** usado para autenticar cartas y documentos.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Pergamino de pedigrí", null, "**Prueba documental del linaje** y la posición de tu familia.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Piezas de oro", null, "**Reserva inicial de dinero** acorde a una crianza acomodada.", TipoObjeto.DINERO),

                    buildInitialObject("", "Baston", null, "**Bastón robusto** para marcha, apoyo o defensa improvisada.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Trampa de caza", null, "**Mecanismo simple** para capturar presas pequeñas.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Trofeo de un animal cazado", null, "**Recuerdo de supervivencia** tomado de una presa importante del pasado.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Ropa de viaje", null, "**Ropa resistente** para la intemperie y el movimiento constante.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Piezas de oro", null, "**Reserva inicial de dinero** para necesidades básicas en ruta.", TipoObjeto.DINERO),

                    buildInitialObject("", "Frasco de tinta negra", null, "**Suministro de escritura** para copias, notas y anotaciones.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Pluma", null, "**Herramienta de escritura** para trabajo académico o documental.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Cuchillo pequeño", null, "**Útil ligero** para tareas menores de viaje o estudio.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Carta de un colega fallecido", null, "**Mensaje inconcluso** que impulsa nuevas investigaciones y preguntas.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Ropa comun", null, "**Ropa sencilla** para trabajo y vida diaria.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Piezas de oro", null, "**Reserva inicial de dinero** para viaje, libros o materiales.", TipoObjeto.DINERO),

                    buildInitialObject("", "Amuleto de la suerte", null, "**Talismán personal** al que atribuyes tu supervivencia en el mar.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Cuerda de seda", "15 metros", "**Cuerda resistente y flexible** útil a bordo, en escaladas o maniobras.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Ropa comun", null, "**Ropa práctica** para la vida diaria fuera de cubierta.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Piezas de oro", null, "**Reserva inicial de dinero** procedente de soldadas o botines modestos.", TipoObjeto.DINERO),

                    buildInitialObject("", "Insignia de rango", null, "**Señal militar** de la posición que ocupaste en tu unidad.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Trofeo de un enemigo caido", null, "**Recuerdo bélico** tomado a un adversario derrotado.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Juego de dados o cartas", null, "**Pasatiempo de campaña** habitual entre soldados durante los descansos.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Ropa comun", null, "**Ropa sencilla** para el tiempo fuera de servicio.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Piezas de oro", null, "**Reserva inicial de dinero** para manutención y camino.", TipoObjeto.DINERO),

                    buildInitialObject("", "Cuchillo pequeño", null, "**Herramienta discreta** para sobrevivir en callejones y azoteas.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Mapa de la ciudad", null, "**Mapa urbano** con rutas, callejones y atajos clave.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Raton mascota", null, "**Pequeño compañero callejero** que ha sobrevivido contigo.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Recuerdo de tus padres", null, "**Objeto sentimental** conservado como vínculo con tu pasado.", TipoObjeto.MISCELANEO),
                    buildInitialObject("", "Piezas de oro", null, "**Reserva inicial de dinero** difícilmente reunida pero valiosa.", TipoObjeto.DINERO),

                    buildInitialObject("ASimple,ASCuerpo,Ligera", "Garrote", "1d4 contundente", "**Arma simple cuerpo a cuerpo** rudimentaria pero efectiva.\n\n* fácil de encontrar\n* útil en manos poco entrenadas", TipoObjeto.ARMA),
                    buildInitialObject("ASimple,ASCuerpo,Sutil,Ligera,Arrojadiza,Alcance20/60", "Daga", "1d4 perforante", "**Arma simple cuerpo a cuerpo** pequeña y muy versátil.\n\n* sirve tanto en combate cercano como al lanzarla\n* favorece estilos ágiles", TipoObjeto.ARMA),
                    buildInitialObject("ASimple,ASCuerpo,ADosManos", "Gran garrote", "1d8 contundente", "**Arma simple cuerpo a cuerpo** pesada y directa.\n\n* requiere ambas manos\n* prima la fuerza sobre la técnica", TipoObjeto.ARMA),
                    buildInitialObject("ASimple,ASCuerpo,Ligera,Arrojadiza,Alcance20/60", "Hacha de mano", "1d6 cortante", "**Arma simple cuerpo a cuerpo** compacta y contundente.\n\n* puede blandirse con soltura\n* también puede lanzarse", TipoObjeto.ARMA),
                    buildInitialObject("ASimple,ASCuerpo,Arrojadiza,Alcance30/120", "Jabalina", "1d6 perforante", "**Arma simple cuerpo a cuerpo** pensada para hostigar y mantener distancia.\n\n* se puede usar en mano\n* funciona bien al lanzarla", TipoObjeto.ARMA),
                    buildInitialObject("ASimple,ASCuerpo,Ligera,Arrojadiza,Alcance20/60", "Martillo ligero", "1d4 contundente", "**Arma simple cuerpo a cuerpo** manejable y fiable.\n\n* útil en combate cercano\n* puede lanzarse con facilidad", TipoObjeto.ARMA),
                    buildInitialObject("ASimple,ASCuerpo", "Maza", "1d6 contundente", "**Arma simple cuerpo a cuerpo** sólida y directa.\n\n* no requiere técnica compleja\n* concentra su fuerza en impactos brutales", TipoObjeto.ARMA),
                    buildInitialObject("ASimple,ASCuerpo,Versatil1d8", "Bastón", "1d6 contundente", "**Arma simple cuerpo a cuerpo** flexible y común entre viajeros.\n\n* se puede usar con una o dos manos\n* destaca por su versatilidad", TipoObjeto.ARMA),
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

    private Habilidad buildSkill(
            String clase,
            Integer nivel,
            String nombre,
            String imagen,
            String formula,
            String descripcion,
            String tags
    ) {
        return Habilidad.builder()
            .clase(clase)
            .nivel(nivel)
                .nombre(nombre)
                .imagen(imagen)
                .formula(formula)
                .descripcion(descripcion)
                .tags(tags)
                .build();
    }

    private Objeto buildInitialObject(
            String indice,
            String nombre,
            String formula,
            String descripcion,
            TipoObjeto tipoObjeto
    ) {
        return Objeto.builder()
                .indice(indice)
                .nombre(nombre)
                .formula(formula)
                .descripcion(descripcion)
                .tipoObjeto(tipoObjeto)
                .build();
    }
}