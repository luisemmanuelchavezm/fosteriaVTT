package com.fosteriaVTT.fosteriaVTT_backend.configuration;

import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.HabilidadRepository;
import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

@Configuration
public class DndSpellSeeder {

    private record SpellSeed(
            String nombre,
            String formula,
            String descripcion,
            String tags
    ) {}

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
                habilidadRepository.save(SeederUtils.buildSkill(
                        habilidad.nombre(),
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
}
