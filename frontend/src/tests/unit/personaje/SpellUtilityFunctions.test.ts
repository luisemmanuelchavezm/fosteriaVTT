// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  extractFirstRollableExpression,
  extractRollableExpressions,
  extractSpellMetadata,
  extractTagValue,
  getSpellLevelLabel,
} from "../../../components/spells/spellUtils";
import {
  extractSpellReferenceItems,
  hasSpellLikeTags,
  isSpellChoiceCatalog,
  isSpellReferenceColumn,
  normalizeChoiceCatalog,
} from "../../../components/spells/spellReferenceUtils";
import type { CharacterAbilityResponse } from "../../../screens/personaje/utils/dndApi";

const spell: CharacterAbilityResponse = {
  id: 3,
  nombre: "Misil mágico",
  bonificacion: null,
  formula: "3d4 + 3 fuerza",
  descripcion: "Impacta siempre",
  tags: "Hechizo;1,TiempoLanzamiento;1 accion,Duracion;Instantaneo,FormulaDado;3d4 + 3",
};

describe("hechizos y referencias - utilidades", () => {
  it("extrae metadatos, niveles y expresiones tirables", () => {
    expect(extractTagValue(spell.tags, "Duracion")).toBe("Instantaneo");
    expect(extractSpellMetadata(spell.tags)).toMatchObject({
      tiempoLanzamiento: "1 accion",
      duracion: "Instantaneo",
      formulaDado: "3d4 + 3",
    });
    expect(getSpellLevelLabel(spell)).toBe("Nivel 1");
    expect(extractFirstRollableExpression(spell.formula)).toBe("3d4 + 3");
    expect(extractRollableExpressions("1d6 + 2, 1d6 + 2 y luego 2d8")).toEqual([
      "1d6 + 2",
      "2d8",
    ]);
  });

  it("normaliza catalogos y detecta referencias de conjuros", () => {
    expect(normalizeChoiceCatalog("wizardCantrips")).toBe("trucosdemago");
    expect(isSpellChoiceCatalog("Conjuros")).toBe(true);
    expect(hasSpellLikeTags("Truco, Ritual")).toBe(true);
    expect(isSpellReferenceColumn("Conjuros conocidos")).toBe(true);
    expect(extractSpellReferenceItems("Truco Prestidigitacion")).toEqual([
      {
        displayText: "Prestidigitacion",
        lookupName: "Prestidigitacion",
        prefix: "Truco",
      },
    ]);
    expect(extractSpellReferenceItems("Escudo, Misil mágico")).toEqual([
      { displayText: "Escudo", lookupName: "Escudo" },
      { displayText: "Misil mágico", lookupName: "Misil mágico" },
    ]);
  });

  it("getSpellLevelLabel devuelve Truco para habilidades con tag truco", () => {
    const cantrip: CharacterAbilityResponse = {
      id: 10,
      nombre: "Prestidigitacion",
      bonificacion: null,
      formula: null,
      descripcion: null,
      tags: "Truco",
    };
    expect(getSpellLevelLabel(cantrip)).toBe("Truco");
  });

  it("getSpellLevelLabel devuelve Hechizo cuando no hay tags de nivel", () => {
    const noLevel: CharacterAbilityResponse = {
      id: 11,
      nombre: "Ataque",
      bonificacion: null,
      formula: null,
      descripcion: null,
      tags: "DND,ARMA",
    };
    expect(getSpellLevelLabel(noLevel)).toBe("Hechizo");
  });

  it("extractFirstRollableExpression devuelve null cuando no hay texto", () => {
    expect(extractFirstRollableExpression(null)).toBeNull();
    expect(extractFirstRollableExpression("")).toBeNull();
    expect(extractFirstRollableExpression("solo texto sin dados")).toBeNull();
  });

  it("extractRollableExpressions devuelve array vacio cuando no hay texto", () => {
    expect(extractRollableExpressions(null)).toEqual([]);
    expect(extractRollableExpressions("")).toEqual([]);
  });
});
