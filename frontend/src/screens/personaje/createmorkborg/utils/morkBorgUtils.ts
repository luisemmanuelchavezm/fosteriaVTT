// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface MorkBorgClassOpcion {
  numero: string;
  nombre: string;
  descripcion: string;
}

export interface MorkBorgClass {
  id: string;
  nombre: string;
  insignia: string;
  /** Párrafo de sabor */
  descripcion: string;
  /** Rasgos fijos: modificadores de atributos, habilidades pasivas, etc. */
  rasgos: string[];
  /** Encabezado que describe qué son las opciones */
  descripcionOpciones?: string;
  /** Lista de opciones numeradas (equipo, especialidades, poderes…) */
  opciones?: MorkBorgClassOpcion[];
}

// ─── Clases ───────────────────────────────────────────────────────────────────

export const MORK_BORG_CLASSES: MorkBorgClass[] = [
  {
    id: "sin-clase",
    nombre: "Sin clase",
    insignia: "SC",
    descripcion:
      "En este mundo hay quienes buscan la riqueza o la redención. Algunos dicen que del apocalipsis se puede escapar, que incluso se podría detener. Y ahí caminas entre la discordia y la desesperación.",
    rasgos: [],
  },

  {
    id: "desertor-colmilludo",
    nombre: "Desertor Colmilludo",
    insignia: "DC",
    descripcion:
      "Tienes una treintena de amigos que nunca te defraudan: TUS DIENTES. Desleal, trastornado o simplemente incontrolable, cualquier grupo que no te haya echado, lo dejaste de todos modos. Pero tu parlamento de dientes (enormes, salientes, gruesos y afilados), siempre ha sido tu aliado.",
    rasgos: [
      "Fuerte como un toro: tira 3d6+2 para Fuerza.",
      "No eres una lumbrera: tira 3d6−1 para Agilidad y Presencia. Las pruebas de Agilidad normales son CD14 en lugar de DR12, excluida la defensa.",
      "Analfabeto: eres incapaz de entender pergaminos. Si comienzas con uno, vuelve a tirar, cómetelo o úsalo como papel higiénico.",
      "Ataque de mordisco: CD10 para atacar, d6 de daño. Debes estar cerca de tu objetivo. 1-2 en d6 posibilidades de que el enemigo obtenga un ataque gratis.",
    ],
    descripcionOpciones: "Comienzas con uno de los siguientes:",
    opciones: [
      {
        numero: "1",
        nombre: "Máscara de monstruo arrugada",
        descripcion:
          "Infunde miedo primitivo en criaturas menores como goblins, gnoums y niños. Mientras la uses, harán pruebas de Moral en cada asalto.",
      },
      {
        numero: "2",
        nombre: "La cimitarra marrón de Galgenbeck",
        descripcion:
          "Una espada apestosa que sacaste de una letrina militar. Daño D6. DR10 ataque y defensa mientras la manejas. Hay una probabilidad de 1 entre 6 de que un enemigo herido sufra una potente sepsis y muera en 10 minutos.",
      },
      {
        numero: "3",
        nombre: "Dientes de mago",
        descripcion:
          "Cuatro extraños dientes traquetean dentro de una bolsa ennegrecida. Antes de la batalla, tira un d6 por cada uno. Por cada 6, uno de tus ataques causa el daño máximo.",
      },
      {
        numero: "4",
        nombre: "Honda del viejo Sigûrd",
        descripcion:
          "Sigûrd fue el hombre más fuerte al que le has roído la garganta. Tejida con su larga cabellera gris, esta honda nunca te ha fallado. 2d4 de daño, requiere rocas del tamaño de un puño que, quizás lamentablemente, están por todas partes.",
      },
      {
        numero: "5",
        nombre: "Viejo sabueso",
        descripcion:
          "Asmática, engañada y en sus últimas patas, esta criatura arrugada todavía tiene un olfato soberbio y puede olfatear tesoros en los escombros más repugnantes. Ataca con CD10 (mordisco d6). Defiende con CD12, 10 PV. Se vuelve frenético cuando hay goblins y berserkers alrededor.",
      },
      {
        numero: "6",
        nombre: "La herradura del caballo de la Muerte",
        descripcion:
          "Parece normal, pero desde que la encontraste en una oscura cripta estás convencido de que esta herradura proviene del mismísimo caballo de la Muerte. En tus manos golpea con CD10, d4 de daño. Hay una probabilidad de 1 entre 6 de que la herradura rompa el cráneo, matando instantáneamente a criaturas de tamaño pequeño o mediano. La herradura vuelve a tu mano como un bumerán.",
      },
    ],
  },

  {
    id: "escoria-alcantarillas",
    nombre: "Escoria nacida en las alcantarillas",
    insignia: "EAL",
    descripcion:
      "Una mala estrella sonrió tu nacimiento. La pobreza, el crimen y la mala crianza tampoco ayudaron. En tu comunidad, un día de trabajo honrado nunca fue una opción. No es que lo hayas probado alguna vez, ¿qué eres?, ¿algún tipo de tonto? Una hoja de afeitar y una noche sin luna vale tanto como una semana de trabajo inútil.",
    rasgos: [
      "Pequeño: tira 3d6−2 para Fuerza.",
      "Sigiloso: todas las pruebas de Presencia y Agilidad tienen su CD reducido en 2 (las pruebas normales son CD10 en lugar de CD12).",
      "Tira d6 en la tabla de armas y d2 en la tabla de armaduras.",
      "Mejora especial: la primera vez que mejores, lanza otra especialidad. A partir de la segunda, puedes volver a tirar una o las dos.",
    ],
    descripcionOpciones: "Comienzas con una especialidad:",
    opciones: [
      {
        numero: "1",
        nombre: "El pinchazo del cobarde",
        descripcion:
          "Al atacar por sorpresa, haz una prueba de Agilidad CD10. Si tienes éxito, golpeas automáticamente una vez con un arma ligera de una mano, lo que causa daño normal +3.",
      },
      {
        numero: "2",
        nombre: "Dedos sucios",
        descripcion:
          "Tus pequeños dedos serpenteantes se meten en los bolsillos y abren cerraduras con una prueba de Agilidad CD8. ¡También comienzas con ganzúas!",
      },
      {
        numero: "3",
        nombre: "Escupidor abominable",
        descripcion:
          "Tu flema es viscosa, grumosa, vil y balísticamente precisa a corta distancia. Puedes escupir d2 veces durante una pelea. Realiza una prueba de Presencia CD8 para atinar. Los objetivos quedan cegados, con arcadas y vómitos durante d4 asaltos. Cualquiera que sea testigo, amigos y enemigos, debe hacer una prueba de Resistencia para no vomitar también (CD10 para PJs, CD12 para enemigos).",
      },
      {
        numero: "4",
        nombre: "Escapar del destino",
        descripcion:
          "Cada vez que uses un presagio, hay un 50% de probabilidad de que no se gaste.",
      },
      {
        numero: "5",
        nombre: "Sigilo excretor",
        descripcion:
          "Tienes una habilidad asombrosa, casi sobrenatural, para esconderte en el lodo, los escombros y la suciedad. Cuando estás oculto en estas condiciones, se requiere una prueba de Presencia CD16 para descubrirte.",
      },
      {
        numero: "6",
        nombre: "Esquivar la muerte",
        descripcion:
          "Eres tan desagradable, irrelevante, repugnante y vil que incluso la Muerte preferiría evitarte si pudiera. Al morir, si existe la más mínima posibilidad de que hayas sobrevivido, hay un 50% de probabilidad de que lo hayas hecho. Si tienes éxito, después de 10 asaltos vuelves a aparecer con d4 PV y una explicación poco probable de tu escapatoria.",
      },
    ],
  },

  {
    id: "ermitano-esoterico",
    nombre: "Ermitaño esotérico",
    insignia: "EE",
    descripcion:
      "La piedra de tu cueva es una con las estrellas. Silencio y perfección. Ahora el caos de un mundo caído perturba tus rituales y la placenta de la noche se vuelve más negra que la penumbra de tu caverna. ¡Irritante!",
    rasgos: [
      "Sabio: tira 3d6+2 para Presencia.",
      "Débil: tira 3d6−2 para Fuerza.",
      "Equipo inicial ordinario más un pergamino aleatorio (sagrado o impuro).",
      "Tira un d4 en la tabla de armas y un d2 en la tabla de armaduras.",
    ],
    descripcionOpciones: "Comienzas con uno de los siguientes:",
    opciones: [
      {
        numero: "1",
        nombre: "Maestro del Destino",
        descripcion:
          "¿De qué sirven los mapas cuando la sustancia de la causalidad misma está abierta a ti? Conoces el camino correcto con una prueba de Presencia CD8.",
      },
      {
        numero: "2",
        nombre: "Un libro de sangre hirviendo",
        descripcion:
          "Puede abrir y leer este libro una vez al día. Tu enemigo debe realizar una prueba CD12 para evitarlo. Si falla, D2 berserker asesinos aparecen desde las profundidades de una dimensión de sangre olvidada. Tira un D6: con 1–4 luchan a tu lado; con 5-6 se vuelven contra ti intentando matarte y destruir el libro. Tras la batalla regresan a su encierro.",
      },
      {
        numero: "3",
        nombre: "Portavoz de verdades",
        descripcion:
          "Dos veces al día usa tu sabiduría, conocimiento, consejo y calma interior para aportar claridad a una criatura que elijas. La CD de la siguiente prueba que realice se reduce en 4.",
      },
      {
        numero: "4",
        nombre: "Iniciado del Colegio Invisible",
        descripcion:
          "Una vez al día puedes invocar D2 pergaminos cuyo poder solo se puede usar una vez. Tira un d4: con 1-2 los pergaminos son sagrados; con 3-4, impuros. Si no se usan antes del amanecer, se convierten en cenizas.",
      },
      {
        numero: "5",
        nombre: "Bardo de los Eternos",
        descripcion:
          "Aprendiste tus melodías en el Otro Mundo. La música de tu arpa da +D4 en las tiradas de reacción.",
      },
      {
        numero: "6",
        nombre: "Halcón como arma",
        descripcion:
          "Tu astuto halcón casi inteligente es leal solo a ti. Incluso sin compartir lenguaje, entiendes sus gritos mientras vigila, explora y ataca a los enemigos. Ataca/defiende CD10 (garras/mordisco D4), PV 8.",
      },
    ],
  },

  {
    id: "realeza-desgracia",
    nombre: "Realeza en desgracia",
    insignia: "RD",
    descripcion:
      "Abrumado solo por los recuerdos de tu propia gloria perdida, no podrías someterte a nadie más. ¡Tú no, de sangre noble! (No es que esperes que alguno de estos peones comprenda la profundidad de tu dolor.)",
    rasgos: [
      "Dolorosamente mediocre: no ajustas ninguna característica.",
      "Tira un d8 en la tabla de armas.",
      "Tira un d4 en la tabla de armaduras, pero vuelve a tirar si recibes una armadura pesada.",
    ],
    descripcionOpciones: "Comienzas con dos de los siguientes:",
    opciones: [
      {
        numero: "1",
        nombre: "La espada de tus antepasados",
        descripcion:
          "Esta magnífica y claramente mágica espada parlante es caprichosa, poco fiable y te desprecia en silencio. Se burla de tus fracasos y, si la decepcionas continuamente, tiene una probabilidad de 1 entre 6 de atacarte 'accidentalmente' a ti o a tus compañeros. Inflige d6+1 de daño. La CD de Ataque/Defensa es 10.",
      },
      {
        numero: "2",
        nombre: '"Poltroon" el bufón de la Corte',
        descripcion:
          "Si bien es prácticamente inútil, personalmente irritante y emocionalmente agotador, las cabriolas de Poltroon en realidad hacen que los enemigos pierdan la concentración en combate. Durante los dos primeros asaltos, tú y tus aliados obtenéis +2 en ataque/defensa.",
      },
      {
        numero: "3",
        nombre: "Barbarister el caballo increíble",
        descripcion:
          "Barbarister es mágico, inteligente, arrogante y vanidoso. También puede hablar. Si puedes persuadirle de que se involucre, Barbarister ocasionalmente suma +2 a las pruebas de Presencia que impliquen lógica e intelecto. El caballo puede ser más inteligente que tú y es muy consciente de ello.",
      },
      {
        numero: "4",
        nombre: "Hamfund el escudero",
        descripcion:
          "Este sirviente intensamente cobarde actúa solo como guardián de la vaina de la espada maldita Eurekia. Una vez por combate, si se puede encontrar a Ham, se puede desenvainar a Eurekia. La espada hace 2d6 de daño y por cada golpe tira un d6. Con un 1, el escudero muere y Eurekia desaparece para siempre.",
      },
      {
        numero: "5",
        nombre: "El regalo de piel de serpiente",
        descripcion:
          "Una costosa caja de sándalo revestida en piel de serpiente. Contiene una daga aparentemente normal, envuelta en seda. La daga hace d4 de daño pero con un 1 el objetivo muere inmediatamente por el veneno mortal que sale de la hoja.",
      },
      {
        numero: "6",
        nombre: "¡Cuerno de los señores de Schleswig!",
        descripcion:
          "Una vez al día, suelta un estruendo de esta vieja trompeta abollada y tira Presencia CD12. Una criatura puede hacer que su próxima prueba que no sea de combate sea un éxito automático.",
      },
    ],
  },

  {
    id: "sacerdote-hereje",
    nombre: "Sacerdote Hereje",
    insignia: "SH",
    descripcion:
      "Perseguido por los Basiliscos de Dos Cabezas de la Única Fe Verdadera, se puede encontrar a este hereje delirando en las ruinas, recorriendo interminablemente caminos polvorientos y profanando catedrales por la noche.",
    rasgos: [
      "Perspicaz: tira 3d6+2 para Presencia.",
      "Frágil: tira 3d6−2 para Fuerza.",
      "Tira un d8 en la tabla de armas y puedes usar Poderes mientras usas armadura media.",
    ],
    descripcionOpciones: "Comienzas con uno de los siguientes:",
    opciones: [
      {
        numero: "1",
        nombre: "Sagrado cayado del pastor",
        descripcion:
          "Su cabeza es un garfio de hueso humano con inscripciones de antioraciones superpuestas. Este cayado atraviesa otros mundos. El bastón hace 2d4 de daño excepto a los humanos infieles.",
      },
      {
        numero: "2",
        nombre: "Mitra robada",
        descripcion:
          "Mientras usa este sombrero sagrado, el infame cuerpo del sacerdote se desvanece, volviéndose difícil de golpear en combate (Defensa CD10). Si se coloca sobre las orejas fuera de la batalla, el sacerdote se vuelve casi invisible, tirando sigilo contra CD8.",
      },
      {
        numero: "3",
        nombre: "Lista de pecados",
        descripcion:
          "Un documento largo y preciso con referencias cruzadas con la realidad para descubrir malhechores invisibles. Presencia exitosa CD10: una luz extraña rodea a las criaturas malignas. El dueño de la lista se defiende con +2 contra cualquier ser descubierto de esta manera.",
      },
      {
        numero: "4",
        nombre: "La Biblia blasfema de Nechrubel",
        descripcion:
          "Tan intensamente blasfema que incluso los mismos sacerdotes solo pueden leerla una vez al día. Cuando se lee, lanza un dado. Resultado par: durante el resto del día, los PJs recuperan d4 PV después de solo cinco minutos de descanso. Resultado impar: el sacerdote sufre alucinaciones demoníacas durante el resto del día (el DM inventa d3 cosas que solo el sacerdote puede ver y las describe como verdaderas).",
      },
      {
        numero: "5",
        nombre: "Piedras del Templo Perdido de Thel-Emas",
        descripcion:
          "Arroja las piedras al suelo. Su patrón revela si el peligro acecha en una habitación adyacente. Las piedras pueden mentir. El sacerdote hace una prueba de Presencia CD10 para ver si son verdaderas, pero después de fallar no puede volver a probar hasta que se haya puesto el sol.",
      },
      {
        numero: "666",
        nombre: "Crucifijo (Jesús invertido)",
        descripcion:
          "El crucifijo se puede usar en encuentros con no muertos, así como con trolls y goblins menores. Tira por Moral (suma o resta el modificador de Presencia del sacerdote) para ver si las criaturas se inclinan y se retiran amablemente.",
      },
    ],
  },

  {
    id: "herborista-ocultista",
    nombre: "Herborista Ocultista",
    insignia: "HO",
    descripcion:
      "Nacido del hongo, criado en el claro, observado por el ojo de la luna en un estanque negro plateado.",
    rasgos: [
      "Duro como la madera: tira 3d6+2 para Resistencia.",
      "Bajo en proteínas: tira 3d6−2 para Fuerza.",
      "Tira d6 en la tabla de armas y d2 en la tabla de armaduras.",
      "Lleva un laboratorio portátil y busca continuamente los ingredientes que se gastan con frecuencia.",
      "Diariamente tiene materiales para crear dos decocciones determinadas al azar (d4 dosis cada una). Si no se usan, pierden vitalidad después de 24 horas.",
    ],
    descripcionOpciones:
      "Tabla de decocciones (tira 2 al día de forma aleatoria):",
    opciones: [
      {
        numero: "1",
        nombre: "Veneno rojo",
        descripcion: "Resistencia CD12 o −d10 PV.",
      },
      {
        numero: "2",
        nombre: "Vapores de Ezumiels",
        descripcion:
          "Pasa una prueba CD14 o alucinaciones graves (y posiblemente divertidas) durante d4 horas.",
      },
      {
        numero: "3",
        nombre: "Estofado de rana sureña",
        descripcion:
          "Vomita durante d4 horas; pasa una prueba CD14 o no puedes hacer nada más.",
      },
      {
        numero: "4",
        nombre: "Elixir Vitalis",
        descripcion: "Cura d6 PV y detiene la infección. Puede crear hábito.",
      },
      {
        numero: "5",
        nombre: "Sopa de araña-búho",
        descripcion:
          "Ver en la oscuridad y trepar por las paredes durante 30 minutos.",
      },
      {
        numero: "6",
        nombre: "Filtro de Fernor",
        descripcion:
          "Aceite translúcido, debe aplicarse directamente en el ojo. Cura la infección y da +2 en las pruebas de Presencia durante d4 horas.",
      },
      {
        numero: "7",
        nombre: "Rapé enervante de Hyphos",
        descripcion:
          "¡Berserker! Dos ataques por asalto pero defiende con CD14. Dura una pelea. Debe ser inhalado; provoca estornudos.",
      },
      {
        numero: "8",
        nombre: "Veneno negro",
        descripcion: "Resistencia CD14 o −d6 PV y cegado durante una hora.",
      },
    ],
  },
];

