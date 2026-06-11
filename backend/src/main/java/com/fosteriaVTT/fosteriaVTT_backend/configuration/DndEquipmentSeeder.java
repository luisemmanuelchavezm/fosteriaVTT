package com.fosteriaVTT.fosteriaVTT_backend.configuration;

import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.HabilidadRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.Objeto;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.ObjetoRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.TipoObjeto;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.PersonajeRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.PersonajeService;
import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

@Configuration
public class DndEquipmentSeeder {

    private static final String DND_ARTISAN_TOOL_CATALOG_TAG = "DND,HerramientaArtesano,CatalogoHerramientasArtesanoDnd";
    private static final String DND_GAME_CATALOG_TAG = "DND,Juego,CatalogoJuegosDnd";
    private static final String DND_INSTRUMENT_CATALOG_TAG = "DND,InstrumentoMusical,CatalogoInstrumentosDnd";
    private static final String DND_WEAPON_ARMOR_COMPETENCY_CATALOG_TAG = "DND,Competencia,ArmaArmadura,CatalogoCompetenciasArmasArmadurasDnd";
    private static final String DND_TOOL_COMPETENCY_CATALOG_TAG = "DND,Competencia,Herramienta,CatalogoCompetenciasHerramientasDnd";

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
                SeederUtils.buildSkill("Acrobacias", null, "Pruebas de equilibrio, volteretas y maniobras acrobaticas.", "DND,CatalogoHabilidadDnd;acrobacias"),
                SeederUtils.buildSkill("Arcano", null, "Conocimiento de magia, teoria arcana y tradiciones misticas.", "DND,CatalogoHabilidadDnd;arcano"),
                SeederUtils.buildSkill("Atletismo", null, "Pruebas de fuerza fisica, salto, escalada y natacion.", "DND,CatalogoHabilidadDnd;atletismo"),
                SeederUtils.buildSkill("Engaño", null, "Mentir, fingir y manipular a otros con falsedades.", "DND,CatalogoHabilidadDnd;engano"),
                SeederUtils.buildSkill("Historia", null, "Recordar hechos, culturas y personajes del pasado.", "DND,CatalogoHabilidadDnd;historia"),
                SeederUtils.buildSkill("Interpretación", null, "Actuar, cantar, tocar instrumentos o entretener a un publico.", "DND,CatalogoHabilidadDnd;interpretacion"),
                SeederUtils.buildSkill("Intimidación", null, "Imponer respeto o miedo mediante presencia, amenazas o autoridad.", "DND,CatalogoHabilidadDnd;intimidacion"),
                SeederUtils.buildSkill("Investigación", null, "Examinar pistas, deducir patrones y sacar conclusiones.", "DND,CatalogoHabilidadDnd;investigacion"),
                SeederUtils.buildSkill("Juego de manos", null, "Trucos de destreza manual, hurtos y manipulacion precisa.", "DND,CatalogoHabilidadDnd;juegodemanos"),
                SeederUtils.buildSkill("Medicina", null, "Diagnosticar heridas, estabilizar y tratar afecciones fisicas.", "DND,CatalogoHabilidadDnd;medicina"),
                SeederUtils.buildSkill("Naturaleza", null, "Conocimiento de fauna, flora, terreno y fenomenos naturales.", "DND,CatalogoHabilidadDnd;naturaleza"),
                SeederUtils.buildSkill("Percepción", null, "Detectar detalles, sonidos, movimientos o peligros cercanos.", "DND,CatalogoHabilidadDnd;percepcion"),
                SeederUtils.buildSkill("Perspicacia", null, "Leer emociones, intenciones y mentiras en los demas.", "DND,CatalogoHabilidadDnd;perspicacia"),
                SeederUtils.buildSkill("Persuasión", null, "Convencer, negociar o ganarse la buena disposicion de otros.", "DND,CatalogoHabilidadDnd;persuasion"),
                SeederUtils.buildSkill("Religión", null, "Conocimiento sobre dioses, cultos, ritos y teologia.", "DND,CatalogoHabilidadDnd;religion"),
                SeederUtils.buildSkill("Sigilo", null, "Ocultarse, moverse sin ser visto y evitar llamar la atencion.", "DND,CatalogoHabilidadDnd;sigilo"),
                SeederUtils.buildSkill("Supervivencia", null, "Rastrear, orientarse y resistir en entornos hostiles.", "DND,CatalogoHabilidadDnd;supervivencia"),
                SeederUtils.buildSkill("Trato con animales", null, "Calmar, dirigir o entender el comportamiento de animales.", "DND,CatalogoHabilidadDnd;tratoconanimales"),
                SeederUtils.buildSkill("Dominio divino", null, "Al escoger este dominio en el nivel 1 obtienes conjuros de dominio y otras aptitudes especiales ligadas a esa esfera divina.", "CClerigo;1,Subclase"),
                SeederUtils.buildSkill("Conjuros de dominio: conocimiento", "Identificar, Orden imperiosa", "Conjuros de dominio: Identificar, Orden imperiosa. Cada dominio tiene una lista de conjuros asociados. Una vez obtienes un conjuro de dominio, siempre lo tienes preparado y no cuenta para el número de conjuros que puedes preparar cada día.", "CClerigo;1,Knowledge,Conjuro"),
                SeederUtils.buildSkill("Bendiciones del conocimiento", "2 idiomas y competencia/pericia en 2 habilidades", "Aprendes dos idiomas a tu elección. Además, escoges dos de estas habilidades: Arcano, Historia, Naturaleza o Religión. Tu bonificador por competencia se duplica en cualquier prueba hecha con las elegidas.", "CClerigo;1,Knowledge,Habilidades,Idioma"),
                SeederUtils.buildSkill("Competencia adicional", "armadura pesada", "También obtienes competencia con armadura pesada.", "CClerigo;1,Vida,ArmaduraPesada"),
                SeederUtils.buildSkill("Conjuros de dominio: vida", "Bendición, Curar heridas", "Cada dominio tiene una lista de conjuros asociados. Una vez obtienes un conjuro de dominio, siempre lo tienes preparado y no cuenta para el número de conjuros que puedes preparar cada día.", "CClerigo;1,Vida,Conjuro"),
                SeederUtils.buildSkill("Discipulo de la vida", "+2 + nivel del conjuro a la curación", "Tus conjuros curativos son más efectivos. Siempre que uses un conjuro de nivel 1 o superior para devolver puntos de golpe a una criatura, esta recupera puntos adicionales iguales a 2 + el nivel del conjuro.", "CClerigo;1,Vida,Curacion"),
                SeederUtils.buildSkill("Conjuros de dominio: luz", "Manos ardientes, Fuego feérico", "Cada dominio tiene una lista de conjuros asociados. Una vez obtienes un conjuro de dominio, siempre lo tienes preparado y no cuenta para el número de conjuros que puedes preparar cada día.", "CClerigo;1,Luz,Conjuro"),
                SeederUtils.buildSkill("Truco adicional de luz", "truco Luz", "Aprendes el truco Luz si todavía no lo conoces.", "CClerigo;1,Luz,Truco"),
                SeederUtils.buildSkill("Llamarada protectora", "Reacción: desventaja a un ataque visible a 30 pies", "Puedes usar tu reacción para imponer desventaja a una tirada de ataque hecha por una criatura que puedas ver dentro de 30 pies, siempre que el atacante también pueda verte. Debes decidirlo antes de saber si el ataque impacta o falla.", "CClerigo;1,Luz,Reaccion,Defensa"),
                SeederUtils.buildSkill("Conjuros de dominio: naturaleza", "Hablar con los animales, Enmarañar", "Cada dominio tiene una lista de conjuros asociados. Una vez obtienes un conjuro de dominio, siempre lo tienes preparado y no cuenta para el número de conjuros que puedes preparar cada día.", "CClerigo;1,Naturaleza,Conjuro"),
                SeederUtils.buildSkill("Acolito de la naturaleza", "1 truco de druida y 1 habilidad", "Aprendes un truco de druida a tu elección. Además, obtienes competencia en una de las siguientes habilidades: Trato con animales, Naturaleza o Supervivencia.", "CClerigo;1,Naturaleza,Habilidades"),
                SeederUtils.buildSkill("Competencia adicional de naturaleza", "armadura pesada", "También obtienes competencia con armadura pesada.", "CClerigo;1,Naturaleza,ArmaduraPesada"),
                SeederUtils.buildSkill("Conjuros de dominio: tempestad", "Nube de niebla, Onda atronadora", "Cada dominio tiene una lista de conjuros asociados. Una vez obtienes un conjuro de dominio, siempre lo tienes preparado y no cuenta para el número de conjuros que puedes preparar cada día.", "CClerigo;1,Tempestad,Conjuro"),
                SeederUtils.buildSkill("Competencias adicionales de tempestad", "armaduras pesadas y armas marciales", "Obtienes competencia con armaduras pesadas y armas marciales.", "CClerigo;1,Tempestad,ArmaduraPesada,ArmaMarcial"),
                SeederUtils.buildSkill("Ira de la tormenta", "Reacción: 2d8 rayo o trueno; DES mitad", "Cuando una criatura a 5 pies de ti que puedas ver te impacta con un ataque, puedes usar tu reacción para obligarla a hacer una salvación de Destreza. Sufre 2d8 de daño de rayo o trueno si falla, o la mitad si tiene éxito.", "CClerigo;1,Tempestad,Reaccion,Daño+"),
                SeederUtils.buildSkill("Conjuros de dominio: engaño", "Hechizar persona, Disfrazarse", "Cada dominio tiene una lista de conjuros asociados. Una vez obtienes un conjuro de dominio, siempre lo tienes preparado y no cuenta para el número de conjuros que puedes preparar cada día.", "CClerigo;1,Engano,Conjuro"),
                SeederUtils.buildSkill("Bendicion del embaucador", "Acción: ventaja en Sigilo durante 1 hora", "Puedes usar tu acción para tocar a una criatura voluntaria distinta de ti y darle ventaja en las pruebas de Destreza (Sigilo) durante 1 hora o hasta que vuelvas a usar este rasgo.", "CClerigo;1,Engano,Sigilo,Apoyo"),
                SeederUtils.buildSkill("Conjuros de dominio: guerra", "Favor divino, Escudo de fe", "Cada dominio tiene una lista de conjuros asociados. Una vez obtienes un conjuro de dominio, siempre lo tienes preparado y no cuenta para el número de conjuros que puedes preparar cada día.", "CClerigo;1,Guerra,Conjuro"),
                SeederUtils.buildSkill("Competencias adicionales de guerra", "armaduras pesadas y armas marciales", "Obtienes competencia con armaduras pesadas y armas marciales.", "CClerigo;1,Guerra,ArmaduraPesada,ArmaMarcial"),
                SeederUtils.buildSkill("Sacerdote guerrero", "ataque como acción adicional, usos = mod. SAB", "Cuando usas la acción de Atacar, puedes hacer un ataque con arma como acción adicional un número de veces igual a tu modificador de Sabiduría por descanso largo.", "CClerigo;1,Guerra,Ataque+,AccionExtra"),
                SeederUtils.buildSkill("Preservar la vida", "cura total = 5 x nivel de clerigo", "Como acción, presentas tu símbolo sagrado y evocas energía curativa capaz de restaurar un total de puntos de golpe igual a cinco veces tu nivel de clérigo. Esta curación se reparte entre criaturas a 30 pies de ti y no puede dejar a ninguna por encima de la mitad de sus puntos de golpe máximos.", "CClerigo;2,Vida,CanalDivino,Curacion"),
                SeederUtils.buildSkill("Sanador bendito", "te curas 2 + nivel del conjuro", "Los conjuros de curación que lanzas sobre otros también te sostienen. Cuando lanzas un conjuro de nivel 1 o superior para devolver puntos de golpe a una criatura distinta de ti, recuperas 2 + el nivel del conjuro.", "CClerigo;6,Vida,Curacion"),
                SeederUtils.buildSkill("Golpe divino", "+1d8 radiante al golpear; +2d8 al 14", "Una vez en cada uno de tus turnos, cuando golpeas a una criatura con un ataque con arma, puedes hacer que el ataque inflija 1d8 de daño radiante extra. Cuando alcanzas el nivel 14, el daño extra aumenta a 2d8.", "CClerigo;8,Vida,Daño+,Radiante"),
                SeederUtils.buildSkill("Curacion suprema", "maximizas los dados de curación", "Cuando normalmente tirarías uno o más dados para restaurar puntos de golpe con un conjuro, usas en su lugar el valor máximo posible de cada dado.", "CClerigo;17,Vida,Curacion"),
                SeederUtils.buildSkill("Juramento sagrado", null, "Cuando alcanzas el nivel 3 haces un juramento que te vincula para siempre en tu búsqueda sagrada. Hasta ese momento has sido una promesa en preparación; ahora escoges el ideal que regirá tu causa. Las opciones disponibles aquí son devoción, antiguos y venganza.", "CPaladin;3,Subclase"),
                SeederUtils.buildSkill("Conjuros de juramento", "Protección contra el bien y el mal, Santuario", "Obtienes conjuros de juramento en los niveles indicados de paladín. Estos conjuros siempre están preparados y no cuentan para el número de conjuros que puedes preparar cada día.", "CPaladin;3,Devocion,Conjuro"),
                SeederUtils.buildSkill("Arma sagrada", "+CAR a tiradas de ataque durante 1 minuto", "Como acción, puedes imbuir un arma que sostengas con energía positiva usando tu Canalizar Divinidad. Durante 1 minuto sumas tu modificador de Carisma a las tiradas de ataque hechas con esa arma y emite luz brillante en un radio de 20 pies y luz tenue 20 pies más. El efecto termina si quedas inconsciente o si el arma deja de estar en tu mano.", "CPaladin;3,Devocion,CanalDivino,Ataque+"),
                SeederUtils.buildSkill("Expulsar lo impio", null, "Como acción, presentas tu símbolo sagrado y pronuncias una plegaria que condena a infernales y no muertos. Cada uno que pueda verte u oírte y falle su salvación de Sabiduría queda expulsado durante 1 minuto o hasta recibir daño.", "CPaladin;3,Devocion,CanalDivino,Control"),
                SeederUtils.buildSkill("Conjuros de juramento", "Golpe apresador, Hablar con los animales", "Obtienes conjuros de juramento en los niveles indicados de paladín. Estos conjuros siempre están preparados y no cuentan para el número de conjuros que puedes preparar cada día.", "CPaladin;3,Antiguos,Conjuro"),
                SeederUtils.buildSkill("Ira de la naturaleza", "apresa a un objetivo con una salvacion de Fuerza o Destreza", "Puedes usar tu Canalizar Divinidad para invocar fuerzas primigenias que aprisionen a una criatura cercana. El objetivo debe superar una salvación de Fuerza o Destreza o quedar apresado por enredaderas espectrales.", "CPaladin;3,Antiguos,CanalDivino,Control"),
                SeederUtils.buildSkill("Expulsar infieles", "expulsa feericos e infernales durante 1 minuto", "Presentas tu símbolo sagrado y pronuncias antiguas palabras de censura contra feéricos e infernales. Cada uno que falle su salvación de Sabiduría queda expulsado durante 1 minuto o hasta recibir daño.", "CPaladin;3,Antiguos,CanalDivino,Control"),
                SeederUtils.buildSkill("Conjuros de juramento", "Marca del cazador, Perdicion", "Obtienes conjuros de juramento en los niveles indicados de paladín. Estos conjuros siempre están preparados y no cuentan para el número de conjuros que puedes preparar cada día.", "CPaladin;3,Venganza,Conjuro"),
                SeederUtils.buildSkill("Abjurar enemigo", "asusta o ralentiza a un objetivo", "Como acción, presentas tu símbolo sagrado y pronuncias un voto de condena contra una criatura visible a 60 pies. Si falla su salvación de Sabiduría queda asustada y su velocidad se reduce a 0; si tiene éxito, su velocidad queda reducida a la mitad durante 1 minuto o hasta que reciba daño.", "CPaladin;3,Venganza,CanalDivino,Control"),
                SeederUtils.buildSkill("Voto de enemistad", "ventaja contra un objetivo durante 1 minuto", "Como acción adicional, puedes pronunciar un voto de enemistad contra una criatura que veas a 10 pies o menos. Durante 1 minuto tienes ventaja en las tiradas de ataque contra ella, o hasta que caiga a 0 puntos de golpe o quede inconsciente.", "CPaladin;3,Venganza,CanalDivino,Ataque+"),
                SeederUtils.buildSkill("Aura de devocion", "inmunidad a hechizado en 10 pies; 30 pies al 18", "Tú y las criaturas amistosas a 10 pies de ti no podéis ser hechizados mientras estés consciente. En el nivel 18 el alcance aumenta a 30 pies.", "CPaladin;7,Devocion,Aura,InmunidadHechizado"),
                SeederUtils.buildSkill("Aura de salvaguarda", "resistencia al daño de conjuros en 10 pies; 30 pies al 18", "Tú y las criaturas amistosas a 10 pies de ti tenéis resistencia al daño causado por conjuros mientras estés consciente. En el nivel 18 el alcance aumenta a 30 pies.", "CPaladin;7,Antiguos,Aura,Resistencia"),
                SeederUtils.buildSkill("Vengador implacable", "te mueves hasta la mitad de tu velocidad tras un ataque de oportunidad", "Cuando impactas a una criatura con un ataque de oportunidad, puedes moverte hasta la mitad de tu velocidad inmediatamente después y como parte de la misma reacción, sin provocar ataques de oportunidad.", "CPaladin;7,Venganza,Reaccion,Movimiento"),
                SeederUtils.buildSkill("Pureza de espiritu", null, "Siempre estás bajo los efectos de Protección contra el bien y el mal.", "CPaladin;15,Devocion,Defensa"),
                SeederUtils.buildSkill("Centinela imperecedero", "si caes a 0 PG vuelves a 1 PG una vez por descanso largo", "Cuando tus puntos de golpe se reducen a 0 y no mueres de forma instantánea, puedes elegir quedar con 1 punto de golpe. Una vez que usas este rasgo, no puedes volver a hacerlo hasta terminar un descanso largo. Además, no sufres ninguno de los inconvenientes de la vejez y no puedes envejecer mágicamente.", "CPaladin;15,Antiguos,Supervivencia,Longevidad"),
                SeederUtils.buildSkill("Espiritu vengativo", "reaccion para atacar al objetivo de tu voto de enemistad", "Cuando una criatura bajo el efecto de tu Voto de enemistad hace un ataque, puedes usar tu reacción para hacer un ataque con arma cuerpo a cuerpo contra esa criatura si está a tu alcance.", "CPaladin;15,Venganza,Reaccion,Ataque+"),
                SeederUtils.buildSkill("Halo sagrado", "1 minuto; 10 de daño radiante por turno a enemigos cercanos", "Como acción, puedes irradiar un aura de luz solar. Durante 1 minuto, luz brillante emana de ti en un radio de 30 pies y luz tenue 30 pies más. Siempre que una criatura enemiga empiece su turno en la luz brillante, recibe 10 de daño radiante. Además, durante ese tiempo tienes ventaja en las salvaciones contra conjuros lanzados por infernales o no muertos.", "CPaladin;20,Devocion,Radiante,Aura,Daño+"),
                SeederUtils.buildSkill("Campeon ancestral", "1 minuto; regeneracion, accion adicional para ciertos conjuros y aura debilitadora", "Puedes asumir la forma de una fuerza antigua de la naturaleza. Durante 1 minuto recuperas 10 puntos de golpe al inicio de cada turno, puedes lanzar conjuros de paladín de lanzamiento de 1 acción como acción adicional y las criaturas enemigas a 10 pies de ti tienen desventaja en las salvaciones contra tus conjuros y opciones de Canalizar Divinidad.", "CPaladin;20,Antiguos,Curacion,Aura,Conjuro"),
                SeederUtils.buildSkill("Angel vengador", "1 hora; alas y aura de amenaza", "Como acción, adoptas la apariencia de un vengador alado. Durante 1 hora obtienes velocidad de vuelo de 60 pies y emites un aura de amenaza de 30 pies. La primera vez que una criatura enemiga entra en esa aura o empieza su turno allí, debe superar una salvación de Sabiduría o quedar asustada durante 1 minuto o hasta recibir daño.", "CPaladin;20,Venganza,Vuelo,Aura,Control"),
                SeederUtils.buildSkill("Jerga de ladrones", null, "Durante tu adiestramiento aprendiste la jerga de ladrones, una mezcla secreta de dialecto, jerga y signos ocultos que te permite transmitir mensajes encubiertos dentro de una conversación aparentemente normal o mediante marcas discretas.", "CPicaro;1,Idioma,Codigo"),
                SeederUtils.buildSkill("Accion astuta", "Desplazarse, retirarse u ocultarse como accion adicional", "A partir del nivel 2, tu rapidez mental y física te permite usar una acción adicional en cada turno de combate. Solo puede emplearse para Desplazarse, Retirarse u Ocultarse.", "CPicaro;2,AccionExtra,Movimiento,Sigilo"),
                SeederUtils.buildSkill("Arquetipo de picaro", null, "En el nivel 3 eliges el arquetipo que da forma a tus métodos. Las opciones disponibles aquí son ladrón, asesino y embaucador arcano.", "CPicaro;3,Subclase"),
                SeederUtils.buildSkill("Manos rapidas", null, "Puedes usar la acción adicional otorgada por Acción astuta para hacer una prueba de Juego de manos, usar tus herramientas de ladrón para desarmar una trampa o abrir una cerradura, o realizar la acción de Utilizar un objeto.", "CPicaro;3,Ladron,AccionExtra"),
                SeederUtils.buildSkill("Balconero", "trepar no cuesta movimiento extra", "Trepar ya no te cuesta movimiento adicional. Además, cuando haces un salto con carrerilla, la distancia que cubres aumenta una cantidad de pies igual a tu modificador de Destreza.", "CPicaro;3,Ladron,Movimiento"),
                SeederUtils.buildSkill("Competencias adicionales", "competencia con utiles para disfrazarse y utiles de envenenador", "Obtienes competencia con el kit de disfraz y el kit de envenenador.", "CPicaro;3,Asesino,Competencia"),
                SeederUtils.buildSkill("Asesinar", "ventaja contra criaturas que aun no han actuado; critico automatico contra sorprendidos", "Tienes ventaja en las tiradas de ataque contra cualquier criatura que todavía no haya actuado en este combate. Además, cualquier impacto que consigas contra una criatura sorprendida es un golpe crítico.", "CPicaro;3,Asesino,Ataque+,Critico+"),
                SeederUtils.buildSkill("Lanzamiento de conjuros", "INT para conjuros; mano de mago obligatoria", "Has aprendido magia para apoyar tus artimañas. Obtienes capacidad para lanzar conjuros usando Inteligencia como característica de conjuro. Debes conocer Mano de mago y la mayoría de tus conjuros conocidos deben ser de encantamiento o ilusión.", "CPicaro;3,EmbaucadorArcano,Conjuro,Inteligencia"),
                SeederUtils.buildSkill("Destreza con mano de mago", "mano invisible; guardar o sacar objetos; abrir cerraduras y desarmar trampas a distancia", "Cuando lanzas Mano de mago puedes hacer la mano invisible y realizar con ella tareas más precisas: guardar o sacar objetos de recipientes llevados por otras criaturas, abrir cerraduras, desarmar trampas a distancia y controlar la mano como acción adicional.", "CPicaro;3,EmbaucadorArcano,Conjuro,AccionExtra"),
                SeederUtils.buildSkill("Sigilo supremo", "Ventaja a sigilo si te mueves a media velocidad o menos", "Tienes ventaja en cualquier prueba de Destreza (Sigilo) si no te mueves más de la mitad de tu velocidad durante el mismo turno.", "CPicaro;9,Ladron,Sigilo"),
                SeederUtils.buildSkill("Pericia en infiltrarse", "creas identidades falsas", "Puedes crear identidades falsas completas para ti mismo, con documentación, historial, profesión y afiliaciones. Debes dedicar siete días y 25 po para establecer una de estas identidades.", "CPicaro;9,Asesino,Infiltracion,Engaño"),
                SeederUtils.buildSkill("Emboscada magica", "desventaja en salvaciones si lanzas oculto", "Si estás escondido de una criatura cuando le lanzas un conjuro, esa criatura tiene desventaja en cualquier tirada de salvación que deba hacer contra el conjuro durante ese turno.", "CPicaro;9,EmbaucadorArcano,Conjuro,Control"),
                SeederUtils.buildSkill("Usar objetos magicos", null, "Ignoras todos los requisitos de clase, raza y nivel en el uso de objetos mágicos.", "CPicaro;13,Ladron,ObjetoMagico"),
                SeederUtils.buildSkill("Impostor", null, "Puedes imitar con precisión el habla, la escritura y el comportamiento de otra persona después de estudiarla al menos durante tres horas. Tus imitaciones solo pueden descubrirse si un observador sospecha y supera una prueba enfrentada.", "CPicaro;13,Asesino,Engaño,Infiltracion"),
                SeederUtils.buildSkill("Embaucador versatil", null, "Como acción adicional en tu turno, puedes designar una criatura a 5 pies de tu Mano de mago. Hasta el final del turno obtienes ventaja en las tiradas de ataque contra esa criatura.", "CPicaro;13,EmbaucadorArcano,Conjuro,Ataque+"),
                SeederUtils.buildSkill("Reflejos de ladron", "2 turnos en la primera ronda si no estas sorprendido", "Eres extraordinariamente veloz al empezar un combate. Si no estás sorprendido, puedes actuar dos veces durante la primera ronda: una en tu iniciativa normal y otra en tu iniciativa menos 10.", "CPicaro;17,Ladron,Iniciativa"),
                SeederUtils.buildSkill("Golpe mortal", null, "Cuando atacas e impactas a una criatura sorprendida, debe hacer una salvación de Constitución. Si falla, el daño del ataque se duplica contra ella.", "CPicaro;17,Asesino,Daño+,Critico+"),
                SeederUtils.buildSkill("Ladron de conjuros", null, "Inmediatamente después de que una criatura te lance un conjuro cuyo objetivo seas tú o que te incluya en su área, puedes usar tu reacción para forzar una salvación con su modificador de conjuro. Si falla, anulas el efecto del conjuro sobre ti y puedes lanzar ese conjuro tú mismo durante las siguientes 8 horas usando tus espacios de conjuro.", "CPicaro;17,EmbaucadorArcano,Conjuro,Reaccion")
        ));
    }

    @Bean
    @Order(7)
    CommandLineRunner syncWeaponAttacksPostSeeder(
            PersonajeRepository personajeRepository,
            ObjetoRepository objetoRepository,
            PersonajeService personajeService
    ) {
        return args -> {
            // Ensure the Bastón object is type ARMA (may have been created as MISCELANEO
            // during character seeding if the equipment catalog hadn't been seeded yet).
            objetoRepository.findByNombreIgnoreCaseOrderByIdAsc("Baston").stream()
                .findFirst()
                .ifPresent(baston -> {
                    if (baston.getTipoObjeto() != TipoObjeto.ARMA) {
                        baston.setTipoObjeto(TipoObjeto.ARMA);
                        objetoRepository.save(baston);
                    }
                });

            // Re-sync weapon attacks for Iria Vael now that the Bastón is ARMA.
            personajeRepository.findByUsuarioUsernameOrderByUsadoDesc("sai").stream()
                .filter(p -> p.getNombre().equalsIgnoreCase("Iria Vael"))
                .findFirst()
                .ifPresent(iria -> personajeService.sincronizarAtaquesArmaPorId(iria.getId()));
        };
    }

    private Objeto buildInstrumentSeed(String nombre) {
        return SeederUtils.buildInitialObject(
                appendTags(DND_INSTRUMENT_CATALOG_TAG, DND_TOOL_COMPETENCY_CATALOG_TAG),
                nombre,
                null,
                "**Instrumento musical** disponible para elecciones iniciales y trasfondos de DnD.",
                TipoObjeto.MISCELANEO
        );
    }

    private Objeto buildGameSeed(String nombre) {
        return SeederUtils.buildInitialObject(
                appendTags(DND_GAME_CATALOG_TAG, DND_TOOL_COMPETENCY_CATALOG_TAG),
                nombre,
                null,
                "**Juego de mesa o azar** disponible para elecciones de trasfondo en DnD.",
                TipoObjeto.MISCELANEO
        );
    }

    private Objeto buildArtisanToolSeed(String nombre) {
        return SeederUtils.buildInitialObject(
                appendTags(DND_ARTISAN_TOOL_CATALOG_TAG, DND_TOOL_COMPETENCY_CATALOG_TAG),
                nombre,
                null,
                "**Herramienta de artesano** disponible para elecciones de raza y trasfondo en DnD.",
                TipoObjeto.MISCELANEO
        );
    }

    private Objeto buildArmorSeed(String indice, String nombre, String formula, String descripcion) {
        return SeederUtils.buildInitialObject(indice, nombre, formula, descripcion, TipoObjeto.ARMADURA);
    }

    private Objeto buildEquipmentSeed(String indice, String nombre, String formula, String descripcion, TipoObjeto tipoObjeto) {
        if (tipoObjeto == TipoObjeto.ARMA) {
            indice = appendTags(indice, DND_WEAPON_ARMOR_COMPETENCY_CATALOG_TAG);
        }
        return SeederUtils.buildInitialObject(indice, nombre, formula, descripcion, tipoObjeto);
    }

    private Objeto buildCompetencyCatalogSeed(String indice, String nombre, String descripcion) {
        return SeederUtils.buildInitialObject(indice, nombre, null, descripcion, TipoObjeto.OBJETO_INTERNO);
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
            if (instrumento.getDescripcion() != null) {
                existente.setDescripcion(instrumento.getDescripcion());
            }
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
            if (objeto.getDescripcion() != null) {
                existente.setDescripcion(objeto.getDescripcion());
            }
            existente.setTipoObjeto(objeto.getTipoObjeto());
            objetoRepository.save(existente);

            if (coincidencias.size() > 1) {
                objetoRepository.deleteAll(coincidencias.subList(1, coincidencias.size()));
            }
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
}
