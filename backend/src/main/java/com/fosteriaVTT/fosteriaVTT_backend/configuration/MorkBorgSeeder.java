package com.fosteriaVTT.fosteriaVTT_backend.configuration;

import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.Estadistica;
import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.EstadisticaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.HabilidadRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Mochila.MochilaRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.Objeto;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.ObjetoRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.TipoObjeto;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.PersonajeRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.mbUtils.MorkBorgCharacterCreationUtils;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.UserRepository;
import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import com.fosteriaVTT.fosteriaVTT_backend.dto.morkborg.CrearPersonajeMorkBorgRequest;
import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

@Configuration
public class MorkBorgSeeder {

    // ── Mork Borg tag prefixes ─────────────────────────────────────────────────
    // ── Mork Borg enemy / NPC tag prefixes ───────────────────────────────────
    private static final String MB_ENEMY_ARMA_TAG      = "MORK_BORG,MBEnemyArma";
    private static final String MB_ENEMY_ARMA_ESP_TAG  = "MORK_BORG,MBEnemyArma,MBEnemyArmaEspecial";
    private static final String MB_ENEMY_ARMADURA_TAG  = "MORK_BORG,MBEnemyArmadura";
    private static final String MB_ENEMY_RASGO_TAG     = "MORK_BORG,MBEnemyRasgo";
    private static final String MB_ENEMY_ESPECIAL_TAG  = "MORK_BORG,MBEnemyEspecial";
    private static final String MB_ENEMY_LOOT_TAG      = "MORK_BORG,MBEnemyLoot";

    private static final String MB_WEAPON_CATALOG_TAG        = "MORK_BORG,Arma";
    private static final String MB_ARMOR_CATALOG_TAG         = "MORK_BORG,Armadura";
    private static final String MB_SCROLL_IMPURE_CATALOG_TAG  = "MORK_BORG,PergaminoImpuro";
    private static final String MB_SCROLL_SACRED_CATALOG_TAG  = "MORK_BORG,PergaminoSagrado";
    private static final String MB_HABILIDAD_CATALOG_TAG      = "MORK_BORG,Habilidad";
    private static final String MB_SPECIAL_WEAPON_CATALOG_TAG = "MORK_BORG,Arma,ArmaEspecial";
    private static final String MB_SPECIAL_ITEM_CATALOG_TAG   = "MORK_BORG,Miscelaneo,ItemEspecial";
    // ── Mork Borg class-specific tag prefixes ─────────────────────────────────
    private static final String MB_ESCORIA_SKILL_TAG    = "MORK_BORG,Habilidad,EscoriaAlcantarillas";
    private static final String MB_DESERTOR_SKILL_TAG   = "MORK_BORG,Habilidad,DesertorColmilludo";
    private static final String MB_ERMITANO_SKILL_TAG   = "MORK_BORG,Habilidad,ErmitanoEsoterico";
    private static final String MB_REALEZA_SKILL_TAG    = "MORK_BORG,Habilidad,RealezaDesgracia";
    private static final String MB_REALEZA_ITEM_TAG     = "MORK_BORG,RealezaDesgracia";
    private static final String MB_SACERDOTE_ITEM_TAG   = "MORK_BORG,SacerdoteHereje";
    private static final String MB_HERBORISTA_SKILL_TAG = "MORK_BORG,Habilidad,HerboristaOcultista";
    private static final String MB_DECOCCION_TAG        = "MORK_BORG,Miscelaneo,Decoccion";

    // ── Character image constants (duplicated from DevelopmentDataSeeder) ─────
    private static final String CHARACTER_IMAGE_ONE = "https://res.cloudinary.com/doxqtmi46/image/upload/v1775754806/nagyunn___unbnqi.jpg";

    @Bean
    @Order(9)
    CommandLineRunner seedMorkBorgEquipment(
            ObjetoRepository objetoRepository,
            HabilidadRepository habilidadRepository,
            UserRepository userRepository,
            PersonajeRepository personajeRepository,
            MochilaRepository mochilaRepository,
            EstadisticaRepository estadisticaRepository,
            MorkBorgCharacterCreationUtils morkBorgCharacterCreationUtils
    ) {
        return args -> {
            // ── Equipo (síncrono — Asdrubal) ───────────
            seedEquipmentCatalogEntries(objetoRepository, buildMbWeaponList());
            seedEquipmentCatalogEntries(objetoRepository, buildMbArmorList());
            seedEquipmentCatalogEntries(objetoRepository, buildMbMiscItemList());
            seedEquipmentCatalogEntries(objetoRepository, buildMbRealezaItemList());
            seedEquipmentCatalogEntries(objetoRepository, buildMbSacerdoteItemList());
            seedEquipmentCatalogEntries(objetoRepository, buildMbDecocciones());
            seedMbScrollCatalogEntries(habilidadRepository);
            seedMbHabilidadCatalogEntries(habilidadRepository);

            // ── Personaje semilla Asdrubal ────────────────────────────────────
            userRepository.findByUsername("sai").ifPresent(sai -> {
                personajeRepository
                        .findByUsuarioUsernameOrderByUsadoDesc("sai").stream()
                        .filter(p -> p.getNombre().equalsIgnoreCase("Asdrubal, El rencoroso"))
                        .findFirst()
                        .ifPresent(existing -> {
                            int itemCount = mochilaRepository
                                    .findByPersonajeIdOrderByIdAsc(existing.getId()).size();
                            String tags = existing.getTags() != null ? existing.getTags() : "";
                            boolean hasRasgos = tags.contains("rasgoTerrible1");
                            if (itemCount < 4 || !hasRasgos) {
                                mochilaRepository.deleteByPersonajeId(existing.getId());
                                personajeRepository.deleteHabilidadesByPersonajeId(existing.getId());
                                estadisticaRepository.deleteByPersonajeId(existing.getId());
                                personajeRepository.deleteById(existing.getId());
                            }
                        });

                boolean alreadyExists = personajeRepository
                        .findByUsuarioUsernameOrderByUsadoDesc("sai").stream()
                        .anyMatch(p -> p.getNombre().equalsIgnoreCase("Asdrubal, El rencoroso"));
                if (!alreadyExists) {
                    morkBorgCharacterCreationUtils.crearPersonajeMorkBorg(
                            buildSeededAsdrubalRequest(),
                            CHARACTER_IMAGE_ONE,
                            "sai"
                    );
                }
            });
        };
    }

