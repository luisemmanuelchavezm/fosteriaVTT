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
  { idx: 1, nombre: "Fémur", formula: "1d4+fuerza" },
  { idx: 2, nombre: "Bastón", formula: "1d4+fuerza" },
  { idx: 3, nombre: "Espada corta", formula: "1d4+fuerza" },
  { idx: 4, nombre: "Cuchillo", formula: "1d4+fuerza" },
  { idx: 5, nombre: "Martillo de guerra", formula: "1d6+fuerza" },
  { idx: 6, nombre: "Espada", formula: "1d6+fuerza" },
  { idx: 7, nombre: "Arco", formula: "1d6+presencia" },
  { idx: 8, nombre: "Mayal", formula: "1d8+fuerza" },
  { idx: 9, nombre: "Ballesta", formula: "1d8+presencia" },
  { idx: 10, nombre: "Zweihänder", formula: "1d10+fuerza" },
];

// ── Tabla de armaduras ────────────────────────────────────────────────────────
export interface MbArmor {
  nivel: number;
  nombre: string;
  formula: string;
  descripcion?: string;
}

export const MB_ARMORS: MbArmor[] = [
  { nivel: 1, nombre: "Armadura ligera", formula: "1d2" },
  {
    nivel: 2,
    nombre: "Armadura media",
    formula: "1d4",
    descripcion: "CD+2 en pruebas de Agilidad, incluida la defensa.",
  },
  {
    nivel: 3,
    nombre: "Armadura pesada",
    formula: "1d6",
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
