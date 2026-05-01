// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { buildCharacterSheetState } from "../../../screens/personaje/dndcharactersheet/screenState";
import {
  applyDamage,
  canTrackAbilityUsage,
  formatClassSummary,
  formatSignedValue,
  getAbilityModifierByName,
  getAbilityResetLabel,
  getActionDamageParts,
  getCharacterCompetencies,
  getCharacterLanguages,
  getCharacterLevel,
  getCharacterMoney,
  getExperienceProgress,
  getProficiencyBonus,
  getRaceSummary,
  getSpellLevel,
  getWeaponDamageParts,
  normalizeText,
  parseBiographySections,
  resolveCharacterFormula,
  shouldResetAbilityUsageOnRest,
  splitCharacterCompetencies,
  uniqueNormalizedValues,
  extractHitDiceStats,
  extractExtraResources,
} from "../../../screens/personaje/dndcharactersheet/utils";
import type {
  CharacterAbilityResponse,
  DndCharacterDetailResponse,
} from "../../../screens/personaje/utils/dndApi";
import type { DndCompetencyCatalog } from "../../../screens/personaje/types";

const baseCharacter: DndCharacterDetailResponse = {
  id: 7,
  nombre: "Aria",
  retrato: "https://img",
  biografia: "Alineamiento: Caotico bueno\nHistoria personal: Heroina del alba",
  sistemaDeJuego: "Dungeons and Dragons",
  raza: "Elfo",
  subraza: "Alto elfo",
  clases: [
    { nombre: "Monje", nivel: 5 },
    { nombre: "Mago", nivel: 1 },
  ],
  caracteristicaLanzamientoConjuros: "Sabiduria",
  estadisticas: {
    Fuerza: 12,
    Destreza: 16,
    Constitucion: 14,
    Inteligencia: 13,
    Sabiduria: 15,
    Carisma: 8,
    Experiencia: 6500,
    "Bonificador por competencia": 3,
    "Puntos de vida": 31,
    "Vida actual": 24,
    "Vida temporal": 5,
    Movimiento: 9,
    "Hechizos nivel 1": 2,
    "Hechizos nivel 1 gastados": 1,
    "Dados de golpe d8": 5,
    "Recurso custom dnd actual 1": 2,
    "Recurso custom dnd maximo 1": 4,
    "Salvación de Fuerza": 1,
    Acrobacias: 5,
    Percepcion: 4,
  },
  habilidades: [
    {
      id: 1,
      nombre: "Competencia: Espada larga",
      bonificacion: null,
      formula: null,
      descripcion: "Competencia marcial",
      tags: "DND,CLASE",
    },
    {
      id: 2,
      nombre: "Competencia dote: Herramientas de ladron",
      bonificacion: null,
      formula: null,
      descripcion: "Dote",
      tags: "DND,DOTE",
    },
    {
      id: 3,
      nombre: "Idioma: Elfico",
      bonificacion: null,
      formula: null,
      descripcion: null,
      tags: "DND",
    },
    {
      id: 4,
      nombre: "Idioma dote: Elfico",
      bonificacion: null,
      formula: null,
      descripcion: null,
      tags: "DND,DOTE",
    },
    {
      id: 5,
      nombre: "Idioma: idioma a elección",
      bonificacion: null,
      formula: null,
      descripcion: null,
      tags: "DND",
    },
    {
      id: 6,
      nombre: "Golpe desarmado",
      bonificacion: 6,
      formula: "1 contundente",
      descripcion: "Ataque sin armas",
      tags: "DND,ATAQUESINARMAS,ACCION",
    },
    {
      id: 7,
      nombre: "Descarga cromatica",
      bonificacion: 5,
      formula: "3d8 relampago",
      descripcion: "Descanso largo",
      tags: "Hechizo;1,TiempoLanzamiento;1 accion",
    },
  ],
  mochila: [
    {
      id: 11,
      nombre: "Piezas de oro",
      cantidad: 23,
      equipado: false,
      tags: "Dinero",
      tipoObjeto: "DINERO",
      formula: null,
      descripcion: null,
    },
    {
      id: 12,
      nombre: "Piezas de cobre",
      cantidad: 4,
      equipado: false,
      tags: "Dinero",
      tipoObjeto: "DINERO",
      formula: null,
      descripcion: null,
    },
  ],
  usado: "2026-04-28T21:00:00",
};

const catalog: DndCompetencyCatalog = {
  habilidades: ["Acrobacias", "Percepcion"],
  armasArmaduras: ["Espada larga", "Escudo"],
  herramientas: ["Herramientas de ladron"],
};

const longRestAbility: CharacterAbilityResponse = {
  id: 99,
  nombre: "Descarga cromatica",
  bonificacion: 5,
  formula: "3d8 relampago",
  descripcion: "Recuperas este uso tras un descanso largo",
  tags: "Hechizo;1",
};

