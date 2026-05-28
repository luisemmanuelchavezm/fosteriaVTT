import type { DndCharacterDetailResponse } from "../../../personaje/utils/dndApi";
import {
  getActionDamageParts,
  isActionAbility,
} from "../../../personaje/dndcharactersheet/utils/characterAbilities";

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
