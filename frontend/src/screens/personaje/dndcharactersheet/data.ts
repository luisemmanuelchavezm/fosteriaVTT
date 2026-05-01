export const SPELL_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export const ABILITY_ABBREVIATIONS: Record<string, string> = {
  Fuerza: "FUE",
  Destreza: "DES",
  Constitucion: "CON",
  Inteligencia: "INT",
  Sabiduria: "SAB",
  Carisma: "CAR",
};

export const SAVING_THROW_ROWS = [
  { statName: "Fuerza", displayName: "Fuerza" },
  { statName: "Destreza", displayName: "Destreza" },
  { statName: "Constitucion", displayName: "Constitucion" },
  { statName: "Inteligencia", displayName: "Inteligencia" },
  { statName: "Sabiduria", displayName: "Sabiduria" },
  { statName: "Carisma", displayName: "Carisma" },
] as const;

export const SKILL_ROWS = [
  { name: "Acrobacias", displayName: "Acrobacias", statName: "Destreza" },
  { name: "Atletismo", displayName: "Atletismo", statName: "Fuerza" },
  { name: "Arcano", displayName: "Arcano", statName: "Inteligencia" },
  { name: "Engano", displayName: "Engaño", statName: "Carisma" },
  { name: "Historia", displayName: "Historia", statName: "Inteligencia" },
  {
    name: "Interpretacion",
    displayName: "Interpretación",
    statName: "Carisma",
  },
  {
    name: "Intimidacion",
    displayName: "Intimidación",
    statName: "Carisma",
  },
  {
    name: "Investigacion",
    displayName: "Investigación",
    statName: "Inteligencia",
  },
  {
    name: "Juego de manos",
    displayName: "Juego de manos",
    statName: "Destreza",
  },
  { name: "Medicina", displayName: "Medicina", statName: "Sabiduria" },
  {
    name: "Naturaleza",
    displayName: "Naturaleza",
    statName: "Inteligencia",
  },
  {
    name: "Percepcion",
    displayName: "Percepción",
    statName: "Sabiduria",
  },
  {
    name: "Perspicacia",
    displayName: "Perspicacia",
    statName: "Sabiduria",
  },
  {
    name: "Persuasión",
    displayName: "Persuasión",
    statName: "Carisma",
  },
  { name: "Religión", displayName: "Religión", statName: "Inteligencia" },
  { name: "Sigilo", displayName: "Sigilo", statName: "Destreza" },
  {
    name: "Supervivencia",
    displayName: "Supervivencia",
    statName: "Sabiduria",
  },
  {
    name: "Trato con Animales",
    displayName: "Trato con Animales",
    statName: "Sabiduria",
  },
] as const;

export type DetailTab =
  | "actions"
  | "spells"
  | "passives"
  | "inventory"
  | "biography";
