package com.fosteriaVTT.fosteriaVTT_backend.configuration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fosteriaVTT.fosteriaVTT_backend.ContenidoSistemaJson.ContenidoSistemaJsonService;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.HabilidadRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Mapa.Mapa;
import com.fosteriaVTT.fosteriaVTT_backend.Mapa.MapaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.Objeto;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.ObjetoRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.TipoObjeto;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.PersonajeRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils.DndCharacterCreationUtils;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Rol;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.UserRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario;
import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CrearPersonajeDndRequest;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
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

    private static final String DND_ARTISAN_TOOL_CATALOG_TAG = "DND,HerramientaArtesano,CatalogoHerramientasArtesanoDnd";
    private static final String DND_GAME_CATALOG_TAG = "DND,Juego,CatalogoJuegosDnd";
    private static final String DND_INSTRUMENT_CATALOG_TAG = "DND,InstrumentoMusical,CatalogoInstrumentosDnd";
    private static final String DND_WEAPON_ARMOR_COMPETENCY_CATALOG_TAG = "DND,Competencia,ArmaArmadura,CatalogoCompetenciasArmasArmadurasDnd";
    private static final String DND_TOOL_COMPETENCY_CATALOG_TAG = "DND,Competencia,Herramienta,CatalogoCompetenciasHerramientasDnd";
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
        });
    }

    @Bean
    @Order(2)
    CommandLineRunner seedDndSpellCatalog(HabilidadRepository habilidadRepository) {
        return args -> CompletableFuture.runAsync(() -> {
            removeLegacySpellCatalogEntries(habilidadRepository);
            removeSpellCatalogEntriesByName(habilidadRepository, List.of("Escritura ilusoria", "Orden"));

            seedSpellCatalogEntries(habilidadRepository, List.of(
                buildSpellSeedDetailed("Salpicadura ácida", "1d6 ácido", "Lanzas una burbuja de ácido contra una o dos criaturas cercanas entre sí dentro del alcance.", "truco", "1 acción", "60 pies", "V S", "Instantáneo", "1d6 ácido", "Nivel 5: 2d6 | Nivel 11: 3d6 | Nivel 17: 4d6", "hechicero", "mago"),
                buildSpellSeedDetailed("Alarma", null, "Proteges una puerta, ventana o una zona de 20 pies para recibir una alerta mental o audible cuando una criatura pequeña o mayor entre en el área protegida.", "Hechizo;1,Ritual", "1 minuto", "30 pies", "V S M (una campanilla y un trozo de hilo de plata fina)", "8 horas", null, null, "explorador", "mago"),
                buildSpellSeedDetailed("Amistad animal", null, "Convences a una bestia de que no pretendes dañarla y puede quedar encantada durante un día si falla su salvación de Sabiduría.", "Hechizo;1", "1 acción", "30 pies", "V S M (un bocado de comida)", "24 horas", null, null, "bardo", "druida", "explorador"),
                buildSpellSeedDetailed("Perdición", "1d4 a ataques y salvaciones", "Hasta tres criaturas dentro del alcance deben restar 1d4 a sus tiradas de ataque y salvación mientras dure el conjuro.", "Hechizo;1", "1 acción", "30 pies", "V S M (una gota de sangre)", "Concentración hasta 1 minuto", "1d4 penalizador", "Nivel 2+: 1 objetivo adicional por nivel del espacio", "bardo", "clerigo"),
                buildSpellSeedDetailed("Bendición", "1d4 a ataques y salvaciones", "Hasta tres criaturas reciben una bendición que les permite sumar 1d4 a sus tiradas de ataque y salvación mientras dure el conjuro.", "Hechizo;1", "1 acción", "30 pies", "V S M (agua bendita)", "Concentración hasta 1 minuto", "1d4 bonificador", "Nivel 2+: 1 objetivo adicional por nivel del espacio", "clerigo", "paladin"),
                buildSpellSeedDetailed("Manos ardientes", "3d6 fuego", "Un abanico de llamas brota de tus manos en un cono de 15 pies. Las criaturas del área realizan una salvación de Destreza para reducir el daño de fuego.", "Hechizo;1", "1 acción", "Lanzador (cono de 15 pies)", "V S", "Instantáneo", "3d6 fuego", "Nivel 2+: +1d6 por nivel del espacio", "hechicero", "mago"),
                buildSpellSeedDetailed("Hechizar persona", null, "Intentas encantar a un humanoide para que te considere un conocido amistoso si falla una salvación de Sabiduría.", "Hechizo;1", "1 acción", "30 pies", "V S", "1 hora", null, "Nivel 2+: 1 objetivo adicional por nivel del espacio", "bardo", "hechicero", "brujo", "mago"),
                buildSpellSeedDetailed("Toque helado", "1d8 necrótico", "Creas una mano fantasmagórica sobre una criatura dentro del alcance y realizas un ataque de conjuro a distancia. Si impactas, el objetivo sufre daño necrótico y no puede recuperar puntos de golpe hasta el comienzo de tu siguiente turno; además, los muertos vivientes impactados tienen desventaja en sus ataques contra ti hasta entonces.", "truco", "1 acción", "120 pies", "V S", "1 asalto", "1d8 necrótico", "Nivel 5: 2d8 | Nivel 11: 3d8 | Nivel 17: 4d8", "hechicero", "brujo", "mago"),
                buildSpellSeedDetailed("Rociada de color", null, "Un estallido de luces deslumbrantes ciega a criaturas con pocos puntos de golpe dentro del cono.", "Hechizo;1", "1 acción", "Lanzador (cono de 15 pies)", "V S M (un pellizco de polvo o arena coloreada)", "1 asalto", null, null, "hechicero", "mago"),
                buildSpellSeedDetailed("Orden imperiosa", null, "Pronuncias una orden de una palabra y una criatura visible debe obedecerla en su siguiente turno si falla la salvación de Sabiduría.", "Hechizo;1", "1 acción", "60 pies", "V", "1 asalto", null, "Nivel 2+: 1 objetivo adicional por nivel del espacio", "clerigo", "paladin"),
                buildSpellSeedDetailed("Comprensión idiomática", null, "Durante un tiempo entiendes el significado literal de cualquier idioma hablado que oigas y de cualquier texto escrito que toques.", "Hechizo;1,Ritual", "1 acción", "Lanzador", "V S M (una pizca de hollín y sal)", "1 hora", null, null, "bardo", "hechicero", "brujo", "mago"),
                buildSpellSeedDetailed("Crear o destruir agua", null, "Creas agua limpia en recipientes dentro del alcance o destruyes agua en un área o recipiente apropiados.", "Hechizo;1", "1 acción", "30 pies", "V S M (una gota de agua si la creas, unos granos de arena si la destruyes)", "Instantáneo", null, "Nivel 2+: +10 galones creados o destruidos por nivel del espacio", "clerigo", "druida"),
                buildSpellSeedDetailed("Curar heridas", "1d8 + modificador de conjuro", "Canalizas energía restauradora en una criatura que tocas para cerrar sus heridas.", "Hechizo;1", "1 acción", "Toque", "V S", "Instantáneo", "1d8 + modificador de conjuro", "Nivel 2+: +1d8 por nivel del espacio", "bardo", "clerigo", "druida", "paladin", "explorador"),
                buildSpellSeedDetailed("Luces danzantes", null, "Creas hasta cuatro luces flotantes con apariencia de antorchas, faroles o esferas luminosas que puedes mover a voluntad.", "truco", "1 acción", "120 pies", "V S M (un trozo de fósforo, una luciérnaga o musgo fosforescente)", "Concentración hasta 1 minuto", null, null, "bardo", "hechicero", "mago"),
                buildSpellSeedDetailed("Detectar el bien y el mal", null, "Percibes aberraciones, celestiales, elementales, feéricos, infernales, no muertos y lugares consagrados o profanados cercanos.", "Hechizo;1", "1 acción", "Lanzador", "V S", "Concentración hasta 10 minutos", null, null, "clerigo", "paladin"),
                buildSpellSeedDetailed("Detectar magia", null, "Sientes la presencia de magia cercana y, con atención, puedes ver su aura y averiguar su escuela.", "Hechizo;1,Ritual", "1 acción", "Lanzador", "V S", "Concentración hasta 10 minutos", null, null, "bardo", "clerigo", "druida", "paladin", "explorador", "hechicero", "mago"),
                buildSpellSeedDetailed("Detectar venenos y enfermedades", null, "Percibes la presencia y localización de venenos, criaturas venenosas y enfermedades dentro del alcance.", "Hechizo;1,Ritual", "1 acción", "Lanzador", "V S M (una hoja de tejo)", "Concentración hasta 10 minutos", null, null, "clerigo", "druida", "paladin", "explorador"),
                buildSpellSeedDetailed("Disfrazarse", null, "Alteras tu aspecto, incluida la ropa, armadura y equipo visibles, para parecer otra persona.", "Hechizo;1", "1 acción", "Lanzador", "V S", "1 hora", null, null, "bardo", "hechicero", "mago"),
                buildSpellSeedDetailed("Favor divino", "1d4 radiante", "Una oración envuelve tus ataques con arma en energía sagrada y añade daño radiante mientras dure el conjuro.", "Hechizo;1", "1 acción adicional", "Lanzador", "V S", "Concentración hasta 1 minuto", "1d4 radiante", null, "paladin"),
                buildSpellSeedDetailed("Druidismo", null, "Invocas un pequeño prodigio natural como predecir el tiempo, hacer brotar una flor o encender una llama pequeña.", "truco", "1 acción", "30 pies", "V S", "Instantáneo", null, null, "druida"),
                buildSpellSeedDetailed("Invocación sobrenatural", "1d10 fuerza", "Un rayo de energía arcana golpea a un objetivo y crece en potencia con tu nivel.", "truco", "1 acción", "120 pies", "V S", "Instantáneo", "1d10 fuerza", "Nivel 5: 2 rayos | Nivel 11: 3 rayos | Nivel 17: 4 rayos", "brujo"),
                buildSpellSeedDetailed("Enmarañar", null, "Hierbas y enredaderas brotan del suelo para inmovilizar a las criaturas de la zona.", "Hechizo;1", "1 acción", "90 pies", "V S", "Concentración hasta 1 minuto", null, null, "druida", "explorador"),
                buildSpellSeedDetailed("Retirada expeditiva", null, "La magia acelera tus pasos y te permite esprintar una y otra vez con facilidad.", "Hechizo;1", "1 acción adicional", "Lanzador", "V S", "Concentración hasta 10 minutos", null, null, "hechicero", "brujo", "mago"),
                buildSpellSeedDetailed("Fuego feérico", null, "Envuelves criaturas y objetos en luz colorida que revela su posición y facilita golpearlos.", "Hechizo;1", "1 acción", "60 pies", "V", "Concentración hasta 1 minuto", null, null, "bardo", "druida"),
                buildSpellSeedDetailed("Vida falsa", "1d4 + 4 PG temporales", "Te refuerzas con una copia necrótica de la vida que te concede puntos de golpe temporales.", "Hechizo;1", "1 acción", "Lanzador", "V S M (una pequeña cantidad de alcohol o licores destilados)", "1 hora", "1d4 + 4 PG temporales", "Nivel 2+: +5 PG temporales por nivel del espacio", "hechicero", "mago"),
                buildSpellSeedDetailed("Caída de pluma", null, "Eliges hasta cinco criaturas descendiendo dentro del alcance. Su velocidad de caída pasa a 60 pies por asalto hasta que termine el conjuro y no sufren daño por caída si aterrizan antes.", "Hechizo;1", "1 reacción", "60 pies", "V M (una pequeña pluma o plumón)", "1 minuto", null, null, "bardo", "hechicero", "mago"),
                buildSpellSeedDetailed("Encontrar familiar", null, "Convocas un espíritu que adopta la forma de un animal y actúa como tu familiar.", "Hechizo;1,Ritual", "1 hora", "10 pies", "V S M (carbón, incienso y hierbas por valor de 10 po que consume el conjuro)", "Instantáneo", null, null, "mago"),
                buildSpellSeedDetailed("Descarga de fuego", "1d10 fuego", "Arrojas una chispa ardiente que quema a una criatura o prende objetos inflamables.", "truco", "1 acción", "120 pies", "V S", "Instantáneo", "1d10 fuego", "Nivel 5: 2d10 | Nivel 11: 3d10 | Nivel 17: 4d10", "hechicero", "mago"),
                buildSpellSeedDetailed("Nube de niebla", null, "Creas una niebla espesa que bloquea la visión y se extiende alrededor de esquinas.", "Hechizo;1", "1 acción", "120 pies", "V S", "Concentración hasta 1 hora", null, null, "druida", "explorador", "hechicero", "mago"),
                buildSpellSeedDetailed("Baya nutritiva", null, "Imbuyes bayas con magia curativa y nutritiva para sostener a una criatura.", "Hechizo;1", "1 acción", "Toque", "V S M (una rama de muérdago)", "Instantáneo", null, null, "druida", "explorador"),
                buildSpellSeedDetailed("Grasa", null, "Cubres el suelo con grasa resbaladiza para hacer tropezar a quienes lo pisan.", "Hechizo;1", "1 acción", "60 pies", "V S M (un poco de corteza de cerdo o mantequilla)", "1 minuto", null, null, "mago"),
                buildSpellSeedDetailed("Guía", "1d4 a una prueba de característica", "Tocas a una criatura y la orientas con magia para mejorar una prueba próxima.", "truco", "1 acción", "Toque", "V S", "Concentración hasta 1 minuto", "1d4 a una prueba", null, "clerigo", "druida"),
                buildSpellSeedDetailed("Saeta guía", "4d6 radiante", "Un destello radiante golpea al objetivo y deja una marca luminosa que facilita el próximo impacto.", "Hechizo;1", "1 acción", "120 pies", "V S", "1 asalto", "4d6 radiante", "Nivel 2+: +1d6 por nivel del espacio", "clerigo"),
                buildSpellSeedDetailed("Palabra sanadora", "1d4 + modificador de conjuro", "Una breve palabra de poder restaura la vitalidad de un aliado a distancia.", "Hechizo;1", "1 acción adicional", "60 pies", "V", "Instantáneo", "1d4 + modificador de conjuro", "Nivel 2+: +1d4 por nivel del espacio", "bardo", "clerigo", "druida"),
                buildSpellSeedDetailed("Reprensión infernal", "2d10 fuego", "Cuando te hieren, respondes con llamas infernales que envuelven al atacante.", "Hechizo;1", "1 reacción", "60 pies", "V S", "Instantáneo", "2d10 fuego", "Nivel 2+: +1d10 por nivel del espacio", "brujo"),
                buildSpellSeedDetailed("Heroísmo", null, "Infundes valor sobrenatural a una criatura para sostenerla frente al miedo y el dolor.", "Hechizo;1", "1 acción", "Toque", "V S", "Concentración hasta 1 minuto", null, "Nivel 2+: 1 objetivo adicional por nivel del espacio", "bardo", "paladin"),
                buildSpellSeedDetailed("Marca del cazador", "1d6 al daño de arma", "Marcas mágicamente a una presa para castigarla con más daño y seguir su rastro con facilidad.", "Hechizo;1", "1 acción adicional", "90 pies", "V", "Concentración hasta 1 hora", "1d6 al daño de arma", null, "explorador"),
                buildSpellSeedDetailed("Identificar", null, "Analizas un objeto o criatura tocados para comprender su naturaleza mágica, sus propiedades y los conjuros que lo afectan.", "Hechizo;1,Ritual", "1 minuto", "Toque", "V S M (una perla valorada en 100 po y una pluma de búho)", "Instantáneo", null, null, "bardo", "mago"),
                buildSpellSeedDetailed("Texto ilusorio", null, "Escribes en un soporte adecuado y lo cubres con una ilusión duradera. Las criaturas que designes ven el mensaje real, mientras que las demás perciben un texto incomprensible o incluso un contenido distinto si conoces el idioma imitado; visión verdadera permite leer el mensaje oculto.", "Hechizo;1,Ritual", "1 minuto", "Toque", "V S M (tinta con base de plomo valorada en 10 po que consume el conjuro)", "10 días", null, null, "bardo", "brujo", "mago"),
                buildSpellSeedDetailed("Infligir heridas", "3d10 necrótico", "Canalizas energía mortífera a través del contacto para devastar a tu objetivo.", "Hechizo;1", "1 acción", "Toque", "V S", "Instantáneo", "3d10 necrótico", "Nivel 2+: +1d10 por nivel del espacio", "clerigo"),
                buildSpellSeedDetailed("Saltar", null, "Potencias el salto de una criatura tocada para que cubra distancias extraordinarias.", "Hechizo;1", "1 acción", "Toque", "V S M (la pata trasera de un saltamontes)", "1 minuto", null, null, "druida", "explorador", "hechicero", "mago"),
                buildSpellSeedDetailed("Luz", null, "Haces que un objeto irradie luz mágica y alumbre la zona circundante.", "truco", "1 acción", "Toque", "V M (una luciérnaga o musgo fosforescente)", "1 hora", null, null, "bardo", "clerigo", "hechicero", "mago"),
                buildSpellSeedDetailed("Zancada prodigiosa", "+10 pies de velocidad", "Tocas a una criatura y aumentas su velocidad en 10 pies hasta el final del conjuro.", "Hechizo;1", "1 acción", "Toque", "V S M (una pizca de tierra)", "1 hora", null, "Nivel 2+: 1 objetivo adicional por nivel del espacio", "bardo", "druida", "explorador", "mago"),
                buildSpellSeedDetailed("Armadura de mago", "CA 13 + Destreza", "Envuelves a una criatura desprotegida en una barrera arcana que mejora su defensa.", "Hechizo;1", "1 acción", "Toque", "V S M (un trozo de cuero curado)", "8 horas", "CA 13 + Destreza", null, "hechicero", "mago"),
                buildSpellSeedDetailed("Mano de mago", null, "Invocas una mano flotante que puede manipular objetos ligeros a distancia.", "truco", "1 acción", "30 pies", "V S", "1 minuto", null, null, "bardo", "hechicero", "brujo", "mago"),
                buildSpellSeedDetailed("Proyectil mágico", "3 x (1d4 + 1 fuerza)", "Creas varios dardos de energía que golpean sin fallar a uno o más objetivos.", "Hechizo;1", "1 acción", "120 pies", "V S", "Instantáneo", "3 x (1d4 + 1 fuerza)", "Nivel 2+: 1 dardo adicional por nivel del espacio", "hechicero", "mago"),
                buildSpellSeedDetailed("Reparar", null, "Unes una grieta o desgarro pequeño en un objeto tocado hasta dejarlo intacto.", "truco", "1 minuto", "Toque", "V S M (dos imanes)", "Instantáneo", null, null, "bardo", "clerigo", "druida", "hechicero", "mago"),
                buildSpellSeedDetailed("Mensaje", null, "Envías un susurro mágico a un objetivo distante y recibes una réplica igual de discreta.", "truco", "1 acción", "120 pies", "V S M (un hilo corto de cobre)", "1 asalto", null, null, "bardo", "hechicero", "mago"),
                buildSpellSeedDetailed("Ilusión menor", null, "Creas una imagen simple o un sonido para distraer, engañar o comunicar algo breve.", "truco", "1 acción", "30 pies", "S M (un poco de vellón)", "1 minuto", null, null, "bardo", "hechicero", "brujo", "mago"),
                buildSpellSeedDetailed("Rociada venenosa", "1d12 veneno", "Exhalas un gas tóxico desde tu mano contra una criatura cercana.", "truco", "1 acción", "10 pies", "V S", "Instantáneo", "1d12 veneno", "Nivel 5: 2d12 | Nivel 11: 3d12 | Nivel 17: 4d12", "druida", "hechicero", "brujo", "mago"),
                buildSpellSeedDetailed("Prestidigitación", null, "Realizas pequeños efectos mágicos de utilidad o exhibición propios de un aprendiz arcano.", "truco", "1 acción", "10 pies", "V S", "Hasta 1 hora", null, null, "bardo", "hechicero", "brujo", "mago"),
                buildSpellSeedDetailed("Llama producida", "1d8 fuego", "Haces aparecer una llama en tu mano que ilumina o puede arrojarse contra un enemigo.", "truco", "1 acción", "Lanzador o 30 pies", "V S", "10 minutos", "1d8 fuego", "Nivel 5: 2d8 | Nivel 11: 3d8 | Nivel 17: 4d8", "druida"),
                buildSpellSeedDetailed("Protección contra el bien y el mal", null, "Proteges a una criatura del influjo de aberraciones, celestiales, elementales, feéricos, infernales y no muertos.", "Hechizo;1", "1 acción", "Toque", "V S M (agua bendita o polvo de plata y hierro que consume el conjuro)", "Concentración hasta 10 minutos", null, null, "clerigo", "paladin", "brujo", "mago"),
                buildSpellSeedDetailed("Purificar comida y bebida", null, "Limpias alimentos y líquidos de venenos y enfermedades para volverlos seguros.", "Hechizo;1,Ritual", "1 acción", "10 pies", "V S", "Instantáneo", null, null, "clerigo", "druida", "paladin"),
                buildSpellSeedDetailed("Rayo de escarcha", "1d8 frío", "Un rayo helado hiere al objetivo y entorpece brevemente su movimiento.", "truco", "1 acción", "60 pies", "V S", "Instantáneo", "1d8 frío", "Nivel 5: 2d8 | Nivel 11: 3d8 | Nivel 17: 4d8", "hechicero", "mago"),
                buildSpellSeedDetailed("Resistencia", "1d4 a una salvación", "Tocas a una criatura para reforzar su próxima tirada de salvación.", "truco", "1 acción", "Toque", "V S M (una capa en miniatura)", "Concentración hasta 1 minuto", "1d4 a una salvación", null, "clerigo", "druida"),
                buildSpellSeedDetailed("Llama sagrada", "1d8 radiante", "Una llamarada divina desciende sobre un objetivo visible y lo quema con luz sagrada.", "truco", "1 acción", "60 pies", "V S", "Instantáneo", "1d8 radiante", "Nivel 5: 2d8 | Nivel 11: 3d8 | Nivel 17: 4d8", "clerigo"),
                buildSpellSeedDetailed("Santuario", null, "Proteges a una criatura para que a los enemigos les cueste agredirla directamente.", "Hechizo;1", "1 acción adicional", "30 pies", "V S M (un pequeño espejo de plata)", "1 minuto", null, null, "clerigo"),
                buildSpellSeedDetailed("Escudo", "+5 CA", "Una barrera invisible aparece como reacción para desviar un ataque o bloquear Proyectil mágico hasta tu siguiente turno.", "Hechizo;1", "1 reacción", "Lanzador", "V S", "1 asalto", "+5 CA", null, "hechicero", "mago"),
                buildSpellSeedDetailed("Escudo de fe", "+2 CA", "Una energía protectora envuelve a un aliado y fortalece su defensa.", "Hechizo;1", "1 acción adicional", "60 pies", "V S M (un pequeño pergamino con un texto sagrado)", "Concentración hasta 10 minutos", "+2 CA", null, "clerigo", "paladin"),
                buildSpellSeedDetailed("Garrote", "1d8 con arma de madera", "Imbuyes un arma de madera sencilla con poder natural para combatir con ella mágicamente.", "truco", "1 acción adicional", "Toque", "V S M (muérdago, una hoja de trébol y un garrote o bastón)", "1 minuto", "1d8 con arma de madera", null, "druida"),
                buildSpellSeedDetailed("Toque eléctrico", "1d8 relámpago", "Descargas electricidad a través del contacto e impides que el objetivo reaccione de inmediato.", "truco", "1 acción", "Toque", "V S", "Instantáneo", "1d8 relámpago", "Nivel 5: 2d8 | Nivel 11: 3d8 | Nivel 17: 4d8", "hechicero", "mago"),
                buildSpellSeedDetailed("Imagen silenciosa", null, "Creas una ilusión visual móvil de un objeto, criatura o fenómeno para engañar a quienes la vean.", "Hechizo;1", "1 acción", "60 pies", "V S M (un poco de vellón)", "Concentración hasta 10 minutos", null, null, "bardo", "hechicero", "mago"),
                buildSpellSeedDetailed("Dormir", "5d8 puntos de golpe afectados", "Sumes en un sueño mágico a criaturas de poca resistencia dentro de una zona.", "Hechizo;1", "1 acción", "90 pies", "V S M (una pizca de arena fina, pétalos de rosa o un grillo)", "1 minuto", "5d8 puntos de golpe afectados", "Nivel 2+: +2d8 por nivel del espacio", "bardo", "hechicero", "mago"),
                buildSpellSeedDetailed("Moribundo estable", null, "Tocas a una criatura agonizante para estabilizarla y evitar que siga muriendo.", "truco", "1 acción", "Toque", "V S", "Instantáneo", null, null, "clerigo"),
                buildSpellSeedDetailed("Hablar con los animales", null, "Comprendes y hablas con bestias, lo que te permite obtener información o pedir pequeños favores.", "Hechizo;1,Ritual", "1 acción", "Lanzador", "V S", "10 minutos", null, null, "bardo", "druida", "explorador"),
                buildSpellSeedDetailed("Taumaturgia", null, "Manifiestas señales menores de poder sobrenatural como hacer temblar el suelo o cambiar tu voz.", "truco", "1 acción", "30 pies", "V", "Hasta 1 minuto", null, null, "clerigo"),
                buildSpellSeedDetailed("Onda atronadora", "2d8 trueno", "Una explosión de fuerza sonora brota de ti y lanza a los enemigos hacia atrás.", "Hechizo;1", "1 acción", "Lanzador (cubo de 15 pies)", "V S", "Instantáneo", "2d8 trueno", "Nivel 2+: +1d8 por nivel del espacio", "bardo", "hechicero", "mago"),
                buildSpellSeedDetailed("Impacto verdadero", null, "Obtienes una intuición fugaz sobre la defensa de un enemigo para golpearlo mejor después.", "truco", "1 acción", "30 pies", "S", "Concentración hasta 1 asalto", null, null, "bardo", "hechicero", "brujo", "mago"),
                buildSpellSeedDetailed("Sirviente invisible", null, "Creas una fuerza invisible y obediente capaz de realizar tareas simples a tu orden.", "Hechizo;1,Ritual", "1 acción", "60 pies", "V S M (un trozo de cuerda y un poco de madera)", "1 hora", null, null, "bardo", "brujo", "mago"),
                buildSpellSeedDetailed("Burla cruel", "1d4 psíquico", "Una ofensa cargada de magia hiere la mente del objetivo y le hace dudar al atacar.", "truco", "1 acción", "60 pies", "V", "Instantáneo", "1d4 psíquico", "Nivel 5: 2d4 | Nivel 11: 3d4 | Nivel 17: 4d4", "bardo"),
                buildSpellSeedDetailed("Tentáculos negros de Evard", "3d6 contundente", "Cubres una zona de 20 pies con tentáculos negros que convierten el suelo en terreno difícil. Una criatura que entre o empiece su turno allí debe superar una salvación de Destreza o sufrir daño contundente y quedar apresada; si ya estaba atrapada, vuelve a recibir el daño. Una criatura apresada puede gastar su acción para intentar liberarse con Fuerza o Destreza contra tu CD de salvación de conjuros.", "Hechizo;4", "1 acción", "90 pies", "V S M (fragmento de tentáculo de pulpo o calamar gigante)", "Concentración hasta 1 minuto", "3d6 contundente", null, "brujo", "mago"),
                buildSpellSeedDetailed("Terremoto", null, "Provocas un temblor sísmico en un radio de 100 pies que vuelve el terreno difícil, hace peligrar la concentración de las criaturas en el suelo y puede derribarlas repetidamente. El DM puede abrir grietas y las estructuras dentro de la zona sufren daño contundente continuo, con riesgo de derrumbe y de sepultar a quienes estén cerca.", "Hechizo;8", "1 acción", "500 pies", "V S M (una pizca de tierra, un trozo de roca y un poco de arcilla)", "Concentración hasta 1 minuto", null, null, "clerigo", "druida", "hechicero"),
                buildSpellSeedDetailed("Terreno alucinatorio", null, "Alteras la apariencia, el sonido y el olor de un gran volumen de terreno natural para que parezca otro tipo de paraje. La ilusión no cambia la textura real del suelo y una criatura que la examine con cuidado puede descubrirla mediante Investigación contra tu CD de salvación de conjuros.", "Hechizo;4", "10 minutos", "300 pies", "V S M (una piedra, una ramita y un trocito de planta)", "24 horas", null, null, "bardo", "druida", "brujo", "mago"),
                buildSpellSeedDetailed("Terror", null, "Proyectas una visión fantasmal con los peores miedos de tus enemigos. Las criaturas en un cono de 30 pies que fallen su salvación de Sabiduría sueltan lo que llevan y quedan asustadas; mientras dure el conjuro deben usar su acción para correr lejos de ti por la ruta más segura disponible.", "Hechizo;3", "1 acción", "Lanzador (cono de 30 pies)", "V S M (una pluma blanca o el corazón de una gallina)", "Concentración hasta 1 minuto", null, null, "bardo", "brujo", "mago"),
                buildSpellSeedDetailed("Terror abyecto", "4d10 psíquico", "Implantas pesadillas visibles solo para sus víctimas dentro de una esfera de 30 pies. Quienes fallen la salvación de Sabiduría quedan asustados y, al final de cada uno de sus turnos, deben repetirla o sufrir daño psíquico; si la superan, el conjuro termina para esa criatura.", "Hechizo;9", "1 acción", "120 pies", "V S", "Concentración hasta 1 minuto", "4d10 psíquico", null, "brujo", "mago"),
                buildSpellSeedDetailed("Toque vampírico", "3d6 necrótico", "Tu mano envuelta en sombras roba la fuerza vital del objetivo. Haces un ataque de conjuro cuerpo a cuerpo; si impactas, infliges daño necrótico y recuperas puntos de golpe iguales a la mitad del daño infligido, y durante el conjuro puedes repetir el ataque gastando tu acción.", "Hechizo;3", "1 acción", "Lanzador", "V S", "Concentración hasta 1 minuto", "3d6 necrótico", "Nivel 4+: +1d6 por nivel del espacio", "brujo", "mago"),
                buildSpellSeedDetailed("Tormenta de aguanieve", null, "Una lluvia helada y espesa llena un cilindro enorme, oscurece por completo la zona, apaga fuegos expuestos y vuelve el suelo resbaladizo y difícil. Las criaturas que entren o empiecen su turno en el área pueden caer derribadas y quienes mantengan concentración deben superar una salvación de Constitución o perderla.", "Hechizo;3", "1 acción", "150 pies", "V S M (unas gotas de agua y una pizca de polvo)", "Concentración hasta 1 minuto", null, null, "druida", "hechicero", "mago"),
                buildSpellSeedDetailed("Tormenta de espinas", "1d10 perforante", "La próxima vez que impactes con un ataque de arma a distancia antes de que termine el conjuro, el proyectil estalla en una lluvia de espinas. El objetivo y las criaturas a 5 pies de él hacen una salvación de Destreza para evitar parte del daño perforante.", "Hechizo;1", "1 acción adicional", "Lanzador", "V", "Concentración hasta 1 minuto", "1d10 perforante", "Nivel 2+: +1d10 por nivel del espacio hasta 6d10", "explorador"),
                buildSpellSeedDetailed("Tormenta de fuego", "7d10 fuego", "Levantas una tormenta de llamas distribuida en hasta diez cubos de 10 pies conectados entre sí. Cada criatura del área realiza una salvación de Destreza para reducir el daño de fuego; además, los objetos inflamables no llevados ni vestidos pueden prenderse.", "Hechizo;7", "1 acción", "150 pies", "V S", "Instantáneo", "7d10 fuego", null, "clerigo", "druida"),
                buildSpellSeedDetailed("Tormenta de hielo", "2d8 contundente + 4d6 frío", "Una granizada devastadora cae sobre un cilindro de 20 pies de radio. Las criaturas en el área hacen una salvación de Destreza para mitigar tanto el daño contundente como el de frío, y el granizo deja la zona como terreno difícil hasta el final de tu siguiente turno.", "Hechizo;4", "1 acción", "300 pies", "V S M (unas gotas de agua y una pizca de polvo)", "Instantáneo", "2d8 contundente + 4d6 frío", "Nivel 5+: +1d8 contundente por nivel del espacio", "druida", "mago"),
                buildSpellSeedDetailed("Tormenta de la venganza", null, "Reúnes una tormenta inmensa de nubes, relámpagos, granizo y lluvia helada sobre un área gigantesca. El conjuro aplica distintos efectos por asalto: trueno y ensordecimiento al inicio, lluvia ácida, rayos selectivos, granizo contundente y, al final, oscuridad intensa, terreno difícil, frío constante y fuertes vientos que dificultan la concentración y dispersan brumas.", "Hechizo;9", "1 acción", "Vista", "V S", "Concentración hasta 1 minuto", null, null, "druida"),
                buildSpellSeedDetailed("Tormenta de meteoritos", "20d6 contundente + 20d6 fuego", "Cuatro meteoros abrasadores impactan en puntos distintos dentro del alcance. Cada criatura en una esfera de 40 pies alrededor de cada impacto hace una salvación de Destreza para reducir el daño; los objetos inflamables no llevados ni vestidos también pueden arder.", "Hechizo;9", "1 acción", "1 milla", "V S", "Instantáneo", "20d6 contundente + 20d6 fuego", null, "hechicero", "mago"),
                buildSpellSeedDetailed("Trepar cual arácnido", null, "La criatura tocada puede caminar por paredes y techos sin usar las manos y obtiene una velocidad trepando igual a su velocidad caminando.", "Hechizo;2", "1 acción", "Toque", "V S M (una gota de betún y una araña)", "Concentración hasta 1 hora", null, null, "hechicero", "brujo", "mago"),
                buildSpellSeedDetailed("Truco de la cuerda", null, "Encantas una cuerda de hasta 60 pies para que se alce y abra una entrada a un espacio extradimensional en su extremo superior. Hasta ocho criaturas Medianas o más pequeñas pueden esconderse allí; ataques y conjuros no cruzan la abertura y todo lo que quede dentro cae fuera cuando el conjuro termina.", "Hechizo;2", "1 acción", "Toque", "V S M (extracto de maíz en polvo y un bucle retorcido de pergamino)", "1 hora", null, null, "mago"),
                buildSpellSeedDetailed("Tsunami", "6d10 contundente", "Creas un muro de agua enorme que nace dentro del alcance y se desplaza 50 pies por turno alejándose de ti. Cuando aparece y cada vez que alcanza a una criatura Enorme o menor, esta debe superar una salvación de Fuerza o sufrir daño contundente; además, la ola arrastra a quienes quedan dentro y se va reduciendo en altura y daño cada asalto.", "Hechizo;8", "1 minuto", "Vista", "V S", "Concentración hasta 6 asaltos", "6d10 contundente", null, "druida"),
                buildSpellSeedDetailed("Urna mágica", null, "Proyectas tu alma a un recipiente valioso y dejas tu cuerpo en estado catatónico. Desde allí puedes intentar poseer a un humanoide cercano; si lo logras, controlas su cuerpo mientras su alma queda atrapada en el recipiente, con las reglas habituales de retorno, muerte del anfitrión y destrucción del contenedor.", "Hechizo;6", "1 minuto", "Lanzador", "V S M (gema, cristal, relicario u otro contenedor ornamental valorado en 500 po)", "Hasta que sea disipado", null, null, "mago"),
                buildSpellSeedDetailed("Ver invisibilidad", null, "Durante el conjuro ves criaturas y objetos invisibles como si fueran visibles y también percibes el Plano Etéreo como formas translúcidas.", "Hechizo;2", "1 acción", "Lanzador", "V S M (una pizca de talco y un poco de plata en polvo)", "1 hora", null, null, "bardo", "hechicero", "mago"),
                buildSpellSeedDetailed("Viajar con el viento", null, "Tú y hasta diez criaturas voluntarias cercanas adoptáis forma gaseosa con velocidad volando de 300 pies y resistencia al daño de armas no mágicas. En esa forma solo podéis correr o invertir un minuto en volver a la forma normal, y si el conjuro termina en pleno vuelo descendéis gradualmente antes de caer.", "Hechizo;6", "1 minuto", "30 pies", "V S M (fuego y agua bendita)", "8 horas", null, null, "clerigo", "druida"),
                buildSpellSeedDetailed("Viajar mediante plantas", null, "Creas un vínculo mágico entre una planta inanimada Grande o mayor cercana y otra planta que hayas visto o tocado antes en el mismo plano. Durante un asalto, cualquier criatura puede entrar por una de ellas y salir por la otra gastando 5 pies de movimiento.", "Hechizo;6", "1 acción", "10 pies", "V S", "1 asalto", null, null, "druida"),
                buildSpellSeedDetailed("Vínculo protector", null, "Creas un lazo místico entre tú y una criatura voluntaria a la que tocas mientras ambos llevéis los anillos requeridos. Mientras estéis a 60 pies o menos, el objetivo gana +1 a la CA y a las salvaciones, además de resistencia a todo el daño, pero tú recibes la misma cantidad de daño que absorba el vínculo.", "Hechizo;2", "1 acción", "Toque", "V S M (dos anillos de platino valorados en 50 po o más)", "1 hora", null, null, "clerigo"),
                buildSpellSeedDetailed("Visión en la oscuridad", null, "Concedes a una criatura voluntaria la capacidad de ver en la oscuridad hasta 60 pies durante la duración del conjuro.", "Hechizo;2", "1 acción", "Toque", "V S M (una pizca de zanahoria seca o un ágata)", "8 horas", null, null, "druida", "explorador", "hechicero", "mago"),
                buildSpellSeedDetailed("Visión veraz", null, "La criatura tocada percibe las cosas tal como son. Durante el conjuro obtiene visión verdadera hasta 120 pies, detecta puertas ocultas por magia y puede ver el Plano Etéreo.", "Hechizo;6", "1 acción", "Toque", "V S M (ungüento para los ojos valorado en 25 po que consume el conjuro)", "1 hora", null, null, "bardo", "clerigo", "druida", "brujo", "mago"),
                buildSpellSeedDetailed("Volar", null, "La criatura voluntaria tocada obtiene una velocidad volando de 60 pies hasta que termine el conjuro. Si sigue en el aire cuando el efecto acaba y no puede sostenerse, cae; con espacios superiores puedes afectar a más objetivos.", "Hechizo;3", "1 acción", "Toque", "V S M (una pluma del ala de cualquier pájaro)", "Concentración hasta 10 minutos", null, "Nivel 4+: 1 objetivo adicional por nivel del espacio", "hechicero", "brujo", "mago"),
                buildSpellSeedDetailed("Zona de la verdad", null, "Creas una esfera mágica contra el engaño. Toda criatura que entre por primera vez o empiece su turno dentro debe superar una salvación de Carisma o no podrá mentir mientras permanezca en la zona; sabes quién falla, aunque la criatura puede negarse a responder o expresarse con evasivas.", "Hechizo;2", "1 acción", "60 pies", "V S", "10 minutos", null, null, "bardo", "clerigo", "paladin")
            ));
        });
    }

    @Bean
    @Order(3)
    CommandLineRunner seedDndInstrumentCatalog(ObjetoRepository objetoRepository) {
        return args -> CompletableFuture.runAsync(() -> seedInstrumentCatalogEntries(objetoRepository, List.of(
            buildCompetencyCatalogSeed(
                DND_TOOL_COMPETENCY_CATALOG_TAG,
                "Herramientas de ladrón",
                "**Competencia de herramienta** base usada por clases, trasfondos y validaciones DnD."
            ),
            buildCompetencyCatalogSeed(
                DND_TOOL_COMPETENCY_CATALOG_TAG,
                "Herramientas de artesano",
                "**Competencia de herramienta** base que representa el dominio general de herramientas de artesano en DnD."
            ),
            buildCompetencyCatalogSeed(
                DND_TOOL_COMPETENCY_CATALOG_TAG,
                "Vehículos terrestres",
                "**Competencia de herramienta** para conducir carros, carretas y otros vehículos terrestres en DnD."
            ),
            buildCompetencyCatalogSeed(
                DND_TOOL_COMPETENCY_CATALOG_TAG,
                "Vehículos acuáticos",
                "**Competencia de herramienta** para gobernar embarcaciones y otros vehículos acuáticos en DnD."
            ),
            buildCompetencyCatalogSeed(
                DND_TOOL_COMPETENCY_CATALOG_TAG,
                "Instrumentos musicales",
                "**Competencia de herramienta** general para el uso de instrumentos musicales en DnD."
            ),
                buildInstrumentSeed("Gaita"),
                buildInstrumentSeed("Tambor"),
                buildInstrumentSeed("Dulceleme"),
                buildInstrumentSeed("Flauta"),
                buildInstrumentSeed("Laud"),
                buildInstrumentSeed("Lira"),
                buildInstrumentSeed("Cuerno"),
                buildInstrumentSeed("Panflauta"),
                buildInstrumentSeed("Chirimia"),
            buildInstrumentSeed("Viola"),
            buildGameSeed("Baraja de cartas"),
            buildGameSeed("Juego de dados"),
            buildGameSeed("Ajedrez de dragón"),
            buildGameSeed("Tres Dragones"),
            buildArtisanToolSeed("Herramientas de herrero"),
            buildArtisanToolSeed("Suministros de cervecero"),
            buildArtisanToolSeed("Herramientas de albañil"),
            buildArtisanToolSeed("Herramientas de alfarero"),
            buildArtisanToolSeed("Herramientas de carpintero"),
            buildArtisanToolSeed("Herramientas de cartógrafo"),
            buildArtisanToolSeed("Herramientas de cocinero"),
            buildArtisanToolSeed("Herramientas de cristalero"),
            buildArtisanToolSeed("Herramientas de curtidor"),
            buildArtisanToolSeed("Herramientas de encuadernador"),
            buildArtisanToolSeed("Herramientas de joyero"),
            buildArtisanToolSeed("Herramientas de soplador de vidrio"),
            buildArtisanToolSeed("Herramientas de tallador de madera"),
            buildArtisanToolSeed("Herramientas de zapatero"),
            buildArtisanToolSeed("Suministros de alquimista"),
            buildArtisanToolSeed("Suministros de calígrafo"),
            buildArtisanToolSeed("Suministros de pintor"),
            buildArtisanToolSeed("Utensilios de tejedor")
        )));
    }

            @Bean
            @Order(4)
            CommandLineRunner seedDndEquipmentCatalog(ObjetoRepository objetoRepository) {
            return args -> CompletableFuture.runAsync(() -> seedEquipmentCatalogEntries(objetoRepository, List.of(
                buildCompetencyCatalogSeed(
                    DND_WEAPON_ARMOR_COMPETENCY_CATALOG_TAG,
                    "Armaduras ligeras",
                    "**Competencia de armadura** general para armaduras ligeras en DnD."
                ),
                buildCompetencyCatalogSeed(
                    DND_WEAPON_ARMOR_COMPETENCY_CATALOG_TAG,
                    "Armaduras medias",
                    "**Competencia de armadura** general para armaduras medias en DnD."
                ),
                buildCompetencyCatalogSeed(
                    DND_WEAPON_ARMOR_COMPETENCY_CATALOG_TAG,
                    "Armaduras pesadas",
                    "**Competencia de armadura** general para armaduras pesadas en DnD."
                ),
                buildCompetencyCatalogSeed(
                    DND_WEAPON_ARMOR_COMPETENCY_CATALOG_TAG,
                    "Escudos",
                    "**Competencia de armadura** general para el uso de escudos en DnD."
                ),
                buildCompetencyCatalogSeed(
                    DND_WEAPON_ARMOR_COMPETENCY_CATALOG_TAG,
                    "Armas simples",
                    "**Competencia de arma** general para armas simples en DnD."
                ),
                buildCompetencyCatalogSeed(
                    DND_WEAPON_ARMOR_COMPETENCY_CATALOG_TAG,
                    "Armas simples cuerpo a cuerpo",
                    "**Competencia de arma** general para armas simples cuerpo a cuerpo en DnD."
                ),
                buildCompetencyCatalogSeed(
                    DND_WEAPON_ARMOR_COMPETENCY_CATALOG_TAG,
                    "Armas simples a distancia",
                    "**Competencia de arma** general para armas simples a distancia en DnD."
                ),
                buildCompetencyCatalogSeed(
                    DND_WEAPON_ARMOR_COMPETENCY_CATALOG_TAG,
                    "Armas marciales",
                    "**Competencia de arma** general para armas marciales en DnD."
                ),
                buildCompetencyCatalogSeed(
                    DND_WEAPON_ARMOR_COMPETENCY_CATALOG_TAG,
                    "Armas marciales cuerpo a cuerpo",
                    "**Competencia de arma** general para armas marciales cuerpo a cuerpo en DnD."
                ),
                buildCompetencyCatalogSeed(
                    DND_WEAPON_ARMOR_COMPETENCY_CATALOG_TAG,
                    "Armas marciales a distancia",
                    "**Competencia de arma** general para armas marciales a distancia en DnD."
                ),
                buildArmorSeed(
                    "ARMADURA,Ligera",
                    "Armadura acolchada",
                    "CA=11+DES",
                    "La armadura acolchada consiste en capas acolchadas de tela y relleno cosidas entre sí.\n\n"
                        + "Desventaja: Sigilo"
                ),
                buildArmorSeed(
                    "ARMADURA,Ligera",
                    "Armadura de cuero",
                    "CA=11+DES",
                    "El peto y las protecciones para hombros de esta armadura están hechos de cuero curtido y endurecido. El resto de la armadura se compone de materiales más blandos y flexibles."
                ),
                buildArmorSeed(
                    "ARMADURA,Ligera",
                    "Armadura de cuero tachonado",
                    "CA=12+DES",
                    "Esta armadura de cuero reforzado está cubierta de remaches o púas muy juntas que aumentan su resistencia sin volverla rígida."
                ),
                buildArmorSeed(
                    "ARMADURA,Media",
                    "Armadura de pieles",
                    "CA=12+DES(max:2)",
                    "Esta armadura tosca está hecha de pieles y cueros gruesos. La suelen llevar tribus, bárbaros y otros combatientes que prefieren materiales naturales."
                ),
                buildArmorSeed(
                    "ARMADURA,Media",
                    "Camisa de malla",
                    "CA=13+DES(max:2)",
                    "La camisa de malla está hecha de anillos de metal entrelazados y se viste entre capas de tela o cuero. Esta armadura ofrece una protección razonable para el torso y es bastante silenciosa."
                ),
                buildArmorSeed(
                    "ARMADURA,Media",
                    "Armadura de escamas",
                    "CA=14+DES(max:2)",
                    "Esta armadura consiste en un peto y unas grebas de cuero cubiertos de piezas metálicas superpuestas, muy parecidas a las escamas de un pez.\n\n"
                        + "Desventaja: Sigilo"
                ),
                buildArmorSeed(
                    "ARMADURA,Media",
                    "Coraza",
                    "CA=14+DES(max:2)",
                    "Esta armadura está formada por una pieza ajustada de metal que cubre el torso. Se combina con cuero flexible y acolchado para proteger sin dificultar demasiado el movimiento."
                ),
                buildArmorSeed(
                    "ARMADURA,Media",
                    "Media armadura",
                    "CA=15+DES(max:2)",
                    "La media armadura consiste en placas metálicas moldeadas que cubren casi todo el cuerpo, pero dejan huecos en las articulaciones para conservar parte de la movilidad.\n\n"
                        + "Desventaja: Sigilo"
                ),
                buildArmorSeed(
                    "ARMADURA,Pesada",
                    "Armadura de anillas",
                    "CA=14",
                    "La armadura de anillas es una armadura de cuero sobre la que se han cosido gruesos anillos de metal. Es inferior a la cota de malla, pero más asequible.\n\n"
                        + "Desventaja: Sigilo"
                ),
                buildArmorSeed(
                    "ARMADURA,Pesada",
                    "Cota de malla",
                    "CA=16",
                    "Hecha de anillos metálicos entrelazados, la cota de malla incluye una capa de tejido acolchado para evitar rozaduras y absorber parte del impacto.\n\n"
                        + "Fuerza: 13\n"
                        + "Desventaja: Sigilo"
                ),
                buildArmorSeed(
                    "ARMADURA,Pesada",
                    "Armadura laminada",
                    "CA=17",
                    "La armadura laminada está formada por estrechas bandas verticales de metal remachadas a un soporte de cuero flexible. Ofrece una protección excelente, aunque su peso es considerable.\n\n"
                        + "Fuerza: 15\n"
                        + "Desventaja: Sigilo"
                ),
                buildArmorSeed(
                    "ARMADURA,Pesada",
                    "Armadura de placas",
                    "CA=18",
                    "La armadura de placas está formada por placas metálicas articuladas que cubren todo el cuerpo. Es la protección más completa disponible para un combatiente entrenado.\n\n"
                        + "Fuerza: 15\n"
                        + "Desventaja: Sigilo"
                ),
                buildEquipmentSeed(
                    "ARMADURA,Escudo",
                    "Escudo",
                    "BONO_CA=2",
                    "Un escudo de madera o metal se lleva en una mano para desviar golpes y proyectiles.\n\n"
                        + "Bono a la CA: +2",
                    TipoObjeto.ARMADURA
                ),
                buildEquipmentSeed(
                    "ARMADURA,Escudo,Madera",
                    "Escudo de madera",
                    "BONO_CA=2",
                    "Un escudo de madera reforzado con cuero y abrazaderas internas. Es habitual entre druidas y viajeros que prefieren materiales naturales.\n\n"
                        + "Bono a la CA: +2",
                    TipoObjeto.ARMADURA
                ),
                buildEquipmentSeed(
                    "ASimple,ASCuerpo,Versatil1d8",
                    "Baston",
                    "1d6 contundente",
                    "**Arma simple cuerpo a cuerpo** usada tanto para apoyo en el viaje como para la defensa.\n\n"
                        + "* versátil: 1d8 si se usa a dos manos\n"
                        + "* compatible con las elecciones iniciales de mago y forastero",
                    TipoObjeto.ARMA
                ),
                buildEquipmentSeed(
                    "MUNICION,Flecha",
                    "Flecha",
                    null,
                    "Munición para arcos. Un carcaj estándar puede llevar hasta 20 flechas.",
                    TipoObjeto.CONSUMIBLE
                ),
                buildEquipmentSeed(
                    "MUNICION,Virote",
                    "Virote",
                    null,
                    "Munición para ballestas. Un estuche estándar puede llevar hasta 20 virotes.",
                    TipoObjeto.CONSUMIBLE
                ),
                buildEquipmentSeed(
                    "DND,Consumible,Acido",
                    "Acido",
                    "2d6 ácido al impactar",
                    "Como acción, puedes esparcir el contenido de este vial sobre una criatura a 5 pies o lanzarlo hasta 20 pies. Trátalo como un arma improvisada; si impacta, el objetivo sufre 2d6 de daño de ácido.",
                    TipoObjeto.CONSUMIBLE
                ),
                buildEquipmentSeed(
                    "DND,Consumible,AguaBendita",
                    "Agua bendita",
                    "2d6 radiante contra infernales y muertos vivientes",
                    "Como acción, puedes esparcir el contenido de este frasco sobre una criatura a 5 pies o lanzarlo hasta 20 pies. Si el objetivo es un infernal o un muerto viviente, sufre 2d6 de daño radiante.",
                    TipoObjeto.CONSUMIBLE
                ),
                buildEquipmentSeed(
                    "DND,Consumible,Antorcha",
                    "Antorcha",
                    "1 de fuego cuerpo a cuerpo; luz 20/20; duracion 1 hora",
                    "Arde durante 1 hora emitiendo luz brillante en 20 pies y luz tenue 20 pies más allá. Si impactas con ella en combate cuerpo a cuerpo mientras está encendida, causa 1 de daño de fuego.",
                    TipoObjeto.CONSUMIBLE
                ),
                buildEquipmentSeed(
                    "DND,Consumible,LinternaOjoBuey",
                    "Linterna de ojo de buey",
                    "luz en cono 60/60; 6 horas por frasco de aceite",
                    "Emite luz brillante en un cono de 60 pies y luz tenue 60 pies más allá. Puede permanecer encendida hasta 6 horas con un frasco de aceite.",
                    TipoObjeto.CONSUMIBLE
                ),
                buildEquipmentSeed(
                    "DND,Consumible,LinternaSorda",
                    "Linterna sorda",
                    "luz 30/30; 6 horas por frasco de aceite",
                    "Emite luz brillante en un radio de 30 pies y luz tenue 30 pies más allá. Como acción puedes cubrirla para que solo proyecte luz tenue en un radio de 5 pies.",
                    TipoObjeto.CONSUMIBLE
                ),
                buildEquipmentSeed(
                    "DND,Consumible,PocionCuracion",
                    "Pocion de curacion",
                    "2d4 + 2 PG",
                    "Quien beba el fluido rojo de este vial recupera 2d4 + 2 puntos de golpe. Administrarla a otra criatura o beberla requiere una acción.",
                    TipoObjeto.CONSUMIBLE
                ),
                buildEquipmentSeed(
                    "DND,Pack,Artista",
                    "Pack de artista",
                    null,
                    "Incluye una mochila, un petate, 2 disfraces, 5 velas, raciones para 5 días, una cantimplora y útiles para disfrazarse.",
                    TipoObjeto.MISCELANEO
                ),
                buildEquipmentSeed(
                    "DND,Pack,Diplomatico",
                    "Pack de diplomático",
                    null,
                    "Incluye un cofre, 2 estuches para mapas o pergaminos, una muda de ropas de calidad, una botella de tinta, una pluma, 2 frascos de aceite, 5 hojas de papel, un vial de perfume, lacre y jabón.",
                    TipoObjeto.MISCELANEO
                ),
                buildEquipmentSeed(
                    "DND,Pack,Erudito",
                    "Pack de erudito",
                    null,
                    "Incluye una mochila, un libro de algún saber concreto, una botella de tinta, una pluma, 10 hojas de pergamino, una bolsita con arena y un cuchillo pequeño.",
                    TipoObjeto.MISCELANEO
                ),
                buildEquipmentSeed(
                    "DND,Pack,Explorador",
                    "Pack de explorador",
                    null,
                    "Incluye una mochila, un petate, utensilios de cocina, un yesquero, 10 antorchas, raciones para 10 días y una cantimplora. Además, lleva una cuerda de cáñamo de 50 pies atada al exterior.",
                    TipoObjeto.MISCELANEO
                ),
                buildEquipmentSeed(
                    "DND,Pack,Calabozo",
                    "Pack de calabozo",
                    null,
                    "Incluye una mochila, una palanqueta, un martillo, 10 pitones, 10 antorchas, un yesquero, raciones para 10 días y una cantimplora. Además, lleva una cuerda de cáñamo de 50 pies atada al exterior.",
                    TipoObjeto.MISCELANEO
                ),
                buildEquipmentSeed(
                    "DND,Pack,Ladron",
                    "Pack de ladron",
                    null,
                    "Incluye una mochila, una bolsa con 1.000 bolas de metal, 10 pies de cordel, una campana, 5 velas, una palanqueta, un martillo, 10 pitones, una linterna sorda, 2 frascos de aceite, raciones para 5 días, un yesquero y una cantimplora. Además, lleva una cuerda de cáñamo de 50 pies atada al exterior.",
                    TipoObjeto.MISCELANEO
                ),
                buildEquipmentSeed(
                    "DND,Pack,Sacerdote",
                    "Pack de sacerdote",
                    null,
                    "Incluye una mochila, una manta, 10 velas, un yesquero, una caja para limosnas, 2 barras de incienso, un incensario, vestiduras, raciones para 2 días y una cantimplora.",
                    TipoObjeto.MISCELANEO
                ),
                buildEquipmentSeed(
                    "DND,FocoArcano",
                    "Foco arcano",
                    null,
                    "Objeto especial diseñado para canalizar el poder de los conjuros arcanos. Puede adoptar la forma de cristal, orbe, vara o bastón de enfoque.",
                    TipoObjeto.MISCELANEO
                ),
                buildEquipmentSeed(
                    "DND,BolsaComponentes",
                    "Bolsa de componentes",
                    null,
                    "Pequeña bolsa con bolsillos para guardar los componentes materiales corrientes necesarios para lanzar conjuros que no tengan un coste específico.",
                    TipoObjeto.MISCELANEO
                ),
                buildEquipmentSeed(
                    "DND,LibroConjuros",
                    "Libro de conjuros",
                    null,
                    "Tomo encuadernado con páginas preparadas para registrar y ampliar el repertorio mágico de un mago.",
                    TipoObjeto.MISCELANEO
                ),
                buildEquipmentSeed(
                    "DND,SimboloSagrado",
                    "Simbolo sagrado",
                    null,
                    "Representación de una deidad o panteón. Puede ser un amuleto, un emblema grabado o un pequeño relicario, y sirve como canalizador mágico para clérigos y paladines.",
                    TipoObjeto.MISCELANEO
                )
            )));
            }

    @Bean
    @Order(5)
    CommandLineRunner syncRequestedDndSkillTexts(HabilidadRepository habilidadRepository) {
        return args -> seedSkillCatalogEntries(habilidadRepository, List.of(
                buildSkill("Acrobacias", null, null, "Pruebas de equilibrio, volteretas y maniobras acrobaticas.", "DND,CatalogoHabilidadDnd;acrobacias"),
                buildSkill("Arcano", null, null, "Conocimiento de magia, teoria arcana y tradiciones misticas.", "DND,CatalogoHabilidadDnd;arcano"),
                buildSkill("Atletismo", null, null, "Pruebas de fuerza fisica, salto, escalada y natacion.", "DND,CatalogoHabilidadDnd;atletismo"),
                buildSkill("Engaño", null, null, "Mentir, fingir y manipular a otros con falsedades.", "DND,CatalogoHabilidadDnd;engano"),
                buildSkill("Historia", null, null, "Recordar hechos, culturas y personajes del pasado.", "DND,CatalogoHabilidadDnd;historia"),
                buildSkill("Interpretación", null, null, "Actuar, cantar, tocar instrumentos o entretener a un publico.", "DND,CatalogoHabilidadDnd;interpretacion"),
                buildSkill("Intimidación", null, null, "Imponer respeto o miedo mediante presencia, amenazas o autoridad.", "DND,CatalogoHabilidadDnd;intimidacion"),
                buildSkill("Investigación", null, null, "Examinar pistas, deducir patrones y sacar conclusiones.", "DND,CatalogoHabilidadDnd;investigacion"),
                buildSkill("Juego de manos", null, null, "Trucos de destreza manual, hurtos y manipulacion precisa.", "DND,CatalogoHabilidadDnd;juegodemanos"),
                buildSkill("Medicina", null, null, "Diagnosticar heridas, estabilizar y tratar afecciones fisicas.", "DND,CatalogoHabilidadDnd;medicina"),
                buildSkill("Naturaleza", null, null, "Conocimiento de fauna, flora, terreno y fenomenos naturales.", "DND,CatalogoHabilidadDnd;naturaleza"),
                buildSkill("Percepción", null, null, "Detectar detalles, sonidos, movimientos o peligros cercanos.", "DND,CatalogoHabilidadDnd;percepcion"),
                buildSkill("Perspicacia", null, null, "Leer emociones, intenciones y mentiras en los demas.", "DND,CatalogoHabilidadDnd;perspicacia"),
                buildSkill("Persuasión", null, null, "Convencer, negociar o ganarse la buena disposicion de otros.", "DND,CatalogoHabilidadDnd;persuasion"),
                buildSkill("Religión", null, null, "Conocimiento sobre dioses, cultos, ritos y teologia.", "DND,CatalogoHabilidadDnd;religion"),
                buildSkill("Sigilo", null, null, "Ocultarse, moverse sin ser visto y evitar llamar la atencion.", "DND,CatalogoHabilidadDnd;sigilo"),
                buildSkill("Supervivencia", null, null, "Rastrear, orientarse y resistir en entornos hostiles.", "DND,CatalogoHabilidadDnd;supervivencia"),
                buildSkill("Trato con animales", null, null, "Calmar, dirigir o entender el comportamiento de animales.", "DND,CatalogoHabilidadDnd;tratoconanimales"),
                buildSkill("Dominio divino", null, null, "Al escoger este dominio en el nivel 1 obtienes conjuros de dominio y otras aptitudes especiales ligadas a esa esfera divina.", "CClerigo;1,Subclase"),
                buildSkill("Conjuros de dominio: conocimiento", null, "Identificar, Orden imperiosa", "Conjuros de dominio: Identificar, Orden imperiosa. Cada dominio tiene una lista de conjuros asociados. Una vez obtienes un conjuro de dominio, siempre lo tienes preparado y no cuenta para el número de conjuros que puedes preparar cada día.", "CClerigo;1,Knowledge,Conjuro"),
                buildSkill("Bendiciones del conocimiento", null, "2 idiomas y competencia/pericia en 2 habilidades", "Aprendes dos idiomas a tu elección. Además, escoges dos de estas habilidades: Arcano, Historia, Naturaleza o Religión. Tu bonificador por competencia se duplica en cualquier prueba hecha con las elegidas.", "CClerigo;1,Knowledge,Habilidades,Idioma"),
                buildSkill("Competencia adicional", null, "armadura pesada", "También obtienes competencia con armadura pesada.", "CClerigo;1,Vida,ArmaduraPesada"),
                buildSkill("Conjuros de dominio: vida", null, "Bendición, Curar heridas", "Cada dominio tiene una lista de conjuros asociados. Una vez obtienes un conjuro de dominio, siempre lo tienes preparado y no cuenta para el número de conjuros que puedes preparar cada día.", "CClerigo;1,Vida,Conjuro"),
                buildSkill("Discipulo de la vida", null, "+2 + nivel del conjuro a la curación", "Tus conjuros curativos son más efectivos. Siempre que uses un conjuro de nivel 1 o superior para devolver puntos de golpe a una criatura, esta recupera puntos adicionales iguales a 2 + el nivel del conjuro.", "CClerigo;1,Vida,Curacion"),
                buildSkill("Conjuros de dominio: luz", null, "Manos ardientes, Fuego feérico", "Cada dominio tiene una lista de conjuros asociados. Una vez obtienes un conjuro de dominio, siempre lo tienes preparado y no cuenta para el número de conjuros que puedes preparar cada día.", "CClerigo;1,Luz,Conjuro"),
                buildSkill("Truco adicional de luz", null, "truco Luz", "Aprendes el truco Luz si todavía no lo conoces.", "CClerigo;1,Luz,Truco"),
                buildSkill("Llamarada protectora", null, "Reacción: desventaja a un ataque visible a 30 pies", "Puedes usar tu reacción para imponer desventaja a una tirada de ataque hecha por una criatura que puedas ver dentro de 30 pies, siempre que el atacante también pueda verte. Debes decidirlo antes de saber si el ataque impacta o falla.", "CClerigo;1,Luz,Reaccion,Defensa"),
                buildSkill("Conjuros de dominio: naturaleza", null, "Hablar con los animales, Enmarañar", "Cada dominio tiene una lista de conjuros asociados. Una vez obtienes un conjuro de dominio, siempre lo tienes preparado y no cuenta para el número de conjuros que puedes preparar cada día.", "CClerigo;1,Naturaleza,Conjuro"),
                buildSkill("Acolito de la naturaleza", null, "1 truco de druida y 1 habilidad", "Aprendes un truco de druida a tu elección. Además, obtienes competencia en una de las siguientes habilidades: Trato con animales, Naturaleza o Supervivencia.", "CClerigo;1,Naturaleza,Habilidades"),
                buildSkill("Competencia adicional de naturaleza", null, "armadura pesada", "También obtienes competencia con armadura pesada.", "CClerigo;1,Naturaleza,ArmaduraPesada"),
                buildSkill("Conjuros de dominio: tempestad", null, "Nube de niebla, Onda atronadora", "Cada dominio tiene una lista de conjuros asociados. Una vez obtienes un conjuro de dominio, siempre lo tienes preparado y no cuenta para el número de conjuros que puedes preparar cada día.", "CClerigo;1,Tempestad,Conjuro"),
                buildSkill("Competencias adicionales de tempestad", null, "armaduras pesadas y armas marciales", "Obtienes competencia con armaduras pesadas y armas marciales.", "CClerigo;1,Tempestad,ArmaduraPesada,ArmaMarcial"),
                buildSkill("Ira de la tormenta", null, "Reacción: 2d8 rayo o trueno; DES mitad", "Cuando una criatura a 5 pies de ti que puedas ver te impacta con un ataque, puedes usar tu reacción para obligarla a hacer una salvación de Destreza. Sufre 2d8 de daño de rayo o trueno si falla, o la mitad si tiene éxito.", "CClerigo;1,Tempestad,Reaccion,Daño+"),
                buildSkill("Conjuros de dominio: engaño", null, "Hechizar persona, Disfrazarse", "Cada dominio tiene una lista de conjuros asociados. Una vez obtienes un conjuro de dominio, siempre lo tienes preparado y no cuenta para el número de conjuros que puedes preparar cada día.", "CClerigo;1,Engano,Conjuro"),
                buildSkill("Bendicion del embaucador", null, "Acción: ventaja en Sigilo durante 1 hora", "Puedes usar tu acción para tocar a una criatura voluntaria distinta de ti y darle ventaja en las pruebas de Destreza (Sigilo) durante 1 hora o hasta que vuelvas a usar este rasgo.", "CClerigo;1,Engano,Sigilo,Apoyo"),
                buildSkill("Conjuros de dominio: guerra", null, "Favor divino, Escudo de fe", "Cada dominio tiene una lista de conjuros asociados. Una vez obtienes un conjuro de dominio, siempre lo tienes preparado y no cuenta para el número de conjuros que puedes preparar cada día.", "CClerigo;1,Guerra,Conjuro"),
                buildSkill("Competencias adicionales de guerra", null, "armaduras pesadas y armas marciales", "Obtienes competencia con armaduras pesadas y armas marciales.", "CClerigo;1,Guerra,ArmaduraPesada,ArmaMarcial"),
                buildSkill("Sacerdote guerrero", null, "ataque como acción adicional, usos = mod. SAB", "Cuando usas la acción de Atacar, puedes hacer un ataque con arma como acción adicional un número de veces igual a tu modificador de Sabiduría por descanso largo.", "CClerigo;1,Guerra,Ataque+,AccionExtra"),
                buildSkill("Preservar la vida", null, "cura total = 5 x nivel de clerigo", "Como acción, presentas tu símbolo sagrado y evocas energía curativa capaz de restaurar un total de puntos de golpe igual a cinco veces tu nivel de clérigo. Esta curación se reparte entre criaturas a 30 pies de ti y no puede dejar a ninguna por encima de la mitad de sus puntos de golpe máximos.", "CClerigo;2,Vida,CanalDivino,Curacion"),
                buildSkill("Sanador bendito", null, "te curas 2 + nivel del conjuro", "Los conjuros de curación que lanzas sobre otros también te sostienen. Cuando lanzas un conjuro de nivel 1 o superior para devolver puntos de golpe a una criatura distinta de ti, recuperas 2 + el nivel del conjuro.", "CClerigo;6,Vida,Curacion"),
                buildSkill("Golpe divino", null, "+1d8 radiante al golpear; +2d8 al 14", "Una vez en cada uno de tus turnos, cuando golpeas a una criatura con un ataque con arma, puedes hacer que el ataque inflija 1d8 de daño radiante extra. Cuando alcanzas el nivel 14, el daño extra aumenta a 2d8.", "CClerigo;8,Vida,Daño+,Radiante"),
                buildSkill("Curacion suprema", null, "maximizas los dados de curación", "Cuando normalmente tirarías uno o más dados para restaurar puntos de golpe con un conjuro, usas en su lugar el valor máximo posible de cada dado.", "CClerigo;17,Vida,Curacion"),
                buildSkill("Juramento sagrado", null, null, "Cuando alcanzas el nivel 3 haces un juramento que te vincula para siempre en tu búsqueda sagrada. Hasta ese momento has sido una promesa en preparación; ahora escoges el ideal que regirá tu causa. Las opciones disponibles aquí son devoción, antiguos y venganza.", "CPaladin;3,Subclase"),
                buildSkill("Conjuros de juramento", null, "Protección contra el bien y el mal, Santuario", "Obtienes conjuros de juramento en los niveles indicados de paladín. Estos conjuros siempre están preparados y no cuentan para el número de conjuros que puedes preparar cada día.", "CPaladin;3,Devocion,Conjuro"),
                buildSkill("Arma sagrada", null, "+CAR a tiradas de ataque durante 1 minuto", "Como acción, puedes imbuir un arma que sostengas con energía positiva usando tu Canalizar Divinidad. Durante 1 minuto sumas tu modificador de Carisma a las tiradas de ataque hechas con esa arma y emite luz brillante en un radio de 20 pies y luz tenue 20 pies más. El efecto termina si quedas inconsciente o si el arma deja de estar en tu mano.", "CPaladin;3,Devocion,CanalDivino,Ataque+"),
                buildSkill("Expulsar lo impio", null, null, "Como acción, presentas tu símbolo sagrado y pronuncias una plegaria que condena a infernales y no muertos. Cada uno que pueda verte u oírte y falle su salvación de Sabiduría queda expulsado durante 1 minuto o hasta recibir daño.", "CPaladin;3,Devocion,CanalDivino,Control"),
                buildSkill("Conjuros de juramento", null, "Golpe apresador, Hablar con los animales", "Obtienes conjuros de juramento en los niveles indicados de paladín. Estos conjuros siempre están preparados y no cuentan para el número de conjuros que puedes preparar cada día.", "CPaladin;3,Antiguos,Conjuro"),
                buildSkill("Ira de la naturaleza", null, "apresa a un objetivo con una salvacion de Fuerza o Destreza", "Puedes usar tu Canalizar Divinidad para invocar fuerzas primigenias que aprisionen a una criatura cercana. El objetivo debe superar una salvación de Fuerza o Destreza o quedar apresado por enredaderas espectrales.", "CPaladin;3,Antiguos,CanalDivino,Control"),
                buildSkill("Expulsar infieles", null, "expulsa feericos e infernales durante 1 minuto", "Presentas tu símbolo sagrado y pronuncias antiguas palabras de censura contra feéricos e infernales. Cada uno que falle su salvación de Sabiduría queda expulsado durante 1 minuto o hasta recibir daño.", "CPaladin;3,Antiguos,CanalDivino,Control"),
                buildSkill("Conjuros de juramento", null, "Marca del cazador, Perdicion", "Obtienes conjuros de juramento en los niveles indicados de paladín. Estos conjuros siempre están preparados y no cuentan para el número de conjuros que puedes preparar cada día.", "CPaladin;3,Venganza,Conjuro"),
                buildSkill("Abjurar enemigo", null, "asusta o ralentiza a un objetivo", "Como acción, presentas tu símbolo sagrado y pronuncias un voto de condena contra una criatura visible a 60 pies. Si falla su salvación de Sabiduría queda asustada y su velocidad se reduce a 0; si tiene éxito, su velocidad queda reducida a la mitad durante 1 minuto o hasta que reciba daño.", "CPaladin;3,Venganza,CanalDivino,Control"),
                buildSkill("Voto de enemistad", null, "ventaja contra un objetivo durante 1 minuto", "Como acción adicional, puedes pronunciar un voto de enemistad contra una criatura que veas a 10 pies o menos. Durante 1 minuto tienes ventaja en las tiradas de ataque contra ella, o hasta que caiga a 0 puntos de golpe o quede inconsciente.", "CPaladin;3,Venganza,CanalDivino,Ataque+"),
                buildSkill("Aura de devocion", null, "inmunidad a hechizado en 10 pies; 30 pies al 18", "Tú y las criaturas amistosas a 10 pies de ti no podéis ser hechizados mientras estés consciente. En el nivel 18 el alcance aumenta a 30 pies.", "CPaladin;7,Devocion,Aura,InmunidadHechizado"),
                buildSkill("Aura de salvaguarda", null, "resistencia al daño de conjuros en 10 pies; 30 pies al 18", "Tú y las criaturas amistosas a 10 pies de ti tenéis resistencia al daño causado por conjuros mientras estés consciente. En el nivel 18 el alcance aumenta a 30 pies.", "CPaladin;7,Antiguos,Aura,Resistencia"),
                buildSkill("Vengador implacable", null, "te mueves hasta la mitad de tu velocidad tras un ataque de oportunidad", "Cuando impactas a una criatura con un ataque de oportunidad, puedes moverte hasta la mitad de tu velocidad inmediatamente después y como parte de la misma reacción, sin provocar ataques de oportunidad.", "CPaladin;7,Venganza,Reaccion,Movimiento"),
                buildSkill("Pureza de espiritu", null, null, "Siempre estás bajo los efectos de Protección contra el bien y el mal.", "CPaladin;15,Devocion,Defensa"),
                buildSkill("Centinela imperecedero", null, "si caes a 0 PG vuelves a 1 PG una vez por descanso largo", "Cuando tus puntos de golpe se reducen a 0 y no mueres de forma instantánea, puedes elegir quedar con 1 punto de golpe. Una vez que usas este rasgo, no puedes volver a hacerlo hasta terminar un descanso largo. Además, no sufres ninguno de los inconvenientes de la vejez y no puedes envejecer mágicamente.", "CPaladin;15,Antiguos,Supervivencia,Longevidad"),
                buildSkill("Espiritu vengativo", null, "reaccion para atacar al objetivo de tu voto de enemistad", "Cuando una criatura bajo el efecto de tu Voto de enemistad hace un ataque, puedes usar tu reacción para hacer un ataque con arma cuerpo a cuerpo contra esa criatura si está a tu alcance.", "CPaladin;15,Venganza,Reaccion,Ataque+"),
                buildSkill("Halo sagrado", null, "1 minuto; 10 de daño radiante por turno a enemigos cercanos", "Como acción, puedes irradiar un aura de luz solar. Durante 1 minuto, luz brillante emana de ti en un radio de 30 pies y luz tenue 30 pies más. Siempre que una criatura enemiga empiece su turno en la luz brillante, recibe 10 de daño radiante. Además, durante ese tiempo tienes ventaja en las salvaciones contra conjuros lanzados por infernales o no muertos.", "CPaladin;20,Devocion,Radiante,Aura,Daño+"),
                buildSkill("Campeon ancestral", null, "1 minuto; regeneracion, accion adicional para ciertos conjuros y aura debilitadora", "Puedes asumir la forma de una fuerza antigua de la naturaleza. Durante 1 minuto recuperas 10 puntos de golpe al inicio de cada turno, puedes lanzar conjuros de paladín de lanzamiento de 1 acción como acción adicional y las criaturas enemigas a 10 pies de ti tienen desventaja en las salvaciones contra tus conjuros y opciones de Canalizar Divinidad.", "CPaladin;20,Antiguos,Curacion,Aura,Conjuro"),
                buildSkill("Angel vengador", null, "1 hora; alas y aura de amenaza", "Como acción, adoptas la apariencia de un vengador alado. Durante 1 hora obtienes velocidad de vuelo de 60 pies y emites un aura de amenaza de 30 pies. La primera vez que una criatura enemiga entra en esa aura o empieza su turno allí, debe superar una salvación de Sabiduría o quedar asustada durante 1 minuto o hasta recibir daño.", "CPaladin;20,Venganza,Vuelo,Aura,Control"),
                buildSkill("Jerga de ladrones", null, null, "Durante tu adiestramiento aprendiste la jerga de ladrones, una mezcla secreta de dialecto, jerga y signos ocultos que te permite transmitir mensajes encubiertos dentro de una conversación aparentemente normal o mediante marcas discretas.", "CPicaro;1,Idioma,Codigo"),
                buildSkill("Accion astuta", null, "Desplazarse, retirarse u ocultarse como accion adicional", "A partir del nivel 2, tu rapidez mental y física te permite usar una acción adicional en cada turno de combate. Solo puede emplearse para Desplazarse, Retirarse u Ocultarse.", "CPicaro;2,AccionExtra,Movimiento,Sigilo"),
                buildSkill("Arquetipo de picaro", null, null, "En el nivel 3 eliges el arquetipo que da forma a tus métodos. Las opciones disponibles aquí son ladrón, asesino y embaucador arcano.", "CPicaro;3,Subclase"),
                buildSkill("Manos rapidas", null, null, "Puedes usar la acción adicional otorgada por Acción astuta para hacer una prueba de Juego de manos, usar tus herramientas de ladrón para desarmar una trampa o abrir una cerradura, o realizar la acción de Utilizar un objeto.", "CPicaro;3,Ladron,AccionExtra"),
                buildSkill("Balconero", null, "trepar no cuesta movimiento extra", "Trepar ya no te cuesta movimiento adicional. Además, cuando haces un salto con carrerilla, la distancia que cubres aumenta una cantidad de pies igual a tu modificador de Destreza.", "CPicaro;3,Ladron,Movimiento"),
                buildSkill("Competencias adicionales", null, "competencia con utiles para disfrazarse y utiles de envenenador", "Obtienes competencia con el kit de disfraz y el kit de envenenador.", "CPicaro;3,Asesino,Competencia"),
                buildSkill("Asesinar", null, "ventaja contra criaturas que aun no han actuado; critico automatico contra sorprendidos", "Tienes ventaja en las tiradas de ataque contra cualquier criatura que todavía no haya actuado en este combate. Además, cualquier impacto que consigas contra una criatura sorprendida es un golpe crítico.", "CPicaro;3,Asesino,Ataque+,Critico+"),
                buildSkill("Lanzamiento de conjuros", null, "INT para conjuros; mano de mago obligatoria", "Has aprendido magia para apoyar tus artimañas. Obtienes capacidad para lanzar conjuros usando Inteligencia como característica de conjuro. Debes conocer Mano de mago y la mayoría de tus conjuros conocidos deben ser de encantamiento o ilusión.", "CPicaro;3,EmbaucadorArcano,Conjuro,Inteligencia"),
                buildSkill("Destreza con mano de mago", null, "mano invisible; guardar o sacar objetos; abrir cerraduras y desarmar trampas a distancia", "Cuando lanzas Mano de mago puedes hacer la mano invisible y realizar con ella tareas más precisas: guardar o sacar objetos de recipientes llevados por otras criaturas, abrir cerraduras, desarmar trampas a distancia y controlar la mano como acción adicional.", "CPicaro;3,EmbaucadorArcano,Conjuro,AccionExtra"),
                buildSkill("Sigilo supremo", null, "Ventaja a sigilo si te mueves a media velocidad o menos", "Tienes ventaja en cualquier prueba de Destreza (Sigilo) si no te mueves más de la mitad de tu velocidad durante el mismo turno.", "CPicaro;9,Ladron,Sigilo"),
                buildSkill("Pericia en infiltrarse", null, "creas identidades falsas", "Puedes crear identidades falsas completas para ti mismo, con documentación, historial, profesión y afiliaciones. Debes dedicar siete días y 25 po para establecer una de estas identidades.", "CPicaro;9,Asesino,Infiltracion,Engaño"),
                buildSkill("Emboscada magica", null, "desventaja en salvaciones si lanzas oculto", "Si estás escondido de una criatura cuando le lanzas un conjuro, esa criatura tiene desventaja en cualquier tirada de salvación que deba hacer contra el conjuro durante ese turno.", "CPicaro;9,EmbaucadorArcano,Conjuro,Control"),
                buildSkill("Usar objetos magicos", null, null, "Ignoras todos los requisitos de clase, raza y nivel en el uso de objetos mágicos.", "CPicaro;13,Ladron,ObjetoMagico"),
                buildSkill("Impostor", null, null, "Puedes imitar con precisión el habla, la escritura y el comportamiento de otra persona después de estudiarla al menos durante tres horas. Tus imitaciones solo pueden descubrirse si un observador sospecha y supera una prueba enfrentada.", "CPicaro;13,Asesino,Engaño,Infiltracion"),
                buildSkill("Embaucador versatil", null, null, "Como acción adicional en tu turno, puedes designar una criatura a 5 pies de tu Mano de mago. Hasta el final del turno obtienes ventaja en las tiradas de ataque contra esa criatura.", "CPicaro;13,EmbaucadorArcano,Conjuro,Ataque+"),
                buildSkill("Reflejos de ladron", null, "2 turnos en la primera ronda si no estas sorprendido", "Eres extraordinariamente veloz al empezar un combate. Si no estás sorprendido, puedes actuar dos veces durante la primera ronda: una en tu iniciativa normal y otra en tu iniciativa menos 10.", "CPicaro;17,Ladron,Iniciativa"),
                buildSkill("Golpe mortal", null, null, "Cuando atacas e impactas a una criatura sorprendida, debe hacer una salvación de Constitución. Si falla, el daño del ataque se duplica contra ella.", "CPicaro;17,Asesino,Daño+,Critico+"),
                buildSkill("Ladron de conjuros", null, null, "Inmediatamente después de que una criatura te lance un conjuro cuyo objetivo seas tú o que te incluya en su área, puedes usar tu reacción para forzar una salvación con su modificador de conjuro. Si falla, anulas el efecto del conjuro sobre ti y puedes lanzar ese conjuro tú mismo durante las siguientes 8 horas usando tus espacios de conjuro.", "CPicaro;17,EmbaucadorArcano,Conjuro,Reaccion")
            ));
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
            PasswordEncoder passwordEncoder
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
						"CBarbaro;1,ResContundente+,ResPerforante+,ResCortante+,PruebaFuerza+,SalvacionFuerza+"
                    ),
                    buildSkill(
                        "Defensa sin armadura",
                        null,
                        "10 + DES + CON",
                        "mientras no lleves armadura:\n\n"
                            + "**CA = 10 + destreza + constitución**\n\n"
                            + "puedes usar escudo.",
						"CBarbaro;1,Escudo"
                    ),
                    buildSkill(
                        "Ataque temerario",
                        null,
                        null,
                        "puedes atacar con ferocidad descuidando tu defensa.\n\n"
                            + "* ventaja en ataques cuerpo a cuerpo con fuerza\n"
                            + "* los enemigos tienen ventaja contra ti hasta tu siguiente turno",
						"CBarbaro;2,Ataque+,Defensa-"
                    ),
                    buildSkill("Sentir el peligro", null, null, "tienes ventaja en las tiradas de salvación de destreza contra efectos que puedas ver, como trampas y conjuros, siempre que no estés cegado, ensordecido o incapacitado.", "CBarbaro;2,SalvacionDestreza+,Percepcion"),
                    buildSkill("Senda primordial", null, null, "eliges una senda primordial que moldea tu furia. Puedes seguir la senda del berserker o la senda del guerrero totémico.", "CBarbaro;3,Subclase"),
                    buildSkill("Frenesí", null, null, "cuando entras en furia puedes hacerlo con frenesí. mientras dure, puedes realizar un ataque con arma cuerpo a cuerpo como acción adicional en cada uno de tus turnos. al terminar la furia, sufres un nivel de agotamiento.", "CBarbaro;3,Berserker,Furia,Agotamiento"),
                    buildSkill("Buscador espiritual", null, null, "adquieres la capacidad de lanzar comunion con la naturaleza y hablar con los animales como rituales, aunque solo para comunicarte con espiritus totémicos.", "CBarbaro;3,Totemico,Conjuro,Ritual"),
                    buildSkill("Espiritu totemico", null, null, "eliges un espiritu totemico que te acompaña mientras estas en furia. oso: obtienes resistencia a todo el daño salvo psiquico. aguila: mientras no lleves armadura pesada, otras criaturas tienen desventaja en ataques de oportunidad contra ti. lobo: mientras estas en furia, tus aliados tienen ventaja en ataques cuerpo a cuerpo contra criaturas hostiles a 5 pies de ti.", "CBarbaro;3,Totemico,Defensa,Movimiento"),
                    buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CBarbaro;4,MejoraCaracteristica"),
                    buildSkill("Ataque adicional", null, "2 ataques por acción de atacar", "puedes atacar dos veces, en lugar de una, cada vez que realices la acción de atacar en tu turno.", "CBarbaro;5,Multiataque"),
                    buildSkill("Movimiento rápido", null, "+10 pies de velocidad", "tu velocidad aumenta en 10 pies mientras no lleves armadura pesada.", "CBarbaro;5,Velocidad+,Movimiento"),
                    buildSkill("Furia sin mente", null, null, "no puedes ser hechizado ni asustado mientras estés en furia. si ya lo estabas al entrar en furia, el efecto queda suspendido mientras dure.", "CBarbaro;6,Berserker,InmunidadHechizado,InmunidadAsustado"),
                    buildSkill("Aspecto de la bestia", null, null, "el animal de tu totem deja su huella fuera de la furia. oso: tu capacidad de carga se duplica y tienes ventaja en pruebas para empujar, arrastrar, levantar o romper objetos. aguila: puedes ver hasta una milla sin dificultad y distingues detalles diminutos a gran distancia. lobo: puedes seguir rastros a gran velocidad y moverte con sigilo normal mientras sigues a otras criaturas.", "CBarbaro;6,Totemico,Exploracion,Movimiento"),
                    buildSkill("Instinto salvaje", null, null, "tienes ventaja en las tiradas de iniciativa. además, si te sorprenden y no estás incapacitado, puedes actuar con normalidad en tu primer turno si entras en furia antes de hacer cualquier otra cosa.", "CBarbaro;7,Iniciativa+,Sorpresa"),
                    buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CBarbaro;8,MejoraCaracteristica"),
                    buildSkill("Crítico brutal (1 dado)", null, "+1 dado de daño en crítico", "puedes tirar un dado adicional de daño del arma al determinar el daño extra de un golpe crítico cuerpo a cuerpo.", "CBarbaro;9,Critico+,Daño+"),
                    buildSkill("Presencia intimidante", null, "CD = 8 + competencia + carisma", "puedes usar tu acción para aterrorizar a una criatura que esté a 30 pies o menos y pueda verte u oírte. debe superar una salvación de sabiduría o quedar asustada hasta el final de tu próximo turno. puedes usar tu acción en turnos siguientes para prolongar el efecto.", "CBarbaro;10,Berserker,Miedo,Control"),
                    buildSkill("Caminante espiritual", null, null, "puedes lanzar comunion con la naturaleza como ritual para entrar en contacto con tus espiritus totemicos y extraer guia del entorno.", "CBarbaro;10,Totemico,Conjuro,Ritual"),
                    buildSkill("Rabia implacable", null, "CD 10 + 5 por uso adicional", "si tus puntos de golpe caen a 0 mientras estás en furia y no mueres en el acto, puedes hacer una tirada de salvación de constitución con CD 10. si tienes éxito, te quedas con 1 punto de golpe. la CD aumenta en 5 cada vez que vuelves a usar este rasgo hasta que completes un descanso corto o largo.", "CBarbaro;11,Supervivencia,Constitucion"),
                    buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CBarbaro;12,MejoraCaracteristica"),
                    buildSkill("Crítico brutal (2 dados)", null, "+2 dados de daño en crítico", "al determinar el daño adicional de un golpe crítico cuerpo a cuerpo, añades dos dados extra de daño del arma en lugar de uno.", "CBarbaro;13,Critico+,Daño+"),
                    buildSkill("Represalia", null, "Reacción: 1 ataque cuerpo a cuerpo", "cuando una criatura que esté a 5 pies de ti te haga daño, puedes usar tu reacción para realizar un ataque con arma cuerpo a cuerpo contra esa criatura.", "CBarbaro;14,Berserker,Reaccion,Contraataque"),
                    buildSkill("Sintonia totemica", null, null, "tu vínculo con el espíritu totémico alcanza su punto máximo mientras estas en furia. oso: las criaturas hostiles a 5 pies de ti tienen desventaja al atacar a objetivos distintos de ti o de otro barbaro con este rasgo. aguila: obtienes una velocidad de vuelo igual a tu velocidad al caminar durante tu turno. lobo: cuando impactas con un ataque cuerpo a cuerpo puedes derribar a una criatura grande o menor, dejandola tumbada si falla una salvación de Fuerza.", "CBarbaro;14,Totemico,Control,Daño+"),
                    buildSkill("Rabia persistente", null, null, "tu furia ya no termina de forma anticipada solo porque no hayas atacado a una criatura hostil o no hayas recibido daño desde tu último turno.", "CBarbaro;15,Furia"),
                    buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CBarbaro;16,MejoraCaracteristica"),
                    buildSkill("Crítico brutal (3 dados)", null, "+3 dados de daño en crítico", "al determinar el daño adicional de un golpe crítico cuerpo a cuerpo, añades tres dados extra de daño del arma.", "CBarbaro;17,Critico+,Daño+"),
                    buildSkill("Poder indomable", null, null, "si el total de una prueba de fuerza es menor que tu puntuación de fuerza, puedes usar tu puntuación de fuerza en lugar del resultado del dado.", "CBarbaro;18,Fuerza,Pruebas"),
                    buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CBarbaro;19,MejoraCaracteristica"),
                    buildSkill("Campeón", null, "FUE +4, CON +4, máximo 24", "tus puntuaciones de fuerza y constitución aumentan en 4. además, el máximo de ambas puntuaciones pasa a ser 24.", "CBarbaro;20,Fuerza+,Constitucion+"),
                        buildSkill("Conjuro bardico", null, "CAR para conjuros; foco: instrumento", "accedes al lanzamiento de conjuros bardicos, lanzas con carisma y puedes usar un instrumento musical como foco.", "CBardo;1,Conjuro,Carisma"),
                        buildSkill("Inspiracion bardica (d6)", null, "usos = mod. CAR; dado d6", "como accion adicional inspiras a una criatura a 60 pies o menos para que sume un dado a una prueba, ataque o salvacion dentro de los 10 minutos siguientes.", "CBardo;1,Apoyo,Inspiracion,Carisma"),
                        buildSkill("Jack of All Trades", null, "+1/2 competencia a pruebas sin competencia", "sumas la mitad de tu bonificador de competencia, redondeando hacia abajo, a cualquier prueba de caracteristica en la que no seas competente.", "CBardo;2,Pruebas,Competencia"),
                        buildSkill("Cancion de descanso (d6)", null, "curacion extra 1d6", "durante un descanso corto, las criaturas aliadas que te oigan recuperan puntos de golpe extra al gastar dados de golpe.", "CBardo;2,Descanso,Curacion"),
                        buildSkill("Colegio bardico", null, null, "eliges un colegio bardico. Entre las opciones disponibles están el colegio del saber y el colegio del valor.", "CBardo;3,Subclase"),
                        buildSkill("Pericia", null, "doblas competencia en 2 habilidades", "eliges dos competencias en habilidades y duplicas tu bonificador de competencia en las pruebas que las usen.", "CBardo;3,Pericia,Habilidades"),
                        buildSkill("Competencias adicionales", null, "+3 habilidades", "al unirte al colegio del saber obtienes competencia en tres habilidades adicionales a tu eleccion.", "CBardo;3,Lore,Habilidades"),
                        buildSkill("Palabras hirientes", null, "Reaccion: resta dado de inspiracion", "puedes gastar una inspiracion bardica para reducir la tirada de ataque, dano o prueba de una criatura que te oiga.", "CBardo;3,Lore,Reaccion,Control"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CBardo;4,MejoraCaracteristica"),
                        buildSkill("Inspiracion bardica (d8)", null, "dado d8", "tu dado de inspiracion bardica mejora a d8.", "CBardo;5,Inspiracion,Escalado"),
                        buildSkill("Fuente de inspiracion", null, "recuperas usos en descanso corto o largo", "recuperas todos los usos de inspiracion bardica al terminar un descanso corto o largo.", "CBardo;5,Inspiracion,Descanso"),
                        buildSkill("Contracanto", null, "Ventaja contra hechizado y miedo", "puedes iniciar una interpretacion que da ventaja en salvaciones contra estar hechizado o asustado a ti y a tus aliados cercanos que te oigan.", "CBardo;6,Apoyo,Salvacion,Miedo,Hechizado"),
                        buildSkill("Secretos magicos adicionales", null, "+2 conjuros de cualquier clase", "el colegio del saber te permite aprender dos conjuros de cualquier lista sin que cuenten para tus conjuros bardicos conocidos.", "CBardo;6,Lore,Conjuro"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CBardo;8,MejoraCaracteristica"),
                        buildSkill("Cancion de descanso (d8)", null, "curacion extra 1d8", "la curacion adicional de tu cancion de descanso aumenta a 1d8.", "CBardo;9,Descanso,Curacion"),
                        buildSkill("Inspiracion bardica (d10)", null, "dado d10", "tu dado de inspiracion bardica mejora a d10.", "CBardo;10,Inspiracion,Escalado"),
                        buildSkill("Pericia", null, "doblas competencia en 2 habilidades mas", "eliges otras dos competencias en habilidades para duplicar tu bonificador de competencia.", "CBardo;10,Pericia,Habilidades"),
                        buildSkill("Secretos magicos", null, "+2 conjuros de cualquier clase", "aprendes dos conjuros de cualquier clase que cuenten como conjuros bardicos para ti.", "CBardo;10,Conjuro"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CBardo;12,MejoraCaracteristica"),
                        buildSkill("Cancion de descanso (d10)", null, "curacion extra 1d10", "la curacion adicional de tu cancion de descanso aumenta a 1d10.", "CBardo;13,Descanso,Curacion"),
                        buildSkill("Secretos magicos", null, "+2 conjuros de cualquier clase", "aprendes otros dos conjuros de cualquier clase que cuentan como bardicos para ti.", "CBardo;14,Conjuro"),
                        buildSkill("Habilidad sin par", null, "gastas inspiracion para mejorar una prueba", "puedes gastar una inspiracion bardica para sumar su dado a una prueba de caracteristica despues de tirar, antes de conocer el resultado.", "CBardo;14,Lore,Pruebas,Inspiracion"),
                        buildSkill("Inspiracion bardica (d12)", null, "dado d12", "tu dado de inspiracion bardica mejora a d12.", "CBardo;15,Inspiracion,Escalado"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CBardo;16,MejoraCaracteristica"),
                        buildSkill("Cancion de descanso (d12)", null, "curacion extra 1d12", "la curacion adicional de tu cancion de descanso aumenta a 1d12.", "CBardo;17,Descanso,Curacion"),
                        buildSkill("Secretos magicos", null, "+2 conjuros de cualquier clase", "aprendes dos conjuros adicionales de cualquier lista.", "CBardo;18,Conjuro"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CBardo;19,MejoraCaracteristica"),
                        buildSkill("Inspiracion superior", null, "recuperas 1 uso al tirar iniciativa si no te quedan", "si inicias combate sin usos de inspiracion bardica, recuperas uno al tirar iniciativa.", "CBardo;20,Inspiracion,Iniciativa"),
                        buildSkill("Conjuro clerical", null, "SAB para conjuros; foco: simbolo sagrado", "accedes al lanzamiento de conjuros clericales, preparas tus plegarias y usas sabiduria como caracteristica de conjuro.", "CClerigo;1,Conjuro,Sabiduria"),
                        buildSkill("Dominio divino", null, null, "eliges un dominio divino. Entre las opciones disponibles están conocimiento, vida, luz, naturaleza, tempestad, engaño y guerra.", "CClerigo;1,Subclase"),
                        buildSkill("Competencia adicional", null, "armadura pesada", "el dominio de la vida te concede competencia con armadura pesada.", "CClerigo;1,Vida,ArmaduraPesada"),
                        buildSkill("Discipulo de la vida", null, "+2 + nivel del conjuro a la curacion", "cuando lanzas un conjuro de nivel 1 o superior que cure puntos de golpe, la criatura recupera curacion adicional.", "CClerigo;1,Vida,Curacion"),
                        buildSkill("Canalizar divinidad", null, "1 uso por descanso", "canalizas energia divina para activar efectos de tu clase y de tu dominio.", "CClerigo;2,CanalDivino"),
                        buildSkill("Expulsar no muertos", null, null, "presentas tu simbolo sagrado para obligar a los no muertos cercanos a huir de ti durante un tiempo.", "CClerigo;2,CanalDivino,NoMuertos,Control"),
                        buildSkill("Preservar la vida", null, "cura total = 5 x nivel de clerigo", "como canal divino repartes curacion entre criaturas cercanas sin superar la mitad de sus puntos de golpe maximos.", "CClerigo;2,Vida,CanalDivino,Curacion"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CClerigo;4,MejoraCaracteristica"),
                        buildSkill("Destruir no muertos (CR 1/2)", null, "afecta a no muertos de CR 1/2 o menor", "cuando un no muerto falla contra expulsar no muertos, queda destruido si su desafio es lo bastante bajo.", "CClerigo;5,NoMuertos,CanalDivino,Daño+"),
                        buildSkill("Canalizar divinidad mejorado", null, "2 usos por descanso", "puedes usar canalizar divinidad dos veces entre descansos.", "CClerigo;6,CanalDivino"),
                        buildSkill("Sanador bendito", null, "te curas 2 + nivel del conjuro", "cuando curas a otra criatura con un conjuro de nivel 1 o superior, recuperas puntos de golpe.", "CClerigo;6,Vida,Curacion"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CClerigo;8,MejoraCaracteristica"),
                        buildSkill("Destruir no muertos (CR 1)", null, "afecta a no muertos de CR 1 o menor", "tu expulsar no muertos destruye automaticamente a no muertos mas poderosos.", "CClerigo;8,NoMuertos,CanalDivino,Daño+"),
                        buildSkill("Golpe divino", null, "+1d8 radiante al golpear; +2d8 al 14", "una vez por turno, al impactar con un arma puedes anadir dano radiante extra.", "CClerigo;8,Vida,Daño+,Radiante"),
                        buildSkill("Intervencion divina", null, "exito si sacas <= nivel en d100", "puedes implorar la ayuda directa de tu deidad para obtener un milagro apropiado a la situacion.", "CClerigo;10,IntervencionDivina"),
                        buildSkill("Destruir no muertos (CR 2)", null, "afecta a no muertos de CR 2 o menor", "tu umbral para destruir no muertos vuelve a mejorar.", "CClerigo;11,NoMuertos,CanalDivino,Daño+"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CClerigo;12,MejoraCaracteristica"),
                        buildSkill("Destruir no muertos (CR 3)", null, "afecta a no muertos de CR 3 o menor", "tu umbral para destruir no muertos vuelve a aumentar.", "CClerigo;14,NoMuertos,CanalDivino,Daño+"),
                        buildSkill("Destruir no muertos (CR 4)", null, "afecta a no muertos de CR 4 o menor", "tu expulsar no muertos puede aniquilar no muertos todavia mas poderosos.", "CClerigo;17,NoMuertos,CanalDivino,Daño+"),
                        buildSkill("Curacion suprema", null, "maximizas los dados de curacion", "cuando un conjuro te haria tirar dados para curar, usas el valor maximo de cada dado.", "CClerigo;17,Vida,Curacion"),
                        buildSkill("Canalizar divinidad superior", null, "3 usos por descanso", "puedes usar canalizar divinidad tres veces entre descansos.", "CClerigo;18,CanalDivino"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CClerigo;19,MejoraCaracteristica"),
                        buildSkill("Intervencion divina mejorada", null, "exito automatico", "tu deidad responde siempre a tu intervencion divina.", "CClerigo;20,IntervencionDivina"),
                        buildSkill("Druidico", null, null, "aprendes el lenguaje secreto de los druidas y puedes dejar mensajes ocultos para otros que lo conozcan.", "CDruida;1,Idioma,Druidico"),
                        buildSkill("Conjuro druida", null, "SAB para conjuros; foco: foco druida", "accedes al lanzamiento de conjuros druida y preparas conjuros usando sabiduria.", "CDruida;1,Conjuro,Sabiduria"),
                        buildSkill("Forma salvaje", null, "2 usos por descanso corto o largo", "puedes transformarte en bestias vistas anteriormente. la forma disponible mejora con tu nivel.", "CDruida;2,Transformacion,Bestia"),
                        buildSkill("Circulo druida", null, null, "eliges un círculo druida. Puedes seguir el círculo de la tierra o el círculo de la luna.", "CDruida;2,Subclase"),
                        buildSkill("Truco adicional", null, "+1 truco druida", "el circulo de la tierra te concede un truco druida extra que no cuenta para tu limite habitual.", "CDruida;2,Tierra,Truco"),
                        buildSkill("Recuperacion natural", null, "recuperas espacios con nivel total <= la mitad de tu nivel", "durante un descanso corto puedes recuperar parte de tu energia magica en forma de espacios de conjuro.", "CDruida;2,Tierra,Conjuro,Descanso"),
                        buildSkill("Mejora de forma salvaje", null, "CR 1/2; sin velocidad de vuelo", "tu forma salvaje admite bestias mas poderosas y quita parte de sus restricciones iniciales.", "CDruida;4,Transformacion,Bestia"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CDruida;4,MejoraCaracteristica"),
                        buildSkill("Paso por la tierra", null, null, "ignoras terreno dificil no magico por plantas y tienes ventaja contra efectos vegetales magicos que dificulten el movimiento.", "CDruida;6,Tierra,Movimiento,Salvacion"),
                        buildSkill("Mejora de forma salvaje", null, "CR 1; con velocidad de vuelo", "tu forma salvaje ahora puede adoptar bestias aun mas fuertes, incluidas formas con velocidad de vuelo.", "CDruida;8,Transformacion,Bestia"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CDruida;8,MejoraCaracteristica"),
                        buildSkill("Proteccion de la naturaleza", null, "inmune a veneno y enfermedad; inmune a hechizado y miedo de feericos y elementales", "la magia de la tierra te protege contra enfermedades, venenos y la influencia de ciertos seres sobrenaturales.", "CDruida;10,Tierra,InmunidadVeneno,InmunidadEnfermedad,InmunidadHechizado,InmunidadAsustado"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CDruida;12,MejoraCaracteristica"),
                        buildSkill("Santuario de la naturaleza", null, "salvacion SAB o cambian de objetivo", "bestias y plantas dudan en atacarte y pueden verse forzadas a fallar o a elegir otro objetivo.", "CDruida;14,Tierra,Defensa,Control"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CDruida;16,MejoraCaracteristica"),
                        buildSkill("Cuerpo intemporal", null, "envejeces 1 ano por cada 10 anos", "la magia primigenia ralentiza tu envejecimiento fisico.", "CDruida;18,Defensa,Longevidad"),
                        buildSkill("Conjuros bestiales", null, null, "puedes lanzar muchos de tus conjuros de druida mientras estas en forma salvaje.", "CDruida;18,Conjuro,Transformacion"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CDruida;19,MejoraCaracteristica"),
                        buildSkill("Archidruida", null, "forma salvaje ilimitada", "puedes usar forma salvaje sin limite y omitir muchos componentes de tus conjuros.", "CDruida;20,Transformacion,Conjuro"),
                        buildSkill("Estilo de combate", null, null, "eliges un estilo de combate que mejora un aspecto concreto de tu forma de luchar.", "CGuerrero;1,Combate"),
                        buildSkill("Segundo aliento", null, "Cura 1d10 + nivel de guerrero", "como accion adicional recuperas puntos de golpe gracias a tu reserva de aguante.", "CGuerrero;1,Curacion,Supervivencia"),
                        buildSkill("Arrebato de accion", null, "1 accion adicional", "en tu turno puedes realizar una accion adicional aparte de tu accion normal y posible accion adicional.", "CGuerrero;2,AccionExtra"),
                        buildSkill("Arquetipo marcial", null, null, "eliges un arquetipo marcial. Entre las opciones disponibles están campeón, maestro de batalla y caballero arcano.", "CGuerrero;3,Subclase"),
                        buildSkill("Critico mejorado", null, "critico con 19-20", "tus ataques con arma logran golpe critico con 19 o 20 en el d20.", "CGuerrero;3,Campeon,Critico+"),
                        buildSkill("Dados de supremacía", null, "4 dados d8; recuperas todo en descanso corto o largo", "aprendes a usar dados de supremacia para potenciar maniobras marciales. comienzas con cuatro dados de d8 y recuperas todos tus usos al terminar un descanso corto o largo.", "CGuerrero;3,MaestroDeBatalla,Combate,Descanso"),
                        buildSkill("Maniobras", null, "3 maniobras al nivel 3; +2 al 7, 10 y 15", "aprendes maniobras especiales que consumen tus dados de supremacia y mejoran tus ataques, defensa o apoyo tactico.", "CGuerrero;3,MaestroDeBatalla,Combate,Tactica"),
                        buildSkill("Lanzamiento de conjuros", null, "INT para conjuros", "aprendes magia arcana para complementar tu estilo de combate. lanzas conjuros de mago usando inteligencia como caracteristica de conjuro.", "CGuerrero;3,CaballeroArcano,Conjuro,Inteligencia"),
                        buildSkill("Vínculo con arma", null, "no te pueden desarmar; invocas el arma como accion adicional", "realizas un ritual con hasta dos armas para vincularte a ellas. mientras esten en tu mismo plano no puedes ser desarmado de ellas voluntariamente y puedes invocar una de las armas vinculadas a tu mano como accion adicional.", "CGuerrero;3,CaballeroArcano,Arma,AccionExtra"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CGuerrero;4,MejoraCaracteristica"),
                        buildSkill("Ataque extra", null, "2 ataques por accion de atacar", "puedes atacar dos veces cuando realizas la accion de atacar.", "CGuerrero;5,Multiataque"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CGuerrero;6,MejoraCaracteristica"),
                        buildSkill("Atleta notable", null, "+1/2 competencia a pruebas de FUE, DES y CON sin competencia", "sumas la mitad de tu competencia a ciertas pruebas fisicas y mejoras tus saltos con carrera.", "CGuerrero;7,Campeon,Pruebas,Movimiento"),
                        buildSkill("Magia de Guerra", null, "accion adicional: un ataque tras lanzar un truco", "cuando usas tu accion para lanzar un truco, puedes realizar un ataque con arma como accion adicional.", "CGuerrero;7,CaballeroArcano,Conjuro,AccionExtra,Ataque+"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CGuerrero;8,MejoraCaracteristica"),
                        buildSkill("Indomable", null, "repite 1 salvacion fallida por descanso largo", "puedes repetir una tirada de salvacion fallida, pero debes usar el nuevo resultado.", "CGuerrero;9,Salvacion"),
                        buildSkill("Estilo de combate adicional", null, null, "el campeon aprende un segundo estilo de combate.", "CGuerrero;10,Campeon,Combate"),
                        buildSkill("Golpe Sobrenatural", null, "los golpes con arma reducen la ventaja en salvaciones contra tus conjuros", "cuando impactas a una criatura con un ataque con arma, esa criatura tiene desventaja en la siguiente tirada de salvacion que haga contra un conjuro que lances antes de que acabe tu siguiente turno.", "CGuerrero;10,CaballeroArcano,Conjuro,Control"),
                        buildSkill("Ataque extra (2)", null, "3 ataques por accion de atacar", "ahora realizas tres ataques cuando usas la accion de atacar.", "CGuerrero;11,Multiataque"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CGuerrero;12,MejoraCaracteristica"),
                        buildSkill("Indomable", null, "2 usos por descanso largo", "puedes usar indomable dos veces entre descansos largos.", "CGuerrero;13,Salvacion"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CGuerrero;14,MejoraCaracteristica"),
                        buildSkill("Critico superior", null, "critico con 18-20", "tus ataques con arma hacen critico con 18, 19 o 20.", "CGuerrero;15,Campeon,Critico+"),
                        buildSkill("Carga Arcana", null, "teletransporte 30 pies al usar arrebato de accion", "si usas arrebato de accion puedes teletransportarte hasta 30 pies a un espacio que veas antes o despues de tu accion adicional.", "CGuerrero;15,CaballeroArcano,Movimiento,Teleportacion,AccionExtra"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CGuerrero;16,MejoraCaracteristica"),
                        buildSkill("Arrebato de accion mejorado", null, "2 usos por descanso", "puedes usar arrebato de accion dos veces entre descansos, aunque solo una vez por turno.", "CGuerrero;17,AccionExtra"),
                        buildSkill("Indomable", null, "3 usos por descanso largo", "puedes usar indomable tres veces entre descansos largos.", "CGuerrero;17,Salvacion"),
                        buildSkill("Magia de Guerra Mejorada", null, "ataque como accion adicional tras lanzar cualquier conjuro", "cuando usas tu accion para lanzar un conjuro, puedes realizar un ataque con arma como accion adicional.", "CGuerrero;18,CaballeroArcano,Conjuro,AccionExtra,Ataque+"),
                        buildSkill("Superviviente", null, "recuperas 5 + CON PG por turno si estas a mitad de vida o menos", "si estas herido pero no a 0 puntos de golpe, recuperas vida al inicio de cada turno.", "CGuerrero;18,Campeon,Curacion,Supervivencia"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CGuerrero;19,MejoraCaracteristica"),
                        buildSkill("Ataque extra (3)", null, "4 ataques por accion de atacar", "alcanzas cuatro ataques por cada accion de atacar.", "CGuerrero;20,Multiataque"),
                        buildSkill("Arremetida", null, "al impactar, gastas un dado para anadir dano y empujar", "cuando impactas con un ataque con arma puedes gastar un dado de supremacia para infligir dano adicional e intentar empujar al objetivo hacia atras.", "DND,Guerrero,MaestroDeBatalla,Maniobra"),
                        buildSkill("Ataque Amenazador", null, "al impactar, anades dano y puedes asustar", "cuando impactas con un ataque con arma puedes gastar un dado de supremacia para anadir dano e intentar asustar al objetivo.", "DND,Guerrero,MaestroDeBatalla,Maniobra"),
                        buildSkill("Ataque de Barrido", null, "al impactar, anades dano a otro objetivo cercano", "cuando impactas con un ataque cuerpo a cuerpo puedes gastar un dado de supremacia para herir tambien a otra criatura cercana.", "DND,Guerrero,MaestroDeBatalla,Maniobra"),
                        buildSkill("Ataque Preciso", null, "anades el dado a la tirada de ataque", "puedes gastar un dado de supremacia para mejorar una tirada de ataque antes o despues de tirar, pero antes de saber si impacta.", "DND,Guerrero,MaestroDeBatalla,Maniobra"),
                        buildSkill("Ataque Provocador", null, "al impactar, anades dano y marcas al objetivo", "cuando impactas puedes gastar un dado de supremacia para infligir dano adicional y dificultar que el objetivo ataque a tus aliados.", "DND,Guerrero,MaestroDeBatalla,Maniobra"),
                        buildSkill("Ataque y Derribo", null, "al impactar, anades dano y puedes derribar", "cuando impactas con un arma puedes gastar un dado de supremacia para anadir dano e intentar dejar tumbado al objetivo.", "DND,Guerrero,MaestroDeBatalla,Maniobra"),
                        buildSkill("Ataque y Desarme", null, "al impactar, anades dano y puedes desarmar", "cuando impactas puedes gastar un dado de supremacia para anadir dano e intentar que el objetivo suelte un objeto que sostenga.", "DND,Guerrero,MaestroDeBatalla,Maniobra"),
                        buildSkill("Ataque y Distracción", null, "al impactar, anades dano y das ventaja a un aliado", "cuando impactas puedes gastar un dado de supremacia para distraer al objetivo y abrir una oportunidad de ataque para un aliado.", "DND,Guerrero,MaestroDeBatalla,Maniobra"),
                        buildSkill("Ataque y Empujón", null, "al impactar, anades dano y puedes empujar lateralmente", "cuando impactas puedes gastar un dado de supremacia para desplazar al objetivo a otra posicion cercana.", "DND,Guerrero,MaestroDeBatalla,Maniobra"),
                        buildSkill("Ataque y Maniobra", null, "al impactar, anades dano y mueves a un aliado", "cuando impactas puedes gastar un dado de supremacia para que un aliado se mueva usando su reaccion sin provocar ataques de oportunidad del objetivo.", "DND,Guerrero,MaestroDeBatalla,Maniobra"),
                        buildSkill("Contraataque", null, "reaccion tras fallo enemigo", "cuando una criatura falla un ataque cuerpo a cuerpo contra ti puedes usar tu reaccion y gastar un dado de supremacia para hacer un ataque de respuesta con dano adicional.", "DND,Guerrero,MaestroDeBatalla,Maniobra,Reaccion"),
                        buildSkill("Finta", null, "accion adicional para ganar ventaja y dano", "puedes gastar un dado de supremacia como accion adicional para fintar contra una criatura y obtener ventaja en tu siguiente ataque contra ella este turno, anadiendo dano extra si impactas.", "DND,Guerrero,MaestroDeBatalla,Maniobra,AccionExtra"),
                        buildSkill("Juego de Pies Evasivo", null, "anades el dado a tu CA al moverte", "cuando te mueves puedes gastar un dado de supremacia para aumentar tu CA hasta que dejes de moverte.", "DND,Guerrero,MaestroDeBatalla,Maniobra,Defensa"),
                        buildSkill("Orden de Ataque", null, "renuncias a un ataque para que un aliado ataque", "cuando realizas la accion de atacar puedes renunciar a uno de tus ataques y gastar un dado de supremacia para dirigir a un aliado a que ataque usando su reaccion.", "DND,Guerrero,MaestroDeBatalla,Maniobra,Tactica"),
                        buildSkill("Parada", null, "reaccion para reducir dano", "cuando una criatura te causa dano con un ataque cuerpo a cuerpo puedes usar tu reaccion y gastar un dado de supremacia para reducir ese dano.", "DND,Guerrero,MaestroDeBatalla,Maniobra,Defensa,Reaccion"),
                        buildSkill("Reagrupar", null, "accion adicional para dar PG temporales", "como accion adicional puedes gastar un dado de supremacia para infundir resistencia a un aliado, otorgandole puntos de golpe temporales.", "DND,Guerrero,MaestroDeBatalla,Maniobra,AccionExtra,Supervivencia"),
                        buildSkill("Defensa sin armadura", null, "10 + DES + SAB", "mientras no lleves armadura ni escudo, tu CA se calcula con destreza y sabiduria.", "CMonje;1,Defensa"),
                        buildSkill("Artes marciales", null, "dado marcial inicial 1d4", "puedes usar destreza con tus golpes desarmados y armas de monje, mejorar su dano y realizar un golpe desarmado adicional.", "CMonje;1,Ataque+,Daño+,Destreza"),
                        buildSkill("Ki", null, "puntos de ki = nivel de monje", "empleas puntos de ki para rafaga de golpes, defensa paciente y paso del viento, y otros rasgos que aprendas.", "CMonje;2,Ki"),
                        buildSkill("Movimiento sin armadura", null, "+10 pies de velocidad", "tu velocidad aumenta mientras no lleves armadura ni escudo.", "CMonje;2,Velocidad+,Movimiento"),
                        buildSkill("Tradicion monastica", null, null, "eliges una tradición monástica. Puedes seguir la vía de la mano abierta, la vía de la sombra o la vía de los cuatro elementos.", "CMonje;3,Subclase"),
                        buildSkill("Desviar proyectiles", null, "reduce dano = 1d10 + DES + nivel", "puedes usar tu reaccion para reducir o incluso atrapar un proyectil que te impacte.", "CMonje;3,Reaccion,Defensa"),
                        buildSkill("Tecnica de mano abierta", null, null, "tras una rafaga de golpes puedes derribar, empujar o impedir reacciones a tu objetivo.", "CMonje;3,ManoAbierta,Control"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CMonje;4,MejoraCaracteristica"),
                        buildSkill("Caida lenta", null, "reduce dano de caida = 5 x nivel", "puedes usar tu reaccion para reducir mucho el dano por caida.", "CMonje;4,Reaccion,Defensa"),
                        buildSkill("Ataque extra", null, "2 ataques por accion de atacar", "puedes atacar dos veces cuando realizas la accion de atacar.", "CMonje;5,Multiataque"),
                        buildSkill("Golpe aturdidor", null, "gastas 1 ki; salvacion de CON o aturdido", "al impactar con un ataque cuerpo a cuerpo puedes intentar aturdir a tu objetivo.", "CMonje;5,Ki,Control,Aturdido"),
                        buildSkill("Golpes potenciados por ki", null, null, "tus golpes desarmados cuentan como magicos para superar resistencias e inmunidades.", "CMonje;6,Ki,Daño+"),
                        buildSkill("Plenitud corporal", null, "cura = 3 x nivel de monje", "como accion te curas a ti mismo y recuperas una buena cantidad de puntos de golpe.", "CMonje;6,ManoAbierta,Curacion"),
                        buildSkill("Evasion", null, null, "cuando una salvacion de destreza te permitiria medio dano, no sufres dano al superar la tirada y solo la mitad al fallarla.", "CMonje;7,Salvacion,Defensa"),
                        buildSkill("Quietud mental", null, null, "puedes terminar con una accion un efecto que te tenga hechizado o asustado.", "CMonje;7,Control,Hechizado,Asustado"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CMonje;8,MejoraCaracteristica"),
                        buildSkill("Movimiento sin armadura mejorado", null, "puedes correr por paredes y sobre liquidos durante el turno", "tu movilidad alcanza un nivel sobrenatural y te permite moverte por superficies imposibles mientras te desplazas.", "CMonje;9,Movimiento,Velocidad+"),
                        buildSkill("Pureza corporal", null, "inmune a enfermedad y veneno", "tu dominio del ki te vuelve inmune a las enfermedades y al veneno.", "CMonje;10,InmunidadEnfermedad,InmunidadVeneno"),
                        buildSkill("Tranquilidad", null, "santuario tras descanso largo", "tras meditar, quedas protegido por un efecto similar a santuario hasta tu siguiente descanso largo.", "CMonje;11,ManoAbierta,Defensa"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CMonje;12,MejoraCaracteristica"),
                        buildSkill("Lengua del sol y la luna", null, null, "entiendes todos los idiomas hablados y cualquier criatura que conozca un idioma puede entenderte.", "CMonje;13,Idioma,Comunicacion"),
                        buildSkill("Alma diamante", null, "competencia en todas las salvaciones", "ganas competencia en todas las tiradas de salvacion y puedes repetir una fallida gastando ki.", "CMonje;14,Salvacion,Ki"),
                        buildSkill("Cuerpo intemporal", null, null, "no sufres el desgaste de la vejez y dejas de necesitar comida y agua.", "CMonje;15,Defensa,Longevidad"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CMonje;16,MejoraCaracteristica"),
                        buildSkill("Palma vibrante", null, "3 ki; CON o 0 PG, si salva 10d10 necrotico", "dejas vibraciones letales en el cuerpo de una criatura y puedes detonarlas mas adelante.", "CMonje;17,ManoAbierta,Ki,Daño+,Control"),
                        buildSkill("Cuerpo vacio", null, "4 ki invisible; 8 ki proyeccion astral", "puedes volverte invisible con resistencia a casi todo el dano o proyectarte astralmente.", "CMonje;18,Ki,Defensa,Invisibilidad"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CMonje;19,MejoraCaracteristica"),
                        buildSkill("Ser perfecto", null, "recuperas 4 ki al tirar iniciativa si estabas a 0", "si empiezas un combate sin ki, recuperas parte de tu reserva.", "CMonje;20,Ki,Iniciativa"),
                        buildSkill("Sentido divino", null, "usos = 1 + mod. CAR", "detectas celestiales, infernales, no muertos y lugares consagrados o profanados cercanos.", "CPaladin;1,Deteccion,Carisma"),
                        buildSkill("Imposición de manos", null, "reserva de curacion = nivel x 5", "usas una reserva de energia sagrada para curar heridas o neutralizar enfermedades y venenos al tocar.", "CPaladin;1,Curacion,Apoyo"),
                        buildSkill("Estilo de combate", null, null, "eliges un estilo de combate propio del paladin.", "CPaladin;2,Combate"),
                        buildSkill("Lanzamiento de conjuros", null, "CAR para conjuros; foco: simbolo sagrado", "preparas conjuros de paladin y usas carisma para lanzarlos.", "CPaladin;2,Conjuro,Carisma"),
                        buildSkill("Castigo divino", null, "2d8 base; +1d8 por nivel de espacio; +1d8 contra infernales o no muertos", "cuando impactas cuerpo a cuerpo puedes gastar un espacio de conjuro para infligir daño radiante adicional.", "CPaladin;2,Daño+,Radiante"),
                        buildSkill("Salud divina", null, "inmune a enfermedad", "la energia sagrada te protege por completo contra las enfermedades.", "CPaladin;3,InmunidadEnfermedad"),
                        buildSkill("Juramento sagrado", null, null, "eliges un juramento sagrado que define el ideal que guiará tus poderes. las opciones actuales son devocion, antiguos y venganza.", "CPaladin;3,Subclase"),
                        buildSkill("Conjuros de juramento", null, "Protección contra el bien y el mal, Santuario", "el juramento de devocion te concede estos conjuros, que siempre se consideran preparados y no cuentan para tu limite habitual.", "CPaladin;3,Devocion,Conjuro"),
                        buildSkill("Arma sagrada", null, "+CAR a tiradas de ataque durante 1 minuto", "usas canal divino para imbuir un arma con energia sagrada y volverla mas precisa y luminosa.", "CPaladin;3,Devocion,CanalDivino,Ataque+"),
                        buildSkill("Expulsar lo impio", null, null, "usas canal divino para condenar a infernales y muertos vivientes, obligandolos a huir de ti.", "CPaladin;3,Devocion,CanalDivino,Control"),
                        buildSkill("Conjuros de juramento", null, "Golpe apresador, Hablar con los animales", "el juramento de los antiguos te concede estos conjuros, que siempre se consideran preparados y no cuentan para tu limite habitual.", "CPaladin;3,Antiguos,Conjuro"),
                        buildSkill("Ira de la naturaleza", null, "apresa a un objetivo con una salvacion de Fuerza o Destreza", "puedes usar canalizar divinidad para invocar enredaderas espectrales que apresan a un enemigo cercano.", "CPaladin;3,Antiguos,CanalDivino,Control"),
                        buildSkill("Expulsar infieles", null, "expulsa feericos e infernales durante 1 minuto", "usas canalizar divinidad para pronunciar palabras ancestrales que hacen huir a feericos e infernales.", "CPaladin;3,Antiguos,CanalDivino,Control"),
                        buildSkill("Conjuros de juramento", null, "Marca del cazador, Perdicion", "el juramento de venganza te concede estos conjuros, que siempre se consideran preparados y no cuentan para tu limite habitual.", "CPaladin;3,Venganza,Conjuro"),
                        buildSkill("Abjurar enemigo", null, "asusta o ralentiza a un objetivo", "usas canalizar divinidad para denunciar a una criatura visible, asustandola o frenandola si resiste.", "CPaladin;3,Venganza,CanalDivino,Control"),
                        buildSkill("Voto de enemistad", null, "ventaja contra un objetivo durante 1 minuto", "como accion adicional puedes emplear canalizar divinidad para obtener ventaja contra un enemigo jurado cercano.", "CPaladin;3,Venganza,CanalDivino,Ataque+"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CPaladin;4,MejoraCaracteristica"),
                        buildSkill("Ataque adicional", null, "2 ataques por accion de atacar", "puedes atacar dos veces cuando realizas la accion de atacar.", "CPaladin;5,Multiataque"),
                        buildSkill("Conjuros de juramento", null, "Restablecimiento menor, Zona de la verdad", "la devocion amplía su lista de conjuros de juramento siempre preparados.", "CPaladin;5,Devocion,Conjuro"),
                        buildSkill("Conjuros de juramento", null, "Paso brumoso, Rayo de luna", "los antiguos amplían su lista de conjuros de juramento siempre preparados.", "CPaladin;5,Antiguos,Conjuro"),
                        buildSkill("Conjuros de juramento", null, "Inmovilizar persona, Paso brumoso", "la venganza amplía su lista de conjuros de juramento siempre preparados.", "CPaladin;5,Venganza,Conjuro"),
                        buildSkill("Aura de proteccion", null, "+CAR a salvaciones en 10 pies; 30 pies al 18", "tu y tus aliados cercanos sumais tu modificador de carisma a las tiradas de salvacion mientras estes consciente.", "CPaladin;6,Aura,Salvacion,Carisma"),
                        buildSkill("Aura de devocion", null, "inmunidad a hechizado en 10 pies; 30 pies al 18", "tu y tus aliados cercanos no podeis ser hechizados mientras estes consciente.", "CPaladin;7,Devocion,Aura,InmunidadHechizado"),
                        buildSkill("Aura de salvaguarda", null, "resistencia al daño de conjuros en 10 pies; 30 pies al 18", "la magia antigua te ha impregnado tanto que tu y tus aliados cercanos teneis resistencia al daño proveniente de conjuros.", "CPaladin;7,Antiguos,Aura,Resistencia"),
                        buildSkill("Vengador implacable", null, "te mueves hasta la mitad de tu velocidad tras un ataque de oportunidad", "cuando impactas a una criatura con un ataque de oportunidad, puedes moverte hasta la mitad de tu velocidad como parte de la misma reaccion sin provocar ataques de oportunidad.", "CPaladin;7,Venganza,Reaccion,Movimiento"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CPaladin;8,MejoraCaracteristica"),
                        buildSkill("Conjuros de juramento", null, "Disipar magia, Señal de esperanza", "la devocion sigue ampliando su lista de conjuros de juramento siempre preparados.", "CPaladin;9,Devocion,Conjuro"),
                        buildSkill("Conjuros de juramento", null, "Crecimiento vegetal, Proteccion contra energia", "los antiguos siguen ampliando su lista de conjuros de juramento siempre preparados.", "CPaladin;9,Antiguos,Conjuro"),
                        buildSkill("Conjuros de juramento", null, "Acelerar, Proteccion contra energia", "la venganza sigue ampliando su lista de conjuros de juramento siempre preparados.", "CPaladin;9,Venganza,Conjuro"),
                        buildSkill("Aura de coraje", null, "inmunidad a miedo en 10 pies; 30 pies al 18", "tu y tus aliados cercanos no podeis ser asustados mientras estes consciente.", "CPaladin;10,Aura,InmunidadAsustado"),
                        buildSkill("Castigo divino mejorado", null, "+1d8 radiante en cada golpe cuerpo a cuerpo", "todos tus ataques cuerpo a cuerpo quedan cargados con dano radiante adicional.", "CPaladin;11,Daño+,Radiante"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CPaladin;12,MejoraCaracteristica"),
                        buildSkill("Conjuros de juramento", null, "Guardian de la fe, Libertad de movimiento", "la devocion alcanza el cuarto tramo de conjuros de juramento siempre preparados.", "CPaladin;13,Devocion,Conjuro"),
                        buildSkill("Conjuros de juramento", null, "Piel petrea, Tormenta de hielo", "los antiguos alcanzan el cuarto tramo de conjuros de juramento siempre preparados.", "CPaladin;13,Antiguos,Conjuro"),
                        buildSkill("Conjuros de juramento", null, "Destierro, Puerta dimensional", "la venganza alcanza el cuarto tramo de conjuros de juramento siempre preparados.", "CPaladin;13,Venganza,Conjuro"),
                        buildSkill("Toque purificador", null, "usos = mod. CAR", "puedes tocar a una criatura voluntaria o a ti mismo para terminar un conjuro que la afecte.", "CPaladin;14,Apoyo,Carisma"),
                        buildSkill("Pureza de espiritu", null, null, "estas siempre bajo los efectos de un conjuro de proteccion contra el bien y el mal.", "CPaladin;15,Devocion,Defensa"),
                        buildSkill("Centinela imperecedero", null, "si caes a 0 PG vuelves a 1 PG una vez por descanso largo", "si tus puntos de golpe se reducen a 0 sin morir al instante, puedes volver a tener 1 punto de golpe. ademas, no sufres los inconvenientes de la edad y no puedes envejecer por medios magicos.", "CPaladin;15,Antiguos,Supervivencia,Longevidad"),
                        buildSkill("Espiritu vengativo", null, "reaccion para atacar al objetivo de tu voto de enemistad", "cuando una criatura bajo los efectos de tu voto de enemistad ataque, puedes usar tu reaccion para realizar un ataque con arma cuerpo a cuerpo contra ella si esta a tu alcance.", "CPaladin;15,Venganza,Reaccion,Ataque+"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CPaladin;16,MejoraCaracteristica"),
                        buildSkill("Conjuros de juramento", null, "Comunion, Golpe flamigero", "la devocion completa su lista de conjuros de juramento siempre preparados.", "CPaladin;17,Devocion,Conjuro"),
                        buildSkill("Conjuros de juramento", null, "Comunion con la naturaleza, Paso arboreo", "los antiguos completan su lista de conjuros de juramento siempre preparados.", "CPaladin;17,Antiguos,Conjuro"),
                        buildSkill("Conjuros de juramento", null, "Escudriñar, Inmovilizar monstruo", "la venganza completa su lista de conjuros de juramento siempre preparados.", "CPaladin;17,Venganza,Conjuro"),
                        buildSkill("Auras mejoradas", null, "radio de 30 pies", "tus auras principales extienden su alcance hasta 30 pies.", "CPaladin;18,Aura"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CPaladin;19,MejoraCaracteristica"),
                        buildSkill("Halo sagrado", null, "1 minuto; 10 de daño radiante por turno a enemigos cercanos", "como accion emanas un aura de luz solar durante 1 minuto. los enemigos que empiecen su turno en tu luz brillante sufren daño radiante y tu tienes ventaja en salvaciones contra conjuros de infernales o muertos vivientes.", "CPaladin;20,Devocion,Radiante,Aura,Daño+"),
                        buildSkill("Campeon ancestral", null, "1 minuto; regeneracion, accion adicional para ciertos conjuros y aura debilitadora", "asumes la forma de una antigua fuerza de la naturaleza. al comienzo de cada turno recuperas 10 puntos de golpe, puedes lanzar ciertos conjuros de paladin como accion adicional y los enemigos cercanos tienen desventaja en sus salvaciones contra tus conjuros y tu canalizar divinidad.", "CPaladin;20,Antiguos,Curacion,Aura,Conjuro"),
                        buildSkill("Angel vengador", null, "1 hora; alas y aura de amenaza", "adoptas la forma de un angel vengador, con alas de vuelo y un aura que asusta a los enemigos cercanos.", "CPaladin;20,Venganza,Vuelo,Aura,Control"),
                        buildSkill("Enemigo predilecto", null, null, "eliges tipos de enemigos sobre los que tienes ventaja para rastrear y recordar informacion. aprendes idiomas asociados y amplias la lista a niveles superiores.", "CExplorador;1,Rastreo,Conocimiento"),
                        buildSkill("Explorador nato", null, null, "eliges un terreno favorito y obtienes ventajas de viaje, exploracion y supervivencia en ese entorno. amplias terrenos a niveles superiores.", "CExplorador;1,Exploracion,Movimiento"),
                        buildSkill("Estilo de combate", null, null, "eliges un estilo de combate adaptado a tu forma de cazar y combatir.", "CExplorador;2,Combate"),
                        buildSkill("Conjuro explorador", null, "SAB para conjuros", "aprendes conjuros de explorador orientados a la caza, el sigilo y la naturaleza.", "CExplorador;2,Conjuro,Sabiduria"),
                        buildSkill("Arquetipo de explorador", null, null, "eliges un arquetipo de explorador. Entre las opciones disponibles están cazador y maestro de bestias.", "CExplorador;3,Subclase"),
                        buildSkill("Conciencia primigenia", null, "gastas un espacio para detectar ciertos tipos de criaturas", "puedes sentir si hay aberraciones, celestiales, dragones, elementales, feericos, infernales o no muertos en la region.", "CExplorador;3,Deteccion,Conjuro"),
                        buildSkill("Presa del cazador", null, null, "eliges una tecnica ofensiva del cazador para desgastar, castigar gigantes o golpear una segunda presa cercana.", "CExplorador;3,Cazador,Combate"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CExplorador;4,MejoraCaracteristica"),
                        buildSkill("Ataque extra", null, "2 ataques por accion de atacar", "puedes atacar dos veces cuando realizas la accion de atacar.", "CExplorador;5,Multiataque"),
                        buildSkill("Mejoras de enemigo predilecto y explorador nato", null, null, "anades un nuevo enemigo predilecto, un idioma asociado y un nuevo terreno favorito.", "CExplorador;6,Rastreo,Exploracion"),
                        buildSkill("Tacticas defensivas", null, null, "eliges una opcion defensiva del cazador para resistir hordas, cadenas de ataques o el miedo.", "CExplorador;7,Cazador,Defensa"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CExplorador;8,MejoraCaracteristica"),
                        buildSkill("Paso por la tierra", null, null, "ignoras terreno dificil no magico por plantas y tienes ventaja contra plantas magicas que dificulten el movimiento.", "CExplorador;8,Movimiento,Salvacion"),
                        buildSkill("Mejora de explorador nato", null, null, "anades otro terreno favorito para extender tus ventajas de viaje y exploracion.", "CExplorador;10,Exploracion"),
                        buildSkill("Esconderse a plena vista", null, "+10 a sigilo mientras permanezcas inmovil y camuflado", "puedes preparar camuflaje natural para ocultarte mejor en entornos apropiados.", "CExplorador;10,Sigilo,Defensa"),
                        buildSkill("Multiataque", null, null, "eliges entre una andanada a distancia o un ataque giratorio cuerpo a cuerpo contra varios enemigos.", "CExplorador;11,Cazador,Multiataque"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CExplorador;12,MejoraCaracteristica"),
                        buildSkill("Mejora de enemigo predilecto", null, null, "anades un enemigo predilecto adicional y el idioma asociado.", "CExplorador;14,Rastreo,Conocimiento"),
                        buildSkill("Desaparecer", null, "esconderse como accion adicional", "puedes usar ocultarte como accion adicional y resulta muy dificil seguirte sin magia.", "CExplorador;14,Sigilo,AccionExtra"),
                        buildSkill("Defensa superior del cazador", null, null, "eliges una tecnica avanzada de defensa como evasion, desviar ataques o reducir dano.", "CExplorador;15,Cazador,Defensa"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CExplorador;16,MejoraCaracteristica"),
                        buildSkill("Sentidos ferales", null, null, "puedes combatir mejor contra enemigos invisibles o que no ves directamente.", "CExplorador;18,Percepcion,Combate"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CExplorador;19,MejoraCaracteristica"),
                        buildSkill("Matanza de enemigos", null, "1 vez por turno anades SAB a ataque o dano contra enemigo predilecto", "te conviertes en un cazador supremo de tus enemigos escogidos.", "CExplorador;20,Daño+,Ataque+,Sabiduria"),
                        buildSkill("Pericia", null, "doblas competencia en 2 competencias", "eliges dos competencias en habilidades o una habilidad y herramientas de ladron para duplicar tu bonificador de competencia.", "CPicaro;1,Pericia,Habilidades"),
                        buildSkill("Ataque furtivo", null, "1d6 al nivel 1; progresa hasta 10d6", "una vez por turno infliges dano extra con armas sutiles o a distancia cuando tienes ventaja o un aliado amenaza al objetivo.", "CPicaro;1,Daño+,Sigilo"),
                        buildSkill("Jerga de ladrones", null, null, "conoces un codigo secreto verbal y simbolico que te permite comunicar mensajes ocultos a otros criminales.", "CPicaro;1,Idioma,Codigo"),
                        buildSkill("Accion astuta", null, "Desplazarse, retirarse u ocultarse como accion adicional", "tu rapidez te permite moverte y reposicionarte con gran facilidad en combate.", "CPicaro;2,AccionExtra,Movimiento,Sigilo"),
                        buildSkill("Arquetipo de picaro", null, null, "eliges un arquetipo de picaro. las opciones actuales son ladron, asesino y embaucador arcano.", "CPicaro;3,Subclase"),
                        buildSkill("Manos rapidas", null, null, "puedes usar la accion adicional de accion astuta para ciertas maniobras de juego de manos, abrir cerraduras, desarmar trampas o utilizar objetos.", "CPicaro;3,Ladron,AccionExtra"),
                        buildSkill("Balconero", null, "trepar no cuesta movimiento extra", "trepar ya no te cuesta movimiento adicional y, cuando saltas con carrerilla, aumentas tu distancia de salto en tantos pies como tu modificador por destreza.", "CPicaro;3,Ladron,Movimiento"),
                        buildSkill("Competencias adicionales", null, "competencia con utiles para disfrazarse y utiles de envenenador", "ganas competencia con los utiles para disfrazarse y los utiles de envenenador.", "CPicaro;3,Asesino,Competencia"),
                        buildSkill("Asesinar", null, "ventaja contra criaturas que aun no han actuado; critico automatico contra sorprendidos", "tienes ventaja en las tiradas de ataque contra cualquier criatura que aun no haya llevado a cabo ningun turno en el combate actual y cualquier impacto contra una criatura sorprendida sera automaticamente un critico.", "CPicaro;3,Asesino,Ataque+,Critico+"),
                        buildSkill("Lanzamiento de conjuros", null, "INT para conjuros; mano de mago obligatoria", "obtienes la capacidad de lanzar conjuros de mago. aprendes mano de mago y otros conjuros de encantamiento e ilusion propios del embaucador arcano.", "CPicaro;3,EmbaucadorArcano,Conjuro,Inteligencia"),
                        buildSkill("Destreza con mano de mago", null, "mano invisible; guardar o sacar objetos; abrir cerraduras y desarmar trampas a distancia", "cuando lanzas mano de mago puedes hacer que la mano espectral sea invisible, guardar o sacar objetos de otras criaturas y usar herramientas de ladron a distancia. ademas, puedes utilizar la accion adicional de accion astuta para controlarla.", "CPicaro;3,EmbaucadorArcano,Conjuro,AccionExtra"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CPicaro;4,MejoraCaracteristica"),
                        buildSkill("Esquiva asombrosa", null, "Reaccion: mitad del dano de un ataque", "cuando un atacante visible te golpea puedes usar tu reaccion para reducir a la mitad el dano.", "CPicaro;5,Reaccion,Defensa"),
                        buildSkill("Pericia", null, "doblas competencia en 2 competencias mas", "eliges dos competencias adicionales para aplicar pericia.", "CPicaro;6,Pericia,Habilidades"),
                        buildSkill("Evasion", null, null, "cuando una salvacion de destreza te permitiria medio dano, no sufres dano al superarla y solo la mitad al fallarla.", "CPicaro;7,Salvacion,Defensa"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CPicaro;8,MejoraCaracteristica"),
                        buildSkill("Sigilo supremo", null, "Ventaja a sigilo si te mueves a media velocidad o menos", "el ladron se vuelve especialmente dificil de detectar cuando se desplaza con cuidado.", "CPicaro;9,Ladron,Sigilo"),
                        buildSkill("Pericia en infiltrarse", null, "creas identidades falsas", "puedes crearte identidades falsas completas, con historia, profesion y afiliaciones, para infiltrarte con credibilidad.", "CPicaro;9,Asesino,Infiltracion,Engaño"),
                        buildSkill("Emboscada magica", null, "desventaja en salvaciones si lanzas oculto", "si estas escondido de una criatura cuando lanzas un conjuro sobre ella, el objetivo tendra desventaja en cualquier tirada de salvacion que deba hacer contra el conjuro este turno.", "CPicaro;9,EmbaucadorArcano,Conjuro,Control"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CPicaro;10,MejoraCaracteristica"),
                        buildSkill("Talentos fiables", null, "un d20 de 9 o menos cuenta como 10", "cuando hagas una prueba de caracteristica que te permita añadir tu bonificador por competencia, puedes considerar cualquier resultado de 9 o menos en el d20 como si fuera un 10.", "CPicaro;11,Pruebas,Pericia"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CPicaro;12,MejoraCaracteristica"),
                        buildSkill("Usar objetos magicos", null, null, "ignoras todas las restricciones de clase, raza y nivel a la hora de emplear objetos magicos.", "CPicaro;13,Ladron,ObjetoMagico"),
                        buildSkill("Impostor", null, null, "adquieres la capacidad para imitar de forma convincente el habla, la caligrafia y el comportamiento de otra persona tras estudiarla.", "CPicaro;13,Asesino,Engaño,Infiltracion"),
                        buildSkill("Embaucador versatil", null, null, "como accion adicional puedes usar tu mano de mago para distraer a un objetivo y obtener ventaja en tus ataques contra el hasta el final del turno.", "CPicaro;13,EmbaucadorArcano,Conjuro,Ataque+"),
                        buildSkill("Sentir sin ver", null, "detectas criaturas ocultas o invisibles a 10 pies", "si eres capaz de oir, eres consciente de la ubicacion de cualquier criatura escondida o invisible a 10 pies o menos de ti.", "CPicaro;14,Percepcion"),
                        buildSkill("Mente escurridiza", null, "competencia en salvaciones de sabiduria", "ganas mayor fortaleza mental frente a efectos que atacan tu voluntad.", "CPicaro;15,Salvacion,Sabiduria"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CPicaro;16,MejoraCaracteristica"),
                        buildSkill("Reflejos de ladron", null, "2 turnos en la primera ronda si no estas sorprendido", "puedes actuar dos veces al inicio del combate, lo que te permite abrir con gran ventaja.", "CPicaro;17,Ladron,Iniciativa"),
                        buildSkill("Golpe mortal", null, null, "cuando atacas e impactas a una criatura sorprendida, debe superar una salvacion de constitucion o el daño del ataque contra ella se duplica.", "CPicaro;17,Asesino,Daño+,Critico+"),
                        buildSkill("Ladron de conjuros", null, null, "inmediatamente despues de que una criatura lance un conjuro que te tenga como objetivo o incluya tu area, puedes usar tu reaccion para anular su efecto sobre ti y robar temporalmente el conocimiento de ese conjuro.", "CPicaro;17,EmbaucadorArcano,Conjuro,Reaccion"),
                        buildSkill("Elusivo", null, null, "ninguna tirada de ataque hecha contra ti tendra ventaja mientras no estes incapacitado.", "CPicaro;18,Defensa"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CPicaro;19,MejoraCaracteristica"),
                        buildSkill("Golpe de suerte", null, "convierte un fallo en exito", "puedes transformar un ataque fallido en impacto o una prueba fallida en un 20 natural.", "CPicaro;20,Pruebas,Ataque+"),
                        buildSkill("Conjuro de hechicero", null, "CAR para conjuros; foco: foco arcano", "accedes a la magia innata del hechicero y usas carisma para lanzar tus conjuros.", "CHechicero;1,Conjuro,Carisma"),
                        buildSkill("Origen sobrenatural", null, null, "eliges el origen de tu poder. Puedes manifestar un linaje dracónico o magia salvaje.", "CHechicero;1,Subclase"),
                        buildSkill("Ancestro draconico", null, null, "eliges un tipo de dragón ancestral que determina tus afinidades de daño futuras; además aprendes dracónico y destacas al tratar con dragones.", "CHechicero;1,Draconico,Dragon,Idioma"),
                        buildSkill("Resiliencia draconica", null, "+1 PG por nivel; CA 13 + DES sin armadura", "tu herencia draconica refuerza tu cuerpo con mas aguante y escamas protectoras.", "CHechicero;1,Draconico,Defensa,Constitucion"),
                        buildSkill("Fuente de magia", null, "puntos de hechiceria = nivel indicado", "obtienes puntos de hechiceria para crear espacios de conjuro o convertir espacios en puntos.", "CHechicero;2,Hechiceria,Conjuro"),
                        buildSkill("Metamagia", null, "2 opciones al 3; otra al 10 y 17", "aprendes a modificar el alcance, duracion, objetivos o forma de tus conjuros usando puntos de hechiceria.", "CHechicero;3,Metamagia,Conjuro"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CHechicero;4,MejoraCaracteristica"),
                        buildSkill("Afinidad elemental", null, "+CAR a una tirada de dano del tipo de tu dragon; 1 punto para resistencia", "tus conjuros del tipo asociado a tu linaje son mas intensos y puedes ganar resistencia temporal a ese tipo de dano.", "CHechicero;6,Draconico,Daño+,Resistencia,Carisma"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CHechicero;8,MejoraCaracteristica"),
                        buildSkill("Metamagia", null, "+1 opcion", "aprendes una opcion adicional de metamagia.", "CHechicero;10,Metamagia,Conjuro"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CHechicero;12,MejoraCaracteristica"),
                        buildSkill("Alas draconicas", null, "velocidad de vuelo = tu velocidad", "puedes manifestar alas de dragon y obtener velocidad de vuelo mientras no lleves armadura incompatible.", "CHechicero;14,Draconico,Vuelo,Movimiento"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CHechicero;16,MejoraCaracteristica"),
                        buildSkill("Metamagia", null, "+1 opcion", "aprendes una nueva opcion de metamagia.", "CHechicero;17,Metamagia,Conjuro"),
                        buildSkill("Presencia draconica", null, "5 puntos de hechiceria; aura de miedo o fascinacion", "puedes irradiar majestuosidad draconica para hechizar o asustar a enemigos hostiles cercanos.", "CHechicero;18,Draconico,Control,Miedo,Hechizado"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CHechicero;19,MejoraCaracteristica"),
                        buildSkill("Restauracion sobrenatural", null, "recuperas 4 puntos de hechiceria en descanso corto", "cada descanso corto te devuelve parte de tu reserva de hechiceria.", "CHechicero;20,Hechiceria,Descanso"),
                        buildSkill("Patrono sobrenatural", null, null, "eliges la fuente de tu pacto. Entre las opciones disponibles están el señor feérico, el infernal y el primigenio.", "CBrujo;1,Subclase"),
                        buildSkill("Magia de pacto", null, "CAR para conjuros; espacios se recuperan en descanso corto", "tu magia usa pocos espacios pero se recargan rapido y todos comparten el mismo nivel.", "CBrujo;1,Conjuro,Carisma,Descanso"),
                        buildSkill("Bendicion del oscuro", null, "PG temporales = CAR + nivel de brujo", "cuando reduces a un enemigo hostil a 0 puntos de golpe, obtienes puntos de golpe temporales.", "CBrujo;1,Infernal,Supervivencia,Curacion"),
                        buildSkill("Invocaciones misticas", null, null, "aprendes invocaciones que alteran tus capacidades con efectos permanentes o lanzamientos especiales.", "CBrujo;2,Invocacion"),
                        buildSkill("Don del pacto", null, null, "eliges entre pacto de la cadena, la hoja o el tomo para definir una parte central de tu estilo.", "CBrujo;3,Pacto"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CBrujo;4,MejoraCaracteristica"),
                        buildSkill("Suerte del oscuro", null, "1d10 a una prueba o salvacion", "puedes invocar a tu patron para sumar un d10 a una prueba de caracteristica o salvacion despues de ver la tirada.", "CBrujo;6,Infernal,Pruebas,Salvacion"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CBrujo;8,MejoraCaracteristica"),
                        buildSkill("Resistencia infernal", null, "eliges 1 tipo de dano por descanso", "al terminar un descanso eliges un tipo de dano al que resistes hasta cambiarlo de nuevo.", "CBrujo;10,Infernal,Resistencia"),
                        buildSkill("Arcano mistico (6)", null, "1 conjuro de nivel 6 por descanso largo", "aprendes un conjuro de nivel 6 que puedes lanzar una vez por descanso largo sin gastar espacios de magia de pacto.", "CBrujo;11,Conjuro,ArcanoMistico"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CBrujo;12,MejoraCaracteristica"),
                        buildSkill("Arcano mistico (7)", null, "1 conjuro de nivel 7 por descanso largo", "obtienes un conjuro de nivel 7 utilizable una vez por descanso largo.", "CBrujo;13,Conjuro,ArcanoMistico"),
                        buildSkill("Arrojar al infierno", null, "10d10 psiquico al volver si no es infernal", "cuando golpeas a una criatura puedes desterrarla brevemente a una vision infernal devastadora.", "CBrujo;14,Infernal,Control,Daño+"),
                        buildSkill("Arcano mistico (8)", null, "1 conjuro de nivel 8 por descanso largo", "obtienes un conjuro de nivel 8 utilizable una vez por descanso largo.", "CBrujo;15,Conjuro,ArcanoMistico"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CBrujo;16,MejoraCaracteristica"),
                        buildSkill("Arcano mistico (9)", null, "1 conjuro de nivel 9 por descanso largo", "obtienes un conjuro de nivel 9 utilizable una vez por descanso largo.", "CBrujo;17,Conjuro,ArcanoMistico"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CBrujo;19,MejoraCaracteristica"),
                        buildSkill("Maestro eldritch", null, "recuperas todos los espacios tras 1 minuto de suplica", "puedes pedir ayuda a tu patron para restaurar todos tus espacios de magia de pacto.", "CBrujo;20,Conjuro,Descanso"),
                        buildSkill("Conjuro de mago", null, "INT para conjuros; foco: foco arcano", "dominas el lanzamiento de conjuros arcanos mediante estudio y memoria.", "CMago;1,Conjuro,Inteligencia"),
                        buildSkill("Libro de conjuros", null, "empiezas con 6 conjuros de nivel 1", "tu grimorio contiene los conjuros que conoces y puedes ampliarlo con aprendizaje y copia.", "CMago;1,Conjuro,Grimorio"),
                        buildSkill("Recuperacion arcana", null, "recuperas espacios con nivel total <= la mitad de tu nivel", "una vez al dia, tras un descanso corto, recuperas parte de tu energia magica.", "CMago;1,Conjuro,Descanso"),
                        buildSkill("Tradicion arcana", null, null, "eliges una escuela de magia. Entre las opciones disponibles están abjuración, conjuración, adivinación, encantamiento, evocación, ilusión, nigromancia y transmutación.", "CMago;2,Subclase"),
                        buildSkill("Erudito de evocacion", null, "copiar conjuros de evocacion cuesta la mitad", "reducen a la mitad el tiempo y el oro necesarios para copiar conjuros de evocacion en tu libro.", "CMago;2,Evocacion,Grimorio"),
                        buildSkill("Esculpir conjuros", null, null, "puedes proteger a criaturas visibles dentro de tus conjuros de evocacion para que eviten el peor efecto.", "CMago;2,Evocacion,Conjuro,Apoyo"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CMago;4,MejoraCaracteristica"),
                        buildSkill("Truco potente", null, null, "tus trucos ofensivos siguen afectando parcialmente a objetivos que superan su salvacion.", "CMago;6,Evocacion,Truco,Daño+"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CMago;8,MejoraCaracteristica"),
                        buildSkill("Evocacion potenciada", null, "+INT a una tirada de dano de evocacion", "anades tu modificador de inteligencia a una tirada de dano de un conjuro de evocacion de mago.", "CMago;10,Evocacion,Daño+,Inteligencia"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CMago;12,MejoraCaracteristica"),
                        buildSkill("Sobrecanalizar", null, "maximizas dano de conjuros de nivel 1-5", "puedes lanzar ciertos conjuros ofensivos de forma sobrecargada para infligir su dano maximo, a costa de desgaste si repites.", "CMago;14,Evocacion,Daño+"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CMago;16,MejoraCaracteristica"),
                        buildSkill("Dominio de conjuros", null, "1 conjuro de nivel 1 y 1 de nivel 2 a voluntad", "eliges conjuros menores que puedes lanzar repetidamente sin gastar espacios, siempre que los tengas preparados.", "CMago;18,Conjuro"),
                        buildSkill("Mejora de puntuación de característica", null, null, "puedes aumentar una característica en 2 puntos, o dos características en 1 punto cada una, respetando el máximo habitual.", "CMago;19,MejoraCaracteristica"),
                        buildSkill("Conjuros distintivos", null, "2 conjuros de nivel 3 con 1 uso gratis por descanso corto o largo", "dominas dos conjuros de nivel 3 que siempre tienes preparados y puedes lanzar con especial facilidad.", "CMago;20,Conjuro")));

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
            String imagen,
            String formula,
            String descripcion,
            String tags
    ) {
        return Habilidad.builder()
                .nombre(nombre)
                .imagen(imagen)
                .formula(formula)
                .descripcion(descripcion)
                .tags(tags)
                .build();
    }

    private SpellSeed buildSpellSeedDetailed(
            String nombre,
            String formula,
            String descripcion,
            String tags,
            String tiempoLanzamiento,
            String alcance,
            String componentes,
            String duracion,
            String formulaDado,
            String escalado,
            String... classIds
    ) {
        return new SpellSeed(
                nombre,
                formula,
                descripcion,
                buildSpellTags(tags, tiempoLanzamiento, alcance, componentes, duracion, formulaDado, escalado, classIds)
        );
    }

    private Objeto buildInstrumentSeed(String nombre) {
        return buildInitialObject(
                appendTags(DND_INSTRUMENT_CATALOG_TAG, DND_TOOL_COMPETENCY_CATALOG_TAG),
                nombre,
                null,
                "**Instrumento musical** disponible para elecciones iniciales y trasfondos de DnD.",
                TipoObjeto.MISCELANEO
        );
    }

    private Objeto buildGameSeed(String nombre) {
        return buildInitialObject(
                appendTags(DND_GAME_CATALOG_TAG, DND_TOOL_COMPETENCY_CATALOG_TAG),
                nombre,
                null,
                "**Juego de mesa o azar** disponible para elecciones de trasfondo en DnD.",
                TipoObjeto.MISCELANEO
        );
    }

    private Objeto buildArtisanToolSeed(String nombre) {
        return buildInitialObject(
                appendTags(DND_ARTISAN_TOOL_CATALOG_TAG, DND_TOOL_COMPETENCY_CATALOG_TAG),
                nombre,
                null,
                "**Herramienta de artesano** disponible para elecciones de raza y trasfondo en DnD.",
                TipoObjeto.MISCELANEO
        );
    }

    private Objeto buildArmorSeed(String indice, String nombre, String formula, String descripcion) {
        return buildInitialObject(indice, nombre, formula, descripcion, TipoObjeto.ARMADURA);
    }

    private Objeto buildEquipmentSeed(String indice, String nombre, String formula, String descripcion, TipoObjeto tipoObjeto) {
        if (tipoObjeto == TipoObjeto.ARMA) {
            indice = appendTags(indice, DND_WEAPON_ARMOR_COMPETENCY_CATALOG_TAG);
        }
        return buildInitialObject(indice, nombre, formula, descripcion, tipoObjeto);
    }

    private Objeto buildCompetencyCatalogSeed(String indice, String nombre, String descripcion) {
        return buildInitialObject(indice, nombre, null, descripcion, TipoObjeto.OBJETO_INTERNO);
    }

    private String appendTags(String indice, String... extraTags) {
        List<String> tags = new ArrayList<>();
        if (indice != null && !indice.isBlank()) {
            for (String tag : indice.split(",")) {
                String trimmed = tag.trim();
                if (!trimmed.isBlank()) {
                    tags.add(trimmed);
                }
            }
        }

        for (String extraTag : extraTags) {
            if (extraTag == null || extraTag.isBlank()) {
                continue;
            }
            if (!tags.contains(extraTag)) {
                tags.add(extraTag);
            }
        }

        return String.join(",", tags);
    }


    private String buildSpellTags(
            String baseTags,
            String tiempoLanzamiento,
            String alcance,
            String componentes,
            String duracion,
            String formulaDado,
            String escalado,
            String... classIds
    ) {
        List<String> tags = new ArrayList<>();
        if (baseTags != null && !baseTags.isBlank()) {
            for (String tag : baseTags.split(",")) {
                String trimmed = tag.trim();
                if (!trimmed.isBlank()) {
                    tags.add(trimmed);
                }
            }
        }

        appendSpellMetadataTag(tags, "TiempoLanzamiento", tiempoLanzamiento);
        appendSpellMetadataTag(tags, "Alcance", alcance);
        appendSpellMetadataTag(tags, "Componentes", componentes);
        appendSpellMetadataTag(tags, "Duracion", duracion);
        appendSpellMetadataTag(tags, "FormulaDado", formulaDado);
        appendSpellMetadataTag(tags, "Escalado", escalado);

        for (String classId : classIds) {
            if (classId == null || classId.isBlank()) {
                continue;
            }
            tags.add("ClaseInicial;" + classId.trim());
        }

        return String.join(",", tags);
    }

    private void appendSpellMetadataTag(List<String> tags, String key, String value) {
        if (value == null || value.isBlank()) {
            return;
        }

        String sanitizedValue = value
                .trim()
                .replace(',', ' ')
                .replace(';', ':');
        tags.add(key + ";" + sanitizedValue);
    }

    private void seedSpellCatalogEntries(HabilidadRepository habilidadRepository, List<SpellSeed> habilidades) {
        for (SpellSeed habilidad : habilidades) {
            Habilidad existente = habilidadRepository.findByNombreIgnoreCaseOrderByIdAsc(habilidad.nombre()).stream()
                    .findFirst()
                    .orElse(null);

            if (existente == null) {
                habilidadRepository.save(buildSkill(
                        habilidad.nombre(),
                        null,
                        habilidad.formula(),
                        habilidad.descripcion(),
                        habilidad.tags()
                ));
                continue;
            }

            existente.setNombre(habilidad.nombre());
            existente.setFormula(habilidad.formula());
            existente.setDescripcion(habilidad.descripcion());
            existente.setTags(habilidad.tags());
            habilidadRepository.save(existente);
        }
    }

    private void seedSkillCatalogEntries(HabilidadRepository habilidadRepository, List<Habilidad> habilidades) {
        List<Habilidad> existentes = new ArrayList<>(habilidadRepository.findAll());

        for (Habilidad habilidad : habilidades) {
            Habilidad existente = findMatchingSkillCatalogEntry(existentes, habilidad);

            if (existente == null) {
                Habilidad guardada = habilidadRepository.save(habilidad);
                existentes.add(guardada);
                continue;
            }

            existente.setNombre(habilidad.getNombre());
            existente.setImagen(habilidad.getImagen());
            existente.setFormula(habilidad.getFormula());
            existente.setDescripcion(habilidad.getDescripcion());
            existente.setTags(habilidad.getTags());
            habilidadRepository.save(existente);
        }
    }

    private Habilidad findMatchingSkillCatalogEntry(List<Habilidad> existentes, Habilidad objetivo) {
        String normalizedTargetName = TagUtils.normalizeText(objetivo.getNombre());
        String targetIdentity = extractCatalogIdentity(objetivo.getTags());

        return existentes.stream()
                .filter(candidata -> TagUtils.normalizeText(candidata.getNombre()).equals(normalizedTargetName))
                .filter(candidata -> extractCatalogIdentity(candidata.getTags()).equals(targetIdentity))
                .findFirst()
                .orElse(null);
    }

    private String extractCatalogIdentity(String tags) {
        if (tags == null || tags.isBlank()) {
            return "";
        }

        String[] parts = tags.split(",");
        List<String> identityParts = new ArrayList<>();
        for (String part : parts) {
            String trimmed = part == null ? "" : part.trim();
            if (trimmed.isBlank()) {
                continue;
            }

            identityParts.add(TagUtils.normalizeText(trimmed));
            if (identityParts.size() == 2) {
                break;
            }
        }

        return String.join("|", identityParts);
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

    private void removeLegacySpellCatalogEntries(HabilidadRepository habilidadRepository) {
        List<Habilidad> legacyEntries = habilidadRepository.findAll().stream()
                .filter(this::isLegacySpellCatalogEntry)
                .toList();
        if (!legacyEntries.isEmpty()) {
            habilidadRepository.deleteAll(legacyEntries);
        }
    }

    private boolean isLegacySpellCatalogEntry(Habilidad habilidad) {
        String tags = habilidad.getTags();
        if (tags == null || tags.isBlank()) {
            return false;
        }

        boolean hasFormula = habilidad.getFormula() != null && !habilidad.getFormula().isBlank();
        boolean hasDescription = habilidad.getDescripcion() != null && !habilidad.getDescripcion().isBlank();
        if (hasFormula || hasDescription) {
            return false;
        }

        String normalizedTags = tags.toLowerCase();
        boolean isSpellOrCantrip = normalizedTags.contains("hechizo;") || TagUtils.normalizeText(tags).contains("truco");
        if (!isSpellOrCantrip) {
            return false;
        }

        if (normalizedTags.contains("claseinicial;")) {
            return false;
        }

        return TagUtils.extractClasses(tags).isEmpty();
    }

    private void removeSpellCatalogEntriesByName(HabilidadRepository habilidadRepository, List<String> nombres) {
        for (String nombre : nombres) {
            if (nombre == null || nombre.isBlank()) {
                continue;
            }

            List<Habilidad> coincidencias = habilidadRepository.findByNombreIgnoreCaseOrderByIdAsc(nombre);
            if (!coincidencias.isEmpty()) {
                habilidadRepository.deleteAll(coincidencias);
            }
        }
    }

    private void seedInstrumentCatalogEntries(ObjetoRepository objetoRepository, List<Objeto> instrumentos) {
        for (Objeto instrumento : instrumentos) {
            Objeto existente = objetoRepository.findByNombreIgnoreCaseOrderByIdAsc(instrumento.getNombre()).stream()
                    .findFirst()
                    .orElse(null);

            if (existente == null) {
                objetoRepository.save(instrumento);
                continue;
            }

            existente.setIndice(instrumento.getIndice());
            existente.setFormula(instrumento.getFormula());
            existente.setDescripcion(instrumento.getDescripcion());
            existente.setTipoObjeto(instrumento.getTipoObjeto());
            objetoRepository.save(existente);
        }
    }

    private void seedEquipmentCatalogEntries(ObjetoRepository objetoRepository, List<Objeto> objetos) {
        for (Objeto objeto : objetos) {
            List<Objeto> coincidencias = objetoRepository.findByNombreIgnoreCaseOrderByIdAsc(objeto.getNombre());
            Objeto existente = coincidencias.stream().findFirst().orElse(null);

            if (existente == null) {
                objetoRepository.save(objeto);
                continue;
            }

            existente.setIndice(objeto.getIndice());
            existente.setFormula(objeto.getFormula());
            existente.setDescripcion(objeto.getDescripcion());
            existente.setTipoObjeto(objeto.getTipoObjeto());
            objetoRepository.save(existente);

            if (coincidencias.size() > 1) {
                objetoRepository.deleteAll(coincidencias.subList(1, coincidencias.size()));
            }
        }
    }

    private record SpellSeed(
            String nombre,
            String formula,
            String descripcion,
            String tags
    ) {}

    private Objeto buildInitialObject(
            String indice,
            String nombre,
            String formula,
            String descripcion,
            TipoObjeto tipoObjeto
    ) {
        return Objeto.builder()
            .indice(indice == null || indice.isBlank() ? "VISIBILIDAD;oficial" : indice + ",VISIBILIDAD;oficial")
                .nombre(nombre)
                .formula(formula)
                .descripcion(descripcion)
                .tipoObjeto(tipoObjeto)
                .build();
    }
}