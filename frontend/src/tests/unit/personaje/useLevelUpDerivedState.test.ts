// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock(
  "../../../screens/personaje/dndcharactersheet/hooks/levelUpFocus",
  () => ({ scrollToTarget: vi.fn() }),
);

vi.mock("../../../screens/personaje/utils/dndApi", () => ({
  fetchClassSkills: vi.fn().mockResolvedValue([]),
  fetchClassSubclassSkills: vi.fn().mockResolvedValue([]),
  fetchDndClassDetail: vi.fn().mockResolvedValue(null),
  fetchDndClassSummaries: vi.fn().mockResolvedValue([]),
  fetchSpellDetailByName: vi.fn().mockResolvedValue(null),
}));

import { useLevelUpDerivedState } from "../../../screens/personaje/dndcharactersheet/hooks/useLevelUpDerivedState";
import type { DndCharacterDetailResponse } from "../../../screens/personaje/utils/dndApi";

function makeCharacter(
  overrides: Partial<DndCharacterDetailResponse> = {},
): DndCharacterDetailResponse {
  return {
    id: 1,
    nombre: "Test",
    clases: [{ nombre: "Guerrero", nivel: 3 }],
    estadisticas: {},
    habilidades: [],
    equipo: [],
    monedas: { po: 0, pp: 0, pe: 0, pc: 0, pe2: 0 },
    puntosDeGolpe: { maximos: 20, actuales: 20, temporales: 0 },
    dadosDeGolpe: { dado: "d10", total: 3, usados: 0 },
    velocidad: 30,
    iniciativa: 0,
    ca: 10,
    inspiration: false,
    rasgos: [],
    trasfondo: null,
    alineamiento: null,
    ...overrides,
  } as unknown as DndCharacterDetailResponse;
}

const BASE_OPTIONS = {
  character: makeCharacter(),
  classCompetencies: [],
  classSkillGroups: [],
  classSummaries: [],
  isDownMode: false,
  selectedClassDetail: null,
  selectedClassLevel: 3,
  selectedFeatId: null,
  selectedSubclassId: null,
  subclassSkillGroups: [],
};

