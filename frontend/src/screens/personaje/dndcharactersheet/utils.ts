import type {
  CharacterAbilityResponse,
  CharacterInventoryItemResponse,
  DndCharacterDetailResponse,
} from "../utils/dndApi";
import type { DndCompetencyCatalog } from "../types";

export function getStatValue(
  character: DndCharacterDetailResponse | null,
  statName: string,
) {
  return character?.estadisticas[statName] ?? 0;
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

export function getCharacterLevel(
  classes: DndCharacterDetailResponse["clases"],
) {
  return classes.reduce((total, item) => total + item.nivel, 0);
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

export function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function uniqueNormalizedValues(values: string[]) {
  return values.filter(
    (value, index, allValues) =>
      allValues.findIndex(
        (entry) => normalizeText(entry) === normalizeText(value),
      ) === index,
  );
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

export function getLocalizedAbilityName(ability: CharacterAbilityResponse) {
  return ability.nombre;
}

export function getWeaponDamageParts(formula: string | null | undefined) {
  const rawFormula = (formula ?? "").trim();
  if (!rawFormula) {
    return { damage: "--", damageType: "--" };
  }

  const parts = rawFormula.split(/\s+/);
  const damageParts = [parts[0] ?? ""];
  let damageTypeStartIndex = 1;

  const modifierToken = parts[1];
  if (modifierToken === "+" || modifierToken === "-") {
    damageParts.push(modifierToken);
    if (parts[2]) {
      damageParts.push(parts[2]);
      damageTypeStartIndex = 3;
    } else {
      damageTypeStartIndex = 2;
    }
  } else if (modifierToken && /^[+-]/.test(modifierToken)) {
    damageParts.push(modifierToken);
    damageTypeStartIndex = 2;
  }

  const damage = damageParts.join(" ").trim();
  const damageType = parts.slice(damageTypeStartIndex).join(" ").trim();

  return {
    damage: damage || "--",
    damageType: damageType || "--",
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

export function getInventoryTagLabel(item: CharacterInventoryItemResponse) {
  return item.tags
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((entry) => {
      const normalized = normalizeText(entry);
      return (
        normalized !== "visibilidadoficial" &&
        normalized !== "visibilidadprivado" &&
        !normalized.startsWith("propietario") &&
        normalized !== "competentepordefecto"
      );
    })
    .map((entry) => {
      const [left, right] = entry.split(";", 2);
      return (right ?? left).replaceAll("_", " ");
    })
    .join(", ");
}

const MONEY_ITEMS = {
  ppt: "Piezas de platino",
  po: "Piezas de oro",
  pp: "Piezas de plata",
  pc: "Piezas de cobre",
} as const;

export function getCharacterMoney(
  character: DndCharacterDetailResponse | null,
) {
  const inventory = character?.mochila ?? [];

  return Object.entries(MONEY_ITEMS).reduce<Record<string, number>>(
    (accumulator, [key, label]) => {
      accumulator[key] =
        inventory.find(
          (item) => normalizeText(item.nombre) === normalizeText(label),
        )?.cantidad ?? 0;
      return accumulator;
    },
    { ppt: 0, po: 0, pp: 0, pc: 0 },
  );
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

export function getClassLevel(
  classes: DndCharacterDetailResponse["clases"],
  className: string,
) {
  const normalizedClassName = normalizeText(className);
  return classes
    .filter((item) => normalizeText(item.nombre) === normalizedClassName)
    .reduce((total, item) => total + item.nivel, 0);
}

export function isSpellAbility(ability: CharacterAbilityResponse) {
  return getSpellLevel(ability) !== null;
}

export function isActionAbility(ability: CharacterAbilityResponse) {
  const normalizedTags = normalizeText(ability.tags);
  if (normalizedTags.includes(normalizeText("ALIENTODRACONICO"))) {
    return false;
  }
  return (
    normalizedTags.includes(normalizeText("ARMA")) ||
    normalizedTags.includes(normalizeText("ATAQUE")) ||
    normalizedTags.includes(normalizeText("ACCION"))
  );
}

export function isPassiveAbility(ability: CharacterAbilityResponse) {
  const normalizedName = normalizeText(ability.nombre);
  const normalizedTags = normalizeText(ability.tags);

  if (normalizedTags.includes(normalizeText("MANIOBRA"))) {
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
  const matchingWeapon = character.mochila.find(
    (item) =>
      item.tipoObjeto === "ARMA" &&
      normalizeText(item.nombre) === normalizeText(ability.nombre),
  );

  const strengthModifier = getAbilityModifierByName(character, "Fuerza");
  const dexterityModifier = getAbilityModifierByName(character, "Destreza");

  if (
    matchingWeapon &&
    normalizeText(matchingWeapon.tags).includes(normalizeText("Sutil"))
  ) {
    return Math.max(strengthModifier, dexterityModifier);
  }

  return strengthModifier;
}

export interface ShortRestResolution {
  totalHealed: number;
  rollExpression: string | null;
}

export function resolveShortRestHealing(
  die: string,
  usedDice: number,
  constitutionModifier: number,
  roller: (faces: number) => number,
): ShortRestResolution {
  if (usedDice <= 0) {
    return { totalHealed: 0, rollExpression: null };
  }

  const faces = Number.parseInt(die.replace(/\D+/g, ""), 10);
  if (Number.isNaN(faces) || faces <= 0) {
    return { totalHealed: 0, rollExpression: null };
  }

  const parts: string[] = [];
  let totalHealed = 0;

  for (let index = 0; index < usedDice; index += 1) {
    const roll = roller(faces);
    totalHealed += Math.max(0, roll + constitutionModifier);
    const rollParts = [String(roll)];
    if (constitutionModifier > 0) {
      rollParts.push(`+ ${constitutionModifier}`);
    } else if (constitutionModifier < 0) {
      rollParts.push(`- ${Math.abs(constitutionModifier)}`);
    }
    parts.push(rollParts.join(" "));
  }

  return {
    totalHealed,
    rollExpression: parts.join(" + "),
  };
}

export function recoverHitDiceOnLongRest(
  totalsByDie: Record<string, number>,
  currentByDie: Record<string, number>,
  totalLevel: number,
) {
  const next = { ...currentByDie };
  let remainingRecovery = Math.max(1, Math.floor(Math.max(0, totalLevel) / 2));

  const orderedDice = Object.entries(totalsByDie)
    .map(([die, total]) => ({
      die,
      total,
      current: currentByDie[die] ?? total,
      faces: Number.parseInt(die.replace(/\D+/g, ""), 10) || 0,
    }))
    .sort((left, right) => right.faces - left.faces);

  for (const entry of orderedDice) {
    if (remainingRecovery <= 0) {
      break;
    }

    const missing = Math.max(0, entry.total - entry.current);
    if (missing <= 0) {
      continue;
    }

    const recovered = Math.min(missing, remainingRecovery);
    next[entry.die] = entry.current + recovered;
    remainingRecovery -= recovered;
  }

  return next;
}

export function getActionDamageParts(
  character: DndCharacterDetailResponse,
  ability: CharacterAbilityResponse,
) {
  const normalizedTags = normalizeText(ability.tags);
  if (normalizedTags.includes(normalizeText("ATAQUESINARMAS"))) {
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

  const { damage, damageType } = getWeaponDamageParts(ability.formula);
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
  const normalizedText = normalizeText(
    `${ability.descripcion ?? ""} ${ability.formula ?? ""}`,
  );

  if (normalizedText.includes(normalizeText("descanso corto o largo"))) {
    return "shortOrLong" as const;
  }
  if (normalizedText.includes(normalizeText("descanso corto"))) {
    return "shortOrLong" as const;
  }
  if (normalizedText.includes(normalizeText("descanso largo"))) {
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

export function parseBiographySections(biography: string | null | undefined) {
  const rawBiography = (biography ?? "").trim();
  if (!rawBiography) {
    return { alignment: null, personalHistory: null };
  }

  const alignmentMatch = rawBiography.match(/Alineamiento:\s*(.+)/i);
  const historyMatch = rawBiography.match(/Historia personal:\s*([\s\S]+)/i);

  return {
    alignment: alignmentMatch?.[1]?.trim() || null,
    personalHistory: historyMatch?.[1]?.trim() || null,
  };
}

export function getCharacterLanguages(character: DndCharacterDetailResponse) {
  return uniqueNormalizedValues(
    character.habilidades
      .map((ability) => ability.nombre)
      .filter((name) => normalizeText(name).startsWith(normalizeText("Idioma")))
      .map((name) => name.replace(/^Idioma(?:\s+dote)?\s*:\s*/i, "").trim())
      .filter((name) => !/\bidioma\s+a\s+eleccion\b/i.test(normalizeText(name)))
      .filter(
        (name) => !/^\d+\s+idioma\s+a\s+eleccion$/i.test(normalizeText(name)),
      ),
  );
}

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

export function extractHitDiceStats(stats: Record<string, number>) {
  return Object.entries(stats)
    .filter(([name, value]) => /^Dados de golpe d\d+$/i.test(name) && value > 0)
    .map(([name, value]) => ({
      key: name,
      die: name.replace(/^Dados de golpe\s+/i, ""),
      total: value,
    }));
}

export function extractExtraResources(stats: Record<string, number>) {
  return Array.from({ length: 9 }, (_, index) => index + 1).map(
    (resourceIndex) => ({
      index: resourceIndex,
      current: stats[`Recurso custom dnd actual ${resourceIndex}`] ?? 0,
      max: stats[`Recurso custom dnd maximo ${resourceIndex}`] ?? 0,
    }),
  );
}