    private List<Objeto> buildMbWeaponList() {
        return List.of(
            SeederUtils.buildInitialObject(MB_WEAPON_CATALOG_TAG + ",ArmaIdx;1",  "Fémur",             "1d4+fuerza",    "Hueso largo usado como arma. Contundente y primitivo.",           TipoObjeto.ARMA),
            SeederUtils.buildInitialObject(MB_WEAPON_CATALOG_TAG + ",ArmaIdx;2",  "Bastón",            "1d4+fuerza",    "Palo de madera resistente, equilibrado y versátil.",              TipoObjeto.ARMA),
            SeederUtils.buildInitialObject(MB_WEAPON_CATALOG_TAG + ",ArmaIdx;3",  "Espada corta",      "1d4+fuerza",    "Hoja corta de filo recto, ligera y fácil de manejar.",            TipoObjeto.ARMA),
            SeederUtils.buildInitialObject(MB_WEAPON_CATALOG_TAG + ",ArmaIdx;4",  "Cuchillo",          "1d4+fuerza",    "Hoja pequeña y afilada, fácil de ocultar.",                       TipoObjeto.ARMA),
            SeederUtils.buildInitialObject(MB_WEAPON_CATALOG_TAG + ",ArmaIdx;5",  "Martillo de guerra","1d6+fuerza",    "Pesado martillo diseñado para aplastar huesos y armaduras.",      TipoObjeto.ARMA),
            SeederUtils.buildInitialObject(MB_WEAPON_CATALOG_TAG + ",ArmaIdx;6",  "Espada",            "1d6+fuerza",    "Hoja larga de doble filo, equilibrada para ataque y defensa.",    TipoObjeto.ARMA),
            SeederUtils.buildInitialObject(MB_WEAPON_CATALOG_TAG + ",ArmaIdx;7",  "Arco",              "1d6+presencia", "Arma a distancia. Requiere flechas.",                             TipoObjeto.ARMA),
            SeederUtils.buildInitialObject(MB_WEAPON_CATALOG_TAG + ",ArmaIdx;8",  "Mayal",             "1d8+fuerza",    "Cadena con pesa. Difícil de bloquear.",                           TipoObjeto.ARMA),
            SeederUtils.buildInitialObject(MB_WEAPON_CATALOG_TAG + ",ArmaIdx;9",  "Ballesta",          "1d8+presencia", "Arma de tiro mecánico. Potente y precisa.",                       TipoObjeto.ARMA),
            SeederUtils.buildInitialObject(MB_WEAPON_CATALOG_TAG + ",ArmaIdx;10", "Zweihänder",        "1d10+fuerza",   "Espadón a dos manos de devastador alcance.",                      TipoObjeto.ARMA),
            // ── Armas especiales (equipo de clase / botín único) ─────────────────
            SeederUtils.buildInitialObject(MB_SPECIAL_WEAPON_CATALOG_TAG + ",DesertorColmilludo,DesertorItemIdx;2", "La cimitarra marrón de Galgenbeck", "d6+fuerza",
                "Una espada apestosa que sacaste de una letrina militar. DR10 ataque y defensa mientras la manejas. Hay una probabilidad de 1 entre 6 de que un enemigo herido sufra una potente sepsis y muera en 10 minutos.",
                TipoObjeto.ARMA),
            SeederUtils.buildInitialObject(MB_SPECIAL_WEAPON_CATALOG_TAG + ",DesertorColmilludo,DesertorItemIdx;4", "Honda del viejo Sigûrd", "2d4+presencia",
                "Sigûrd fue el hombre más fuerte al que le has roído la garganta. Tejida con su larga cabellera gris, esta honda nunca te ha fallado. Requiere rocas del tamaño de un puño que, quizás lamentablemente, están por todas partes.",
                TipoObjeto.ARMA),
            SeederUtils.buildInitialObject(MB_SPECIAL_WEAPON_CATALOG_TAG + ",DesertorColmilludo,DesertorItemIdx;6", "La herradura del caballo de la Muerte", "1d4+presencia",
                "Parece normal, pero desde que la encontraste en una oscura cripta estás convencido de que esta herradura proviene del mismísimo caballo de la Muerte. Golpea con CD10. Hay una probabilidad de 1 entre 6 de que la herradura rompa el cráneo, matando instantáneamente a criaturas de tamaño pequeño o mediano. La herradura vuelve a tu mano como un bumerán.",
                TipoObjeto.ARMA)
        );
    }

    private List<Objeto> buildMbArmorList() {
        return List.of(
            SeederUtils.buildInitialObject(MB_ARMOR_CATALOG_TAG + ",ArmaduraNivel;1", "Armadura ligera (nivel 1)", "1d2", "Daño recibido -1d2. Protección básica. Sin penalizaciones a la Agilidad.",                TipoObjeto.ARMADURA),
            SeederUtils.buildInitialObject(MB_ARMOR_CATALOG_TAG + ",ArmaduraNivel;2", "Armadura media (nivel 2)",  "1d4", "Daño recibido -1d4. CD+2 en pruebas de Agilidad, incluida la defensa.",                   TipoObjeto.ARMADURA),
            SeederUtils.buildInitialObject(MB_ARMOR_CATALOG_TAG + ",ArmaduraNivel;3", "Armadura pesada (nivel 3)", "1d6", "Daño recibido -1d6. CD+4 en la prueba de Agilidad, la defensa es CD+2.",                  TipoObjeto.ARMADURA),
            SeederUtils.buildInitialObject(MB_ARMOR_CATALOG_TAG + ",EscudoMB,ItemSinClase2;9", "Escudo",            "-1", "-1 PV de daño o hace que el escudo se rompa para ignorar un ataque.", TipoObjeto.ARMADURA)
        );
    }

