import type { DndCharacterDetailResponse } from "../utils/dndApi";
import { SAVING_THROW_ROWS, SKILL_ROWS, SPELL_LEVELS } from "./data";
import {
  extractExtraResources,
  extractHitDiceStats,
  getCharacterLanguages,
  getCharacterMoney,
  parseBiographySections,
} from "./utils";

const CORE_STAT_NAMES = [
  "Fuerza",
  "Destreza",
  "Constitucion",
  "Inteligencia",
  "Sabiduria",
  "Carisma",
] as const;

export function buildCharacterSheetState(
  data: DndCharacterDetailResponse,
  healthCurrentStat: string,
  healthTempStat: string,
  healthTotalStat: string,
  movementStat: string,
) {
  const biographySections = parseBiographySections(data.biografia);

  return {
    currentHp: data.estadisticas[healthCurrentStat] ?? 0,
    tempHp: data.estadisticas[healthTempStat] ?? 0,
    currentSpellSlots: Object.fromEntries(
      SPELL_LEVELS.map((level) => [
        level,
        data.estadisticas[`Hechizos nivel ${level} gastados`] ??
          data.estadisticas[`Hechizos nivel ${level}`] ??
          0,
      ]).filter(([, amount]) => amount > 0),
    ),
    currentExtraResources: Object.fromEntries(
      extractExtraResources(data.estadisticas)
        .filter((entry) => entry.max > 0)
        .map((entry) => [entry.index, entry.current]),
    ),
    currentHitDice: Object.fromEntries(
      extractHitDiceStats(data.estadisticas).map((entry) => [
        entry.die,
        entry.total,
      ]),
    ),
    currentMoney: getCharacterMoney(data),
    editableName: data.nombre,
    editableAlignment: biographySections.alignment ?? "",
    editablePersonalHistory: biographySections.personalHistory ?? "",
    editableLanguagesText: getCharacterLanguages(data).join(", "),
    editableStatScores: Object.fromEntries(
      CORE_STAT_NAMES.map((statName) => [
        statName,
        data.estadisticas[statName] ?? 10,
      ]),
    ),
    editableMovement: data.estadisticas[movementStat] ?? 0,
    editableMaxHp: data.estadisticas[healthTotalStat] ?? 1,
    editableSpellSlotMaximums: Object.fromEntries(
      SPELL_LEVELS.map((level) => [
        level,
        data.estadisticas[`Hechizos nivel ${level}`] ?? 0,
      ]),
    ),
    editableExtraResourceMaximums: Object.fromEntries(
      extractExtraResources(data.estadisticas).map((entry) => [
        entry.index,
        entry.max,
      ]),
    ),
    editableSavingThrowProficiencies: SAVING_THROW_ROWS.filter(
      (item) =>
        (data.estadisticas[`Salvación de ${item.statName}`] ??
          data.estadisticas[`Salvacion de ${item.statName}`] ??
          0) > 0,
    ).map((item) => item.statName),
    editableSkillProficiencies: SKILL_ROWS.filter(
      (item) => (data.estadisticas[item.name] ?? 0) > 0,
    ).map((item) => item.name),
  };
}
