// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { secureRandomInt, secureRandomBase36 } from "../../../lib/secureRandom";

describe("secureRandomInt", () => {
  it("retorna un número dentro del rango [min, max]", () => {
    for (let i = 0; i < 100; i++) {
      const result = secureRandomInt(1, 6);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
    }
  });

  it("retorna exactamente el valor cuando min === max", () => {
    expect(secureRandomInt(5, 5)).toBe(5);
  });

  it("retorna un entero", () => {
    const result = secureRandomInt(0, 100);
    expect(Number.isInteger(result)).toBe(true);
  });

  it("lanza TypeError si min no es entero", () => {
    expect(() => secureRandomInt(1.5, 6)).toThrow(TypeError);
  });

  it("lanza TypeError si max no es entero", () => {
    expect(() => secureRandomInt(1, 6.5)).toThrow(TypeError);
  });

  it("lanza RangeError si max < min", () => {
    expect(() => secureRandomInt(10, 5)).toThrow(RangeError);
  });

  it("cubre todo el rango de valores posibles en muchas iteraciones", () => {
    const resultados = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      resultados.add(secureRandomInt(1, 3));
    }
    expect(resultados.has(1)).toBe(true);
    expect(resultados.has(2)).toBe(true);
    expect(resultados.has(3)).toBe(true);
  });

  it("funciona con rango grande (0-100)", () => {
    const result = secureRandomInt(0, 100);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it("funciona con números negativos", () => {
    const result = secureRandomInt(-5, 5);
    expect(result).toBeGreaterThanOrEqual(-5);
    expect(result).toBeLessThanOrEqual(5);
  });
});

describe("secureRandomBase36", () => {
  it("retorna una cadena de la longitud indicada", () => {
    expect(secureRandomBase36(8)).toHaveLength(8);
    expect(secureRandomBase36(16)).toHaveLength(16);
  });

  it("retorna sólo caracteres base36 (a-z0-9)", () => {
    const result = secureRandomBase36(50);
    expect(result).toMatch(/^[a-z0-9]+$/);
  });

  it("lanza RangeError con longitud 0", () => {
    expect(() => secureRandomBase36(0)).toThrow(RangeError);
  });

  it("lanza RangeError con longitud negativa", () => {
    expect(() => secureRandomBase36(-1)).toThrow(RangeError);
  });

  it("lanza RangeError con longitud no entera", () => {
    expect(() => secureRandomBase36(3.5)).toThrow(RangeError);
  });

  it("genera cadenas diferentes en ejecuciones sucesivas", () => {
    const a = secureRandomBase36(16);
    const b = secureRandomBase36(16);
    // Estadísticamente imposible que sean iguales
    expect(a).not.toBe(b);
  });

  it("longitud 1 retorna un solo carácter", () => {
    const result = secureRandomBase36(1);
    expect(result).toHaveLength(1);
    expect(result).toMatch(/^[a-z0-9]$/);
  });
});