    /**
     * Objetos misceláneos de Mork Borg (equipo inicial aleatorio).
     * Tablas del Sin Clase: d6 contenedor + d12 objetos tabla 1 + d12 tabla 2.
     * Sólo se crean los objetos físicos; los pergaminos aleatorios salen del
     * catálogo de pergaminos ya sembrado.
     */
    private List<Objeto> buildMbMiscItemList() {
        final String BASE = "MORK_BORG,Miscelaneo";
        return List.of(
            // ── Tabla d6 – contenedores (Sin Clase) ──────────────────────────
            SeederUtils.buildInitialObject(BASE + ",ContenedorSinClase;3", "Mochila",       null, "mochila para 7 artículos de tamaño normal",  TipoObjeto.MISCELANEO),
            SeederUtils.buildInitialObject(BASE + ",ContenedorSinClase;4", "Saco",          null, "saco para 10 prendas de tamaño normal",      TipoObjeto.MISCELANEO),
            SeederUtils.buildInitialObject(BASE + ",ContenedorSinClase;5", "Cofre pequeño", null, "Caja resistente para guardar objetos valiosos.",                         TipoObjeto.MISCELANEO),
            // Burro → convertido a habilidad (compañero animal)

            // ── Tabla d12 n.º 1 – objetos (Sin Clase) ────────────────────────
            // resultado 5 = pergamino impuro al azar (ya existe en catálogo de pergaminos)
            SeederUtils.buildInitialObject(BASE + ",ItemSinClase1;1",  "Cuerda",                null, "Cuerda de 30 pies. Útil para escalar o atar.",                             TipoObjeto.MISCELANEO),
            SeederUtils.buildInitialObject(BASE + ",ItemSinClase1;2",  "Antorchas",             null, "Proporciona luz en la oscuridad durante varias horas.",                    TipoObjeto.MISCELANEO),
            SeederUtils.buildInitialObject(BASE + ",ItemSinClase1;3",  "Farol",                 null, "Farol con aceite para Presencia +6 horas.",                               TipoObjeto.MISCELANEO),
            SeederUtils.buildInitialObject(BASE + ",ItemSinClase1;4",  "Tira de magnesio",      null, "Arde con luz cegadora. Útil para iluminar o distraer.",                   TipoObjeto.MISCELANEO),
            SeederUtils.buildInitialObject(BASE + ",ItemSinClase1;6",  "Aguja afilada",         null, "Pequeña pero letal. Útil para cerraduras o venenos.",                     TipoObjeto.MISCELANEO),
            SeederUtils.buildInitialObject(BASE + ",ItemSinClase1;7",  "Botiquín",              null, "Detiene la hemorragia y la infección. Cura d6 PV.",                       TipoObjeto.MISCELANEO),
            SeederUtils.buildInitialObject(BASE + ",ItemSinClase1;8",  "Lima de metal y ganzúas", null, "Herramientas para abrir cerraduras y limar barrotes.",                  TipoObjeto.MISCELANEO),
            SeederUtils.buildInitialObject(BASE + ",ItemSinClase1;9",  "Trampa para osos",      null, "Presencia DR14 para detectar. Daño d8.",                                  TipoObjeto.MISCELANEO),
            SeederUtils.buildInitialObject(BASE + ",ItemSinClase1;10", "Bomba",                 "1d10", "Botella sellada, daño d10.",                                            TipoObjeto.CONSUMIBLE),
            SeederUtils.buildInitialObject(BASE + ",ItemSinClase1;11", "Botella de veneno rojo", null, "Resistencia CD12 o daño d10.",                                           TipoObjeto.MISCELANEO),
            SeederUtils.buildInitialObject(BASE + ",ItemSinClase1;12", "Crucifijo de plata",    null, "Símbolo sagrado. Puede ahuyentar criaturas no muertas.",                  TipoObjeto.MISCELANEO),
            // ── Tabla d12 n.º 2 – objetos (Sin Clase) ────────────────────────
            // resultado 2 = pergamino sagrado al azar (ya existe en catálogo)
            // resultado 9 = Escudo (ya existe en catálogo de armaduras)
            SeederUtils.buildInitialObject(BASE + ",ItemSinClase2;1",  "Elixir de vida",            "1d6",  "Cura d6 PV y elimina la infección.",                                  TipoObjeto.CONSUMIBLE),
            // Perro y Monos → convertidos a habilidades (compañeros animales)

            SeederUtils.buildInitialObject(BASE + ",ItemSinClase2;5",  "Perfume exquisito",         null,   "Perfume exquisito por valor de 25s.",                                 TipoObjeto.MISCELANEO),
            SeederUtils.buildInitialObject(BASE + ",ItemSinClase2;6",  "Caja de herramientas",      null,   "10 clavos, tenazas, martillo, sierra pequeña y taladro.",            TipoObjeto.MISCELANEO),
            SeederUtils.buildInitialObject(BASE + ",ItemSinClase2;7",  "Cadena pesada",             null,   "Cadena pesada de 15 pies.",                                           TipoObjeto.MISCELANEO),
            SeederUtils.buildInitialObject(BASE + ",ItemSinClase2;8",  "Gancho de escalada",        null,   "Gancho resistente para escalar muros y acantilados.",                 TipoObjeto.MISCELANEO),
            SeederUtils.buildInitialObject(BASE + ",ItemSinClase2;10", "Palanca",                   "1d4",  "Barra de metal para forzar puertas y mover obstáculos.",             TipoObjeto.ARMA),
            SeederUtils.buildInitialObject(BASE + ",ItemSinClase2;11", "Manteca de cerdo",          null,   "Puede funcionar como 5 comidas en caso de necesidad.",               TipoObjeto.MISCELANEO),
            SeederUtils.buildInitialObject(BASE + ",ItemSinClase2;12", "Tienda de campaña",         null,   "Refugio portátil para acampar en el exterior.",                      TipoObjeto.MISCELANEO),
            // ── Ítems especiales (equipo de clase / botín único) ──────────────────
            SeederUtils.buildInitialObject(MB_SPECIAL_ITEM_CATALOG_TAG + ",DesertorColmilludo,DesertorItemIdx;1", "Máscara de monstruo arrugada", null,
                "Infunde miedo primitivo en criaturas menores como goblins, gnoums y niños. Mientras la uses, harán pruebas de Moral en cada asalto.",
                TipoObjeto.MISCELANEO),
            SeederUtils.buildInitialObject(MB_SPECIAL_ITEM_CATALOG_TAG + ",DesertorColmilludo,DesertorItemIdx;3", "Dientes de mago", null,
                "Cuatro extraños dientes traquetean dentro de una bolsa ennegrecida. Antes de la batalla, tira un d6 por cada uno. Por cada 6, uno de tus ataques causa el daño máximo.",
                TipoObjeto.MISCELANEO),
            SeederUtils.buildInitialObject(MB_SPECIAL_ITEM_CATALOG_TAG + ",ErmitanoEsoterico,ErmitanoEspecialidadIdx;2", "Un libro de sangre hirviendo", null,
                "Puede abrir y leer este libro una vez al día. Tu enemigo debe realizar una prueba CD12 para evitar esto. Si falla, D2 berserker asesinos aparecen desde las profundidades de una dimensión de sangre olvidada. Tira un D6. Con un 1–4, estas criaturas luchan a tu lado. Con un 5-6 se vuelven contra ti, intentando matarte y destruir el libro. Después de la batalla regresan a su encierro.",
                TipoObjeto.MISCELANEO)
        );
    }

    private void seedMbScrollCatalogEntries(HabilidadRepository habilidadRepository) {
        List<Habilidad> scrolls = List.of(
            // ── Pergaminos Impuros ─────────────────────────────────────────────
            SeederUtils.buildSkill("Las palmeras abren la Puerta del Sur",    null,
                "Una bola de fuego golpea a d2 criaturas e inflige d8 de daño por criatura.",
                MB_SCROLL_IMPURE_CATALOG_TAG + ",PergaminoImpuroIdx;1"),
            SeederUtils.buildSkill("Lengua de Eris",                          null,
                "Una criatura de tu elección queda confundida durante 10 minutos.",
                MB_SCROLL_IMPURE_CATALOG_TAG + ",PergaminoImpuroIdx;2"),
            SeederUtils.buildSkill("Te-le-kin-esis",                          null,
                "Mueves un objeto hacia arriba 1d10 × 10 pies durante d6 minutos.",
                MB_SCROLL_IMPURE_CATALOG_TAG + ",PergaminoImpuroIdx;3"),
            SeederUtils.buildSkill("Levitación de Lucy-Fire",                 null,
                "Flotar durante Presencia + d10 asaltos.",
                MB_SCROLL_IMPURE_CATALOG_TAG + ",PergaminoImpuroIdx;4"),
            SeederUtils.buildSkill("Demonio de los capilares",                null,
                "Una criatura se asfixia durante d6 asaltos, perdiendo d4 PV por asalto.",
                MB_SCROLL_IMPURE_CATALOG_TAG + ",PergaminoImpuroIdx;5"),
            SeederUtils.buildSkill("Nueve señales violetas desatan la tormenta", null,
                "Produce d2 rayos que infligen d6 de daño cada uno.",
                MB_SCROLL_IMPURE_CATALOG_TAG + ",PergaminoImpuroIdx;6"),
            SeederUtils.buildSkill("Metzhuotl ciega tu ojo",                  null,
                "Una criatura se vuelve invisible durante d6 asaltos o hasta que reciba daño, ataca/defiende con CD6.",
                MB_SCROLL_IMPURE_CATALOG_TAG + ",PergaminoImpuroIdx;7"),
            SeederUtils.buildSkill("Psicopompo asqueroso",                    null,
                "Invoca (d6): 1-3 d4 esqueletos, 4-6 d4 zombis.",
                MB_SCROLL_IMPURE_CATALOG_TAG + ",PergaminoImpuroIdx;8"),
            SeederUtils.buildSkill("El párpado que ciega la mente",           null,
                "d4 criaturas se quedan dormidas durante una hora a menos que superen una prueba de CD14.",
                MB_SCROLL_IMPURE_CATALOG_TAG + ",PergaminoImpuroIdx;9"),
            SeederUtils.buildSkill("Muerte",                                  null,
                "Todas las criaturas en un radio de 30 pies pierden un total de 4d10 PV.",
                MB_SCROLL_IMPURE_CATALOG_TAG + ",PergaminoImpuroIdx;10"),
            // ── Pergaminos Sagrados ────────────────────────────────────────────
            SeederUtils.buildSkill("Gracia del santo muerto",                 null,
                "d2 criaturas recuperan d10 PV cada una.",
                MB_SCROLL_SACRED_CATALOG_TAG + ",PergaminoSagradoIdx;1"),
            SeederUtils.buildSkill("Gracia por un pecador",                   null,
                "Una criatura de tu elección obtiene +d6 en una tirada (daño, prueba, etc.)",
                MB_SCROLL_SACRED_CATALOG_TAG + ",PergaminoSagradoIdx;2"),
            SeederUtils.buildSkill("Susurros a través de la puerta",          null,
                "Haz tres preguntas a una criatura fallecida.",
                MB_SCROLL_SACRED_CATALOG_TAG + ",PergaminoSagradoIdx;3"),
            SeederUtils.buildSkill("Égida del dolor",                         null,
                "Una criatura de tu elección gana 2d6 PV extra durante 10 asaltos.",
                MB_SCROLL_SACRED_CATALOG_TAG + ",PergaminoSagradoIdx;4"),
            SeederUtils.buildSkill("Destino insatisfecho",                    null,
                "Una criatura, muerta desde hace no más de una semana, se despierta con terribles recuerdos.",
                MB_SCROLL_SACRED_CATALOG_TAG + ",PergaminoSagradoIdx;5"),
            SeederUtils.buildSkill("Discurso bestial",                        null,
                "Puede hablar con animales durante d20 minutos.",
                MB_SCROLL_SACRED_CATALOG_TAG + ",PergaminoSagradoIdx;6"),
            SeederUtils.buildSkill("Falso amanecer/carruaje de la noche",     null,
                "Luz u oscuridad total durante 3d10 minutos.",
                MB_SCROLL_SACRED_CATALOG_TAG + ",PergaminoSagradoIdx;7"),
            SeederUtils.buildSkill("Paso hermético",                          null,
                "Encuentras todas las trampas en tu camino durante 2d10 minutos.",
                MB_SCROLL_SACRED_CATALOG_TAG + ",PergaminoSagradoIdx;8"),
            SeederUtils.buildSkill("Resplandor consumidor de Roskoe",         null,
                "d4 criaturas pierden d8 PV cada una.",
                MB_SCROLL_SACRED_CATALOG_TAG + ",PergaminoSagradoIdx;9"),
            SeederUtils.buildSkill("Sintaxis",                                null,
                "Una enoquiana criatura obedece ciegamente una sola orden.",
                MB_SCROLL_SACRED_CATALOG_TAG + ",PergaminoSagradoIdx;10")
        );

        for (Habilidad scroll : scrolls) {
            Habilidad existente = habilidadRepository
                .findByNombreIgnoreCaseOrderByIdAsc(scroll.getNombre())
                .stream().findFirst().orElse(null);
            if (existente == null) {
                habilidadRepository.save(scroll);
            } else {
                existente.setDescripcion(scroll.getDescripcion());
                existente.setTags(scroll.getTags());
                habilidadRepository.save(existente);
            }
        }
    }