// ─── Fases de creación ────────────────────────────────────────────────────────

export interface MorkBorgCreationPhase {
  id: string;
  title: string;
}

export const MORK_BORG_CREATION_PHASES: MorkBorgCreationPhase[] = [
  { id: "class", title: "Clase" },
  { id: "stats", title: "Estadísticas" },
  { id: "equipment", title: "Equipo" },
  { id: "traits", title: "Rasgos" },
];

// ─── Estadísticas ─────────────────────────────────────────────────────────────

export interface MorkBorgStat {
  id: string;
  label: string;
  abbr: string;
}

export const MORK_BORG_STATS: MorkBorgStat[] = [
  { id: "fuerza", label: "Fuerza", abbr: "FUE" },
  { id: "agilidad", label: "Agilidad", abbr: "AGI" },
  { id: "presencia", label: "Presencia", abbr: "PRE" },
  { id: "resistencia", label: "Resistencia", abbr: "RES" },
];

// Modificadores de atributo por clase (sólo los que difieren de 3d6)
const CLASS_STAT_EXPRESSIONS: Record<
  string,
  Partial<Record<string, string>>
> = {
  "desertor-colmilludo": {
    fuerza: "3d6+2",
    agilidad: "3d6-1",
    presencia: "3d6-1",
  },
  "escoria-alcantarillas": { fuerza: "3d6-2" },
  "ermitano-esoterico": { presencia: "3d6+2", fuerza: "3d6-2" },
  "sacerdote-hereje": { presencia: "3d6+2", fuerza: "3d6-2" },
  "herborista-ocultista": { resistencia: "3d6+2", fuerza: "3d6-2" },
};

