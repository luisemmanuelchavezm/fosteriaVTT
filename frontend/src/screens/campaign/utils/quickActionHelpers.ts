import type {
  DndCharacterDetailResponse,
  CharacterAbilityResponse,
} from "../../personaje/utils/dndApi";
import { getAbilityModifierByName } from "../../personaje/dndcharactersheet/utils/characterAbilities";

// Utilidad para obtener el total de habilidad igual que en la ficha
export function getSkillTotal(
  detail: DndCharacterDetailResponse | null,
  skill: { name: string; statName: string },
  proficiencyBonus: number,
) {
  // El modificador base de la característica
  const mod = getAbilityModifierByName(detail, skill.statName);
  // El nivel de competencia (0: nada, 1: competencia, 2: maestría)
  let proficiencyLevel = 0;
  const statValue = detail?.estadisticas[skill.name] ?? 0;
  if (proficiencyBonus > 0 && statValue >= proficiencyBonus * 2) {
    proficiencyLevel = 2;
  } else if (statValue > 0) {
    proficiencyLevel = 1;
  }
  return mod + proficiencyLevel * proficiencyBonus;
}

export function getEnemySkillBonus(
  detail: DndCharacterDetailResponse | null,
  skill: { name: string; statName: string },
): number {
  const flat = detail?.estadisticas[skill.name];
  if (flat !== undefined && flat !== 0) return flat;
  return getAbilityModifierByName(detail, skill.statName);
}

export function getEnemySaveBonus(
  detail: DndCharacterDetailResponse | null,
  statName: string,
): number {
  const flat =
    detail?.estadisticas[`Salvacion de ${statName}`] ??
    detail?.estadisticas[`Salvación de ${statName}`];
  if (flat !== undefined && flat !== 0) return flat;
  return getAbilityModifierByName(detail, statName);
}

// Utilidad para obtener el total de salvación igual que en la ficha
export function getSavingThrowTotal(
  detail: DndCharacterDetailResponse | null,
  statName: string,
  proficiencyBonus: number,
) {
  const mod = getAbilityModifierByName(detail, statName);
  // Proficiente si la estadística de salvación es > 0
  const isProficient =
    (detail?.estadisticas[`Salvación de ${statName}`] ??
      detail?.estadisticas[`Salvacion de ${statName}`] ??
      0) > 0;
  return mod + (isProficient ? proficiencyBonus : 0);
}

export function getSpellLevel(ability: CharacterAbilityResponse): number {
  const tags = ability.tags ?? "";
  for (const rawTag of tags.split(",")) {
    const trimmed = rawTag.trim().toLowerCase();
    if (trimmed === "truco") {
      return 0;
    }
    const parts = trimmed.split(";");
    if (parts[0] === "hechizo" && parts[1]) {
      const level = Number.parseInt(parts[1], 10);
      return Number.isNaN(level) ? -1 : level;
    }
  }
  return -1;
}

export function groupSpellsByLevel(
  spells: CharacterAbilityResponse[],
): Map<number, CharacterAbilityResponse[]> {
  const grouped = new Map<number, CharacterAbilityResponse[]>();
  for (const spell of spells) {
    const level = getSpellLevel(spell);
    if (level >= 0) {
      if (!grouped.has(level)) {
        grouped.set(level, []);
      }
      grouped.get(level)!.push(spell);
    }
  }
  return grouped;
}
