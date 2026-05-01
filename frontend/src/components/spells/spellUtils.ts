import type { CharacterAbilityResponse } from "../../screens/personaje/utils/dndApi";

export interface SpellMetadata {
  tiempoLanzamiento: string | null;
  alcance: string | null;
  componentes: string | null;
  duracion: string | null;
  formulaDado: string | null;
  escalado: string | null;
}

export const ROLLABLE_EXPRESSION_REGEX = /\b\d+d\d+(?:\s*[+-]\s*\d+)?\b/gi;

export function extractSpellMetadata(
  tags: string | null | undefined,
): SpellMetadata {
  return {
    tiempoLanzamiento: extractTagValue(tags, "TiempoLanzamiento"),
    alcance: extractTagValue(tags, "Alcance"),
    componentes: extractTagValue(tags, "Componentes"),
    duracion: extractTagValue(tags, "Duracion"),
    formulaDado: extractTagValue(tags, "FormulaDado"),
    escalado: extractTagValue(tags, "Escalado"),
  };
}

export function extractTagValue(
  tags: string | null | undefined,
  prefix: string,
) {
  if (!tags) {
    return null;
  }

  const normalizedPrefix = normalizeText(prefix);

  for (const rawTag of tags.split(",")) {
    const trimmed = rawTag.trim();
    const parts = trimmed.split(";", 2);
    if (parts.length !== 2 || normalizeText(parts[0]) !== normalizedPrefix) {
      continue;
    }

    return parts[1].trim();
  }

  return null;
}

export function extractFirstRollableExpression(
  text: string | null | undefined,
) {
  if (!text) {
    return null;
  }

  const match = text.match(ROLLABLE_EXPRESSION_REGEX);
  return match?.[0] ?? null;
}

export function extractRollableExpressions(text: string | null | undefined) {
  if (!text) {
    return [];
  }

  return Array.from(new Set(text.match(ROLLABLE_EXPRESSION_REGEX) ?? []));
}

export function getSpellLevelLabel(spell: CharacterAbilityResponse) {
  const tags = spell.tags ?? "";

  for (const rawTag of tags.split(",")) {
    const trimmed = rawTag.trim();
    if (normalizeText(trimmed) === "truco") {
      return "Truco";
    }

    const parts = trimmed.split(";", 2);
    if (parts.length === 2 && normalizeText(parts[0]) === "hechizo") {
      return `Nivel ${parts[1].trim()}`;
    }
  }

  return "Hechizo";
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