    // ── Habilidades de clase ───────────────────────────────────────────────────

    private void seedMbHabilidadCatalogEntries(HabilidadRepository habilidadRepository) {
        List<Habilidad> habilidades = List.of(
            // ── Escoria nacida en las alcantarillas ───────────────────────────
            SeederUtils.buildSkill("El pinchazo del cobarde", null,
                "Al atacar por sorpresa, haz una prueba de Agilidad CD10. Si tienes éxito, golpeas automáticamente una vez con un arma ligera de una mano, lo que causa daño normal +3.",
                MB_ESCORIA_SKILL_TAG + ",EscEspecialidadIdx;1"),
            SeederUtils.buildSkill("Dedos sucios", null,
                "Tus pequeños dedos serpenteantes se meten en los bolsillos y abren cerraduras con una prueba de Agilidad CD8. ¡También comienzas con ganzúas!",
                MB_ESCORIA_SKILL_TAG + ",EscEspecialidadIdx;2"),
            SeederUtils.buildSkill("Escupidor abominable", null,
                "Tu flema es viscosa, grumosa, vil y balísticamente precisa a corta distancia. Puedes escupir d2 veces durante una pelea. Realiza una prueba de Presencia CD8 para atinar. Los objetivos quedan cegados, con arcadas y vómitos durante d4 asaltos. Cualquiera que sea testigo, amigos y enemigos, debe hacer una prueba de Resistencia para no vomitar también (CD10 para PJs, CD12 para enemigos).",
                MB_ESCORIA_SKILL_TAG + ",EscEspecialidadIdx;3"),
            SeederUtils.buildSkill("Escapar del destino", null,
                "Cada vez que uses un presagio, hay un 50% de probabilidad de que no se gaste.",
                MB_ESCORIA_SKILL_TAG + ",EscEspecialidadIdx;4"),
            SeederUtils.buildSkill("Sigilo excretor", null,
                "Tienes una habilidad asombrosa, casi sobrenatural, para esconderte en el lodo, los escombros y la suciedad. Cuando estás oculto en estas condiciones, se requiere una prueba de Presencia CD16 para descubrirte.",
                MB_ESCORIA_SKILL_TAG + ",EscEspecialidadIdx;5"),
            SeederUtils.buildSkill("Esquivar la muerte", null,
                "Eres tan desagradable, irrelevante, repugnante y vil que incluso la Muerte preferiría evitarte si pudiera. Al morir, si existe la más mínima posibilidad de que hayas sobrevivido, hay un 50% de probabilidad de que lo hayas hecho. Si tienes éxito, después de 10 asaltos vuelves a aparecer con d4 PV y una explicación poco probable de tu escapatoria.",
                MB_ESCORIA_SKILL_TAG + ",EscEspecialidadIdx;6"),
            // ── Desertor Colmilludo ───────────────────────────────────────────
            SeederUtils.buildSkill("Viejo sabueso", null,
                "Asmática, engañada y en sus últimas patas, esta criatura arrugada todavía tiene un olfato soberbio y puede olfatear tesoros en los escombros más repugnantes. Ataca con CD10 (mordisco d6). Defiende con CD12, 10 PV. Se vuelve frenético cuando hay goblins y berserkers alrededor.",
                MB_DESERTOR_SKILL_TAG + ",DesertorItemIdx;5"),
            // ── Ermitaño esotérico ────────────────────────────────────────────
            SeederUtils.buildSkill("Maestro del Destino", null,
                "¿De qué sirven los mapas cuando la sustancia de la causalidad misma está abierta a ti? Conoces el camino correcto con una prueba de Presencia CD8.",
                MB_ERMITANO_SKILL_TAG + ",ErmitanoEspecialidadIdx;1"),
            SeederUtils.buildSkill("Portavoz de verdades", null,
                "Dos veces al día usa tu sabiduría, conocimiento, consejo y calma interior para aportar claridad a una criatura que elijas. La CD de la siguiente prueba que realice se reduce en 4.",
                MB_ERMITANO_SKILL_TAG + ",ErmitanoEspecialidadIdx;3"),
            SeederUtils.buildSkill("Iniciado del Colegio Invisible", null,
                "Una vez al día puedes invocar D2 pergaminos cuyo poder solo se puede usar una vez. Tira un d4: con 1-2 los pergaminos son sagrados; con 3-4, impuros. Si no se usan antes del amanecer, se convierten en cenizas.",
                MB_ERMITANO_SKILL_TAG + ",ErmitanoEspecialidadIdx;4"),
            SeederUtils.buildSkill("Bardo de los Eternos", null,
                "Aprendiste tus melodías en el Otro Mundo. La música de tu arpa da +D4 en las tiradas de reacción.",
                MB_ERMITANO_SKILL_TAG + ",ErmitanoEspecialidadIdx;5"),
            SeederUtils.buildSkill("Halcón como arma", null,
                "Tu astuto halcón casi inteligente es leal solo a ti. Incluso sin compartir lenguaje, entiendes sus gritos mientras vigila, explora y ataca a los enemigos. Ataca/defiende CD10 (garras/mordisco D4), PV 8.",
                MB_ERMITANO_SKILL_TAG + ",ErmitanoEspecialidadIdx;6"),
            // ── Realeza en desgracia ──────────────────────────────────────────
            SeederUtils.buildSkill("\"Poltroon\" el bufón de la Corte", null,
                "Si bien es prácticamente inútil, personalmente irritante y emocionalmente agotador, las cabriolas de Poltroon en realidad hacen que los enemigos pierdan la concentración en combate. Durante los dos primeros asaltos, tú y tus aliados obtenéis +2 en ataque/defensa.",
                MB_REALEZA_SKILL_TAG + ",RealezaItemIdx;2"),
            SeederUtils.buildSkill("Barbarister el caballo increíble", null,
                "Barbarister es mágico, inteligente, arrogante y vanidoso. También puede hablar. Si puedes persuadirle de que se involucre, Barbarister ocasionalmente suma +2 a las pruebas de Presencia que impliquen lógica e intelecto. El caballo puede ser más inteligente que tú y es muy consciente de ello.",
                MB_REALEZA_SKILL_TAG + ",RealezaItemIdx;3"),
            SeederUtils.buildSkill("Hamfund el escudero", null,
                "Este sirviente intensamente cobarde actúa solo como guardián de la vaina de la espada maldita Eurekia. Una vez por combate, si se puede encontrar a Ham, se puede desenvainar a Eurekia. La espada hace 2d6 de daño y por cada golpe tira un d6. Con un 1, el escudero muere y Eurekia desaparece para siempre.",
                MB_REALEZA_SKILL_TAG + ",RealezaItemIdx;4"),
            // ── Herborista Ocultista ──────────────────────────────────────────
            SeederUtils.buildSkill("Creación de decocciones", null,
                "Diariamente tiene los materiales para crear dos decocciones determinadas al azar. Puede preparar un total de d4 dosis. Si no se usan, pierden vitalidad después de 24 horas.",
                MB_HERBORISTA_SKILL_TAG + ",HerboristaHabilidadIdx;1"),
            // ── Compañeros animales (Sin Clase) ──────────────────────────────
            SeederUtils.buildSkill("Burro", null,
                "Animal de carga. Puede transportar tu equipo.",
                MB_HABILIDAD_CATALOG_TAG + ",ContenedorSinClase;6"),
            SeederUtils.buildSkill("Perro pequeño pero feroz", null,
                "d6+2 PV, mordisco d4. Solo obedece a su dueño.",
                MB_HABILIDAD_CATALOG_TAG + ",ItemSinClase2;3"),
            SeederUtils.buildSkill("Monos", null,
                "Monos que te ignoran pero te quieren (d4+2 PV, puñetazo/mordisco d4).",
                MB_HABILIDAD_CATALOG_TAG + ",ItemSinClase2;4")
        );

        for (Habilidad h : habilidades) {
            Habilidad existente = habilidadRepository
                .findByNombreIgnoreCaseOrderByIdAsc(h.getNombre())
                .stream().findFirst().orElse(null);
            if (existente == null) {
                habilidadRepository.save(h);
            } else {
                existente.setDescripcion(h.getDescripcion());
                existente.setTags(h.getTags());
                habilidadRepository.save(existente);
            }
        }
    }

