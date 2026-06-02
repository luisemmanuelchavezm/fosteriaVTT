import { describe, expect, it, vi } from "vitest";
import {
  buildCriticalExpression,
  getWeaponOptions,
  getMBWeaponOptions,
  getMBEnemyWeaponOptions,
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

// ── getMBWeaponOptions ───────────────────────────────────────────────────────

describe("getMBWeaponOptions", () => {
  it("retorna [] con detail null", () => {
    expect(getMBWeaponOptions(null)).toEqual([]);
  });

  it("retorna [] si no hay armas en mochila", () => {
    const detail = {
      mochila: [
        { id: 1, nombre: "Escudo", tipoObjeto: "ARMADURA", formula: null },
      ],
      estadisticas: {},
    } as never;
    expect(getMBWeaponOptions(detail)).toEqual([]);
  });

  it("mapea arma con modificador de fuerza positivo", () => {
    const detail = {
      mochila: [
        { id: 10, nombre: "Espada", tipoObjeto: "ARMA", formula: "1d6+fuerza" },
      ],
      estadisticas: { MB_ModFuerza: 2 },
    } as never;
    const options = getMBWeaponOptions(detail);
    expect(options).toHaveLength(1);
    expect(options[0].name).toBe("Espada");
    expect(options[0].attackBonus).toBe(2);
    expect(options[0].damageExpression).toBe("1d6+2");
  });

  it("mapea arma con modificador de fuerza negativo", () => {
    const detail = {
      mochila: [
        {
          id: 11,
          nombre: "Daga rota",
          tipoObjeto: "ARMA",
          formula: "1d4+fuerza",
        },
      ],
      estadisticas: { MB_ModFuerza: -1 },
    } as never;
    const options = getMBWeaponOptions(detail);
    expect(options[0].attackBonus).toBe(-1);
    expect(options[0].damageExpression).toBe("1d4-1");
  });

  it("mapea arma con agilidad", () => {
    const detail = {
      mochila: [
        { id: 12, nombre: "Arco", tipoObjeto: "ARMA", formula: "1d6+agilidad" },
      ],
      estadisticas: { MB_ModAgilidad: 1 },
    } as never;
    const options = getMBWeaponOptions(detail);
    expect(options[0].attackBonus).toBe(1);
  });

  it("mapea arma con presencia", () => {
    const detail = {
      mochila: [
        {
          id: 13,
          nombre: "Orbe mágico",
          tipoObjeto: "ARMA",
          formula: "1d8+presencia",
        },
      ],
      estadisticas: { MB_ModPresencia: 3 },
    } as never;
    const options = getMBWeaponOptions(detail);
    expect(options[0].attackBonus).toBe(3);
  });

  it("mapea arma con resistencia", () => {
    const detail = {
      mochila: [
        {
          id: 14,
          nombre: "Lanza robusta",
          tipoObjeto: "ARMA",
          formula: "1d8+resistencia",
        },
      ],
      estadisticas: { MB_ModResistencia: 0 },
    } as never;
    const options = getMBWeaponOptions(detail);
    expect(options[0].attackBonus).toBe(0);
  });

  it("ignora armas sin formula", () => {
    const detail = {
      mochila: [
        { id: 15, nombre: "Maza oxidada", tipoObjeto: "ARMA", formula: null },
      ],
      estadisticas: {},
    } as never;
    expect(getMBWeaponOptions(detail)).toEqual([]);
  });

  it("normaliza 'd6' → '1d6' en la expresión de daño", () => {
    const detail = {
      mochila: [
        {
          id: 16,
          nombre: "Cuchillo",
          tipoObjeto: "ARMA",
          formula: "d6+fuerza",
        },
      ],
      estadisticas: { MB_ModFuerza: 0 },
    } as never;
    const options = getMBWeaponOptions(detail);
    expect(options[0].damageExpression).toBe("1d6+0");
  });
});

// ── getMBEnemyWeaponOptions ──────────────────────────────────────────────────

describe("getMBEnemyWeaponOptions", () => {
  it("retorna [] con detail null", () => {
    expect(getMBEnemyWeaponOptions(null)).toEqual([]);
  });

  it("retorna [] si no hay tags ni habilidades de arma", () => {
    const detail = { tags: "", habilidades: [], biografia: null } as never;
    expect(getMBEnemyWeaponOptions(detail)).toEqual([]);
  });

  it("retorna arma aleatoria desde biography con mbArmaIdx", () => {
    const bio = JSON.stringify({
      armaAleatoria: {
        opciones: [
          { nombre: "Hacha", formula: "1d8" },
          { nombre: "Espada", formula: "1d6" },
        ],
      },
    });
    const detail = {
      tags: "mbArmaIdx;2",
      biografia: bio,
      habilidades: [],
    } as never;
    const options = getMBEnemyWeaponOptions(detail);
    expect(options).toHaveLength(1);
    expect(options[0].name).toBe("Espada");
    expect(options[0].damageExpression).toBe("1d6");
    expect(options[0].attackBonus).toBeNull();
  });

  it("ignora biography JSON inválido sin lanzar error", () => {
    const detail = {
      tags: "mbArmaIdx;1",
      biografia: "not-json{",
      habilidades: [],
    } as never;
    expect(() => getMBEnemyWeaponOptions(detail)).not.toThrow();
    expect(getMBEnemyWeaponOptions(detail)).toEqual([]);
  });

  it("retorna armas de habilidades con tag MBEnemyArma", () => {
    const detail = {
      tags: "",
      habilidades: [
        { id: 5, nombre: "Garra", formula: "1d4", tags: "MBEnemyArma" },
      ],
      biografia: null,
    } as never;
    const options = getMBEnemyWeaponOptions(detail);
    expect(options).toHaveLength(1);
    expect(options[0].name).toBe("Garra");
    expect(options[0].id).toBe(5);
  });

  it("retorna armas de habilidades con tag MBEnemyArmaEspecial", () => {
    const detail = {
      tags: "",
      habilidades: [
        {
          id: 6,
          nombre: "Colmillo",
          formula: "2d6+1",
          tags: "MBEnemyArmaEspecial",
        },
      ],
      biografia: null,
    } as never;
    const options = getMBEnemyWeaponOptions(detail);
    expect(options).toHaveLength(1);
    expect(options[0].name).toBe("Colmillo");
  });

  it("ignora habilidades MBEnemyArma sin formula", () => {
    const detail = {
      tags: "",
      habilidades: [
        { id: 7, nombre: "Grito", formula: null, tags: "MBEnemyArma" },
      ],
      biografia: null,
    } as never;
    expect(getMBEnemyWeaponOptions(detail)).toEqual([]);
  });

  it("combina arma aleatoria y habilidades estáticas", () => {
    const bio = JSON.stringify({
      armaAleatoria: { opciones: [{ nombre: "Hacha", formula: "1d8" }] },
    });
    const detail = {
      tags: "mbArmaIdx;1",
      biografia: bio,
      habilidades: [
        { id: 3, nombre: "Zarpazo", formula: "1d6", tags: "MBEnemyArma" },
      ],
    } as never;
    const options = getMBEnemyWeaponOptions(detail);
    expect(options).toHaveLength(2);
  });
});
