import type { DndCharacterDetailResponse } from "../../../personaje/utils/dndApi";
import {
  getActionDamageParts,
  isActionAbility,
} from "../../../personaje/dndcharactersheet/utils/characterAbilities";

const MB_STAT_FORMULA_MAP: { name: string; modKey: string }[] = [
  { name: "fuerza", modKey: "MB_ModFuerza" },
  { name: "agilidad", modKey: "MB_ModAgilidad" },
  { name: "presencia", modKey: "MB_ModPresencia" },
  { name: "resistencia", modKey: "MB_ModResistencia" },
];

function normalizeMbDamageExpression(expression: string | null): string | null {
  if (!expression) return null;
  return expression.replace(/(^|[+(-])d(\d+)/gi, "$11d$2");
}

export function getMBWeaponOptions(
  detail: DndCharacterDetailResponse | null,
): WeaponOption[] {
  if (!detail) return [];
  const stats = detail.estadisticas;
  return detail.mochila
    .filter((item) => item.tipoObjeto === "ARMA" && item.formula)
    .map((item) => {
      const formula = item.formula!.toLowerCase();
      let mod = 0;
      let damageExpr = formula;
      for (const { name, modKey } of MB_STAT_FORMULA_MAP) {
        if (formula.includes(name)) {
          mod = stats[modKey] ?? 0;
          if (mod >= 0) {
            damageExpr = formula.replace(name, String(mod));
          } else {
            // Replace "+stat" with "-abs(mod)" to get valid dice expression (e.g. "2d4-2")
            damageExpr = formula.replace(`+${name}`, String(mod));
            if (damageExpr === formula)
              damageExpr = formula.replace(name, String(mod));
          }
          break;
        }
      }
      return {
        id: item.id,
        name: item.nombre,
        attackBonus: mod,
        damageExpression: normalizeMbDamageExpression(damageExpr),
      };
    });
}

export function buildCriticalExpression(
  expression: string | null,
): string | null {
  if (!expression) return null;
  return expression.replace(/(\d+)d(\d+)/gi, (_, rawCount, rawFaces) => {
    const count = Number.parseInt(rawCount, 10);
    const faces = Number.parseInt(rawFaces, 10);
    if (Number.isNaN(count) || Number.isNaN(faces))
      return `${rawCount}d${rawFaces}`;
    return `${count * 2}d${faces}`;
  });
}

function hasExactTagAT(tags: string | null | undefined, key: string): boolean {
  return !!tags && tags.split(",").some((t) => t.trim() === key);
}

/** Weapons for MB enemies — read from habilidades (MBEnemyArma) and biography (random weapon). */
export function getMBEnemyWeaponOptions(
  detail: DndCharacterDetailResponse | null,
): WeaponOption[] {
  if (!detail) return [];
  const tags = detail.tags ?? "";
  const options: WeaponOption[] = [];

  // Random weapon (e.g. Berserker): resolved via mbArmaIdx tag + biography JSON
  const armaIdxMatch = tags.match(/mbArmaIdx;(\d+)/);
  if (armaIdxMatch && detail.biografia) {
    try {
      const bio = JSON.parse(detail.biografia) as {
        armaAleatoria?: { opciones: { nombre: string; formula: string }[] };
      };
      const idx = Number.parseInt(armaIdxMatch[1], 10) - 1;
      const weapon = bio.armaAleatoria?.opciones[idx];
      if (weapon) {
        options.push({
          id: -1,
          name: weapon.nombre,
          attackBonus: null,
          damageExpression: normalizeMbDamageExpression(weapon.formula),
        });
      }
    } catch {
      /* ignore */
    }
  }

  // Static weapons from habilidades tagged MBEnemyArma / MBEnemyArmaEspecial
  for (const h of detail.habilidades) {
    if (
      (hasExactTagAT(h.tags, "MBEnemyArma") ||
        hasExactTagAT(h.tags, "MBEnemyArmaEspecial")) &&
      h.formula
    ) {
      options.push({
        id: h.id,
        name: h.nombre,
        attackBonus: null,
        damageExpression: normalizeMbDamageExpression(h.formula),
      });
    }
  }

  return options;
}

export function getWeaponOptions(
  detail: DndCharacterDetailResponse | null,
): WeaponOption[] {
  if (!detail) return [];
  return detail.habilidades.filter(isActionAbility).map((ability) => ({
    id: ability.id,
    name: ability.nombre,
    attackBonus: ability.bonificacion ?? null,
    damageExpression:
      getActionDamageParts(detail, ability).expression ?? ability.formula,
  }));
}

export interface AdvantageResult {
  die1: number;
  die2: number;
  modifier: number;
  weaponName: string;
  type: "ventaja" | "desventaja";
}

export interface WeaponOption {
  id: number;
  name: string;
  attackBonus: number | null;
  damageExpression: string | null;
}

export interface AttackRollAction {
  id: string;
  label: string;
  image: string;
  onClick: () => void;
}