/** Expresión de dados para una estadística según la clase elegida. */
export function getMbStatExpression(
  classId: string | undefined,
  statId: string,
): string {
  if (!classId) return "3d6";
  // Sin clase: 4d6, descarta el menor (se gestiona en MorkBorgStatsSection)
  if (classId === "sin-clase") return "4d6";
  return CLASS_STAT_EXPRESSIONS[classId]?.[statId] ?? "3d6";
}

/** Indica si la clase usa la regla de 4d6 descarta el menor. */
export function mbUsesDropLowest(classId: string | undefined): boolean {
  return classId === "sin-clase";
}

/** Convierte el total de la tirada al modificador de Mork Borg. */
export function getMbModifier(value: number): number {
  if (value <= 4) return -3;
  if (value <= 6) return -2;
  if (value <= 8) return -1;
  if (value <= 12) return 0;
  if (value <= 14) return 1;
  if (value <= 16) return 2;
  return 3;
}

/** Número de caras del dado de vida según la clase. */
const HP_DICE: Record<string, number> = {
  "desertor-colmilludo": 10,
  "escoria-alcantarillas": 6,
  "ermitano-esoterico": 4,
  "realeza-desgracia": 6,
  "sacerdote-hereje": 8,
  "herborista-ocultista": 6,
};

