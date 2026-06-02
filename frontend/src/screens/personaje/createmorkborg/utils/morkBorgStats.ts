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
