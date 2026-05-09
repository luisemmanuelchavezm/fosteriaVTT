import type { DndClassDetail } from "../../types";

export const HEALTH_TOTAL_STAT = "Puntos de vida";
export const HEALTH_CURRENT_STAT = "Vida actual";
export const HEALTH_TEMP_STAT = "Vida temporal";
export const MOVEMENT_STAT = "Movimiento";
export const ARMOR_CLASS_STAT = "CA";
export const MAX_DELTA_VALUE = 99;
export const MAX_CURRENT_HP = 3000;
export const MAX_TEMP_HP = 300;

export function extractClassCompetencies(detail: DndClassDetail) {
  return [
    ...detail.competencias.armaduras,
    ...detail.competencias.armas,
    ...detail.competencias.herramientas,
  ]
    .map((value) => value.trim())
    .filter(Boolean);
}

export function sanitizeNonNegativeNumber(value: string) {
  const digitsOnly = value.replace(/\D+/g, "");
  if (digitsOnly === "") {
    return "0";
  }
  return String(Math.min(MAX_DELTA_VALUE, Number.parseInt(digitsOnly, 10)));
}
