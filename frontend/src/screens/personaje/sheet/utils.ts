import type {
  CharacterAbilityResponse,
  CharacterInventoryItemResponse,
  DndCharacterDetailResponse,
} from "../utils/dndApi";

export function getStatValue(
  character: DndCharacterDetailResponse | null,
  statName: string,
) {
  return character?.estadisticas[statName] ?? 0;
}

export function formatClassSummary(
  classes: DndCharacterDetailResponse["clases"],
) {
  return classes.map((item) => `${item.nombre} nivel ${item.nivel}`).join(", ");
}

export function formatSignedValue(value: number) {
  return `${value >= 0 ? "+" : ""}${value}`;
}

export function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function getAbilityModifierByName(
  character: DndCharacterDetailResponse | null,
  statName: string,
) {
  const score = getStatValue(character, statName);
  return Math.floor((score - 10) / 2);
}

export function getSpellLevel(ability: CharacterAbilityResponse) {
  const rawTags = ability.tags ?? "";

  for (const tag of rawTags.split(",")) {
    const trimmed = tag.trim();

    if (normalizeText(trimmed) === "truco") {
      return 0;
    }

    const parts = trimmed.split(";", 2);
    if (parts.length === 2 && normalizeText(parts[0]) === "hechizo") {
      const parsed = Number.parseInt(parts[1], 10);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

export function getInventoryTagLabel(item: CharacterInventoryItemResponse) {
  return item.tags.replaceAll("_", " ");
}

export function applyDamage(currentHp: number, tempHp: number, amount: number) {
  const safeAmount = Math.max(0, amount);
  const remainingAfterTemp = Math.max(0, safeAmount - tempHp);
  const nextTempHp = Math.max(0, tempHp - safeAmount);
  const nextCurrentHp = Math.max(0, currentHp - remainingAfterTemp);

  return {
    currentHp: nextCurrentHp,
    tempHp: nextTempHp,
  };
}