export function getMbHpDice(classId: string | undefined): number {
  if (!classId) return 8;
  return HP_DICE[classId] ?? 8;
}

// ─── Equipo ───────────────────────────────────────────────────────────────────

export const ID_SIN_CLASE = "sin-clase";

/** Entrada de cualquier tabla de equipo aleatorio. */
export interface MbTableEntry {
  /** Resultado del dado que activa esta entrada. */
  result: number;
  /** null → "Nada" */
  nombre: string | null;
  descripcion?: string;
  /** Si el resultado es un pergamino al azar, indica su tipo. */
  esScrollAleatorio?: "impuro" | "sagrado";
  /** Si el resultado permite elegir entre varias opciones anteriores. */
  esEleccion?: boolean;
}

// ── Tabla d6: contenedor (exclusiva de Sin Clase) ─────────────────────────────
export const MB_SIN_CLASE_CONTAINER_TABLE: MbTableEntry[] = [
  { result: 1, nombre: null },
  { result: 2, nombre: null },
  {
    result: 3,
    nombre: "Mochila",
    descripcion: "mochila para 7 artículos de tamaño normal",
  },
  {
    result: 4,
    nombre: "Saco",
    descripcion: "saco para 10 prendas de tamaño normal",
  },
  { result: 5, nombre: "Cofre pequeño", esEleccion: true },
  {
    result: 6,
    nombre: "Burro",
    descripcion: "burro, no está mal",
    esEleccion: true,
  },
];

