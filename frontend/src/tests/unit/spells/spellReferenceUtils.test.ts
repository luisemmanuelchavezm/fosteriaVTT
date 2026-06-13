import { describe, expect, it } from "vitest";
import {
  normalizeChoiceCatalog,
  isSpellChoiceCatalog,
  hasSpellLikeTags,
  isSpellReferenceColumn,
  extractSpellReferenceItems,
} from "../../../components/spells/spellReferenceUtils";

describe("normalizeChoiceCatalog", () => {
  it("retorna vacío para null/undefined", () => {
    expect(normalizeChoiceCatalog(null)).toBe("");
    expect(normalizeChoiceCatalog(undefined)).toBe("");
  });

  it("normaliza variantes de conjuros", () => {
    expect(normalizeChoiceCatalog("spells")).toBe("conjuros");
    expect(normalizeChoiceCatalog("conjuros")).toBe("conjuros");
    expect(normalizeChoiceCatalog("CONJUROS")).toBe("conjuros");
  });

  it("normaliza variantes de trucos", () => {
    expect(normalizeChoiceCatalog("cantrips")).toBe("trucos");
    expect(normalizeChoiceCatalog("trucos")).toBe("trucos");
  });

  it("normaliza trucos de mago", () => {
    expect(normalizeChoiceCatalog("wizardCantrips")).toBe("trucosdemago");
    expect(normalizeChoiceCatalog("trucosDeMago")).toBe("trucosdemago");
  });

  it("normaliza habilidades", () => {
    expect(normalizeChoiceCatalog("skills")).toBe("habilidades");
    expect(normalizeChoiceCatalog("habilidades")).toBe("habilidades");
  });

  it("normaliza idiomas", () => {
    expect(normalizeChoiceCatalog("languages")).toBe("idiomas");
    expect(normalizeChoiceCatalog("idiomas")).toBe("idiomas");
  });

  it("normaliza puntuaciones de característica", () => {
    expect(normalizeChoiceCatalog("abilityScores")).toBe(
      "puntuacionescaracteristica",
    );
    expect(normalizeChoiceCatalog("puntuacionesCaracteristica")).toBe(
      "puntuacionescaracteristica",
    );
  });

  it("normaliza herramientas artesano", () => {
    expect(normalizeChoiceCatalog("artisanTools")).toBe("herramientasartesano");
  });

  it("normaliza juegos", () => {
    expect(normalizeChoiceCatalog("games")).toBe("juegos");
  });

  it("normaliza instrumentos", () => {
    expect(normalizeChoiceCatalog("instruments")).toBe("instrumentos");
  });

  it("normaliza ancestros draconicos", () => {
    expect(normalizeChoiceCatalog("draconicAncestors")).toBe(
      "ancestrosdraconicos",
    );
  });

  it("retorna el valor normalizado para catálogos desconocidos", () => {
    expect(normalizeChoiceCatalog("customCatalog")).toBe("customcatalog");
  });
});

describe("isSpellChoiceCatalog", () => {
  it("retorna true para catálogos de conjuros", () => {
    expect(isSpellChoiceCatalog("spells")).toBe(true);
    expect(isSpellChoiceCatalog("conjuros")).toBe(true);
  });

  it("retorna true para catálogos de trucos", () => {
    expect(isSpellChoiceCatalog("cantrips")).toBe(true);
    expect(isSpellChoiceCatalog("trucos")).toBe(true);
  });

  it("retorna true para trucos de mago", () => {
    expect(isSpellChoiceCatalog("wizardCantrips")).toBe(true);
    expect(isSpellChoiceCatalog("trucosDeMago")).toBe(true);
  });

  it("retorna false para catálogos no relacionados con conjuros", () => {
    expect(isSpellChoiceCatalog("habilidades")).toBe(false);
    expect(isSpellChoiceCatalog("idiomas")).toBe(false);
    expect(isSpellChoiceCatalog(null)).toBe(false);
  });
});

describe("hasSpellLikeTags", () => {
  it("retorna true cuando los tags contienen conjuro", () => {
    expect(hasSpellLikeTags("Conjuro,Nivel1")).toBe(true);
    expect(hasSpellLikeTags("conjuro")).toBe(true);
  });

  it("retorna true cuando los tags contienen truco", () => {
    expect(hasSpellLikeTags("truco,Magia")).toBe(true);
    expect(hasSpellLikeTags("Truco")).toBe(true);
  });

  it("retorna false cuando los tags no contienen conjuro ni truco", () => {
    expect(hasSpellLikeTags("Combate,Magia")).toBe(false);
    expect(hasSpellLikeTags("")).toBe(false);
    expect(hasSpellLikeTags(null)).toBe(false);
  });
});

describe("isSpellReferenceColumn", () => {
  it("retorna true para columnas con 'conjuro'", () => {
    expect(isSpellReferenceColumn("Conjuro conocido")).toBe(true);
    expect(isSpellReferenceColumn("conjuros de nivel 1")).toBe(true);
  });

  it("retorna true para columnas con 'truco'", () => {
    expect(isSpellReferenceColumn("Trucos")).toBe(true);
    expect(isSpellReferenceColumn("truco de mago")).toBe(true);
  });

  it("retorna false para columnas no relacionadas con conjuros", () => {
    expect(isSpellReferenceColumn("Nivel de personaje")).toBe(false);
    expect(isSpellReferenceColumn(null)).toBe(false);
  });
});

describe("extractSpellReferenceItems", () => {
  it("retorna vacío para cadena vacía", () => {
    expect(extractSpellReferenceItems("")).toHaveLength(0);
  });

  it("retorna vacío para texto con números", () => {
    expect(extractSpellReferenceItems("3d6")).toHaveLength(0);
    expect(extractSpellReferenceItems("1")).toHaveLength(0);
  });

  it("extrae un conjuro simple", () => {
    const result = extractSpellReferenceItems("Proyectil mágico");
    expect(result).toHaveLength(1);
    expect(result[0].displayText).toBe("Proyectil mágico");
    expect(result[0].lookupName).toBe("Proyectil mágico");
  });

  it("extrae múltiples conjuros separados por coma", () => {
    const result = extractSpellReferenceItems(
      "Proyectil mágico, Escudo, Misil",
    );
    expect(result).toHaveLength(3);
    expect(result[0].displayText).toBe("Proyectil mágico");
    expect(result[1].displayText).toBe("Escudo");
  });

  it("extrae truco con prefijo", () => {
    const result = extractSpellReferenceItems("truco Taumaturgia");
    expect(result).toHaveLength(1);
    expect(result[0].displayText).toBe("Taumaturgia");
    expect(result[0].prefix).toBe("Truco");
  });
});
