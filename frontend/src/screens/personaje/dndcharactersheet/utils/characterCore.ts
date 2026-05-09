import type { DndCharacterDetailResponse } from "../../utils/dndApi";
import { normalizeText } from "./characterText";

const XP_TO_NEXT_LEVEL: Record<number, number> = {
  1: 300,
  2: 600,
  3: 1800,
  4: 3800,
  5: 7500,
  6: 9000,
  7: 11000,
  8: 14000,
  9: 16000,
  10: 21000,
  11: 15000,
  12: 20000,
  13: 20000,
  14: 25000,
  15: 30000,
  16: 30000,
  17: 40000,
  18: 40000,
  19: 50000,
};

export function getStatValue(
  character: DndCharacterDetailResponse | null,
  statName: string,
) {
  return character?.estadisticas[statName] ?? 0;
}

export function getCharacterLevel(
  classes: DndCharacterDetailResponse["clases"],
) {
  return classes.reduce((total, item) => total + item.nivel, 0);
}

export function getProficiencyBonus(
  character: DndCharacterDetailResponse | null,
) {
  return (
    character?.estadisticas["Bonificador por competencia"] ??
    Math.max(
      2,
      Math.min(
        6,
        Math.floor((getCharacterLevel(character?.clases ?? []) - 1) / 4) + 2,
      ),
    )
  );
}

export function formatClassSummary(
  classes: DndCharacterDetailResponse["clases"],
) {
  return classes.map((item) => `${item.nombre} nivel ${item.nivel}`).join(", ");
}

export function getRaceSummary(race: string | null, subrace: string | null) {
  if (!race && !subrace) {
    return "-";
  }

  if (!subrace) {
    return race ?? "-";
  }

  return race ? `${race}, ${subrace}` : subrace;
}

export function getExperienceProgress(
  classes: DndCharacterDetailResponse["clases"],
  stats: DndCharacterDetailResponse["estadisticas"],
) {
  const currentLevel = Math.max(1, getCharacterLevel(classes));
  const currentXp = Math.max(0, stats.Experiencia ?? 0);
  const nextLevelXp = XP_TO_NEXT_LEVEL[currentLevel] ?? null;

  return {
    currentLevel,
    currentXp,
    nextLevelXp,
  };
}

export function formatSignedValue(value: number) {
  return `${value >= 0 ? "+" : ""}${value}`;
}

export function getClassLevel(
  classes: DndCharacterDetailResponse["clases"],
  className: string,
) {
  const normalizedClassName = normalizeText(className);
  return classes
    .filter((item) => normalizeText(item.nombre) === normalizedClassName)
    .reduce((total, item) => total + item.nivel, 0);
}