    // ── Ítems físicos por clase ────────────────────────────────────────────────

    private List<Objeto> buildMbRealezaItemList() {
        return List.of(
            SeederUtils.buildInitialObject(MB_REALEZA_ITEM_TAG + ",RealezaItemIdx;1", "La espada de tus antepasados", "d6+1",
                "Esta magnífica y claramente mágica espada parlante es caprichosa, poco fiable y te desprecia en silencio. Se burla de tus fracasos y, si la decepcionas continuamente, tiene una probabilidad de 1 entre 6 de atacarte accidentalmente a ti o a tus compañeros. La CD de Ataque/Defensa es 10.",
                TipoObjeto.ARMA),
            SeederUtils.buildInitialObject(MB_REALEZA_ITEM_TAG + ",RealezaItemIdx;5", "El regalo de piel de serpiente", "d4",
                "Una costosa caja de sándalo revestida en piel de serpiente. Contiene una daga aparentemente normal, envuelta en seda. La daga hace d4 de daño pero con un 1 el objetivo muere inmediatamente por el veneno mortal que sale de la hoja.",
                TipoObjeto.ARMA),
            SeederUtils.buildInitialObject(MB_REALEZA_ITEM_TAG + ",RealezaItemIdx;6", "¡Cuerno de los señores de Schleswig!", null,
                "Una vez al día, suelta un estruendo de esta vieja trompeta abollada y tira Presencia CD12. Una criatura puede hacer que su próxima prueba que no sea de combate sea un éxito automático.",
                TipoObjeto.MISCELANEO)
        );
    }

    private List<Objeto> buildMbSacerdoteItemList() {
        return List.of(
            SeederUtils.buildInitialObject(MB_SACERDOTE_ITEM_TAG + ",SacerdoteItemIdx;1", "Sagrado cayado del pastor", "2d4",
                "Su cabeza es un garfio de hueso humano con inscripciones de antioraciones superpuestas. Este cayado atraviesa otros mundos. El bastón hace 2d4 de daño excepto a los humanos infieles.",
                TipoObjeto.ARMA),
            SeederUtils.buildInitialObject(MB_SACERDOTE_ITEM_TAG + ",SacerdoteItemIdx;2", "Mitra robada", null,
                "Mientras usa este sombrero sagrado, el infame cuerpo del sacerdote se desvanece, volviéndose difícil de golpear en combate (Defensa CD10). Si se coloca sobre las orejas fuera de la batalla, el sacerdote se vuelve casi invisible, tirando sigilo contra CD8.",
                TipoObjeto.MISCELANEO),
            SeederUtils.buildInitialObject(MB_SACERDOTE_ITEM_TAG + ",SacerdoteItemIdx;3", "Lista de pecados", null,
                "Un documento largo y preciso con referencias cruzadas con la realidad para descubrir malhechores invisibles. Presencia exitosa CD10: una luz extraña rodea a las criaturas malignas. El dueño de la lista se defiende con +2 contra cualquier ser descubierto de esta manera.",
                TipoObjeto.MISCELANEO),
            SeederUtils.buildInitialObject(MB_SACERDOTE_ITEM_TAG + ",SacerdoteItemIdx;4", "La Biblia blasfema de Nechrubel", null,
                "Tan intensamente blasfema que incluso los mismos sacerdotes solo pueden leerla una vez al día. Cuando se lee, lanza un dado. Resultado par: durante el resto del día, los PJs recuperan d4 PV después de solo cinco minutos de descanso. Resultado impar: el sacerdote sufre alucinaciones demoníacas durante el resto del día (el DM inventa d3 cosas que solo el sacerdote puede ver y las describe como verdaderas).",
                TipoObjeto.MISCELANEO),
            SeederUtils.buildInitialObject(MB_SACERDOTE_ITEM_TAG + ",SacerdoteItemIdx;5", "Piedras del Templo Perdido de Thel-Emas", null,
                "Arroja las piedras al suelo. Su patrón revela si el peligro acecha en una habitación adyacente. Las piedras pueden mentir. El sacerdote hace una prueba de Presencia CD10 para ver si son verdaderas, pero después de fallar no puede volver a probar hasta que se haya puesto el sol.",
                TipoObjeto.MISCELANEO),
            SeederUtils.buildInitialObject(MB_SACERDOTE_ITEM_TAG + ",SacerdoteItemIdx;666", "Crucifijo (Jesús invertido)", null,
                "El crucifijo se puede usar en encuentros con no muertos, así como con trolls y goblins menores. Tira por Moral (suma o resta el modificador de Presencia del sacerdote) para ver si las criaturas se inclinan y se retiran amablemente.",
                TipoObjeto.MISCELANEO)
        );
    }

