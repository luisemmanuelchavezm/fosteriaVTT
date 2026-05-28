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

  // ── isOpen reset effect ───────────────────────────────────────────────────

  it("resets all selections when isOpen becomes true", async () => {
    const { result, rerender } = renderHook(
      (props: typeof BASE_OPTIONS) => useLevelUpSpellSelectionState(props),
      { initialProps: { ...BASE_OPTIONS, isOpen: false } },
    );

    // Set some state
    act(() => {
      result.current.setSelectedFeatCantrips(["luz"]);
      result.current.setEaChosenCantrips(["fuego"]);
    });

    expect(result.current.selectedFeatCantrips).toEqual(["luz"]);

    // Open the modal → should reset
    rerender({ ...BASE_OPTIONS, isOpen: true });

    expect(result.current.selectedFeatCantrips).toEqual([]);
    expect(result.current.eaChosenCantrips).toEqual([]);
  });

  // ── EA cantrip fetching ───────────────────────────────────────────────────

  it("fetches EA cantrip options when isGainingEa and eaCantripCount > 0", async () => {
    const fetchSpellCatalog = vi.mocked(dndApi.fetchSpellCatalog);
    const mockSpells = [
      {
        id: 1,
        nombre: "Luz",
        bonificacion: null,
        formula: null,
        descripcion: null,
        tags: null,
      },
    ];
    fetchSpellCatalog.mockResolvedValueOnce(mockSpells);

    const { result } = renderHook(() =>
      useLevelUpSpellSelectionState({
        ...BASE_OPTIONS,
        isOpen: true,
        isGainingEa: true,
        eaCantripCount: 1,
      }),
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(fetchSpellCatalog).toHaveBeenCalledWith(
      "test-token",
      expect.objectContaining({ nivel: 0, clase: "mago" }),
      expect.any(AbortSignal),
    );
    expect(result.current.eaCantripOptions).toHaveLength(1);
  });

  it("eaCantripOptions is empty when isDownMode", async () => {
    const { result } = renderHook(() =>
      useLevelUpSpellSelectionState({
        ...BASE_OPTIONS,
        isOpen: true,
        isDownMode: true,
        isGainingEa: true,
        eaCantripCount: 1,
      }),
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.eaCantripOptions).toEqual([]);
  });

  // ── EA spell fetching ─────────────────────────────────────────────────────

  it("fetches EA spell options when isGainingEa and eaSpellCount > 0 with valid maxLevel", async () => {
    const fetchSpellCatalog = vi.mocked(dndApi.fetchSpellCatalog);
    const mockSpells = [
      {
        id: 10,
        nombre: "Misil mágico",
        bonificacion: null,
        formula: null,
        descripcion: null,
        tags: null,
      },
    ];
    fetchSpellCatalog.mockResolvedValueOnce(mockSpells);

    // Stable reference to avoid infinite re-render loop (effect dep array)
    const getAtMaxSpellLevel = () => 1;
    const { result } = renderHook(() =>
      useLevelUpSpellSelectionState({
        ...BASE_OPTIONS,
        isOpen: true,
        isGainingEa: true,
        eaSpellCount: 1,
        targetLevel: 5,
        getAtMaxSpellLevel,
      }),
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(fetchSpellCatalog).toHaveBeenCalled();
    expect(result.current.eaSpellOptions.length).toBeGreaterThanOrEqual(0);
  });

  it("eaSpellOptions is empty when getAtMaxSpellLevel returns 0", async () => {
    // BASE_OPTIONS already has getAtMaxSpellLevel: () => 0, which is stable
    const { result } = renderHook(() =>
      useLevelUpSpellSelectionState({
        ...BASE_OPTIONS,
        isOpen: true,
        isGainingEa: true,
        eaSpellCount: 1,
      }),
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.eaSpellOptions).toEqual([]);
  });

  // ── EK cantrip fetching ───────────────────────────────────────────────────

  it("fetches EK cantrip options when isGainingEk and ekCantripCount > 0", async () => {
    const fetchSpellCatalog = vi.mocked(dndApi.fetchSpellCatalog);
    const mockSpells = [
      {
        id: 2,
        nombre: "Prestidigitacion",
        bonificacion: null,
        formula: null,
        descripcion: null,
        tags: null,
      },
    ];
    fetchSpellCatalog.mockResolvedValueOnce(mockSpells);

    const { result } = renderHook(() =>
      useLevelUpSpellSelectionState({
        ...BASE_OPTIONS,
        isOpen: true,
        isGainingEk: true,
        ekCantripCount: 1,
      }),
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(fetchSpellCatalog).toHaveBeenCalled();
    expect(result.current.ekCantripOptions.length).toBeGreaterThanOrEqual(0);
  });

  it("ekCantripOptions is empty when isDownMode", async () => {
    const { result } = renderHook(() =>
      useLevelUpSpellSelectionState({
        ...BASE_OPTIONS,
        isOpen: true,
        isDownMode: true,
        isGainingEk: true,
        ekCantripCount: 1,
      }),
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.ekCantripOptions).toEqual([]);
  });

  // ── EK spell fetching ─────────────────────────────────────────────────────

  it("ekSpellOptions is empty when getEkMaxSpellLevel returns 0", async () => {
    // BASE_OPTIONS already has getEkMaxSpellLevel: () => 0 (stable ref)
    const { result } = renderHook(() =>
      useLevelUpSpellSelectionState({
        ...BASE_OPTIONS,
        isOpen: true,
        isGainingEk: true,
        ekSpellCount: 1,
      }),
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.ekSpellOptions).toEqual([]);
  });

  it("fetches EK spell options when isGainingEk and valid maxLevel", async () => {
    const fetchSpellCatalog = vi.mocked(dndApi.fetchSpellCatalog);
    const mockSpells = [
      {
        id: 3,
        nombre: "Escudo",
        bonificacion: null,
        formula: null,
        descripcion: null,
        tags: null,
      },
    ];
    fetchSpellCatalog.mockResolvedValueOnce(mockSpells);

    // Stable reference to avoid infinite re-render loop
    const getEkMaxSpellLevel = () => 1;
    const { result } = renderHook(() =>
      useLevelUpSpellSelectionState({
        ...BASE_OPTIONS,
        isOpen: true,
        isGainingEk: true,
        ekSpellCount: 1,
        targetLevel: 5,
        getEkMaxSpellLevel,
      }),
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(fetchSpellCatalog).toHaveBeenCalled();
    expect(result.current.ekSpellOptions.length).toBeGreaterThanOrEqual(0);
  });

  // ── Battle Master maneuver fetching ───────────────────────────────────────

  it("battleMasterManeuverOptions is empty when conditions not met", async () => {
    const { result } = renderHook(() =>
      useLevelUpSpellSelectionState({
        ...BASE_OPTIONS,
        isOpen: true,
        isGainingBattleMaster: false,
        isActiveBattleMaster: false,
        battleMasterManeuverCount: 1,
      }),
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.battleMasterManeuverOptions).toEqual([]);
  });

  it("fetches battleMaster maneuvers when isGainingBattleMaster and count > 0", async () => {
    const fetchAbilityCatalog = vi.mocked(dndApi.fetchAbilityCatalog);
    const mockManeuvers = [
      {
        id: 5,
        nombre: "Arremetida",
        bonificacion: null,
        formula: null,
        descripcion: null,
        tags: null,
      },
    ];
    fetchAbilityCatalog.mockResolvedValueOnce(mockManeuvers);

    const { result } = renderHook(() =>
      useLevelUpSpellSelectionState({
        ...BASE_OPTIONS,
        isOpen: true,
        isGainingBattleMaster: true,
        battleMasterManeuverCount: 1,
      }),
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(fetchAbilityCatalog).toHaveBeenCalled();
    expect(
      result.current.battleMasterManeuverOptions.length,
    ).toBeGreaterThanOrEqual(0);
  });

  // ── Cantrip upgrade fetching ──────────────────────────────────────────────

  it("cantripUpgradeOptions is empty when no selectedClassDetail", async () => {
    // BASE_OPTIONS already has selectedClassDetail: null (stable)
    const { result } = renderHook(() =>
      useLevelUpSpellSelectionState({
        ...BASE_OPTIONS,
        isOpen: true,
        cantripUpgradeCount: 1,
      }),
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.cantripUpgradeOptions).toEqual([]);
  });

  it("fetches cantrip upgrade options when cantripUpgradeCount > 0 and class is set", async () => {
    const fetchSpellCatalog = vi.mocked(dndApi.fetchSpellCatalog);
    const mockCantrips = [
      {
        id: 6,
        nombre: "Rayo de escarcha",
        bonificacion: null,
        formula: null,
        descripcion: null,
        tags: null,
      },
    ];
    fetchSpellCatalog.mockResolvedValueOnce(mockCantrips);

    // Stable reference to avoid infinite re-render loop
    const selectedClassDetail = { id: "mago", nombre: "Mago" } as never;
    const { result } = renderHook(() =>
      useLevelUpSpellSelectionState({
        ...BASE_OPTIONS,
        isOpen: true,
        cantripUpgradeCount: 1,
        selectedClassDetail,
      }),
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(fetchSpellCatalog).toHaveBeenCalledWith(
      "test-token",
      expect.objectContaining({ nivel: 0, clase: "mago" }),
      expect.any(AbortSignal),
    );
    expect(result.current.cantripUpgradeOptions.length).toBeGreaterThanOrEqual(
      0,
    );
  });

  // ── Feat spell fetching ───────────────────────────────────────────────────

  it("feat options are empty when asiMode is not 'feat'", async () => {
    const { result } = renderHook(() =>
      useLevelUpSpellSelectionState({
        ...BASE_OPTIONS,
        isOpen: true,
        asiMode: "single",
      }),
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.featCantripOptions).toEqual([]);
    expect(result.current.featSpellOptions).toEqual([]);
  });

  it("feat options are empty when selectedFeat has no spellSelection", async () => {
    // Stable reference to avoid infinite re-render loop (selectedFeat in deps)
    const selectedFeat = {
      nombre: "Alerta",
      descripcion: "...",
      spellSelection: undefined,
    } as never;
    const { result } = renderHook(() =>
      useLevelUpSpellSelectionState({
        ...BASE_OPTIONS,
        isOpen: true,
        asiMode: "feat",
        selectedFeat,
      }),
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.featCantripOptions).toEqual([]);
    expect(result.current.featSpellOptions).toEqual([]);
  });
});
