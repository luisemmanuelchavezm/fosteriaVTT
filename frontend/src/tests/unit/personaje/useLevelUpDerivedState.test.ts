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
});