    private List<Objeto> buildMbDecocciones() {
        return List.of(
            SeederUtils.buildInitialObject(MB_DECOCCION_TAG + ",DecoccIdx;1", "Veneno rojo",              null,    "Resistencia CD12 o −d10 PV.",                                                                                                         TipoObjeto.CONSUMIBLE),
            SeederUtils.buildInitialObject(MB_DECOCCION_TAG + ",DecoccIdx;2", "Vapores de Ezumiels",      null,    "Pasa una prueba CD14 o alucinaciones graves (y posiblemente divertidas) durante d4 horas.",                                            TipoObjeto.CONSUMIBLE),
            SeederUtils.buildInitialObject(MB_DECOCCION_TAG + ",DecoccIdx;3", "Estofado de rana sureña",  null,    "Vomita durante d4 horas; pasa una prueba CD14 o no puedes hacer nada más.",                                                           TipoObjeto.CONSUMIBLE),
            SeederUtils.buildInitialObject(MB_DECOCCION_TAG + ",DecoccIdx;4", "Elixir Vitalis",           "1d6",   "Cura d6 PV y detiene la infección. Puede crear hábito.",                                                                               TipoObjeto.CONSUMIBLE),
            SeederUtils.buildInitialObject(MB_DECOCCION_TAG + ",DecoccIdx;5", "Sopa de araña-búho",       null,    "Ver en la oscuridad y trepar por las paredes durante 30 minutos.",                                                                      TipoObjeto.CONSUMIBLE),
            SeederUtils.buildInitialObject(MB_DECOCCION_TAG + ",DecoccIdx;6", "Filtro de Fernor",         null,    "Aceite translúcido, debe aplicarse directamente en el ojo. Cura la infección y da +2 en las pruebas de Presencia durante d4 horas.",   TipoObjeto.CONSUMIBLE),
            SeederUtils.buildInitialObject(MB_DECOCCION_TAG + ",DecoccIdx;7", "Rapé enervante de Hyphos", null,    "¡Berserker! Dos ataques por asalto pero defiende con CD14. Dura una pelea. Debe ser inhalado; provoca estornudos.",                    TipoObjeto.CONSUMIBLE),
            SeederUtils.buildInitialObject(MB_DECOCCION_TAG + ",DecoccIdx;8", "Veneno negro",             null,    "Resistencia CD14 o −d6 PV y cegado durante una hora.",                                                                                TipoObjeto.CONSUMIBLE)
        );
    }

    // ── Mork Borg enemy seeder ────────────────────────────────────────────────

