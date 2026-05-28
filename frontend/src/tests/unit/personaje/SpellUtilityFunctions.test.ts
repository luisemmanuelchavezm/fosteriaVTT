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

  it("extractTagValue devuelve null cuando tags es null o undefined", () => {
    expect(extractTagValue(null, "Duracion")).toBeNull();
    expect(extractTagValue(undefined, "Alcance")).toBeNull();
  });
});

// ── normalizeChoiceCatalog - casos adicionales ────────────────────────────────

describe("normalizeChoiceCatalog - casos adicionales", () => {
  it("normaliza 'cantrips' y 'trucos' a 'trucos'", () => {
    expect(normalizeChoiceCatalog("cantrips")).toBe("trucos");
    expect(normalizeChoiceCatalog("trucos")).toBe("trucos");
  });

  it("normaliza 'skills' a 'habilidades'", () => {
    expect(normalizeChoiceCatalog("skills")).toBe("habilidades");
    expect(normalizeChoiceCatalog("habilidades")).toBe("habilidades");
  });

  it("normaliza 'languages' a 'idiomas'", () => {
    expect(normalizeChoiceCatalog("languages")).toBe("idiomas");
    expect(normalizeChoiceCatalog("idiomas")).toBe("idiomas");
  });

  it("normaliza 'abilityscores' a 'puntuacionescaracteristica'", () => {
    expect(normalizeChoiceCatalog("abilityscores")).toBe(
      "puntuacionescaracteristica",
    );
    expect(normalizeChoiceCatalog("puntuacionesCaracteristica")).toBe(
      "puntuacionescaracteristica",
    );
  });

  it("normaliza 'artisantools' a 'herramientasartesano'", () => {
    expect(normalizeChoiceCatalog("artisantools")).toBe("herramientasartesano");
    expect(normalizeChoiceCatalog("herramientasArtesano")).toBe(
      "herramientasartesano",
    );
  });

  it("normaliza 'games' a 'juegos'", () => {
    expect(normalizeChoiceCatalog("games")).toBe("juegos");
    expect(normalizeChoiceCatalog("juegos")).toBe("juegos");
  });

  it("normaliza 'instruments' a 'instrumentos'", () => {
    expect(normalizeChoiceCatalog("instruments")).toBe("instrumentos");
    expect(normalizeChoiceCatalog("instrumentos")).toBe("instrumentos");
  });

  it("normaliza 'draconicancestors' a 'ancestrosdraconicos'", () => {
    expect(normalizeChoiceCatalog("draconicancestors")).toBe(
      "ancestrosdraconicos",
    );
    expect(normalizeChoiceCatalog("ancestrosDraconicos")).toBe(
      "ancestrosdraconicos",
    );
  });

  it("retorna el valor normalizado en caso default", () => {
    expect(normalizeChoiceCatalog("unknown_value")).toBe("unknownvalue");
  });

  it("retorna string vacío para null/undefined", () => {
    expect(normalizeChoiceCatalog(null)).toBe("");
    expect(normalizeChoiceCatalog(undefined)).toBe("");
  });
});

// ── extractSpellReferenceItems - casos adicionales ────────────────────────────

describe("extractSpellReferenceItems - casos adicionales", () => {
  it("retorna array vacío para texto vacío", () => {
    expect(extractSpellReferenceItems("")).toEqual([]);
  });

  it("retorna array vacío para texto que contiene dígitos", () => {
    expect(extractSpellReferenceItems("1d6")).toEqual([]);
    expect(extractSpellReferenceItems("3 hechizos")).toEqual([]);
  });

  it("retorna un solo item para texto sin comas", () => {
    expect(extractSpellReferenceItems("Escudo")).toEqual([
      { displayText: "Escudo", lookupName: "Escudo" },
    ]);
  });

  it("trata 'truco' sin nombre como un item normal (no hace match del regex)", () => {
    // "truco" sin nombre después → el regex /^truco\s+(.+)$/i no hace match
    // se trata como un item normal
    expect(extractSpellReferenceItems("truco")).toEqual([
      { displayText: "truco", lookupName: "truco" },
    ]);
  });
});
