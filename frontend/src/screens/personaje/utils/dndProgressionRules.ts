import type { DndCharacterDetailResponse } from "./dndApi";
import type { DndClassDetail, DndClassSummary } from "../types";

const STANDARD_ASI_LEVELS = new Set([4, 8, 12, 16, 19]);
const FIGHTER_ASI_LEVELS = new Set([4, 6, 8, 12, 14, 16, 19]);
const ROGUE_ASI_LEVELS = new Set([4, 8, 10, 12, 16, 19]);

export function normalizeDndText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function requiresSubclass(
  classDetail: DndClassDetail | null,
  targetLevel: number,
) {
  if (!classDetail) {
    return false;
  }

  return classDetail.subclases.some(
    (subclass) => subclass.nivelDesbloqueo === targetLevel,
  );
}

export function inferCurrentSubclass(
  character: DndCharacterDetailResponse,
  classDetail: DndClassDetail | null,
) {
  if (!classDetail) {
    return null;
  }

  const abilityTagTokens = character.habilidades
    .flatMap((ability) => (ability.tags ?? "").split(","))
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => {
      const parts = tag.split(";", 2);
      return parts.length === 2 ? parts[1].trim() : tag;
    });
  const characterTagTokens = (character.tags ?? [])
    .flatMap((tag) => (tag ?? "").split(","))
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => {
      const parts = tag.split(";", 2);
      return parts.length === 2 ? parts[1].trim() : tag;
    });
  const subclassTokens = [...abilityTagTokens, ...characterTagTokens];

  return (
    classDetail.subclases.find((subclass) =>
      subclassTokens.some((tag) => {
        const normalizedTag = normalizeDndText(tag);
        return (
          normalizedTag === normalizeDndText(subclass.id) ||
          normalizedTag === normalizeDndText(subclass.nombre) ||
          normalizedTag ===
            normalizeDndText(subclass.nombre.replace(/^.*?del\s+/i, ""))
        );
      }),
    ) ?? null
  );
}

export function isAsiLevel(classId: string, targetLevel: number) {
  const normalizedClass = normalizeDndText(classId);
  if (normalizedClass === normalizeDndText("guerrero")) {
    return FIGHTER_ASI_LEVELS.has(targetLevel);
  }
  if (normalizedClass === normalizeDndText("picaro")) {
    return ROGUE_ASI_LEVELS.has(targetLevel);
  }
  return STANDARD_ASI_LEVELS.has(targetLevel);
}

export function classWarnings(
  classSummary: DndClassSummary,
  character: DndCharacterDetailResponse,
) {
  const strength = character.estadisticas.Fuerza ?? 0;
  const dexterity = character.estadisticas.Destreza ?? 0;
  const constitution = character.estadisticas.Constitucion ?? 0;
  const wisdom = character.estadisticas.Sabiduria ?? 0;
  const charisma = character.estadisticas.Carisma ?? 0;
  const intelligence = character.estadisticas.Inteligencia ?? 0;
  const normalized = normalizeDndText(classSummary.id);

  switch (normalized) {
    case "barbaro":
    case "guerrero":
    case "paladin":
      return strength >= 13;
    case "bardo":
    case "brujo":
    case "hechicero":
      return charisma >= 13;
    case "clerigo":
    case "druida":
      return wisdom >= 13;
    case "explorador":
    case "monje":
      return dexterity >= 13 && wisdom >= 13;
    case "mago":
      return intelligence >= 13;
    case "picaro":
      return dexterity >= 13;
    default:
      return constitution >= 13 || true;
  }
}