    @Bean
    @Order(10)
    CommandLineRunner seedMorkBorgEnemies(
            UserRepository userRepository,
            PersonajeRepository personajeRepository,
            EstadisticaRepository estadisticaRepository,
            HabilidadRepository habilidadRepository
    ) {
        return args -> userRepository.findByUsername("sistema").ifPresent(sistema -> {
            List<String[]> noArmas = List.<String[]>of();
            List<String[]> noArmaduras = List.<String[]>of();
            seedMBEnemigo(sistema, personajeRepository, estadisticaRepository, habilidadRepository,
                "Goblin",
                "https://res.cloudinary.com/doxqtmi46/image/upload/v1780245537/goblin_ryrbqn.png",
                "enemigo", "MORK_BORG",
                6, 7, null,
                List.of(
                    new String[]{"Cuchillo", "1d4", "false"},
                    new String[]{"Arco corto", "1d4", "false"}
                ),
                List.<String[]>of(new String[]{"Piel viscosa", "-1d2"}),
                "Todos los goblins portan una maldición. Una vez como tú, ahora están atrapados en la prisión de su enloquecida carne de goblin. Solo sus ojos revelan la verdad: una mente destruida que observa cómo su cuerpo-prisión realiza actos terribles. Incluso ser atacado por goblins envía la maldición, llevada por los vientos de su odio. Acierte o falle, no importa. En la oscuridad de Sarkash, disparan a los transeúntes con arcos vibrantes. Debes encontrar y matar al goblin antes de que tu mente se paralice. Si la criatura que lleva la maldición todavía vive d6 días después del ataque, tú mismo te convertirás irrevocablemente en uno. Entonces, solo la oscuridad de Sarkash te esconderá.",
                "Rápido, ataque y defensa son CD14.",
                "Cabeza 7 plata\nCapturado 150 plata, muerto 20 plata"
            );
            seedMBEnemigo(sistema, personajeRepository, estadisticaRepository, habilidadRepository,
                "Escoria",
                "https://res.cloudinary.com/doxqtmi46/image/upload/v1780245097/escoria_ubezys.jpg",
                "enemigo", "MORK_BORG",
                7, 8, null,
                List.<String[]>of(new String[]{"Cuchillo envenenado", "1d4", "true"}),
                noArmaduras,
                "Hay pocos demonios más bajos que la pobreza o monstruos más poderosos que el odio. En este mundo asolado, los barrios bajos y los callejones negros son escoria fecunda, madre de innumerables malhechores aborrecibles. El PJ con mayor Presencia realiza una prueba CD14 al comienzo de la batalla. Fallar significa que un miembro aleatorio del grupo es golpeado automáticamente por una cobarde puñalada por la espalda: daño normal +3.",
                "Cuchillo envenenado. Prueba de Resistencia CD10 o se infecta.",
                "Capturado 50-120s (buscado, delito grave)\nMuerto 20-70s (buscado, delito grave)"
            );
            seedMBEnemigo(sistema, personajeRepository, estadisticaRepository, habilidadRepository,
                "Berserker",
                "https://res.cloudinary.com/doxqtmi46/image/upload/v1780244324/berserker_uoybvk.png",
                "enemigo", "MORK_BORG,MBArmaAleatoria",
                13, 9,
                "{\"armaAleatoria\":{\"tagKey\":\"mbArmaIdx\",\"nombre\":\"Arma\",\"dados\":\"d4\",\"opciones\":[{\"nombre\":\"Mayal largo\",\"formula\":\"1d8\"},{\"nombre\":\"Maza pesada\",\"formula\":\"1d6\"},{\"nombre\":\"Espada con cadena\",\"formula\":\"1d6\"},{\"nombre\":\"Martillo de guerra enorme\",\"formula\":\"1d10\"}]}}",
                noArmas,
                List.<String[]>of(new String[]{"Piel endurecida", "-1d2"}),
                "¡Están sobre ti! Como de la nada, surge una emboscada frenética en pasillos polvorientos y detrás de las piedras negras apiladas de las catacumbas.",
                "Ataca dos veces por asalto pero no tiene tiempo para defenderse (CD10 para golpearlos).",
                "Capturado 55 plata\nMuerto 20 plata\nSangre, por litro 3 plata"
            );
            seedMBEnemigo(sistema, personajeRepository, estadisticaRepository, habilidadRepository,
                "Espectro",
                "https://res.cloudinary.com/doxqtmi46/image/upload/v1780243949/wrath_ywffcb.png",
                "enemigo", "MORK_BORG,MBMoralNA",
                15, null, null,
                List.<String[]>of(new String[]{"Toque", "1d4", "true"}),
                noArmaduras,
                "Estos fantasmas silenciosos siempre ganan la iniciativa. Su toque drena Fuerza, Presencia y Agilidad en 1 durante la duración del combate.",
                "Rápido, escurridizo y difícil de golpear (CD14).",
                "Capturado 120s\nCráneo 70s\nEctoplasma 25s"
            );
            seedMBEnemigo(sistema, personajeRepository, estadisticaRepository, habilidadRepository,
                "Esqueleto bañado en sangre",
                "https://res.cloudinary.com/doxqtmi46/image/upload/v1780240084/esqueleto_ba%C3%B1ado_en_sangre_p38d7g.jpg",
                "enemigo", "MORK_BORG",
                7, 8, null,
                List.of(
                    new String[]{"Espada corta", "1d4", "false"},
                    new String[]{"Cuchillo", "1d4", "false"},
                    new String[]{"Nudillos huesudos", "1d2", "false"}
                ),
                noArmaduras,
                null,
                "Merodea, imposiblemente silencioso. Ataca por sorpresa. Puede imitar voces para atraer a las víctimas, pero solo puede repetir lo que ha escuchado. Los ataques contra ellos con armas perforantes son CD14. Cualquier golpe que haga 5 o más daño destruye el esqueleto por completo.",
                "Capturado 35s\nDestruido 7s"
            );
            seedMBEnemigo(sistema, personajeRepository, estadisticaRepository, habilidadRepository,
                "Nigromante no muerto",
                "https://res.cloudinary.com/doxqtmi46/image/upload/v1780240133/nigromante_no_muerto_swdtdo.jpg",
                "enemigo", "MORK_BORG,MBMoralNA",
                15, null, null,
                List.<String[]>of(new String[]{"Ataque", "1d6", "true"}),
                List.<String[]>of(new String[]{"Barrera necro", "-1d4"}),
                "Nadie puede usar poderes cerca de esta herida antimágica en la realidad. En cada asalto pueden robar el contenido de un pergamino cercano y usar este poder contra su propietario.",
                "Toque paralizante (Presencia CD14 en cada asalto para liberarse).",
                "Capturado 200s\nDespojos 130s\nCalavera 100s"
            );
            seedMBEnemigo(sistema, personajeRepository, estadisticaRepository, habilidadRepository,
                "Troll",
                "https://res.cloudinary.com/doxqtmi46/image/upload/v1780243448/ChatGPT_Image_31_may_2026_06_03_51_p.m._rfgylx.png",
                "enemigo", "MORK_BORG,MBMoralEspecial",
                32, null, null,
                List.<String[]>of(new String[]{"Puño", "2d6", "false"}),
                List.<String[]>of(new String[]{"Piel gruesa", "-1d2"}),
                "Cobardes a pesar de su tamaño. Por lo general, se retiran si están gravemente heridos. Nunca olvidan quién los hirió. Aumentan de tamaño durante el proceso de curación y volverán definitivamente más fuertes que antes. Cualquier PV curado se suma a su PV máximo. Cada vez que regresen, suma otro d6 a su daño.",
                "Fácil de golpear; los ataques son CD10.",
                "Capturado 200s\nCadáver 70s\nCuerno 25s"
            );
            seedMBEnemigo(sistema, personajeRepository, estadisticaRepository, habilidadRepository,
                "Zombi",
                "https://res.cloudinary.com/doxqtmi46/image/upload/v1780240268/zombieMB_usnl5p.jpg",
                "enemigo", "MORK_BORG,MBMoralNA",
                7, null, null,
                List.<String[]>of(new String[]{"Garra/mordisco", "1d2", "true"}),
                List.<String[]>of(new String[]{"Restos de cuero", "-1d2"}),
                "El rey Fathmu IX de Wästland, en particular, busca esta cura y conoce el nombre y la ubicación del bosque que domina la montaña.",
                "Cualquiera que haya sido mordido hace una prueba de Resistencia CD8 o muere dos días antes de convertirse en zombi. Se dice que la única cura o vacuna se encuentra en la cima de una montaña pálida dentro de un bosque infinitamente miserable de hojas oscuras.",
                "Capturado 30s\nSangre, por litro 5s"
            );
            seedMBEnemigo(sistema, personajeRepository, estadisticaRepository, habilidadRepository,
                "Muñeca no muerta",
                "https://res.cloudinary.com/doxqtmi46/image/upload/v1780243605/mu%C3%B1eca_de_porcelana_asyrdh.jpg",
                "enemigo", "MORK_BORG,MBMoralNA",
                11, null, null,
                List.<String[]>of(new String[]{"Garras/mordisco perforante", "1d4", "false"}),
                List.<String[]>of(new String[]{"Porcelana", "-1d2"}),
                "En Tveland, los ladrones de reliquias, los difamadores y los funcionarios corruptos sufren un castigo de una crueldad exquisita y profundamente poco práctica. Sus hijos o nietos son encerrados en muñecos de porcelana y luego colocados en las ventanas de la catedral, para morir lentamente de hambre y calor. A pesar de los rituales de protección, muchos regresan como no muertos vengativos, y a menudo se reúnen en grandes multitudes para cazar a sus torturadores. Su mirada enloquecida exige una prueba de Presencia CD12 al inicio del combate para evitar quedar congelado por el miedo durante d4 asaltos.",
                null,
                "Cabeza 20s\nCapturado 80s"
            );
            seedMBEnemigo(sistema, personajeRepository, estadisticaRepository, habilidadRepository,
                "Grotesco",
                "https://res.cloudinary.com/doxqtmi46/image/upload/v1780242421/grotesco_w74idb.jpg",
                "enemigo", "MORK_BORG,MBMoralNA",
                18, null, null,
                List.of(
                    new String[]{"Garras", "1d6", "false"},
                    new String[]{"Rayo de ojo", "1d8", "false"}
                ),
                List.<String[]>of(new String[]{"Arcilla/Piedra", "-1d6"}),
                "Espiando alrededor de las iglesias, acechando cementerios, acercándose sigilosamente cuando miras hacia otro lado. Inquietantemente inmóvil, difíciles de distinguir contra la piedra gris y difíciles de reconocer incluso cuando se ven. Se mueven lentamente y son fáciles de golpear (CD10). Usa su mirada aterradora con 1-2 en un d6 cada asalto. Siempre acierta.",
                null,
                "Capturado 190s\nMuerto (intacto) 100s\nMuerto (en pedazos) 10s"
            );
            seedMBEnemigo(sistema, personajeRepository, estadisticaRepository, habilidadRepository,
                "Pálido",
                "https://res.cloudinary.com/doxqtmi46/image/upload/v1780240004/Palido_qzn7on.jpg",
                "pnj", "MORK_BORG,MBRasgosAleatorios",
                5, 8,
                "{\"rasgosAleatorios\":[{\"tagKey\":\"mbRasgo1\",\"nombre\":\"Rasgo\",\"dados\":\"d4\",\"opciones\":[\"Amargado\",\"Incoherente\",\"Silencioso\",\"Comportamiento autodestructivo\"]},{\"tagKey\":\"mbRasgo2\",\"nombre\":\"Valora\",\"dados\":\"d6\",\"opciones\":[\"No tener que usar su especialidad todo el tiempo\",\"Limpieza\",\"Escuchar melodías melancólicas\",\"Un par de horas a solas en la oscuridad\",\"Vino\",\"Rituales oscuros con el grupo\"]},{\"tagKey\":\"mbEspecialidad\",\"nombre\":\"Especialidad\",\"dados\":\"d4\",\"opciones\":[\"Crea d2 dosis de una decocción aleatoria (ver la clase Herborista Ocultista)\",\"Crea d2 dosis de Elixir Vitalis (cura d6 PV y detiene la infección)\",\"Usa un Poder impuro al azar\",\"Usa un Poder sagrado aleatorio\"]}]}",
                List.<String[]>of(new String[]{"Desarmado", "1d2", "false"}),
                noArmaduras,
                null,
                null,
                "Nada"
            );
            seedMBEnemigo(sistema, personajeRepository, estadisticaRepository, habilidadRepository,
                "Merodeador",
                "https://res.cloudinary.com/doxqtmi46/image/upload/v1780242361/merodeador_ummlay.jpg",
                "pnj", "MORK_BORG,MBRasgosAleatorios",
                8, 8,
                "{\"rasgosAleatorios\":[{\"tagKey\":\"mbRasgo1\",\"nombre\":\"Rasgos\",\"dados\":\"d4\",\"opciones\":[\"Perezoso\",\"Fanfarrón\",\"Mentiroso\",\"Traidor\"]},{\"tagKey\":\"mbRasgo2\",\"nombre\":\"Valora\",\"dados\":\"d6\",\"opciones\":[\"Pago en plata\",\"Alimentos\",\"Rumores\",\"Licor\",\"Muerte sin sentido\",\"Obtener crédito por sus hazañas\"]},{\"tagKey\":\"mbEspecialidad\",\"nombre\":\"Especialidad\",\"dados\":\"d4\",\"opciones\":[\"Desarmar trampas (primero hay que encontrarlas)\",\"Robar artículos sencillos\",\"Escalar rutas imposibles en solitario\",\"Encontrar senderos y rincones que mantienen al grupo oculto\"]}]}",
                List.<String[]>of(new String[]{"Espada corta sucia", "1d4+1", "false"}),
                List.<String[]>of(new String[]{"Cuero", "-1d2"}),
                null,
                null,
                "Nada"
            );
        });
    }

