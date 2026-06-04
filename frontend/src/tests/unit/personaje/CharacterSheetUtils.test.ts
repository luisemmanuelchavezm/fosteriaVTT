// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { buildCharacterSheetState } from "../../../screens/personaje/dndcharactersheet/screenState";
import {
  formatClassSummary,
  formatSignedValue,
  getCharacterLevel,
  getExperienceProgress,
  getProficiencyBonus,
  getRaceSummary,
} from "../../../screens/personaje/dndcharactersheet/utils/characterCore";
import {
  applyDamage,
  extractExtraResources,
  extractHitDiceStats,
  recoverHitDiceOnLongRest,
  resolveShortRestHealing,
} from "../../../screens/personaje/dndcharactersheet/utils/characterResources";
import {
  canTrackAbilityUsage,
  getAbilityModifierByName,
  getAbilityResetLabel,
  getActionDamageParts,
  isActionAbility,
  isPassiveAbility,
  getSpellLevel,
  getWeaponDamageParts,
  resolveCharacterFormula,
  shouldResetAbilityUsageOnRest,
} from "../../../screens/personaje/dndcharactersheet/utils/characterAbilities";
import {
  getCharacterCompetencies,
  splitCharacterCompetencies,
} from "../../../screens/personaje/dndcharactersheet/utils/characterCompetencies";
import {
  getCharacterMoney,
  getInventoryTagLabel,
} from "../../../screens/personaje/dndcharactersheet/utils/characterInventory";
import { getCharacterLanguages } from "../../../screens/personaje/dndcharactersheet/utils/characterProfile";
import {
  normalizeText,
  parseBiographySections,
  uniqueNormalizedValues,
} from "../../../screens/personaje/dndcharactersheet/utils/characterText";
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
    {
      id: 8,
      nombre: "Estoque",
      bonificacion: 5,
      formula: "1d8 perforante",
      descripcion: "Ataque con arma sutil",
      tags: "DND,ARMA,OBJETO,501",
    },
    {
      id: 9,
      nombre: "Hacha de mano",
      bonificacion: 4,
      formula: "1d6 cortante",
      descripcion: "Ataque con arma cuerpo a cuerpo",
      tags: "DND,ARMA,OBJETO,502",
    },
  ],
  mochila: [
    {
      id: 11,
      objetoId: null,
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
      objetoId: null,
      nombre: "Piezas de cobre",
      cantidad: 4,
      equipado: false,
      tags: "Dinero",
      tipoObjeto: "DINERO",
      formula: null,
      descripcion: null,
    },
    {
      id: 13,
      objetoId: null,
      nombre: "Estoque",
      cantidad: 1,
      equipado: true,
      tags: "AMCuerpo,Sutil",
      tipoObjeto: "ARMA",
      formula: "1d8 perforante",
      descripcion: null,
    },
    {
      id: 14,
      objetoId: null,
      nombre: "Hacha de mano",
      cantidad: 1,
      equipado: true,
      tags: "ASCuerpo,Ligera",
      tipoObjeto: "ARMA",
      formula: "1d6 cortante",
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

  it("considera las maniobras de maestro de batalla como visibles en pasivas", () => {
    expect(
      isPassiveAbility({
        id: 200,
        nombre: "Parada",
        bonificacion: null,
        formula: null,
        descripcion: "Reaccion para reducir dano",
        tags: "DND,Guerrero,MaestroDeBatalla,Maniobra,Defensa,Reaccion",
      }),
    ).toBe(true);
  });

  it("resuelve formulas, daño, dinero, idiomas y competencias", () => {
    expect(getAbilityModifierByName(baseCharacter, "Destreza")).toBe(3);
    expect(getSpellLevel(baseCharacter.habilidades[6])).toBe(1);
    expect(getWeaponDamageParts("1d8 + 3 cortante")).toEqual({
      damage: "1d8 + 3",
      damageType: "cortante",
    });
    expect(getWeaponDamageParts("10d100 + 10 + 2 perforante")).toEqual({
      damage: "10d100 + 10 + 2",
      damageType: "perforante",
    });
    expect(getWeaponDamageParts("1d6 - 1 contundente")).toEqual({
      damage: "1d6 - 1",
      damageType: "contundente",
    });
    expect(getWeaponDamageParts("10d100 + 10d100 + @fuerza")).toEqual({
      damage: "10d100 + 10d100 + @fuerza",
      damageType: "custom",
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
    // Carisma = 8 → mod -1, should normalize "+ -1" to "- 1"
    expect(
      resolveCharacterFormula(baseCharacter, "1d6 + @carisma perforante"),
    ).toBe("1d6 - 1 perforante");
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
    expect(
      getActionDamageParts(baseCharacter, baseCharacter.habilidades[7]),
    ).toEqual({
      damage: "1d8 + 3",
      damageType: "perforante",
      expression: "1d8 + 3",
    });
    expect(
      getActionDamageParts(baseCharacter, baseCharacter.habilidades[8]),
    ).toEqual({
      damage: "1d6 + 1",
      damageType: "cortante",
      expression: "1d6 + 1",
    });
    expect(
      getActionDamageParts(baseCharacter, {
        id: 900,
        nombre: "Arma custom",
        bonificacion: 0,
        formula: "10d100 + 10d100 + @fuerza + @fuerza + @fuerza",
        descripcion: null,
        tags: "DND,ARMA,OBJETO",
      }),
    ).toEqual({
      damage: "10d100 + 10d100 + 1 + 1 + 1",
      damageType: "custom",
      expression: "10d100 + 10d100 + 1 + 1 + 1",
    });
    // Admin-created weapon with negative stat mod: "1d6 + @carisma perforante" (Carisma mod = -1)
    expect(
      getActionDamageParts(baseCharacter, {
        id: 901,
        nombre: "Varita admin",
        bonificacion: 0,
        formula: "1d6 + @carisma perforante",
        descripcion: null,
        tags: "DND,ARMA,OBJETO",
      }),
    ).toEqual({
      damage: "1d6 - 1",
      damageType: "perforante",
      expression: "1d6 - 1",
    });
    // Multiple flat bonuses in formula (e.g. from admin form with baseBonus + abilityModifier resolved)
    expect(
      getActionDamageParts(baseCharacter, {
        id: 902,
        nombre: "Arma multi",
        bonificacion: 0,
        formula: "10d100 + 10 + @fuerza perforante",
        descripcion: null,
        tags: "DND,ARMA,OBJETO",
      }),
    ).toEqual({
      damage: "10d100 + 10 + 1",
      damageType: "perforante",
      expression: "10d100 + 10 + 1",
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
    expect(
      resolveShortRestHealing(
        "d8",
        2,
        2,
        vi.fn().mockReturnValueOnce(4).mockReturnValueOnce(6),
      ),
    ).toEqual({
      totalHealed: 14,
      rollExpression: "4 + 2 + 6 + 2",
    });
    expect(
      recoverHitDiceOnLongRest({ d12: 1, d6: 4 }, { d12: 0, d6: 2 }, 5),
    ).toEqual({ d12: 1, d6: 3 });
  });

  it("getActionDamageParts para monje de nivel 11 usa dado d8", () => {
    const monk11: DndCharacterDetailResponse = {
      ...baseCharacter,
      clases: [{ nombre: "Monje", nivel: 11 }],
    };
    const ataqSinarmasAbility: CharacterAbilityResponse = {
      id: 20,
      nombre: "Golpe desarmado nivel 11",
      bonificacion: 6,
      formula: null,
      descripcion: null,
      tags: "DND,ATAQUESINARMAS,ACCION",
    };
    const parts = getActionDamageParts(monk11, ataqSinarmasAbility);
    expect(parts.damage).toContain("d8");
    expect(parts.damageType).toBe("Contundente");
  });

  it("getActionDamageParts para monje de nivel 17+ usa dado d10", () => {
    const monk17: DndCharacterDetailResponse = {
      ...baseCharacter,
      clases: [{ nombre: "Monje", nivel: 17 }],
    };
    const ataqSinarmasAbility: CharacterAbilityResponse = {
      id: 21,
      nombre: "Golpe desarmado nivel 17",
      bonificacion: 6,
      formula: null,
      descripcion: null,
      tags: "DND,ATAQUESINARMAS,ACCION",
    };
    const parts = getActionDamageParts(monk17, ataqSinarmasAbility);
    expect(parts.damage).toContain("d10");
    expect(parts.damageType).toBe("Contundente");
  });

  it("getActionDamageParts sin clase monje usa daño = 1", () => {
    const noMonk: DndCharacterDetailResponse = {
      ...baseCharacter,
      clases: [{ nombre: "Guerrero", nivel: 5 }],
    };
    const ataqSinarmasAbility: CharacterAbilityResponse = {
      id: 22,
      nombre: "Golpe desarmado no monje",
      bonificacion: 6,
      formula: null,
      descripcion: null,
      tags: "DND,ATAQUESINARMAS,ACCION",
    };
    const parts = getActionDamageParts(noMonk, ataqSinarmasAbility);
    expect(parts.damage).toBe("1 + 1");
    expect(parts.damageType).toBe("Contundente");
  });

  it("getActionDamageParts monje usa max(fuerza, destreza)", () => {
    const highDexMonk: DndCharacterDetailResponse = {
      ...baseCharacter,
      clases: [{ nombre: "Monje", nivel: 5 }],
      estadisticas: { ...baseCharacter.estadisticas, Fuerza: 10, Destreza: 18 },
    };
    const ataqSinarmasAbility: CharacterAbilityResponse = {
      id: 23,
      nombre: "Golpe desarmado dex monje",
      bonificacion: 6,
      formula: null,
      descripcion: null,
      tags: "DND,ATAQUESINARMAS,ACCION",
    };
    const parts = getActionDamageParts(highDexMonk, ataqSinarmasAbility);
    // destreza 18 = +4 modifier
    expect(parts.damage).toContain("+ 4");
  });

  it("getActionDamageParts con formula sin datos devuelve --", () => {
    const emptyFormulaAbility: CharacterAbilityResponse = {
      id: 24,
      nombre: "Ataque vacio",
      bonificacion: null,
      formula: "",
      descripcion: null,
      tags: "DND,ARMA,OBJETO",
    };
    const parts = getActionDamageParts(baseCharacter, emptyFormulaAbility);
    expect(parts.damage).toBe("--");
  });

  it("getActionDamageParts no suma Fuerza en armas custom", () => {
    const characterWithCustomWeapon: DndCharacterDetailResponse = {
      ...baseCharacter,
      mochila: [
        ...baseCharacter.mochila,
        {
          id: 99,
          objetoId: null,
          nombre: "Bj",
          cantidad: 1,
          equipado: true,
          tags: "ASCuerpo,COMPETENTE_POR_DEFECTO",
          tipoObjeto: "ARMA",
          formula: "10d100 + 10d100",
          descripcion: null,
        },
      ],
    };

    const customWeaponAction: CharacterAbilityResponse = {
      id: 120,
      nombre: "Bj",
      bonificacion: 1,
      formula: "10d100 + 10d100",
      descripcion: null,
      tags: "DND,ARMA,OBJETO",
    };

    expect(
      getActionDamageParts(characterWithCustomWeapon, customWeaponAction),
    ).toEqual({
      damage: "10d100 + 10d100",
      damageType: "custom",
      expression: "10d100 + 10d100",
    });
  });

  it("isActionAbility devuelve false para competencia con ArmaduraPesada (no substring ARMA)", () => {
    const ability: CharacterAbilityResponse = {
      id: 26,
      nombre: "Competencia adicional",
      bonificacion: null,
      formula: "armadura pesada",
      descripcion: null,
      tags: "CClerigo;1,Vida,ArmaduraPesada",
    };
    expect(isActionAbility(ability)).toBe(false);
  });

  it("isActionAbility devuelve false para aliento draconico", () => {
    const ability: CharacterAbilityResponse = {
      id: 25,
      nombre: "Aliento draconico",
      bonificacion: null,
      formula: null,
      descripcion: null,
      tags: "DND,ALIENTODRACONICO,ACCION",
    };
    expect(isActionAbility(ability)).toBe(false);
  });

  it("resolveShortRestHealing con constitutionModifier negativo", () => {
    const result = resolveShortRestHealing(
      "d8",
      2,
      -2,
      vi.fn().mockReturnValueOnce(5).mockReturnValueOnce(5),
    );
    expect(result.totalHealed).toBe(6);
    expect(result.rollExpression).toBe("5 - 2 + 5 - 2");
  });

  it("recoverHitDiceOnLongRest cuando dice ya estan al maximo (missing <= 0)", () => {
    const result = recoverHitDiceOnLongRest({ d8: 5 }, { d8: 5 }, 5);
    expect(result).toEqual({ d8: 5 });
  });

  it("recoverHitDiceOnLongRest con remainingRecovery 0 (totalLevel muy pequeño)", () => {
    const result = recoverHitDiceOnLongRest(
      { d8: 4, d6: 4 },
      { d8: 1, d6: 1 },
      0,
    );
    // totalLevel 0 => remainingRecovery = max(1, floor(0/2)) = 1, solo recupera 1 dado
    expect(result.d8).toBe(2);
    expect(result.d6).toBe(1);
  });

  it("buildCharacterSheetState asigna nivel 2 (expertise) cuando storedValue >= proficiencyBonus * 2", () => {
    const expertiseCharacter = {
      ...baseCharacter,
      estadisticas: {
        ...baseCharacter.estadisticas,
        // proficiencyBonus = 3, expertise requires storedValue >= 6
        "Bonificador por competencia": 3,
        Acrobacias: 6, // 6 >= 3*2 → level 2
      },
    } as never;
    const state = buildCharacterSheetState(
      expertiseCharacter,
      "Vida actual",
      "Vida temporal",
      "Puntos de vida",
      "Movimiento",
    );
    expect(state.editableSkillProficiencyLevels["Acrobacias"]).toBe(2);
  });

  it("parseBiographySections devuelve nulls cuando biografia es nula o vacia", () => {
    expect(parseBiographySections(null)).toEqual({
      alignment: null,
      personalHistory: null,
    });
    expect(parseBiographySections("")).toEqual({
      alignment: null,
      personalHistory: null,
    });
  });

  it("resolveShortRestHealing retorna zeros cuando usedDice es 0", () => {
    const result = resolveShortRestHealing("d8", 0, 0, vi.fn());
    expect(result).toEqual({ totalHealed: 0, rollExpression: null });
  });

  it("resolveShortRestHealing retorna zeros cuando el dado es invalido", () => {
    const result = resolveShortRestHealing("dadoInvalido", 2, 0, vi.fn());
    expect(result).toEqual({ totalHealed: 0, rollExpression: null });
  });
});

// ── getInventoryTagLabel ─────────────────────────────────────────────────────

describe("getInventoryTagLabel", () => {
  function makeItem(tags: string) {
    return { tags } as never;
  }

  it("retorna string vacío para tags vacío", () => {
    expect(getInventoryTagLabel(makeItem(""))).toBe("");
  });

  it("retorna el nombre del tag simple", () => {
    expect(getInventoryTagLabel(makeItem("ARMA"))).toBe("ARMA");
  });

  it("une múltiples tags con coma y espacio", () => {
    expect(getInventoryTagLabel(makeItem("ARMA, ARMA CUERPO A CUERPO"))).toBe(
      "ARMA, ARMA CUERPO A CUERPO",
    );
  });

  it("filtra tag de visibilidad oficial", () => {
    expect(getInventoryTagLabel(makeItem("VisibilidadOficial, ARMA"))).toBe(
      "ARMA",
    );
  });

  it("filtra tag de visibilidad privado", () => {
    expect(getInventoryTagLabel(makeItem("VisibilidadPrivado, ARMA"))).toBe(
      "ARMA",
    );
  });

  it("filtra tags que empiezan con propietario", () => {
    expect(getInventoryTagLabel(makeItem("propietario123, ARMA"))).toBe("ARMA");
  });

  it("filtra tag competentepordefecto", () => {
    expect(getInventoryTagLabel(makeItem("competentepordefecto, ARMA"))).toBe(
      "ARMA",
    );
  });

  it("usa la parte derecha si el tag tiene punto y coma (tipo;descripcion)", () => {
    expect(getInventoryTagLabel(makeItem("tipo;EspadaLarga"))).toBe(
      "EspadaLarga",
    );
  });

  it("reemplaza guiones bajos con espacios en la etiqueta", () => {
    expect(getInventoryTagLabel(makeItem("tipo;Espada_Larga"))).toBe(
      "Espada Larga",
    );
  });

  it("retorna string vacío si todos los tags son filtrados", () => {
    expect(
      getInventoryTagLabel(makeItem("VisibilidadOficial, VisibilidadPrivado")),
    ).toBe("");
  });
});
