import { describe, expect, it, vi } from "vitest";
import {
  buildCriticalExpression,
  getWeaponOptions,
} from "../../../screens/campaign/components/quickactions/attackTypes";

// Mock the character abilities module
vi.mock(
  "../../../screens/personaje/dndcharactersheet/utils/characterAbilities",
  () => ({
    isActionAbility: (ability: { tipo?: string }) => ability.tipo === "accion",
    getActionDamageParts: (_: unknown, ability: { formula?: string }) => ({
      expression: ability.formula ?? null,
    }),
  }),
);

describe("buildCriticalExpression", () => {
  it("retorna null si la expresión es null", () => {
    expect(buildCriticalExpression(null)).toBeNull();
  });

  it("retorna null si la expresión es string vacío", () => {
    expect(buildCriticalExpression("")).toBeNull();
  });

  it("duplica el número de dados en una expresión simple", () => {
    expect(buildCriticalExpression("1d6")).toBe("2d6");
  });

  it("duplica el número de dados con modificador", () => {
    expect(buildCriticalExpression("2d8+3")).toBe("4d8+3");
  });

  it("duplica múltiples grupos de dados", () => {
    expect(buildCriticalExpression("1d6+1d4")).toBe("2d6+2d4");
  });

  it("maneja 3d10 correctamente", () => {
    expect(buildCriticalExpression("3d10")).toBe("6d10");
  });

  it("conserva partes no-dado sin modificarlas", () => {
    expect(buildCriticalExpression("2d6+5")).toBe("4d6+5");
  });

  it("es case-insensitive (acepta D mayúscula) pero el reemplazo usa d minúscula", () => {
    // La regex tiene flag /i pero la cadena de reemplazo fija usa 'd' minúscula
    expect(buildCriticalExpression("1D8")).toBe("2d8");
  });

  it("maneja expresiones sin dados (sin reemplazos)", () => {
    expect(buildCriticalExpression("5")).toBe("5");
  });

  it("maneja expresión con un dado de 12 caras", () => {
    expect(buildCriticalExpression("1d12+4")).toBe("2d12+4");
  });
});

// ── getWeaponOptions ─────────────────────────────────────────────────────────

describe("getWeaponOptions", () => {
  it("retorna array vacío si detail es null", () => {
    expect(getWeaponOptions(null)).toEqual([]);
  });

  it("retorna array vacío si el personaje no tiene habilidades de acción", () => {
    const detail = {
      habilidades: [
        {
          id: 1,
          nombre: "Sigilo",
          tipo: "habilidad",
          formula: null,
          bonificacion: null,
        },
      ],
    } as never;
    expect(getWeaponOptions(detail)).toEqual([]);
  });

  it("retorna armas con bonificacion y formula del personaje", () => {
    const detail = {
      estadisticas: { Fuerza: 16 },
      habilidades: [
        {
          id: 1,
          nombre: "Espada Larga",
          tipo: "accion",
          formula: "1d8+3",
          bonificacion: 5,
        },
      ],
    } as never;
    const result = getWeaponOptions(detail);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Espada Larga");
    expect(result[0].attackBonus).toBe(5);
    expect(result[0].damageExpression).toBe("1d8+3");
  });

  it("usa null para attackBonus cuando bonificacion es null", () => {
    const detail = {
      estadisticas: {},
      habilidades: [
        {
          id: 2,
          nombre: "Daga",
          tipo: "accion",
          formula: "1d4",
          bonificacion: null,
        },
      ],
    } as never;
    const result = getWeaponOptions(detail);
    expect(result[0].attackBonus).toBeNull();
  });

  it("filtra habilidades que no son acciones", () => {
    const detail = {
      estadisticas: {},
      habilidades: [
        {
          id: 1,
          nombre: "Acrobacias",
          tipo: "habilidad",
          formula: null,
          bonificacion: null,
        },
        {
          id: 2,
          nombre: "Maza",
          tipo: "accion",
          formula: "1d6",
          bonificacion: 3,
        },
      ],
    } as never;
    const result = getWeaponOptions(detail);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Maza");
  });
});
