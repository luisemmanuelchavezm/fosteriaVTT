import type {
  CharacterAbilityResponse,
  DndCharacterDetailResponse,
} from "../../utils/dndApi";
import { getClassLevel, getStatValue } from "./characterCore";
import { normalizeText } from "./characterText";

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

export function getLocalizedAbilityName(ability: CharacterAbilityResponse) {
  return ability.nombre;
}

export function getWeaponDamageParts(formula: string | null | undefined) {
  const rawFormula = (formula ?? "").trim();
  if (!rawFormula) {
    return { damage: "--", damageType: "--" };
  }

  const standardMatch = rawFormula.match(
    /^(\d+d\d+(?:\s*[+-]\s*\d+)?)\s+([a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+)$/,
  );
  if (standardMatch) {
    return {
      damage: standardMatch[1].trim(),
      damageType: standardMatch[2].trim(),
    };
  }

  const hasStatVariable = /@[a-z]+/i.test(rawFormula);
  const diceTermCount = (rawFormula.match(/\d+d\d+/gi) ?? []).length;
  const isCustomLikeFormula = hasStatVariable || diceTermCount > 1;

  return {
    damage: rawFormula || "--",
    damageType: isCustomLikeFormula ? "custom" : "--",
  };
}

function evaluateFlatExpression(expression: string) {
  const compact = expression.replace(/\s+/g, "");
  if (!/^[+-]?\d+(?:[+-]\d+)*$/.test(compact)) {
    return null;
  }

  const parts = compact.match(/[+-]?\d+/g);
  if (!parts) {
    return null;
  }

  return parts.reduce((total, part) => total + Number.parseInt(part, 10), 0);
}

function clampMinimumDamageExpression(expression: string | null) {
  if (!expression) {
    return null;
  }

  const flatValue = evaluateFlatExpression(expression);
  if (flatValue !== null) {
    return flatValue <= 1 ? "1" : expression;
  }

  return expression;
}

export function isSpellAbility(ability: CharacterAbilityResponse) {
  return getSpellLevel(ability) !== null;
}

function hasTag(ability: CharacterAbilityResponse, tag: string) {
  const normalizedTag = normalizeText(tag);
  return (ability.tags ?? "")
    .split(",")
    .some((t) => normalizeText(t.trim()) === normalizedTag);
}

export function isActionAbility(ability: CharacterAbilityResponse) {
  if (hasTag(ability, "ALIENTODRACONICO")) {
    return false;
  }
  return (
    hasTag(ability, "ARMA") ||
    hasTag(ability, "ATAQUE") ||
    hasTag(ability, "ATAQUESINARMAS")
  );
}

export function isPassiveAbility(ability: CharacterAbilityResponse) {
  const normalizedName = normalizeText(ability.nombre);

  if (hasTag(ability, "MANIOBRA")) {
    return true;
  }

  if (isSpellAbility(ability) || isActionAbility(ability)) {
    return false;
  }

  return (
    !normalizedName.startsWith(normalizeText("Competencia")) &&
    !normalizedName.startsWith(normalizeText("Idioma"))
  );
}

function getMonkMartialArtsDie(monkLevel: number) {
  if (monkLevel >= 17) {
    return 10;
  }
  if (monkLevel >= 11) {
    return 8;
  }
  if (monkLevel >= 5) {
    return 6;
  }
  return 4;
}

function formatDamageExpression(baseExpression: string, modifier: number) {
  if (modifier === 0) {
    return baseExpression;
  }

  return modifier > 0
    ? `${baseExpression} + ${modifier}`
    : `${baseExpression} - ${Math.abs(modifier)}`;
}

function getWeaponAbilityModifier(
  character: DndCharacterDetailResponse,
  ability: CharacterAbilityResponse,
) {
  // NPC weapons (tagged NPC,ARMA,BONO;X) encode everything in their formula
  // — never add an ability modifier on top of it.
  if (hasTag(ability, "NPC")) {
    return 0;
  }

  const matchingWeapon = character.mochila.find(
    (item) =>
      item.tipoObjeto === "ARMA" &&
      normalizeText(item.nombre) === normalizeText(ability.nombre),
  );

  const strengthModifier = getAbilityModifierByName(character, "Fuerza");
  const dexterityModifier = getAbilityModifierByName(character, "Destreza");
  const normalizedWeaponTags = normalizeText(matchingWeapon?.tags ?? "");

  const isCustomWeapon =
    !!matchingWeapon &&
    normalizedWeaponTags.includes(normalizeText("COMPETENTE_POR_DEFECTO"));
  if (isCustomWeapon || /@[a-z]+/i.test(ability.formula ?? "")) {
    return 0;
  }

  if (matchingWeapon && normalizedWeaponTags.includes(normalizeText("Sutil"))) {
    return Math.max(strengthModifier, dexterityModifier);
  }

  return strengthModifier;
}

export function getActionDamageParts(
  character: DndCharacterDetailResponse,
  ability: CharacterAbilityResponse,
) {
  if (hasTag(ability, "ATAQUESINARMAS")) {
    const strengthModifier = getAbilityModifierByName(character, "Fuerza");
    const dexterityModifier = getAbilityModifierByName(character, "Destreza");
    const monkLevel = getClassLevel(character.clases, "Monje");
    const attackModifier =
      monkLevel > 0
        ? Math.max(strengthModifier, dexterityModifier)
        : strengthModifier;
    const baseExpression =
      monkLevel > 0 ? `1d${getMonkMartialArtsDie(monkLevel)}` : "1";
    const expression = clampMinimumDamageExpression(
      formatDamageExpression(baseExpression, attackModifier),
    );

    return {
      damage: expression ?? "1",
      damageType: "Contundente",
      expression: expression ?? "1",
    };
  }

  const resolvedFormula = resolveCharacterFormula(character, ability.formula);
  const { damage, damageType } = getWeaponDamageParts(
    resolvedFormula ?? ability.formula,
  );
  const abilityModifier = getWeaponAbilityModifier(character, ability);
  const expression = clampMinimumDamageExpression(
    damage === "--" ? null : formatDamageExpression(damage, abilityModifier),
  );
  return {
    damage: expression ?? damage,
    damageType,
    expression,
  };
}

export function getAbilityResetType(ability: CharacterAbilityResponse) {
  const normalized = normalizeText(
    `${ability.descripcion ?? ""} ${ability.formula ?? ""}`,
  );

  if (normalized.includes(normalizeText("descanso corto o largo"))) {
    return "shortOrLong" as const;
  }
  if (normalized.includes(normalizeText("descanso corto"))) {
    return "shortOrLong" as const;
  }
  if (normalized.includes(normalizeText("descanso largo"))) {
    return "longOnly" as const;
  }
  return "none" as const;
}

export function shouldResetAbilityUsageOnRest(
  ability: CharacterAbilityResponse,
  restType: "short" | "long",
) {
  const resetType = getAbilityResetType(ability);
  if (resetType === "shortOrLong") {
    return true;
  }
  return restType === "long" && resetType === "longOnly";
}

export function getAbilityResetLabel(ability: CharacterAbilityResponse) {
  const resetType = getAbilityResetType(ability);
  if (resetType === "shortOrLong") {
    return "Descanso corto o largo";
  }
  if (resetType === "longOnly") {
    return "Descanso largo";
  }
  return "Manual";
}

export function canTrackAbilityUsage(ability: CharacterAbilityResponse) {
  return getAbilityResetType(ability) !== "none";
}

export function resolveCharacterFormula(
  character: DndCharacterDetailResponse,
  formula: string | null | undefined,
) {
  const rawFormula = (formula ?? "").trim();
  if (!rawFormula) {
    return null;
  }

  return rawFormula.replace(/@([a-z]+)/gi, (_, rawKey: string) => {
    const key = normalizeText(rawKey);
    const mapping: Record<string, string> = {
      fuerza: "Fuerza",
      destreza: "Destreza",
      constitucion: "Constitucion",
      inteligencia: "Inteligencia",
      sabiduria: "Sabiduria",
      carisma: "Carisma",
    };
    const statName = mapping[key];
    if (!statName) {
      return "0";
    }
    return String(getAbilityModifierByName(character, statName));
  });
}
