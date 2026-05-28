import { describe, expect, it } from "vitest";
import {
  getMaxHp,
  clampPercentage,
  getInitiative,
  getArmorClass,
  formatStatWithModifier,
} from "../../../screens/campaign/hooks/useTokenPanelCharacter";

// ── getMaxHp ──────────────────────────────────────────────────────────────────

describe("getMaxHp", () => {
  it("usa 'Puntos de vida' como fuente primaria", () => {
    expect(getMaxHp({ "Puntos de vida": 45 })).toBe(45);
  });

  it("usa 'Vida maxima' si no hay 'Puntos de vida'", () => {
    expect(getMaxHp({ "Vida maxima": 30 })).toBe(30);
  });

  it("usa 'Vida' como fallback secundario", () => {
    expect(getMaxHp({ Vida: 20 })).toBe(20);
  });

  it("devuelve 1 si no hay ninguna clave de vida", () => {
    expect(getMaxHp({})).toBe(1);
  });

  it("devuelve 1 si el valor es 0 (mínimo 1)", () => {
    expect(getMaxHp({ "Puntos de vida": 0 })).toBe(1);
  });

  it("devuelve 1 si el valor es negativo", () => {
    expect(getMaxHp({ "Puntos de vida": -5 })).toBe(1);
  });

  it("'Puntos de vida' tiene prioridad sobre 'Vida maxima'", () => {
    expect(getMaxHp({ "Puntos de vida": 50, "Vida maxima": 30 })).toBe(50);
  });
});

// ── clampPercentage ───────────────────────────────────────────────────────────

describe("clampPercentage", () => {
  it("devuelve el valor si está entre 0 y 100", () => {
    expect(clampPercentage(75)).toBe(75);
  });

  it("clampea a 0 si el valor es negativo", () => {
    expect(clampPercentage(-10)).toBe(0);
  });

  it("clampea a 100 si el valor supera 100", () => {
    expect(clampPercentage(150)).toBe(100);
  });

  it("devuelve 0 para NaN", () => {
    expect(clampPercentage(Number.NaN)).toBe(0);
  });

  it("devuelve 0 para Infinity negativa", () => {
    expect(clampPercentage(-Infinity)).toBe(0);
  });

  it("devuelve 0 para Infinity positiva (no es finito)", () => {
    expect(clampPercentage(Infinity)).toBe(0);
  });

  it("devuelve exactamente 0 en el límite inferior", () => {
    expect(clampPercentage(0)).toBe(0);
  });

  it("devuelve exactamente 100 en el límite superior", () => {
    expect(clampPercentage(100)).toBe(100);
  });
});

// ── getInitiative ─────────────────────────────────────────────────────────────

describe("getInitiative", () => {
  it("usa el valor de Iniciativa directamente si existe", () => {
    expect(getInitiative({ Iniciativa: 5 })).toBe(5);
  });

  it("calcula modificador de destreza si no hay Iniciativa", () => {
    // Destreza 14 → mod = (14-10)/2 = +2
    expect(getInitiative({ Destreza: 14 })).toBe(2);
  });

  it("usa Destreza 10 por defecto si no existe (mod = 0)", () => {
    expect(getInitiative({})).toBe(0);
  });

  it("calcula correctamente modificador negativo (Destreza 8 → -1)", () => {
    expect(getInitiative({ Destreza: 8 })).toBe(-1);
  });

  it("Iniciativa explícita de 0 devuelve 0", () => {
    expect(getInitiative({ Iniciativa: 0 })).toBe(0);
  });
});

// ── getArmorClass ─────────────────────────────────────────────────────────────

describe("getArmorClass", () => {
  it("usa el campo CA si existe", () => {
    expect(getArmorClass({ CA: 16 })).toBe(16);
  });

  it("usa 'Clase de armadura' si no hay CA", () => {
    expect(getArmorClass({ "Clase de armadura": 14 })).toBe(14);
  });

  it("devuelve 0 si no hay ninguna clave de CA", () => {
    expect(getArmorClass({})).toBe(0);
  });

  it("devuelve 0 si el valor es negativo (mínimo 0)", () => {
    expect(getArmorClass({ CA: -2 })).toBe(0);
  });

  it("CA tiene prioridad sobre 'Clase de armadura'", () => {
    expect(getArmorClass({ CA: 18, "Clase de armadura": 12 })).toBe(18);
  });
});

// ── formatStatWithModifier ────────────────────────────────────────────────────

describe("formatStatWithModifier", () => {
  it("devuelve solo el valor cuando el modificador es 0", () => {
    expect(formatStatWithModifier(10, 0)).toBe("10");
  });

  it("incluye modificador positivo con signo +", () => {
    expect(formatStatWithModifier(16, 3)).toBe("16(+3)");
  });

  it("incluye modificador negativo", () => {
    expect(formatStatWithModifier(8, -1)).toBe("8(-1)");
  });

  it("funciona con valor 0 y modificador positivo", () => {
    expect(formatStatWithModifier(0, 5)).toBe("0(+5)");
  });
});
