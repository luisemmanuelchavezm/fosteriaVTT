import { describe, expect, it } from "vitest";
import {
  extractClassCompetencies,
  sanitizeNonNegativeNumber,
  MAX_DELTA_VALUE,
} from "../../../screens/personaje/dndcharactersheet/hooks/characterSheetConstants";

describe("extractClassCompetencies", () => {
  it("combina armaduras, armas y herramientas en un array plano", () => {
    const detail = {
      competencias: {
        armaduras: ["Ligera", "Media"],
        armas: ["Espadas simples"],
        herramientas: ["Instrumentos de musica"],
      },
    } as never;

    const result = extractClassCompetencies(detail);
    expect(result).toEqual([
      "Ligera",
      "Media",
      "Espadas simples",
      "Instrumentos de musica",
    ]);
  });

  it("recorta espacios en blanco de cada entrada", () => {
    const detail = {
      competencias: {
        armaduras: ["  Ligera  "],
        armas: [" Espada "],
        herramientas: [],
      },
    } as never;

    const result = extractClassCompetencies(detail);
    expect(result).toEqual(["Ligera", "Espada"]);
  });

  it("filtra entradas que quedan vacias tras recortar", () => {
    const detail = {
      competencias: {
        armaduras: ["   ", ""],
        armas: ["Daga"],
        herramientas: [],
      },
    } as never;

    const result = extractClassCompetencies(detail);
    expect(result).toEqual(["Daga"]);
  });

  it("devuelve array vacio si todas las listas estan vacias", () => {
    const detail = {
      competencias: { armaduras: [], armas: [], herramientas: [] },
    } as never;

    expect(extractClassCompetencies(detail)).toEqual([]);
  });
});

describe("sanitizeNonNegativeNumber", () => {
  it("devuelve el numero como string cuando es valido", () => {
    expect(sanitizeNonNegativeNumber("5")).toBe("5");
    expect(sanitizeNonNegativeNumber("42")).toBe("42");
  });

  it("devuelve '0' para string sin digitos", () => {
    expect(sanitizeNonNegativeNumber("abc")).toBe("0");
    expect(sanitizeNonNegativeNumber("")).toBe("0");
  });

  it("elimina caracteres no numericos y parsea el resultado", () => {
    expect(sanitizeNonNegativeNumber("12px")).toBe("12");
    expect(sanitizeNonNegativeNumber("-5")).toBe("5");
  });

  it("clampea al maximo MAX_DELTA_VALUE (99)", () => {
    expect(sanitizeNonNegativeNumber("999")).toBe(String(MAX_DELTA_VALUE));
    expect(sanitizeNonNegativeNumber("100")).toBe(String(MAX_DELTA_VALUE));
  });
});