// ── Tabla d12 nº1: objetos (exclusiva de Sin Clase) ───────────────────────────
export const MB_SIN_CLASE_ITEM_TABLE_1: MbTableEntry[] = [
  { result: 1, nombre: "Cuerda", descripcion: "cuerda de 30 pies" },
  { result: 2, nombre: "Antorchas", descripcion: "Presencia + 4 antorchas" },
  {
    result: 3,
    nombre: "Farol",
    descripcion: "farol con aceite para Presencia +6 horas",
  },
  { result: 4, nombre: "Tira de magnesio" },
  { result: 5, nombre: "Pergamino impuro", esScrollAleatorio: "impuro" },
  { result: 6, nombre: "Aguja afilada" },
  {
    result: 7,
    nombre: "Botiquín",
    descripcion:
      "Presencia + 4 usos. Detiene la hemorragia / infección y cura d6 PV",
  },
  { result: 8, nombre: "Lima de metal y ganzúas" },
  {
    result: 9,
    nombre: "Trampa para osos",
    descripcion: "Presencia DR14 para detectar, daño d8",
  },
  { result: 10, nombre: "Bomba", descripcion: "botella sellada, daño d10" },
  {
    result: 11,
    nombre: "Botella de veneno rojo",
    descripcion: "Resistencia CD12 o daño d10",
  },
  { result: 12, nombre: "Crucifijo de plata" },
];

// ── Tabla d12 nº2: objetos (exclusiva de Sin Clase) ───────────────────────────
export const MB_SIN_CLASE_ITEM_TABLE_2: MbTableEntry[] = [
  {
    result: 1,
    nombre: "Elixir de vida",
    descripcion: "d4 dosis. Cura d6 PV y elimina la infección",
  },
  { result: 2, nombre: "Pergamino sagrado", esScrollAleatorio: "sagrado" },
  {
    result: 3,
    nombre: "Perro pequeño pero feroz",
    descripcion: "d6+2 PV, mordisco d4. Solo obedece a su dueño",
  },
  {
    result: 4,
    nombre: "Monos",
    descripcion:
      "monos que te ignoran pero te quieren (d4+2 PV, puñetazo/mordisco d4)",
  },
  {
    result: 5,
    nombre: "Perfume exquisito",
    descripcion: "perfume exquisito por valor de 25s",
  },
  {
    result: 6,
    nombre: "Caja de herramientas",
    descripcion:
      "caja de herramientas 10 clavos, tenazas, martillo, sierra pequeña y taladro",
  },
  {
    result: 7,
    nombre: "Cadena pesada",
    descripcion: "cadena pesada de 15 pies",
  },
  { result: 8, nombre: "Gancho de escalada" },
  {
    result: 9,
    nombre: "Escudo",
    descripcion:
      "-1 PV de daño, o romper el escudo para ignorar un ataque completo",
  },
  { result: 10, nombre: "Palanca", descripcion: "1d4 daño" },
  {
    result: 11,
    nombre: "Manteca de cerdo",
    descripcion: "puede funcionar como 5 comidas en caso de necesidad",
  },
  { result: 12, nombre: "Tienda de campaña" },
];

// ── Tabla de armas (d10) ──────────────────────────────────────────────────────
export interface MbWeapon {
  idx: number;
  nombre: string;
  formula: string;
}

export const MB_WEAPONS: MbWeapon[] = [
  { idx: 1, nombre: "Fémur", formula: "d4+fuerza" },
  { idx: 2, nombre: "Bastón", formula: "d4+fuerza" },
  { idx: 3, nombre: "Espada corta", formula: "d4+fuerza" },
  { idx: 4, nombre: "Cuchillo", formula: "d4+fuerza" },
  { idx: 5, nombre: "Martillo de guerra", formula: "d6+fuerza" },
  { idx: 6, nombre: "Espada", formula: "d6+fuerza" },
  { idx: 7, nombre: "Arco", formula: "d6+presencia" },
  { idx: 8, nombre: "Mayal", formula: "d8+fuerza" },
  { idx: 9, nombre: "Ballesta", formula: "d8+presencia" },
  { idx: 10, nombre: "Zweihänder", formula: "d10+fuerza" },
];

// ── Tabla de armaduras ────────────────────────────────────────────────────────
export interface MbArmor {
  nivel: number;
  nombre: string;
  formula: string;
  descripcion?: string;
}

export const MB_ARMORS: MbArmor[] = [
  { nivel: 1, nombre: "Armadura ligera", formula: "d2" },
  {
    nivel: 2,
    nombre: "Armadura media",
    formula: "d4",
    descripcion: "CD+2 en pruebas de Agilidad, incluida la defensa.",
  },
  {
    nivel: 3,
    nombre: "Armadura pesada",
    formula: "d6",
    descripcion: "CD+4 en la prueba de Agilidad, la defensa es CD+2.",
  },
  {
    nivel: 4,
    nombre: "Escudo",
    formula: "-1",
    descripcion:
      "Puedes optar por ignorar todo el daño de un ataque pero el escudo se rompe.",
  },
];

