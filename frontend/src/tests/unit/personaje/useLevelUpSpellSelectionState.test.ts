// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../../../screens/personaje/utils/dndApi", () => ({
  fetchAbilityCatalog: vi.fn().mockResolvedValue([]),
  fetchSpellCatalog: vi.fn().mockResolvedValue([]),
}));

import { useLevelUpSpellSelectionState } from "../../../screens/personaje/dndcharactersheet/hooks/useLevelUpSpellSelectionState";
import * as dndApi from "../../../screens/personaje/utils/dndApi";

const BASE_OPTIONS = {
  token: "test-token",
  isOpen: false,
  isDownMode: false,
  asiMode: "single" as const,
  characterAbilities: [],
  selectedFeat: null,
  selectedFeatSpellClass: "",
  selectedClassDetail: null,
  targetLevel: 4,
  cantripUpgradeCount: 0,
  eaCantripCount: 0,
  eaSpellCount: 0,
  ekCantripCount: 0,
  ekSpellCount: 0,
  battleMasterManeuverCount: 0,
  isGainingEa: false,
  isActiveEa: false,
  isGainingEk: false,
  isActiveEk: false,
  isGainingBattleMaster: false,
  isActiveBattleMaster: false,
  getAtMaxSpellLevel: () => 0,
  getEkMaxSpellLevel: () => 0,
};

describe("useLevelUpSpellSelectionState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes all arrays as empty", () => {
    const { result } = renderHook(() =>
      useLevelUpSpellSelectionState(BASE_OPTIONS),
    );
    expect(result.current.selectedFeatCantrips).toEqual([]);
    expect(result.current.selectedFeatSpells).toEqual([]);
    expect(result.current.eaChosenCantrips).toEqual([]);
    expect(result.current.eaChosenSpells).toEqual([]);
    expect(result.current.ekChosenCantrips).toEqual([]);
    expect(result.current.ekChosenSpells).toEqual([]);
    expect(result.current.battleMasterManeuvers).toEqual([]);
    expect(result.current.cantripUpgradeChosen).toEqual([]);
  });

  it("initializes all option arrays as empty", () => {
    const { result } = renderHook(() =>
      useLevelUpSpellSelectionState(BASE_OPTIONS),
    );
    expect(result.current.featCantripOptions).toEqual([]);
    expect(result.current.featSpellOptions).toEqual([]);
    expect(result.current.eaCantripOptions).toEqual([]);
    expect(result.current.eaSpellOptions).toEqual([]);
    expect(result.current.ekCantripOptions).toEqual([]);
    expect(result.current.ekSpellOptions).toEqual([]);
    expect(result.current.battleMasterManeuverOptions).toEqual([]);
    expect(result.current.cantripUpgradeOptions).toEqual([]);
  });

  it("setter functions are exposed", () => {
    const { result } = renderHook(() =>
      useLevelUpSpellSelectionState(BASE_OPTIONS),
    );
    expect(typeof result.current.setSelectedFeatCantrips).toBe("function");
    expect(typeof result.current.setSelectedFeatSpells).toBe("function");
    expect(typeof result.current.setEaChosenCantrips).toBe("function");
    expect(typeof result.current.setEaChosenSpells).toBe("function");
    expect(typeof result.current.setEkChosenCantrips).toBe("function");
    expect(typeof result.current.setEkChosenSpells).toBe("function");
    expect(typeof result.current.setBattleMasterManeuvers).toBe("function");
    expect(typeof result.current.setCantripUpgradeChosen).toBe("function");
  });

  it("setSelectedFeatCantrips updates state", () => {
    const { result } = renderHook(() =>
      useLevelUpSpellSelectionState(BASE_OPTIONS),
    );
    act(() => {
      result.current.setSelectedFeatCantrips(["luz"]);
    });
    expect(result.current.selectedFeatCantrips).toEqual(["luz"]);
  });

  it("does not fetch when not gaining EA and eaCantripCount > 0", () => {
    const fetchSpellCatalog = vi.mocked(dndApi.fetchSpellCatalog);

    renderHook(() =>
      useLevelUpSpellSelectionState({
        ...BASE_OPTIONS,
        isOpen: true,
        isGainingEa: false,
        isActiveEa: false,
        eaCantripCount: 1,
      }),
    );
    expect(fetchSpellCatalog).not.toHaveBeenCalled();
  });
});