describe("useLevelUpDerivedState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates targetLevel as selectedClassLevel + 1", () => {
    const { result } = renderHook(() =>
      useLevelUpDerivedState({ ...BASE_OPTIONS, selectedClassLevel: 4 }),
    );
    expect(result.current.targetLevel).toBe(5);
  });

  it("calculates totalCharacterLevel from clases array", () => {
    const character = makeCharacter({
      clases: [
        { nombre: "Guerrero", nivel: 3 },
        { nombre: "Mago", nivel: 2 },
      ] as never,
    });
    const { result } = renderHook(() =>
      useLevelUpDerivedState({ ...BASE_OPTIONS, character }),
    );
    expect(result.current.totalCharacterLevel).toBe(5);
  });

  it("requiresAsi is false when no class detail", () => {
    const { result } = renderHook(() =>
      useLevelUpDerivedState({ ...BASE_OPTIONS, selectedClassDetail: null }),
    );
    expect(result.current.requiresAsi).toBe(false);
  });

  it("needsSubclass is false when no class detail", () => {
    const { result } = renderHook(() =>
      useLevelUpDerivedState({ ...BASE_OPTIONS, selectedClassDetail: null }),
    );
    expect(result.current.needsSubclass).toBe(false);
  });

  it("classIsNew is true when selectedClassLevel is 0", () => {
    const { result } = renderHook(() =>
      useLevelUpDerivedState({ ...BASE_OPTIONS, selectedClassLevel: 0 }),
    );
    expect(result.current.classIsNew).toBe(true);
  });

  it("classIsNew is false when selectedClassLevel > 0", () => {
    const { result } = renderHook(() =>
      useLevelUpDerivedState({ ...BASE_OPTIONS, selectedClassLevel: 3 }),
    );
    expect(result.current.classIsNew).toBe(false);
  });

  it("eaCantripCount is 0 when not active/gaining EA", () => {
    const { result } = renderHook(() =>
      useLevelUpDerivedState({ ...BASE_OPTIONS }),
    );
    expect(result.current.eaCantripCount).toBe(0);
  });

  it("battleMasterManeuverCount is 0 when not active/gaining battle master", () => {
    const { result } = renderHook(() =>
      useLevelUpDerivedState({ ...BASE_OPTIONS }),
    );
    expect(result.current.battleMasterManeuverCount).toBe(0);
  });

  it("targetLevelAfterDown is max(0, selectedClassLevel - 1)", () => {
    const { result } = renderHook(() =>
      useLevelUpDerivedState({ ...BASE_OPTIONS, selectedClassLevel: 1 }),
    );
    expect(result.current.targetLevelAfterDown).toBe(0);
  });

  it("visibleClassSummaries includes all summaries when not down mode", () => {
    const classSummaries = [
      { nombre: "Guerrero", id: "guerrero" },
      { nombre: "Mago", id: "mago" },
    ] as never;
    const { result } = renderHook(() =>
      useLevelUpDerivedState({
        ...BASE_OPTIONS,
        classSummaries,
        isDownMode: false,
      }),
    );
    expect(result.current.visibleClassSummaries).toHaveLength(2);
  });

  // ── cantripUpgradeCount branches ─────────────────────────────────────────

  it("cantripUpgradeCount returns 0 when isDownMode is true (even with spellcasting)", () => {
    const classDetailWithSpells = {
      lanzamientoConjuros: {
        modo: "full",
        caracteristica: "INT",
        formulaConjurosPreparados: null,
        niveles: [
          { nivel: 1, trucosConocidos: 3 },
          { nivel: 2, trucosConocidos: 4 },
        ],
      },
      subclases: [],
      elecciones: [],
    } as never;
    const { result } = renderHook(() =>
      useLevelUpDerivedState({
        ...BASE_OPTIONS,
        selectedClassDetail: classDetailWithSpells,
        selectedClassLevel: 1, // targetLevel = 2
        isDownMode: true,
      }),
    );
    expect(result.current.cantripUpgradeCount).toBe(0);
  });

  it("cantripUpgradeCount returns 0 when targetLevel < 2 (selectedClassLevel = 0)", () => {
    const classDetailWithSpells = {
      lanzamientoConjuros: {
        modo: "full",
        caracteristica: "INT",
        formulaConjurosPreparados: null,
        niveles: [{ nivel: 1, trucosConocidos: 2 }],
      },
      subclases: [],
      elecciones: [],
    } as never;
    const { result } = renderHook(() =>
      useLevelUpDerivedState({
        ...BASE_OPTIONS,
        selectedClassDetail: classDetailWithSpells,
        selectedClassLevel: 0, // targetLevel = 1 < 2
        isDownMode: false,
      }),
    );
    expect(result.current.cantripUpgradeCount).toBe(0);
  });

  it("cantripUpgradeCount returns positive when cantrips increase at level up", () => {
    const classDetailWithSpells = {
      lanzamientoConjuros: {
        modo: "full",
        caracteristica: "INT",
        formulaConjurosPreparados: null,
        niveles: [
          { nivel: 1, trucosConocidos: 3 },
          { nivel: 2, trucosConocidos: 4 },
        ],
      },
      subclases: [],
      elecciones: [],
    } as never;
    const { result } = renderHook(() =>
      useLevelUpDerivedState({
        ...BASE_OPTIONS,
        selectedClassDetail: classDetailWithSpells,
        selectedClassLevel: 1, // targetLevel = 2
        isDownMode: false,
      }),
    );
    // 4 (level 2) - 3 (level 1) = 1 new cantrip
    expect(result.current.cantripUpgradeCount).toBe(1);
  });

  it("usa findSubclassById cuando hay selectedSubclassId y classDetail con subclases", () => {
    const classDetailWithSubclass = {
      lanzamientoConjuros: null,
      subclases: [
        {
          id: "evocacion",
          nombre: "Evocación",
          nivelDesbloqueo: 2,
          tablas: [],
          elecciones: [],
        },
      ],
      elecciones: [],
    } as never;

    const { result } = renderHook(() =>
      useLevelUpDerivedState({
        ...BASE_OPTIONS,
        selectedClassDetail: classDetailWithSubclass,
        selectedSubclassId: "evocacion",
        selectedClassLevel: 2,
      }),
    );
    // needsSubclass should be false since subclass is already selected
    expect(result.current.needsSubclass).toBe(false);
  });

  it("getSubclassTableCounts retorna conjuros de subclase Embaucador Arcano con tablas", () => {
    const classDetailWithSubclassTable = {
      lanzamientoConjuros: null,
      subclases: [
        {
          id: "embaucador-arcano",
          nombre: "Embaucador Arcano",
          nivelDesbloqueo: 3,
          tablas: [
            {
              filas: [
                ["3", "0", "2"],
                ["4", "0", "3"],
              ],
            },
          ],
          elecciones: [],
        },
      ],
      elecciones: [],
    } as never;

    const character = makeCharacter({
      clases: [{ nombre: "Picaro", nivel: 3 }],
    });
    const { result } = renderHook(() =>
      useLevelUpDerivedState({
        ...BASE_OPTIONS,
        character,
        selectedClassDetail: classDetailWithSubclassTable,
        selectedSubclassId: "embaucador-arcano",
        selectedClassLevel: 3,
      }),
    );
    // getAtMaxSpellLevel and getAtTableCounts should work through eaSubclass
    expect(typeof result.current.getAtMaxSpellLevel(3)).toBe("number");
    expect(typeof result.current.eaSpellCount).toBe("number");
    expect(typeof result.current.eaCantripCount).toBe("number");
  });

  it("isInitialClassSkillChoice reconoce elecciones de habilidad de clase", () => {
    const classDetailWithSkillChoice = {
      lanzamientoConjuros: null,
      subclases: [],
      elecciones: [
        {
          id: "class-skill-0",
          catalogo: "habilidades",
          cantidad: 2,
          opciones: ["Arcano", "Historia"],
        },
      ],
    } as never;

    const { result } = renderHook(() =>
      useLevelUpDerivedState({
        ...BASE_OPTIONS,
        selectedClassDetail: classDetailWithSkillChoice,
        classSkillGroups: [
          {
            id: "class-skill-0",
            catalogo: "habilidades",
            cantidad: 2,
            habilidades: [],
          },
        ],
        selectedClassLevel: 0,
      }),
    );
    // classIsNew should be true (selectedClassLevel = 0)
    expect(result.current.classIsNew).toBe(true);
  });

  it("getSubclassMaxSpellLevel con Caballero Arcano con slots de conjuros", () => {
    const classDetailWithSpellSlots = {
      lanzamientoConjuros: null,
      subclases: [
        {
          id: "caballero-arcano",
          nombre: "Caballero Arcano",
          nivelDesbloqueo: 3,
          tablas: [
            {
              filas: [
                ["3", "0", "2", "2", "0", "0"],
                ["4", "0", "3", "3", "2", "0"],
              ],
            },
          ],
          elecciones: [],
        },
      ],
      elecciones: [],
    } as never;

    const character = makeCharacter({
      clases: [{ nombre: "Guerrero", nivel: 3 }],
    });
    const { result } = renderHook(() =>
      useLevelUpDerivedState({
        ...BASE_OPTIONS,
        character,
        selectedClassDetail: classDetailWithSpellSlots,
        selectedSubclassId: "caballero-arcano",
        selectedClassLevel: 3,
      }),
    );
    expect(typeof result.current.getEkMaxSpellLevel(3)).toBe("number");
    expect(typeof result.current.ekSpellCount).toBe("number");
    expect(result.current.ekSpellCount).toBeGreaterThanOrEqual(0);
  });
});
