export type EquipmentKind = "ARMA" | "ARMADURA";

export interface RandomTable {
  tagKey: string;
  nombre: string;
  dados: string;
  opciones: string[];
}

export interface BiografiaJson {
  rasgosAleatorios?: RandomTable[];
}

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function buildEquipmentTag(kind: EquipmentKind) {
  return kind === "ARMA"
    ? "MORK_BORG,MBEnemyArma"
    : "MORK_BORG,MBEnemyArmadura";
}

export function buildRandomTable(
  tagKey: string,
  nombre: string,
  entries: string[],
): RandomTable {
  return {
    tagKey,
    nombre,
    dados: `d${entries.length}`,
    opciones: entries,
  };
}

export function buildStaticText(entries: string[]) {
  return entries[0] ?? "Nada";
}
