import { describe, expect, it } from "vitest";
import type { DndCharacterDetailResponse } from "../../../screens/personaje/utils/dndApi";
import {
  FEAT_ATTRIBUTE_OPTIONS,
  FEAT_LANGUAGE_OPTIONS,
  FEAT_SKILL_OPTIONS,
} from "../../../screens/personaje/dndcharactersheet/feats/constants";
import { FEAT_OPTIONS } from "../../../screens/personaje/dndcharactersheet/feats/catalog";
import {
  buildFeat,
  buildFeatStatBonuses,
  getFeatValidity,
} from "../../../screens/personaje/dndcharactersheet/feats/helpers";

function buildCharacter(overrides: Record<string, unknown> = {}) {
  return {
    estadisticas: {
      Fuerza: 14,
      Destreza: 14,
      Constitucion: 14,
      Inteligencia: 14,
      Sabiduria: 14,
      Carisma: 14,
    },
    caracteristicaLanzamientoConjuros: "Inteligencia",
    ...overrides,
  } as never;
}

describe("dndcharactersheet feats", () => {
  it("expone los catalogos base y el listado completo de dotes", () => {
    expect(FEAT_OPTIONS.length).toBeGreaterThan(30);
    expect(FEAT_OPTIONS.map((feat) => feat.id)).toContain(
      "iniciado-en-la-magia",
    );
    expect(FEAT_OPTIONS.map((feat) => feat.id)).toContain("maestro-de-armas");
    expect(FEAT_ATTRIBUTE_OPTIONS).toContain("Fuerza");
    expect(FEAT_LANGUAGE_OPTIONS).toContain("Draconico");
    expect(FEAT_SKILL_OPTIONS).toContain("Percepcion");

    const magicInitiate = FEAT_OPTIONS.find(
      (feat) => feat.id === "iniciado-en-la-magia",
    );
    const weaponMaster = FEAT_OPTIONS.find(
      (feat) => feat.id === "maestro-de-armas",
    );

    expect(magicInitiate?.spellSelection).toEqual(
      expect.objectContaining({
        chooseClass: true,
        cantrips: 2,
        spells: 1,
        spellLevel: 1,
      }),
    );
    expect(weaponMaster?.selectableCompetencies).toEqual(
      expect.objectContaining({ count: 4 }),
    );
  });

  it("valida requisitos por caracteristica, lanzamiento de conjuros y competencias", () => {
    const strongCaster = buildCharacter();
    const weakNonCaster = buildCharacter({
      estadisticas: {
        Fuerza: 10,
        Destreza: 10,
        Constitucion: 10,
        Inteligencia: 10,
        Sabiduria: 10,
        Carisma: 10,
      },
      caracteristicaLanzamientoConjuros: null,
    });

    const duelist = FEAT_OPTIONS.find(
      (feat) => feat.id === "duelista-defensivo",
    );
    const ritualCaster = FEAT_OPTIONS.find(
      (feat) => feat.id === "lanzador-ritual",
    );
    const elementalAdept = FEAT_OPTIONS.find(
      (feat) => feat.id === "adepto-elemental",
    );
    const heavilyArmored = FEAT_OPTIONS.find(
      (feat) => feat.id === "fuertemente-acorazado",
    );
    const shieldMaster = FEAT_OPTIONS.find(
      (feat) => feat.id === "maestro-de-escudo",
    );
    const martialAdept = FEAT_OPTIONS.find(
      (feat) => feat.id === "adepto-marcial",
    );

    expect(getFeatValidity(duelist!, strongCaster, [])).toBe(true);
    expect(getFeatValidity(duelist!, weakNonCaster, [])).toBe(false);

    expect(getFeatValidity(ritualCaster!, strongCaster, [])).toBe(true);
    expect(getFeatValidity(ritualCaster!, weakNonCaster, [])).toBe(false);

    expect(getFeatValidity(elementalAdept!, strongCaster, [])).toBe(true);
    expect(getFeatValidity(elementalAdept!, weakNonCaster, [])).toBe(false);

    expect(
      getFeatValidity(heavilyArmored!, strongCaster, [
        "Armaduras ligeras",
        "Armadura media",
      ]),
    ).toBe(true);
    expect(
      getFeatValidity(heavilyArmored!, strongCaster, ["Armaduras ligeras"]),
    ).toBe(false);

    expect(getFeatValidity(shieldMaster!, strongCaster, ["Escudos"])).toBe(
      true,
    );
    expect(
      getFeatValidity(shieldMaster!, strongCaster, ["Armas simples"]),
    ).toBe(false);

    expect(
      getFeatValidity(martialAdept!, strongCaster, ["Armas marciales"]),
    ).toBe(true);
    expect(
      getFeatValidity(martialAdept!, strongCaster, ["Armas simples"]),
    ).toBe(false);
  });

  it("combina bonificadores fijos y seleccionables respetando el maximo permitido", () => {
    const athlete = FEAT_OPTIONS.find((feat) => feat.id === "atleta");
    const linguist = FEAT_OPTIONS.find((feat) => feat.id === "linguista");
    const resilient = FEAT_OPTIONS.find((feat) => feat.id === "resiliente");

    expect(buildFeatStatBonuses(athlete!, ["Fuerza", "Destreza"])).toEqual({
      Fuerza: 1,
    });

    expect(buildFeatStatBonuses(linguist!, [])).toEqual({ Inteligencia: 1 });

    expect(buildFeatStatBonuses(resilient!, ["Sabiduria"])).toEqual({
      Sabiduria: 1,
    });
  });

  it("buildFeat sin validate usa alwaysValid (devuelve true)", () => {
    const feat = buildFeat({
      id: "custom",
      nombre: "Custom",
      descripcion: "Desc",
      requisitos: [],
    });
    expect(
      feat.validate!({} as unknown as DndCharacterDetailResponse, []),
    ).toBe(true);
  });

  it("buildFeatStatBonuses ignora stats vacios", () => {
    // resiliente has no selectableBonus count > 1, build a custom feat instead
    const customFeat = buildFeat({
      id: "custom2",
      nombre: "Custom2",
      descripcion: "Desc",
      requisitos: [],
      selectableBonus: { count: 2, amount: 1, options: ["Fuerza", "Destreza"] },
    });
    const result = buildFeatStatBonuses(customFeat, ["", "Fuerza"]);
    // "" should be skipped, "Fuerza" should apply
    expect(result.Fuerza).toBe(1);
    expect(result[""]).toBeUndefined();
  });
});
