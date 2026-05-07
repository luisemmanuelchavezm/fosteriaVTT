import type { DndCharacterDetailResponse } from "../../utils/dndApi";
import type { FeatOption } from "./types";

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function hasAbilityScore(
  character: DndCharacterDetailResponse,
  statName: string,
  min: number,
) {
  return (character.estadisticas[statName] ?? 0) >= min;
}

export function hasSpellcasting(character: DndCharacterDetailResponse) {
  return Boolean(character.caracteristicaLanzamientoConjuros);
}

export function hasCompetency(
  classCompetencies: string[],
  ...matches: string[]
) {
  return classCompetencies.some((entry) => {
    const normalizedEntry = normalizeText(entry);
    return matches.some((match) =>
      normalizedEntry.includes(normalizeText(match)),
    );
  });
}

function alwaysValid() {
  return true;
}

export function buildFeat(
  config: Omit<FeatOption, "validate"> & {
    validate?: FeatOption["validate"];
  },
): FeatOption {
  return {
    ...config,
    validate: config.validate ?? alwaysValid,
  };
}

export function getFeatValidity(
  feat: FeatOption,
  character: DndCharacterDetailResponse,
  classCompetencies: string[],
) {
  return feat.validate(character, classCompetencies);
}

export function buildFeatStatBonuses(
  feat: FeatOption,
  selectedStats: string[],
) {
  const result: Record<string, number> = {
    ...(feat.fixedBonuses ?? {}),
  };

  const selectableBonus = feat.selectableBonus;
  if (selectableBonus) {
    selectedStats.slice(0, selectableBonus.count).forEach((stat) => {
      if (!stat) {
        return;
      }
      result[stat] = (result[stat] ?? 0) + selectableBonus.amount;
    });
  }

  return result;
}