/** Obtiene una entrada de la tabla de armas por su índice (1-10). */
export function getMbWeaponByIdx(idx: number): MbWeapon | null {
  return MB_WEAPONS.find((w) => w.idx === idx) ?? null;
}

/** @deprecated Usar getMbArmorByRoll en su lugar. */
export function getMbArmorByNivel(nivel: number): MbArmor | null {
  return MB_ARMORS.find((a) => a.nivel === nivel) ?? null;
}

/**
 * Obtiene la armadura por resultado de dado con la tabla de creación:
 *   1 → Nada · 2 → Armadura ligera · 3 → Armadura media · 4 → Armadura pesada
 * El Escudo (nivel 4 en MB_ARMORS) no aparece en la creación de personaje.
 */
export function getMbArmorByRoll(roll: number): MbArmor | null {
  if (roll <= 1) return null; // 1 = Nada
  // roll 2 → nivel 1, roll 3 → nivel 2, roll 4 → nivel 3
  return MB_ARMORS.find((a) => a.nivel === roll - 1) ?? null;
}

/**
 * Expresión de dado para la estadística de Presagios.
 * Ermitaño esotérico y Sacerdote Hereje usan 1d4; el resto 1d2.
 */
export function getMbPresagiosExpression(classId: string | undefined): string {
  if (classId === "ermitano-esoterico" || classId === "sacerdote-hereje")
    return "1d4";
  return "1d2";
}

/** Obtiene una entrada de cualquier tabla de objetos por resultado del dado. */
export function getMbTableEntry(
  table: MbTableEntry[],
  result: number,
): MbTableEntry | null {
  return table.find((e) => e.result === result) ?? null;
}

// ── Expresiones de dados por clase ────────────────────────────────────────────

/** Expresión de plata para la clase. El multiplicador × 10 se aplica en el handler. */
export function getMbPlataExpression(classId: string | undefined): string {
  switch (classId) {
    case "escoria-alcantarillas":
    case "ermitano-esoterico":
      return "1d6";
    case "sacerdote-hereje":
      return "3d6";
    case "realeza-desgracia":
      return "4d6";
    case "sin-clase":
    case "desertor-colmilludo":
    case "herborista-ocultista":
    default:
      return "2d6";
  }
}

/** Expresión de comida para la clase. Siempre 1d4 para todas las clases. */
export function getMbComidaExpression(): string {
  return "1d4";
}

/**
 * Expresión de dado para la tirada de arma inicial.
 * Todas las clases tienen tirada; las sin especificar usan el dado máximo (1d10).
 */
export function getMbArmaExpression(classId: string | undefined): string {
  switch (classId) {
    case "escoria-alcantarillas":
    case "herborista-ocultista":
      return "1d6";
    case "ermitano-esoterico":
      return "1d4";
    case "realeza-desgracia":
    case "sacerdote-hereje":
      return "1d8";
    case "sin-clase":
    case "desertor-colmilludo":
    default:
      return "1d10"; // dado máximo para clases sin especificar
  }
}

/**
 * Expresión de dado para la tirada de armadura inicial.
 * Todas las clases tienen tirada; las sin especificar usan el dado máximo (1d4).
 * Si el jugador elige empezar con pergamino, el componente usa "1d2" en su lugar.
 */
export function getMbArmaduraExpression(classId: string | undefined): string {
  switch (classId) {
    case "escoria-alcantarillas":
    case "ermitano-esoterico":
    case "herborista-ocultista":
      return "1d2";
    case "realeza-desgracia":
      return "1d4";
    case "sin-clase":
    case "desertor-colmilludo":
    case "sacerdote-hereje":
    default:
      return "1d4"; // dado máximo para clases sin especificar
  }
}

// ── Catálogos de pergaminos (para sub-tiradas al azar) ────────────────────────

export interface MbScroll {
  idx: number;
  nombre: string;
  descripcion: string;
}

export const MB_IMPURE_SCROLLS: MbScroll[] = [
  {
    idx: 1,
    nombre: "Las palmeras abren la Puerta del Sur",
    descripcion:
      "Una bola de fuego golpea a d2 criaturas e inflige d8 de daño por criatura.",
  },
  {
    idx: 2,
    nombre: "Lengua de Eris",
    descripcion:
      "Una criatura de tu elección queda confundida durante 10 minutos.",
  },
  {
    idx: 3,
    nombre: "Te-le-kin-esis",
    descripcion:
      "Mueves un objeto hacia arriba 1d10 × 10 pies durante d6 minutos.",
  },
  {
    idx: 4,
    nombre: "Levitación de Lucy-Fire",
    descripcion: "Flotar durante Presencia + d10 asaltos.",
  },
  {
    idx: 5,
    nombre: "Demonio de los capilares",
    descripcion:
      "Una criatura se asfixia durante d6 asaltos, perdiendo d4 PV por asalto.",
  },
  {
    idx: 6,
    nombre: "Nueve señales violetas desatan la tormenta",
    descripcion: "Produce d2 rayos que infligen d6 de daño cada uno.",
  },
  {
    idx: 7,
    nombre: "Metzhuotl ciega tu ojo",
    descripcion:
      "Una criatura se vuelve invisible durante d6 asaltos o hasta que reciba daño, ataca/defiende con CD6.",
  },
  {
    idx: 8,
    nombre: "Psicopompo asqueroso",
    descripcion: "Invoca (d6): 1-3 d4 esqueletos, 4-6 d4 zombis.",
  },
  {
    idx: 9,
    nombre: "El párpado que ciega la mente",
    descripcion:
      "d4 criaturas se quedan dormidas durante una hora a menos que superen una prueba de CD14.",
  },
  {
    idx: 10,
    nombre: "Muerte",
    descripcion:
      "Todas las criaturas en un radio de 30 pies pierden un total de 4d10 PV.",
  },
];

