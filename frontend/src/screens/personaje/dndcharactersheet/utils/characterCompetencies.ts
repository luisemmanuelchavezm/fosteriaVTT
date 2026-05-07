import type { DndCharacterDetailResponse } from "../../utils/dndApi";
import type { DndCompetencyCatalog } from "../../types";
import { normalizeText, uniqueNormalizedValues } from "./characterText";

export interface CharacterCompetencyGroups {
  weaponArmor: string[];
  tools: string[];
}

function toNormalizedSet(values: string[]) {
  return new Set(values.map((value) => normalizeText(value)));
}

export function isSkillCompetencyName(
  value: string,
  catalog: DndCompetencyCatalog | null,
) {
  return (
    catalog !== null &&
    toNormalizedSet(catalog.habilidades).has(normalizeText(value))
  );
}

export function isWeaponArmorCompetencyName(
  value: string,
  catalog: DndCompetencyCatalog | null,
) {
  return (
    catalog !== null &&
    toNormalizedSet(catalog.armasArmaduras).has(normalizeText(value))
  );
}

export function splitCharacterCompetencies(
  competencies: string[],
  catalog: DndCompetencyCatalog | null,
): CharacterCompetencyGroups {
  const weaponArmor: string[] = [];
  const tools: string[] = [];

  for (const competency of competencies) {
    if (isSkillCompetencyName(competency, catalog)) {
      continue;
    }

    if (isWeaponArmorCompetencyName(competency, catalog)) {
      weaponArmor.push(competency);
      continue;
    }

    tools.push(competency);
  }

  return {
    weaponArmor,
    tools,
  };
}

export function getCharacterCompetencies(
  character: DndCharacterDetailResponse,
  classCompetencies: string[] = [],
  catalog: DndCompetencyCatalog | null = null,
) {
  const abilityCompetencies = character.habilidades
    .map((ability) => ability.nombre)
    .filter((name) =>
      normalizeText(name).startsWith(normalizeText("Competencia")),
    )
    .map((name) => name.replace(/^Competencia(?:\s+dote)?\s*:\s*/i, "").trim())
    .filter(Boolean);

  return uniqueNormalizedValues(
    [...classCompetencies, ...abilityCompetencies]
      .filter((value) => value.trim().length > 0)
      .filter((value) => !isSkillCompetencyName(value, catalog)),
  ).sort((left, right) => left.localeCompare(right, "es"));
}