    private void seedMBEnemigo(
            com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario usuario,
            PersonajeRepository personajeRepository,
            EstadisticaRepository estadisticaRepository,
            HabilidadRepository habilidadRepository,
            String nombre,
            String retrato,
            String tipo,
            String extraTags,
            int hp,
            Integer moral,
            String biografia,
            List<String[]> armas,
            List<String[]> armaduras,
            String rasgo,
            String especial,
            String loot
    ) {
        var existingOpt = personajeRepository.findAll().stream()
                .filter(p -> p.getNombre().equalsIgnoreCase(nombre)
                        && p.getSistemaDeJuego() == SistemaDeJuego.MORK_BORG
                        && p.isEsPublico()
                        && p.getTags() != null && p.getTags().contains(tipo))
                .findFirst();

        if (existingOpt.isPresent()) {
            Personaje existing = existingOpt.get();
            boolean dirty = false;
            if (biografia != null && !biografia.equals(existing.getBiografia())) {
                existing.setBiografia(biografia);
                dirty = true;
            }
            if (dirty) personajeRepository.save(existing);
            for (com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad h : existing.getHabilidades()) {
                boolean changed = false;
                if (h.getFormula() != null) {
                    String fixed = SeederUtils.fixMBFormula(h.getFormula());
                    if (!fixed.equals(h.getFormula())) {
                        h.setFormula(fixed);
                        changed = true;
                    }
                }
                // Para armas y armaduras de enemigos el dado está en descripcion, no en formula
                if (h.getDescripcion() != null && h.getTags() != null
                        && (h.getTags().contains("MBEnemyArma") || h.getTags().contains("MBEnemyArmadura"))) {
                    String fixed = SeederUtils.fixMBFormula(h.getDescripcion());
                    if (!fixed.equals(h.getDescripcion())) {
                        h.setDescripcion(fixed);
                        changed = true;
                    }
                }
                if (changed) habilidadRepository.save(h);
            }
            return;
        }

        String tags = tipo + "," + extraTags;

        Personaje personaje = Personaje.builder()
                .nombre(nombre)
                .retrato(retrato)
                .sistemaDeJuego(SistemaDeJuego.MORK_BORG)
                .tags(tags)
                .esPublico(true)
                .biografia(biografia)
                .usuario(usuario)
                .build();
        personaje = personajeRepository.save(personaje);

        // Estadísticas
        List<Estadistica> stats = new ArrayList<>();
        stats.add(Estadistica.builder().nombre("Vida actual").valor(hp).personaje(personaje).build());
        stats.add(Estadistica.builder().nombre("Vida maxima").valor(hp).personaje(personaje).build());
        if (moral != null) {
            stats.add(Estadistica.builder().nombre("Moral actual").valor(moral).personaje(personaje).build());
            stats.add(Estadistica.builder().nombre("Moral maxima").valor(moral).personaje(personaje).build());
        }
        estadisticaRepository.saveAll(stats);

        // Habilidades
        for (String[] arma : armas) {
            boolean esEspecial = Boolean.parseBoolean(arma[2]);
            Habilidad h = SeederUtils.buildSkill(arma[0], null, arma[1],
                    esEspecial ? MB_ENEMY_ARMA_ESP_TAG : MB_ENEMY_ARMA_TAG);
            h = habilidadRepository.save(h);
            personaje.getHabilidades().add(h);
        }
        for (String[] armadura : armaduras) {
            Habilidad h = SeederUtils.buildSkill(armadura[0], null, armadura[1], MB_ENEMY_ARMADURA_TAG);
            h = habilidadRepository.save(h);
            personaje.getHabilidades().add(h);
        }
        if (rasgo != null && !rasgo.isBlank()) {
            Habilidad h = SeederUtils.buildSkill("Rasgos", null, rasgo, MB_ENEMY_RASGO_TAG);
            h = habilidadRepository.save(h);
            personaje.getHabilidades().add(h);
        }
        if (especial != null && !especial.isBlank()) {
            Habilidad h = SeederUtils.buildSkill("Especial", null, especial, MB_ENEMY_ESPECIAL_TAG);
            h = habilidadRepository.save(h);
            personaje.getHabilidades().add(h);
        }
        if (loot != null && !loot.isBlank()) {
            Habilidad h = SeederUtils.buildSkill("Loot", null, loot, MB_ENEMY_LOOT_TAG);
            h = habilidadRepository.save(h);
            personaje.getHabilidades().add(h);
        }
        personajeRepository.save(personaje);
    }

    private CrearPersonajeMorkBorgRequest buildSeededAsdrubalRequest() {
        return new CrearPersonajeMorkBorgRequest(
            // nombre, claseId
            "Asdrubal, El rencoroso",
            "desertor-colmilludo",
            // claseOpciones: opción 4 (Honda del viejo Sigûrd) → índice 0-based = 3
            List.of(3),

            // ── Estadísticas ──────────────────────────────────────────────────
            // fuerza=10 (mod 0), agilidad=10 (mod 0), presencia=6 (mod -2), resistencia=15 (mod 2)
            10,  0,
            10,  0,
             6, -2,
            15,  2,
            // vida, presagios, carga
            11, 1, 8,

            // ── Equipo base ───────────────────────────────────────────────────
            // plata, comida
            90, 3,
            // armaIdx: 4 = Cuchillo (d4+fuerza)
            4,
            // armaduraNivel: 0 = sin armadura
            0,

            // ── Equipo básico (tablas) ────────────────────────────────────────
            // contenedorResult: 6 = Burro
            6,
            // item1Result: 2 = Antorchas
            2,
            // item2Result: 9 = Escudo
            9,

            // ── Pergamino ────────────────────────────────────────────────────
            // wantsScroll: true → Gracia del santo muerto (sagrado idx 1)
            true,
            1,   // perScrollTipo: 1 = sagrado
            1,   // perScrollIdx: 1 = Gracia del santo muerto

            // ── Pergamino esotérico (solo Ermitaño) ───────────────────────────
            null, null,

            // ── Rasgos ────────────────────────────────────────────────────────
            // rasgoTerrible1: 6 = Egocéntrico
             6,
            // rasgoTerrible2: 14 = Sospechoso
            14,
            // cuerpoRoto: 13 = Temblor y tartamudeo por daño nervioso o estrés
            13,
            // habito: 20 = Haces joyas con los dientes de los muertos
            20,
            // historiaperturbadora: 16 = En guerra permanente con todos los córvidos
            16
        );
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
}
