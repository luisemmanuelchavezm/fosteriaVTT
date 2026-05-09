// @vitest-environment jsdom
import { renderHook, act, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../../../screens/personaje/utils/dndApi", () => ({
  fetchClassSkills: vi.fn().mockResolvedValue([]),
  fetchClassSubclassSkills: vi.fn().mockResolvedValue([]),
  fetchDndClassDetail: vi.fn().mockResolvedValue(null),
  fetchDndClassSummaries: vi.fn().mockResolvedValue([]),
  fetchSpellDetailByName: vi.fn().mockResolvedValue(null),
}));

vi.mock(
  "../../../screens/personaje/dndcharactersheet/hooks/levelUpFocus",
  () => ({ scrollToTarget: vi.fn() }),
);

vi.mock(
  "../../../screens/personaje/dndcharactersheet/hooks/levelUpValidation",
  () => ({
    getExpertiseMissingSelectionResult: vi
      .fn()
      .mockReturnValue({ error: null, missingChoiceErrors: {} }),
  }),
);

import { useLevelUpModalSupport } from "../../../screens/personaje/dndcharactersheet/hooks/useLevelUpModalSupport";
import type { DndCharacterDetailResponse } from "../../../screens/personaje/utils/dndApi";
import * as dndApi from "../../../screens/personaje/utils/dndApi";

function makeCharacter(): DndCharacterDetailResponse {
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
  } as unknown as DndCharacterDetailResponse;
}

function makeOptions(overrides: Record<string, unknown> = {}) {
  return {
    availableExpertiseOptions: [],
    character: makeCharacter(),
    classChoicesSectionRef: { current: null },
    effectiveSubclass: null,
    expertiseChoiceConfig: null,
    expertiseChoices: [],
    isOpen: false,
    selectedClassDetail: null,
    selectedClassId: null,
    selectedClassLevel: 3,
    setClassChoices: vi.fn(),
    setClassSkillGroups: vi.fn(),
    setClassSummaries: vi.fn(),
    setExpertiseChoices: vi.fn(),
    setMissingChoiceErrors: vi.fn(),
    setSelectedClassDetail: vi.fn(),
    setSelectedClassId: vi.fn(),
    setSelectedFeatCompetencies: vi.fn(),
    setSelectedFeatDetail: vi.fn(),
    setSelectedFeatLanguages: vi.fn(),
    setSelectedFeatSkills: vi.fn(),
    setSelectedFeatSpellClass: vi.fn(),
    setSelectedFeatStats: vi.fn(),
    setSelectedSubclassId: vi.fn(),
    setSubmitError: vi.fn(),
    setSubclassSkillGroups: vi.fn(),
    token: "test-token",
    ...overrides,
  };
}

describe("useLevelUpModalSupport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exposes closeSpellDetail and openSpellDetailByName", () => {
    const { result } = renderHook(() => useLevelUpModalSupport(makeOptions()));
    expect(typeof result.current.closeSpellDetail).toBe("function");
    expect(typeof result.current.openSpellDetailByName).toBe("function");
  });

  it("selectedSpell starts as null", () => {
    const { result } = renderHook(() => useLevelUpModalSupport(makeOptions()));
    expect(result.current.selectedSpell).toBeNull();
  });

  it("closeSpellDetail resets selectedSpell to null", async () => {
    const { result } = renderHook(() => useLevelUpModalSupport(makeOptions()));
    act(() => {
      result.current.closeSpellDetail();
    });
    expect(result.current.selectedSpell).toBeNull();
  });

  it("does not fetch class summaries when isOpen is false", () => {
    const fetchDndClassSummaries = vi.mocked(dndApi.fetchDndClassSummaries);

    renderHook(() => useLevelUpModalSupport(makeOptions({ isOpen: false })));
    expect(fetchDndClassSummaries).not.toHaveBeenCalled();
  });

  it("fetches class summaries when isOpen becomes true", async () => {
    const fetchDndClassSummaries = vi.mocked(dndApi.fetchDndClassSummaries);

    const setClassSummaries = vi.fn();
    renderHook(() =>
      useLevelUpModalSupport(makeOptions({ isOpen: true, setClassSummaries })),
    );

    await waitFor(() => {
      expect(fetchDndClassSummaries).toHaveBeenCalledWith(
        "test-token",
        expect.any(AbortSignal),
      );
    });
  });

  it("openSpellDetailByName with null token does nothing", async () => {
    const { result } = renderHook(() => useLevelUpModalSupport(makeOptions()));
    await act(async () => {
      await result.current.openSpellDetailByName(null, "Bola de Fuego");
    });
    expect(result.current.selectedSpell).toBeNull();
  });
});
