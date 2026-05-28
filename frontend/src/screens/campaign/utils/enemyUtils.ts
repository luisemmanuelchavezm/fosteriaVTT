import type { AddDndCharacterInventoryItemRequest } from "../../personaje/utils/dndApi";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface SkillOverride {
  skill: string;
  bonus: number;
}

export interface SaveOverride {
  ability: string;
  bonus: number;
}

export interface PassiveEntry {
  nombre: string;
  descripcion: string;
}

export interface ActionEntry {
  nombre: string;
  descripcion: string;
}

export interface WeaponEntry {
  key: number;
  displayName: string;
  payload: AddDndCharacterInventoryItemRequest;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function calcMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : String(mod);
}
