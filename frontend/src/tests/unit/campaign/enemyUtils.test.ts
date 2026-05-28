import { describe, expect, it } from "vitest";
import { calcMod, formatMod } from "../../../screens/campaign/utils/enemyUtils";

describe("calcMod", () => {
  it("calcula correctamente el modificador de 10 (→ 0)", () => {
    expect(calcMod(10)).toBe(0);
  });

  it("calcula correctamente el modificador de 8 (→ -1)", () => {
    expect(calcMod(8)).toBe(-1);
  });

  it("calcula correctamente el modificador de 20 (→ +5)", () => {
    expect(calcMod(20)).toBe(5);
  });

  it("calcula correctamente el modificador de 1 (→ -5)", () => {
    expect(calcMod(1)).toBe(-5);
  });

  it("calcula correctamente el modificador de 12 (→ +1)", () => {
    expect(calcMod(12)).toBe(1);
  });

  it("calcula correctamente el modificador de 15 (→ +2)", () => {
    expect(calcMod(15)).toBe(2);
  });

  it("calcula correctamente el modificador de 17 (→ +3)", () => {
    expect(calcMod(17)).toBe(3);
  });

  it("calcula correctamente el modificador de 7 (→ -2)", () => {
    expect(calcMod(7)).toBe(-2);
  });
});

describe("formatMod", () => {
  it("formatea un modificador positivo con +", () => {
    expect(formatMod(3)).toBe("+3");
  });

  it("formatea el modificador 0 con +", () => {
    expect(formatMod(0)).toBe("+0");
  });

  it("formatea un modificador negativo sin +", () => {
    expect(formatMod(-2)).toBe("-2");
  });

  it("formatea modificador +5", () => {
    expect(formatMod(5)).toBe("+5");
  });

  it("formatea modificador -5", () => {
    expect(formatMod(-5)).toBe("-5");
  });
});