describe("hoja de personaje - utilidades", () => {
  it("construye el estado editable inicial de la hoja", () => {
    const state = buildCharacterSheetState(
      baseCharacter,
      "Vida actual",
      "Vida temporal",
      "Puntos de vida",
      "Movimiento",
    );

    expect(state.currentHp).toBe(24);
    expect(state.tempHp).toBe(5);
    expect(state.currentSpellSlots).toEqual({ 1: 1 });
    expect(state.currentExtraResources).toEqual({ 1: 2 });
    expect(state.currentHitDice).toEqual({ d8: 5 });
    expect(state.currentMoney).toEqual({ ppt: 0, po: 23, pp: 0, pc: 4 });
    expect(state.editableName).toBe("Aria");
    expect(state.editableAlignment).toBe("Caotico bueno");
    expect(state.editablePersonalHistory).toBe("Heroina del alba");
    expect(state.editableLanguagesText).toBe("Elfico");
    expect(state.editableStatScores.Destreza).toBe(16);
    expect(state.editableSavingThrowProficiencies).toEqual(["Fuerza"]);
    expect(state.editableSkillProficiencies).toEqual(
      expect.arrayContaining(["Acrobacias", "Percepcion"]),
    );
  });

  it("resuelve progresion, resumenes y normalizacion de texto", () => {
    expect(getCharacterLevel(baseCharacter.clases)).toBe(6);
    expect(getProficiencyBonus(baseCharacter)).toBe(3);
    expect(getProficiencyBonus({ ...baseCharacter, estadisticas: {} })).toBe(3);
    expect(formatClassSummary(baseCharacter.clases)).toBe(
      "Monje nivel 5, Mago nivel 1",
    );
    expect(getRaceSummary("Elfo", "Alto elfo")).toBe("Elfo, Alto elfo");
    expect(getRaceSummary(null, null)).toBe("-");
    expect(
      getExperienceProgress(baseCharacter.clases, baseCharacter.estadisticas),
    ).toEqual({
      currentLevel: 6,
      currentXp: 6500,
      nextLevelXp: 9000,
    });
    expect(formatSignedValue(-2)).toBe("-2");
    expect(normalizeText("ÁrCANO")).toBe("arcano");
    expect(uniqueNormalizedValues(["Élfico", "elfico", "Enano"])).toEqual([
      "Élfico",
      "Enano",
    ]);
    expect(parseBiographySections(baseCharacter.biografia)).toEqual({
      alignment: "Caotico bueno",
      personalHistory: "Heroina del alba",
    });
  });

  it("resuelve formulas, daño, dinero, idiomas y competencias", () => {
    expect(getAbilityModifierByName(baseCharacter, "Destreza")).toBe(3);
    expect(getSpellLevel(baseCharacter.habilidades[6])).toBe(1);
    expect(getWeaponDamageParts("1d8 + 3 cortante")).toEqual({
      damage: "1d8 + 3",
      damageType: "cortante",
    });
    expect(getCharacterMoney(baseCharacter)).toEqual({
      ppt: 0,
      po: 23,
      pp: 0,
      pc: 4,
    });
    expect(getCharacterLanguages(baseCharacter)).toEqual(["Elfico"]);
    expect(
      getCharacterCompetencies(baseCharacter, ["Escudo"], catalog),
    ).toEqual(["Escudo", "Espada larga", "Herramientas de ladron"]);
    expect(
      splitCharacterCompetencies(
        ["Espada larga", "Herramientas de ladron", "Acrobacias"],
        catalog,
      ),
    ).toEqual({
      weaponArmor: ["Espada larga"],
      tools: ["Herramientas de ladron"],
    });
    expect(
      resolveCharacterFormula(baseCharacter, "1d20 + @destreza + @sabiduria"),
    ).toBe("1d20 + 3 + 2");
  });

  it("maneja daño, descansos y recursos de combate", () => {
    expect(applyDamage(24, 5, 7)).toEqual({ currentHp: 22, tempHp: 0 });
    expect(
      getActionDamageParts(baseCharacter, baseCharacter.habilidades[5]),
    ).toEqual({
      damage: "1d6 + 3",
      damageType: "Contundente",
      expression: "1d6 + 3",
    });
    expect(shouldResetAbilityUsageOnRest(longRestAbility, "short")).toBe(false);
    expect(shouldResetAbilityUsageOnRest(longRestAbility, "long")).toBe(true);
    expect(getAbilityResetLabel(longRestAbility)).toBe("Descanso largo");
    expect(canTrackAbilityUsage(longRestAbility)).toBe(true);
    expect(extractHitDiceStats(baseCharacter.estadisticas)).toEqual([
      { key: "Dados de golpe d8", die: "d8", total: 5 },
    ]);
    expect(extractExtraResources(baseCharacter.estadisticas)[0]).toEqual({
      index: 1,
      current: 2,
      max: 4,
    });
  });
});