export const MB_SACRED_SCROLLS: MbScroll[] = [
  {
    idx: 1,
    nombre: "Gracia del santo muerto",
    descripcion: "d2 criaturas recuperan d10 PV cada una.",
  },
  {
    idx: 2,
    nombre: "Gracia por un pecador",
    descripcion:
      "Una criatura de tu elección obtiene +d6 en una tirada (daño, prueba, etc.)",
  },
  {
    idx: 3,
    nombre: "Susurros a través de la puerta",
    descripcion: "Haz tres preguntas a una criatura fallecida.",
  },
  {
    idx: 4,
    nombre: "Égida del dolor",
    descripcion:
      "Una criatura de tu elección gana 2d6 PV extra durante 10 asaltos.",
  },
  {
    idx: 5,
    nombre: "Destino insatisfecho",
    descripcion:
      "Una criatura, muerta desde hace no más de una semana, se despierta con terribles recuerdos.",
  },
  {
    idx: 6,
    nombre: "Discurso bestial",
    descripcion: "Puede hablar con animales durante d20 minutos.",
  },
  {
    idx: 7,
    nombre: "Falso amanecer/carruaje de la noche",
    descripcion: "Luz u oscuridad total durante 3d10 minutos.",
  },
  {
    idx: 8,
    nombre: "Paso hermético",
    descripcion:
      "Encuentras todas las trampas en tu camino durante 2d10 minutos.",
  },
  {
    idx: 9,
    nombre: "Resplandor consumidor de Roskoe",
    descripcion: "d4 criaturas pierden d8 PV cada una.",
  },
  {
    idx: 10,
    nombre: "Sintaxis",
    descripcion: "Una enoquiana criatura obedece ciegamente una sola orden.",
  },
];

export function getMbScrollByIdx(
  type: "impuro" | "sagrado",
  idx: number,
): MbScroll | null {
  const table = type === "sagrado" ? MB_SACRED_SCROLLS : MB_IMPURE_SCROLLS;
  return table.find((s) => s.idx === idx) ?? null;
}

// ── Rasgos ────────────────────────────────────────────────────────────────────

export interface MbTrait {
  idx: number;
  nombre: string;
}

export const MB_RASGOS_TERRIBLES: MbTrait[] = [
  { idx: 1, nombre: "Agraviado sin cesar" },
  { idx: 2, nombre: "Complejo de inferioridad" },
  { idx: 3, nombre: "Problemas con la autoridad" },
  { idx: 4, nombre: "Boca ruidosa" },
  { idx: 5, nombre: "CRUEL" },
  { idx: 6, nombre: "Egocéntrico" },
  { idx: 7, nombre: "Nihilista" },
  { idx: 8, nombre: "Propenso al abuso de sustancias" },
  { idx: 9, nombre: "Bipolar" },
  { idx: 10, nombre: "Astuto" },
  { idx: 11, nombre: "Vengativo" },
  { idx: 12, nombre: "Cobarde" },
  { idx: 13, nombre: "Perezoso" },
  { idx: 14, nombre: "Sospechoso" },
  { idx: 15, nombre: "Despiadado" },
  { idx: 16, nombre: "Preocupado" },
  { idx: 17, nombre: "Amargado" },
  { idx: 18, nombre: "Engañoso" },
  { idx: 19, nombre: "Derrochador" },
  { idx: 20, nombre: "Arrogante" },
];

export const MB_CUERPOS_ROTOS: MbTrait[] = [
  { idx: 1, nombre: "Mirada fija y maníaca." },
  { idx: 2, nombre: "Cubierto de (para algunos) tatuajes blasfemos." },
  { idx: 3, nombre: "Cara podrida. Lleva una máscara." },
  { idx: 4, nombre: "Perdió tres dedos del pie, cojea." },
  { idx: 5, nombre: "Hambriento: demacrado y pálido." },
  { idx: 6, nombre: "Una mano reemplazada con un gancho oxidado (daño d6)." },
  { idx: 7, nombre: "Dientes deteriorados." },
  { idx: 8, nombre: "Inquietantemente hermosa, enervantemente limpia." },
  { idx: 9, nombre: "Manos cubiertas de llagas." },
  {
    idx: 10,
    nombre: "Catarata que se extiende lenta pero inexorable en ambos ojos.",
  },
  {
    idx: 11,
    nombre: "Cabello largo enredado, al menos una cucaracha vive en él.",
  },
  { idx: 12, nombre: "Orejas rotas y aplastadas." },
  { idx: 13, nombre: "Temblor y tartamudeo por daño nervioso o estrés." },
  { idx: 14, nombre: "Corpulento, voraz, babeante." },
  {
    idx: 15,
    nombre: "Una mano carece de pulgar e índice, agarra como una langosta.",
  },
  { idx: 16, nombre: "Nariz enrojecida e hinchada de alcohólico." },
  { idx: 17, nombre: "Cara de maníaco en reposo, hacer amigos es difícil." },
  { idx: 18, nombre: "Pie de atleta crónico. Apesta." },
  {
    idx: 19,
    nombre: "Ojo recién acuchillado y maloliente cubierto con un parche.",
  },
  { idx: 20, nombre: "Uñas agrietadas y negras, tal vez a punto de caerse." },
];

