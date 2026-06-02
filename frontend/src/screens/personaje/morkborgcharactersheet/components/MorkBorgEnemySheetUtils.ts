import type { DndCharacterDetailResponse } from "../../utils/dndApi";

// ── Tag helpers ──────────────────────────────────────────────────────────────

export function hasTag(tags: string | null | undefined, key: string): boolean {
  return !!tags && tags.includes(key);
}

export function extractTagNumber(
  tags: string | null | undefined,
  key: string,
): number | null {
  if (!tags) return null;
  const match = tags.match(new RegExp(`${key};(\\d+)`));
  return match ? Number.parseInt(match[1], 10) : null;
}

export function hasExactTag(
  tags: string | null | undefined,
  key: string,
): boolean {
  if (!tags) return false;
  return tags.split(",").some((t) => t.trim() === key);
}

export function getWeapons(character: DndCharacterDetailResponse) {
  return character.habilidades.filter(
    (h) =>
      hasExactTag(h.tags, "MBEnemyArma") ||
      hasExactTag(h.tags, "MBEnemyArmaEspecial"),
  );
}

export function getArmaduras(character: DndCharacterDetailResponse) {
  return character.habilidades.filter((h) =>
    hasExactTag(h.tags, "MBEnemyArmadura"),
  );
}

export function getRasgo(character: DndCharacterDetailResponse): string | null {
  const h = character.habilidades.find((h) => hasTag(h.tags, "MBEnemyRasgo"));
  return h?.descripcion ?? null;
}

export function getEspecial(
  character: DndCharacterDetailResponse,
): string | null {
  const h = character.habilidades.find((h) =>
    hasTag(h.tags, "MBEnemyEspecial"),
  );
  return h?.descripcion ?? null;
}

export function getLoot(character: DndCharacterDetailResponse): string | null {
  const h = character.habilidades.find((h) => hasTag(h.tags, "MBEnemyLoot"));
  return h?.descripcion ?? null;
}

// ── Random trait resolution ───────────────────────────────────────────────────

export interface RandomTable {
  tagKey: string;
  nombre: string;
  dados: string;
  opciones: string[];
}

export interface WeaponOption {
  nombre: string;
  formula: string;
}

export interface RandomWeaponTable {
  tagKey: string;
  nombre: string;
  dados: string;
  opciones: WeaponOption[];
}

export interface BiografiaJson {
  rasgosAleatorios?: RandomTable[];
  armaAleatoria?: RandomWeaponTable;
}

export function isEspecialTable(table: RandomTable): boolean {
  return table.tagKey.toLowerCase().includes("especial");
}

export function parseBiografia(
  bio: string | null | undefined,
): BiografiaJson | null {
  if (!bio) return null;
  try {
    return JSON.parse(bio) as BiografiaJson;
  } catch {
    return null;
  }
}

export function resolveRandomTraits(
  tables: RandomTable[],
  tags: string | null | undefined,
): Array<{ nombre: string; resultado: string } | null> {
  return tables.map((t) => {
    const idx = extractTagNumber(tags, t.tagKey);
    if (idx === null) return null;
    const value = t.opciones[idx - 1];
    return value ? { nombre: t.nombre, resultado: value } : null;
  });
}

export function resolveRandomWeapon(
  table: RandomWeaponTable,
  tags: string | null | undefined,
): { nombre: string; formula: string } | null {
  const idx = extractTagNumber(tags, table.tagKey);
  if (idx === null) return null;
  return table.opciones[idx - 1] ?? null;
}
