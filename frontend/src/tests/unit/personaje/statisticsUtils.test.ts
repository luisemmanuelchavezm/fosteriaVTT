import { describe, expect, it } from "vitest";
import {
  ABILITY_STATS,
  POINT_BUY_COSTS,
  STANDARD_ARRAY,
  POINT_BUY_TOTAL,
  POINT_BUY_MIN,
  POINT_BUY_MAX,
  buildScoreFromDiceValues,
  formatAbilityModifier,
  getAvailableStandardOptions,
  createInitialAssignments,
  createInitialDiceSlots,
  createDiceRound,
} from "../../../screens/personaje/creatednd/utils/statisticsUtils";

// ── ABILITY_STATS ─────────────────────────────────────────────────────────────

describe("ABILITY_STATS", () => {
  it("contiene exactamente 6 estadísticas", () => {
    expect(ABILITY_STATS).toHaveLength(6);
  });

  it("incluye Fuerza, Destreza, Constitución, Inteligencia, Sabiduría y Carisma", () => {
    const ids = ABILITY_STATS.map((s) => s.id);
    expect(ids).toContain("strength");
    expect(ids).toContain("dexterity");
    expect(ids).toContain("constitution");
    expect(ids).toContain("intelligence");
    expect(ids).toContain("wisdom");
    expect(ids).toContain("charisma");
  });

  it("cada stat tiene id, name y displayName", () => {
    for (const stat of ABILITY_STATS) {
      expect(stat.id).toBeTruthy();
      expect(stat.name).toBeTruthy();
      expect(stat.displayName).toBeTruthy();
    }
  });
});

// ── STANDARD_ARRAY / POINT_BUY constants ─────────────────────────────────────

describe("Constantes de estadísticas", () => {
  it("STANDARD_ARRAY tiene 6 valores", () => {
    expect(STANDARD_ARRAY).toHaveLength(6);
  });

  it("STANDARD_ARRAY contiene [15, 14, 13, 12, 10, 8]", () => {
    expect(STANDARD_ARRAY).toEqual([15, 14, 13, 12, 10, 8]);
  });

  it("POINT_BUY_TOTAL es 27", () => {
    expect(POINT_BUY_TOTAL).toBe(27);
  });

  it("POINT_BUY_MIN es 8 y POINT_BUY_MAX es 15", () => {
    expect(POINT_BUY_MIN).toBe(8);
    expect(POINT_BUY_MAX).toBe(15);
  });

  it("POINT_BUY_COSTS tiene coste 0 para puntuación 8", () => {
    expect(POINT_BUY_COSTS[8]).toBe(0);
  });

  it("POINT_BUY_COSTS tiene coste 9 para puntuación 15", () => {
    expect(POINT_BUY_COSTS[15]).toBe(9);
  });
});

// ── buildScoreFromDiceValues ──────────────────────────────────────────────────

describe("buildScoreFromDiceValues", () => {
  it("suma los 3 dados más altos (descarta el más bajo)", () => {
    // [6, 5, 4, 1] → top3 = [6, 5, 4] → total = 15
    const result = buildScoreFromDiceValues([6, 5, 4, 1]);
    expect(result.total).toBe(15);
  });

  it("devuelve rolls en orden descendente", () => {
    const result = buildScoreFromDiceValues([3, 6, 1, 5]);
    expect(result.rolls).toEqual([6, 5, 3, 1]);
  });

  it("funciona con exactamente 3 dados (no descarta ninguno)", () => {
    const result = buildScoreFromDiceValues([4, 4, 4]);
    expect(result.total).toBe(12);
  });

  it("máximo posible: 4×6 → total 18", () => {
    const result = buildScoreFromDiceValues([6, 6, 6, 6]);
    expect(result.total).toBe(18);
  });

  it("con 1 dado devuelve ese valor", () => {
    const result = buildScoreFromDiceValues([5]);
    expect(result.total).toBe(5);
  });
});

// ── formatAbilityModifier ─────────────────────────────────────────────────────

describe("formatAbilityModifier", () => {
  it("score 10 → +0", () => {
    expect(formatAbilityModifier(10)).toBe("+0");
  });

  it("score 12 → +1", () => {
    expect(formatAbilityModifier(12)).toBe("+1");
  });

  it("score 18 → +4", () => {
    expect(formatAbilityModifier(18)).toBe("+4");
  });

  it("score 8 → -1", () => {
    expect(formatAbilityModifier(8)).toBe("-1");
  });

  it("score 20 → +5", () => {
    expect(formatAbilityModifier(20)).toBe("+5");
  });

  it("score 1 → -5", () => {
    expect(formatAbilityModifier(1)).toBe("-5");
  });
});

// ── getAvailableStandardOptions ───────────────────────────────────────────────

describe("getAvailableStandardOptions", () => {
  it("devuelve todas las opciones si no hay valores usados", () => {
    const options = getAvailableStandardOptions([], "");
    expect(options).toHaveLength(6);
  });

  it("excluye opciones usadas por otros", () => {
    // "15-0" está usado por otro stat; la selección actual es "14-1"
    const options = getAvailableStandardOptions(["15-0"], "14-1");
    expect(options).not.toContain("15-0");
    expect(options).toContain("14-1"); // propia selección siempre visible
  });

  it("incluye la propia selección aunque esté en usedValues", () => {
    const options = getAvailableStandardOptions(["15-0"], "15-0");
    expect(options).toContain("15-0");
  });

  it("formato de clave es `valor-indice`", () => {
    const options = getAvailableStandardOptions([], "");
    expect(options[0]).toMatch(/^\d+-\d+$/);
  });
});

// ── createInitialAssignments ──────────────────────────────────────────────────

describe("createInitialAssignments", () => {
  it("crea un registro con las 6 stats inicializadas a null", () => {
    const result = createInitialAssignments(null);
    expect(Object.keys(result)).toHaveLength(6);
    expect(Object.values(result).every((v) => v === null)).toBe(true);
  });

  it("crea un registro con las 6 stats inicializadas a 0", () => {
    const result = createInitialAssignments(0);
    expect(Object.values(result).every((v) => v === 0)).toBe(true);
  });

  it("crea un registro con las 6 stats inicializadas a string vacío", () => {
    const result = createInitialAssignments("");
    expect(Object.values(result).every((v) => v === "")).toBe(true);
  });
});

// ── createInitialDiceSlots ────────────────────────────────────────────────────

describe("createInitialDiceSlots", () => {
  it("crea 6 slots", () => {
    const slots = createInitialDiceSlots();
    expect(slots).toHaveLength(6);
  });

  it("cada slot tiene total null, rolls vacío y assignedStatId vacío", () => {
    const slots = createInitialDiceSlots();
    for (const slot of slots) {
      expect(slot.total).toBeNull();
      expect(slot.rolls).toEqual([]);
      expect(slot.assignedStatId).toBe("");
    }
  });
});

// ── createDiceRound ───────────────────────────────────────────────────────────

describe("createDiceRound", () => {
  it("asigna el label correcto", () => {
    const round = createDiceRound(2);
    expect(round.label).toBe(2);
  });

  it("genera un id único que incluye el label", () => {
    const round = createDiceRound(3);
    expect(round.id).toContain("dice-round-3");
  });

  it("tiene exactamente 6 slots inicializados", () => {
    const round = createDiceRound(1);
    expect(round.slots).toHaveLength(6);
  });

  it("dos rondas tienen ids distintos", () => {
    const r1 = createDiceRound(1);
    const r2 = createDiceRound(1);
    expect(r1.id).not.toBe(r2.id);
  });
});