export const MB_HABITOS: MbTrait[] = [
  { idx: 1, nombre: "Recolectas obsesivamente pequeñas piedras afiladas." },
  {
    idx: 2,
    nombre:
      "No usarás una cuchilla sin probarla en tu propia carne. Brazos cubiertos de cicatrices.",
  },
  { idx: 3, nombre: "No puedes dejar de beber una vez que empiezas." },
  {
    idx: 4,
    nombre:
      "Adicto al juego. Debes apostar todos los días. Si pierdes, subes la apuesta y vuelves a jugar.",
  },
  {
    idx: 5,
    nombre:
      "No puedes tolerar críticas de ningún tipo. Acabas en rabia y llanto.",
  },
  {
    idx: 6,
    nombre:
      "Incapaz de ir al grano. En realidad, nunca has terminado una historia.",
  },
  {
    idx: 7,
    nombre:
      "Tu mejor amigo es una calavera. Llévala contigo, cuéntale todo, no confíes en nadie más.",
  },
  { idx: 8, nombre: "Te hurgas la nariz tan profundamente que sangra." },
  {
    idx: 9,
    nombre:
      "Te ríes histéricamente de tus propios chistes que luego explicas en detalle.",
  },
  {
    idx: 10,
    nombre:
      "Nihilista. Insistes en decirle a todo el mundo que eres nihilista y en explicar por qué.",
  },
  { idx: 11, nombre: "Comedor empedernido de insectos." },
  {
    idx: 12,
    nombre:
      "La respuesta al estrés es una exhibición estética. Cuanto peor se ponen las cosas, más elegante hay que ser.",
  },
  {
    idx: 13,
    nombre:
      "Depósito permanente de flemas en la garganta. Continuamente toses, resoplas, escupes y tragas.",
  },
  { idx: 14, nombre: "Pirómano." },
  {
    idx: 15,
    nombre:
      "Pierdes constantemente objetos importantes y olvidas datos vitales.",
  },
  {
    idx: 16,
    nombre:
      "AGITADOR DE MIERDA INSEGURO. HABLAS DE QUIEN ACABA DE SALIR DE LA HABITACIÓN.",
  },
  { idx: 17, nombre: "Tartamudeas cuando mientes." },
  { idx: 18, nombre: "Te ríes locamente en los peores momentos posibles." },
  {
    idx: 19,
    nombre:
      "Silbas mientras intentas esconderte. Negarás esto. Silbas cuando salga 5, 7, 9, 11 o 13 en un d20.",
  },
  { idx: 20, nombre: "Haces joyas con los dientes de los muertos." },
];

export const MB_HISTORIAS_PERTURBADORAS: MbTrait[] = [
  {
    idx: 1,
    nombre: "Perseguido por homicidio involuntario. Hay una recompensa.",
  },
  {
    idx: 2,
    nombre:
      "Deuda enorme. La deuda se está negociando con grupos cada vez más despiadados.",
  },
  { idx: 3, nombre: "Tienes un artículo raro y buscado." },
  { idx: 4, nombre: "Tienes una herida maldita que nunca cicatriza." },
  {
    idx: 5,
    nombre:
      "Tuviste un romance ilegal, inmoral y secreto con un miembro de la familia real. Tienes pruebas.",
  },
  {
    idx: 6,
    nombre:
      "Miembro de culto huido. Aterrorizado y paranoico. Hay otros cultistas por todas partes.",
  },
  {
    idx: 7,
    nombre:
      "Un ladrón de identidad que recientemente mató y reemplazó a esta persona.",
  },
  {
    idx: 8,
    nombre:
      "Desterrado y repudiado por hechos no especificados. Nunca podrás volver a casa.",
  },
  {
    idx: 9,
    nombre:
      "Desertor militar después de presenciar una masacre, hay recompensa por tu cabeza. Cazado por antiguos amigos.",
  },
  {
    idx: 10,
    nombre:
      "Asesinaste muy recientemente a un pariente cercano. Muy recientemente.",
  },
  {
    idx: 11,
    nombre:
      "Has montado incorrectamente (¿o no?) un cubo rompecabezas, despertando a una abominación dormida.",
  },
  {
    idx: 12,
    nombre:
      "Las criaturas malvadas aman el olor de tu rastro y se sienten atraídas por él, trayendo el desastre a tu paso.",
  },
  {
    idx: 13,
    nombre:
      "Una herida de batalla dejó una esquirla de metal acercándose lentamente a tu corazón. Todos los días hay un 2% de probabilidad de que lo alcance.",
  },
  {
    idx: 14,
    nombre:
      "La violencia te obligó a ir al desierto. Crees que los árboles que se agitan susurran. Hablas, gritas y atacas a los árboles.",
  },
  {
    idx: 15,
    nombre:
      "Maldito por compartir las pesadillas ajenas, duermes muy, muy lejos.",
  },
  {
    idx: 16,
    nombre:
      "En guerra permanente con todos los córvidos. Ningún contacto sin algo de violencia. Llevas una honda.",
  },
  {
    idx: 17,
    nombre:
      "Después de soñar con un templo subterráneo de un dios olvidado, comprendes los cantos de insectos y gusanos.",
  },
  {
    idx: 18,
    nombre:
      "Eres rastreado y observado por un gólem después de un acuerdo que sabes que ha sido borrado de tu mente.",
  },
  { idx: 19, nombre: '"Arder o ser quemado" es el destino que has aceptado.' },
  {
    idx: 20,
    nombre:
      'Tu carne se cura el doble de rápido, pero tus compañeros el doble de lento. Ves un "ángel de la guarda" de muchos ojos.',
  },
];
