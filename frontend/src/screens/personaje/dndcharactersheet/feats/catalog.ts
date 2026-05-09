import {
  FEAT_ATTRIBUTE_OPTIONS,
  FEAT_LANGUAGE_OPTIONS,
  FEAT_SKILL_OPTIONS,
  MAGIC_INITIATE_CLASS_OPTIONS,
  WEAPON_MASTER_OPTIONS,
} from "./constants";
import {
  buildFeat,
  hasAbilityScore,
  hasCompetency,
  hasSpellcasting,
} from "./helpers";
import type { FeatOption } from "./types";

export const FEAT_OPTIONS: FeatOption[] = [
  buildFeat({
    id: "actor",
    nombre: "Actor",
    descripcion:
      "Ventaja en Engano e Interpretacion al hacerte pasar por otra persona. Puedes imitar voces y sonidos tras escucharlos durante 1 minuto.",
    requisitos: [],
    fixedBonuses: { Carisma: 1 },
  }),
  buildFeat({
    id: "alerta",
    nombre: "Alerta",
    descripcion:
      "+5 a iniciativa. No puedes ser sorprendido mientras seas consciente y las criaturas ocultas no ganan ventaja por no ser vistas.",
    requisitos: [],
  }),
  buildFeat({
    id: "atleta",
    nombre: "Atleta",
    descripcion:
      "Levantarte del suelo cuesta 5 pies. Mejoras saltos y escaladas con impulso.",
    requisitos: [],
    selectableBonus: {
      count: 1,
      amount: 1,
      options: ["Fuerza", "Destreza"],
    },
  }),
  buildFeat({
    id: "cargador",
    nombre: "Cargador",
    descripcion:
      "Tras usar la accion de Correr puedes hacer un ataque cuerpo a cuerpo o empujar como accion adicional.",
    requisitos: [],
  }),
  buildFeat({
    id: "duelista-defensivo",
    nombre: "Duelista defensivo",
    descripcion:
      "Mientras portes un arma sutil con la que seas competente, puedes usar tu reaccion para sumar tu bonificador por competencia a la CA contra un ataque cuerpo a cuerpo.",
    requisitos: ["Destreza 13 o mas"],
    validate: (character) => hasAbilityScore(character, "Destreza", 13),
  }),
  buildFeat({
    id: "explorador-de-mazmorras",
    nombre: "Explorador de mazmorras",
    descripcion:
      "Ventaja para detectar puertas secretas y trampas, y resistencia a dano de trampas.",
    requisitos: [],
  }),
  buildFeat({
    id: "duradero",
    nombre: "Duradero",
    descripcion:
      "Al gastar dados de golpe, el minimo que recuperas por dado es el doble de tu modificador de Constitucion.",
    requisitos: ["Constitucion 13 o mas"],
    validate: (character) => hasAbilityScore(character, "Constitucion", 13),
    fixedBonuses: { Constitucion: 1 },
  }),
  buildFeat({
    id: "adepto-elemental",
    nombre: "Adepto elemental",
    descripcion:
      "Tus conjuros ignoran resistencia al tipo elegido y los 1 del dano se tratan como 2.",
    requisitos: ["Poder lanzar al menos un conjuro"],
    validate: (character) => hasSpellcasting(character),
  }),
  buildFeat({
    id: "agarrador",
    nombre: "Agarrador",
    descripcion:
      "Ventaja al atacar criaturas apresadas por ti y puedes inmovilizarte con el objetivo.",
    requisitos: ["Fuerza 13 o mas"],
    validate: (character) => hasAbilityScore(character, "Fuerza", 13),
  }),
  buildFeat({
    id: "gran-maestro-de-armas",
    nombre: "Gran maestro de armas",
    descripcion:
      "Puedes hacer un ataque adicional tras un critico o derribar a 0 PG, y cambiar precision por dano con armas pesadas.",
    requisitos: ["Fuerza 13 o mas"],
    validate: (character) => hasAbilityScore(character, "Fuerza", 13),
  }),
  buildFeat({
    id: "ligeramente-acorazado",
    nombre: "Ligeramente acorazado",
    descripcion: "Ganas competencia con armaduras ligeras.",
    requisitos: [],
    selectableBonus: {
      count: 1,
      amount: 1,
      options: ["Fuerza", "Destreza"],
    },
  }),
  buildFeat({
    id: "fuertemente-acorazado",
    nombre: "Fuertemente acorazado",
    descripcion: "Ganas competencia con armaduras pesadas.",
    requisitos: ["Competencia con armadura ligera y media"],
    validate: (_, classCompetencies) =>
      hasCompetency(
        classCompetencies,
        "armaduras ligeras",
        "armadura ligera",
      ) &&
      hasCompetency(classCompetencies, "armaduras medias", "armadura media"),
    fixedBonuses: { Fuerza: 1 },
  }),
  buildFeat({
    id: "maestro-armaduras-pesadas",
    nombre: "Maestro en armaduras pesadas",
    descripcion:
      "Mientras vistas armadura pesada, el dano contundente, cortante y perforante no magico se reduce en 3.",
    requisitos: ["Competencia con armadura pesada"],
    validate: (_, classCompetencies) =>
      hasCompetency(classCompetencies, "armaduras pesadas", "armadura pesada"),
    fixedBonuses: { Fuerza: 1 },
  }),
  buildFeat({
    id: "lider-inspirador",
    nombre: "Lider inspirador",
    descripcion:
      "Tras un discurso de 10 minutos, hasta seis criaturas ganan PG temporales iguales a tu nivel + mod. Carisma.",
    requisitos: ["Carisma 13 o mas"],
    validate: (character) => hasAbilityScore(character, "Carisma", 13),
  }),
  buildFeat({
    id: "mente-prodigiosa",
    nombre: "Mente prodigiosa",
    descripcion:
      "Siempre sabes orientarte, recuerdas lo visto u oido el ultimo mes y conoces la hora aproximada del dia.",
    requisitos: ["Inteligencia 13 o mas"],
    validate: (character) => hasAbilityScore(character, "Inteligencia", 13),
    fixedBonuses: { Inteligencia: 1 },
  }),
  buildFeat({
    id: "linguista",
    nombre: "Lingüista",
    descripcion: "Aprendes tres idiomas y puedes crear cifrados sencillos.",
    descripcionCompleta:
      "Aumentas tu Inteligencia en 1, hasta un maximo de 20. Aprendes tres idiomas a tu eleccion y puedes elaborar por escrito cifrados y mensajes codificados que otras criaturas no pueden descifrar sin tiempo o ayuda adecuada.",
    requisitos: ["Inteligencia 13 o mas"],
    validate: (character) => hasAbilityScore(character, "Inteligencia", 13),
    fixedBonuses: { Inteligencia: 1 },
    selectableLanguages: {
      count: 3,
      options: FEAT_LANGUAGE_OPTIONS,
    },
  }),
  buildFeat({
    id: "afortunado",
    nombre: "Afortunado",
    descripcion:
      "Obtienes tres puntos de suerte por descanso largo para repetir ataques, pruebas o salvaciones.",
    requisitos: [],
  }),
  buildFeat({
    id: "mata-magos",
    nombre: "Mata magos",
    descripcion:
      "Ventaja en salvaciones contra conjuros a 5 pies y ataques de oportunidad cuando lanzan conjuros.",
    requisitos: [],
  }),
  buildFeat({
    id: "iniciado-en-la-magia",
    nombre: "Iniciado en la magia",
    descripcion:
      "Aprendes dos trucos y un conjuro de nivel 1 de una lista de clase.",
    requisitos: [],
    descripcionCompleta:
      "Elige una clase entre bardo, brujo, clerigo, druida, hechicero o mago. Aprendes dos trucos y un conjuro de nivel 1 de esa lista. El conjuro de nivel 1 puede lanzarse una vez por descanso largo sin gastar espacios, y tambien puedes lanzarlo con tus propios espacios si mas adelante obtienes Lanzamiento de Conjuros o Magia de Pacto.",
    spellSelection: {
      chooseClass: true,
      classOptions: MAGIC_INITIATE_CLASS_OPTIONS,
      cantrips: 2,
      spells: 1,
      spellLevel: 1,
    },
  }),
  buildFeat({
    id: "adepto-marcial",
    nombre: "Adepto marcial",
    descripcion:
      "Aprendes dos maniobras de maestro de batalla y ganas un dado de superioridad d6.",
    requisitos: ["Competencia con armas marciales"],
    validate: (_, classCompetencies) =>
      hasCompetency(classCompetencies, "armas marciales", "arma marcial"),
  }),
  buildFeat({
    id: "moderadamente-acorazado",
    nombre: "Moderadamente acorazado",
    descripcion: "Ganas competencia con armaduras medias y escudos.",
    requisitos: ["Competencia con armadura ligera"],
    validate: (_, classCompetencies) =>
      hasCompetency(classCompetencies, "armaduras ligeras", "armadura ligera"),
    selectableBonus: {
      count: 1,
      amount: 1,
      options: ["Fuerza", "Destreza"],
    },
  }),
  buildFeat({
    id: "maestro-armaduras-medias",
    nombre: "Maestro en armaduras medias",
    descripcion:
      "No tienes desventaja en Sigilo con armadura media y puedes sumar hasta +3 de Destreza a la CA.",
    requisitos: ["Competencia con armadura media"],
    validate: (_, classCompetencies) =>
      hasCompetency(classCompetencies, "armaduras medias", "armadura media"),
  }),
  buildFeat({
    id: "movil",
    nombre: "Móvil",
    descripcion:
      "+10 pies de movimiento y no provocas ataques de oportunidad de criaturas a las que hayas atacado.",
    requisitos: [],
  }),
  buildFeat({
    id: "observador",
    nombre: "Observador",
    descripcion:
      "+5 a Percepcion e Investigacion pasivas y puedes leer labios si entiendes el idioma.",
    requisitos: [],
    selectableBonus: {
      count: 1,
      amount: 1,
      options: ["Inteligencia", "Sabiduria"],
    },
  }),
  buildFeat({
    id: "amo-de-armas-de-asta",
    nombre: "Amo de armas de asta",
    descripcion:
      "Obtienes ataque adicional con la culata y ataques de oportunidad cuando entran en tu alcance.",
    requisitos: [],
  }),
  buildFeat({
    id: "resiliente",
    nombre: "Resiliente",
    descripcion:
      "Ganas competencia en tiradas de salvacion de una caracteristica elegida.",
    requisitos: [],
    selectableBonus: {
      count: 1,
      amount: 1,
      options: FEAT_ATTRIBUTE_OPTIONS,
    },
  }),
  buildFeat({
    id: "lanzador-ritual",
    nombre: "Lanzador ritual",
    descripcion:
      "Obtienes un libro ritual y puedes lanzar conjuros con la etiqueta ritual desde el.",
    requisitos: ["Inteligencia 13 o Sabiduria 13"],
    validate: (character) =>
      hasAbilityScore(character, "Inteligencia", 13) ||
      hasAbilityScore(character, "Sabiduria", 13),
  }),
  buildFeat({
    id: "atacante-salvaje",
    nombre: "Atacante salvaje",
    descripcion:
      "Una vez por turno puedes repetir los dados de dano de un ataque cuerpo a cuerpo y usar cualquiera de los resultados.",
    requisitos: [],
  }),
  buildFeat({
    id: "centinela",
    nombre: "Centinela",
    descripcion:
      "Detienes enemigos con ataques de oportunidad y castigas a quienes ataquen a tus aliados.",
    requisitos: [],
  }),
  buildFeat({
    id: "tirador-experto",
    nombre: "Tirador experto",
    descripcion:
      "Ignoras cobertura parcial, largo alcance sin desventaja y puedes cambiar precision por dano con armas a distancia.",
    requisitos: ["Destreza 13 o mas"],
    validate: (character) => hasAbilityScore(character, "Destreza", 13),
  }),
  buildFeat({
    id: "maestro-de-escudo",
    nombre: "Maestro de escudo",
    descripcion:
      "Puedes empujar con accion adicional tras atacar y sumar el bono del escudo a salvaciones de Destreza.",
    requisitos: ["Competencia con escudos"],
    validate: (_, classCompetencies) =>
      hasCompetency(classCompetencies, "escudos", "escudo"),
  }),
  buildFeat({
    id: "habilidoso",
    nombre: "Habilidoso",
    descripcion:
      "Ganas competencia en tres habilidades o herramientas a tu eleccion.",
    requisitos: [],
    descripcionCompleta:
      "Obtienes competencia en cualquier combinacion de tres habilidades o herramientas de tu eleccion. En esta hoja, la seleccion se aplica a tres habilidades basicas de DnD.",
    selectableSkills: {
      count: 3,
      options: FEAT_SKILL_OPTIONS,
    },
  }),
  buildFeat({
    id: "escurridizo",
    nombre: "Escurridizo",
    descripcion:
      "Puedes esconderte con cobertura ligera y las criaturas tienen desventaja para detectarte en penumbra.",
    requisitos: ["Destreza 13 o mas"],
    validate: (character) => hasAbilityScore(character, "Destreza", 13),
  }),
  buildFeat({
    id: "francotirador-conjuros",
    nombre: "Francotirador de conjuros",
    descripcion:
      "Doblas el alcance de conjuros con tirada de ataque y aprendes un truco adicional.",
    requisitos: ["Poder lanzar al menos un conjuro"],
    validate: (character) => hasSpellcasting(character),
    descripcionCompleta:
      "Doblas el alcance de los conjuros que requieren tirada de ataque y aprendes un truco adicional de una lista apropiada de lanzador. Ese truco pasa a formar parte de tus aptitudes conocidas.",
    spellSelection: {
      cantrips: 1,
      spells: 0,
      cantripClassOptions: MAGIC_INITIATE_CLASS_OPTIONS,
    },
  }),
  buildFeat({
    id: "maton-de-taberna",
    nombre: "Matón de taberna",
    descripcion:
      "Competencia con armas improvisadas, golpe desarmado mejorado y agarre como accion adicional.",
    requisitos: [],
    selectableBonus: {
      count: 1,
      amount: 1,
      options: ["Fuerza", "Constitucion"],
    },
  }),
  buildFeat({
    id: "duro",
    nombre: "Duro",
    descripcion:
      "Tus puntos de golpe maximos aumentan en el doble de tu nivel actual y 2 mas por nivel futuro.",
    requisitos: [],
  }),
  buildFeat({
    id: "lanzador-de-guerra",
    nombre: "Lanzador de guerra",
    descripcion:
      "Ventaja para mantener concentracion y puedes lanzar conjuros como ataque de oportunidad.",
    requisitos: ["Poder lanzar al menos un conjuro"],
    validate: (character) => hasSpellcasting(character),
  }),
  buildFeat({
    id: "maestro-de-armas",
    nombre: "Maestro de armas",
    descripcion:
      "Aumentas tu Fuerza o Destreza en 1 y ganas competencia con cuatro armas simples o marciales a eleccion.",
    requisitos: [],
    selectableBonus: {
      count: 1,
      amount: 1,
      options: ["Fuerza", "Destreza"],
    },
    selectableCompetencies: {
      count: 4,
      options: WEAPON_MASTER_OPTIONS,
    },
  }),
];
