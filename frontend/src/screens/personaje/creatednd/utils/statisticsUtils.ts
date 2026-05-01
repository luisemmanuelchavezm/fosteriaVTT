export const PANEL_CLASSES =
  "rounded-[24px] border border-stone-300/10 bg-[linear-gradient(180deg,rgba(12,10,9,0.72),rgba(41,37,36,0.18))]";

export const SELECT_CLASSES =
  "h-11 w-full appearance-none rounded-[16px] border border-amber-300/35 bg-black/55 px-4 text-sm text-stone-100 outline-none transition focus:border-amber-300/60 focus:bg-stone-950 disabled:cursor-not-allowed disabled:opacity-60";

export const STAT_BOX_CLASSES =
  "min-w-[140px] rounded-[22px] border-2 border-white bg-white px-4 py-5 text-center shadow-[0_12px_30px_rgba(0,0,0,0.18)]";

export const PARCHMENT_CARD_CLASSES =
  "rounded-[22px] border-2 border-[#c9a34a] bg-[linear-gradient(180deg,#f7efcf_0%,#ead9ab_100%)] p-4 text-stone-950 shadow-[0_12px_30px_rgba(0,0,0,0.18)]";

export type StatsMethod = "dice" | "standard" | "point-buy" | "custom";

export interface AbilityStat {
  id: string;
  name: string;
}

export interface DiceSlot {
  total: number | null;
  rolls: number[];
  assignedStatId: string;
}

export interface DiceRound {
  id: string;
  label: number;
  slots: DiceSlot[];
}

export interface ActiveRollContext {
  roundId: string;
  slotIndex: number;
}

export interface DiceBoxRollResult {
  value?: number;
}

export const ABILITY_STATS: AbilityStat[] = [
  { id: "strength", name: "Fuerza" },
  { id: "dexterity", name: "Destreza" },
  { id: "constitution", name: "Constitucion" },
  { id: "intelligence", name: "Inteligencia" },
  { id: "wisdom", name: "Sabiduria" },
  { id: "charisma", name: "Carisma" },
];

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
export const POINT_BUY_BASE_SCORE = 8;
export const POINT_BUY_TOTAL = 27;
export const POINT_BUY_MIN = 8;
export const POINT_BUY_MAX = 15;
export const CUSTOM_SCORE_MAX = 30;
export const MAX_DICE_ROUNDS = 3;

export const POINT_BUY_COSTS: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

export const METHOD_OPTIONS: Array<{ id: StatsMethod; label: string }> = [
  { id: "dice", label: "Tirada de Dados" },
  { id: "standard", label: "Puntuaciones Estándar" },
  { id: "point-buy", label: "Compra de Puntuaciones" },
  { id: "custom", label: "Personalizado" },
];

export function createInitialAssignments<T extends string | number | null>(
  value: T,
) {
  return ABILITY_STATS.reduce<Record<string, T>>((accumulator, stat) => {
    accumulator[stat.id] = value;
    return accumulator;
  }, {});
}

export function createInitialDiceSlots(): DiceSlot[] {
  return Array.from({ length: 6 }, () => ({
    total: null,
    rolls: [],
    assignedStatId: "",
  }));
}

export function createDiceRound(label: number): DiceRound {
  return {
    id: `dice-round-${label}-${Math.random().toString(36).slice(2, 10)}`,
    label,
    slots: createInitialDiceSlots(),
  };
}

export function buildScoreFromDiceValues(values: number[]) {
  const sortedDescending = [...values].sort((a, b) => b - a);
  const keptRolls = sortedDescending.slice(0, 3);

  return {
    total: keptRolls.reduce((sum, value) => sum + value, 0),
    rolls: sortedDescending,
  };
}

export function formatAbilityModifier(score: number) {
  const modifier = Math.floor((score - 10) / 2);
  return `${modifier >= 0 ? "+" : ""}${modifier}`;
}

export function getAvailableStandardOptions(
  usedValues: string[],
  selectedValue: string,
) {
  return STANDARD_ARRAY.map((value, index) => `${value}-${index}`).filter(
    (optionKey) =>
      optionKey === selectedValue || !usedValues.includes(optionKey),
  );
}
