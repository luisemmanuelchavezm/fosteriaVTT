// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  fetchAbilityCatalog: vi.fn(),
  fetchClassSkills: vi.fn(),
  fetchClassSubclassSkills: vi.fn(),
  fetchDndClassDetail: vi.fn(),
  fetchDndClassSummaries: vi.fn(),
  fetchSpellCatalog: vi.fn(),
  fetchSpellDetailByName: vi.fn(),
}));

vi.mock("../../../screens/personaje/utils/dndApi", () => ({
  ...apiMocks,
}));

vi.mock(
  "../../../screens/personaje/dndcharactersheet/hooks/useLevelUpDerivedState",
  () => ({
    useLevelUpDerivedState: vi.fn(
      (options: { selectedClassDetail: unknown }) => ({
        availableExpertiseOptions: [],
        battleMasterManeuverCount: 0,
        cantripUpgradeCount: 0,
        classIsNew: false,
        currentSubclass: null,
        eaCantripCount: 0,
        eaSpellCount: 0,
        effectiveSubclass: null,
        ekCantripCount: 0,
        ekSpellCount: 0,
        expertiseChoiceConfig: null,
        featOptions: [],
        getAtMaxSpellLevel: () => 0,
        getEkMaxSpellLevel: () => 0,
        isActiveBattleMaster: false,
        isActiveEa: false,
        isActiveEk: false,
        isGainingBattleMaster: false,
        isGainingEa: false,
        isGainingEk: false,
        levelFeatures: [],
        needsSubclass: false,
        requiresAsi: false,
        selectedFeat: null,
        subclassFeatures: [],
        targetLevel: 3,
        targetLevelAfterDown: 1,
        totalCharacterLevel: 2,
        visibleClassSummaries: [],
        visibleInitialClassChoices: options.selectedClassDetail
          ? ((options.selectedClassDetail as { elecciones?: unknown[] })
              .elecciones ?? [])
          : [],
      }),
    ),
  }),
);

vi.mock(
  "../../../screens/personaje/dndcharactersheet/hooks/useLevelUpSpellSelectionState",
  () => ({
    useLevelUpSpellSelectionState: vi.fn(() => ({
      battleMasterManeuverOptions: [],
      battleMasterManeuvers: [],
      cantripUpgradeChosen: [],
      cantripUpgradeOptions: [],
      eaCantripOptions: [],
      eaChosenCantrips: [],
      eaChosenSpells: [],
      eaSpellOptions: [],
      ekCantripOptions: [],
      ekChosenCantrips: [],
      ekChosenSpells: [],
      ekSpellOptions: [],
      featCantripOptions: [],
      featSpellOptions: [],
      selectedFeatCantrips: [],
      selectedFeatSpells: [],
      setBattleMasterManeuvers: vi.fn(),
      setCantripUpgradeChosen: vi.fn(),
      setEaChosenCantrips: vi.fn(),
      setEaChosenSpells: vi.fn(),
      setEkChosenCantrips: vi.fn(),
      setEkChosenSpells: vi.fn(),
      setSelectedFeatCantrips: vi.fn(),
      setSelectedFeatSpells: vi.fn(),
    })),
  }),
);

import { useLevelUpModalState } from "../../../screens/personaje/dndcharactersheet/hooks/useLevelUpModalState";

const rogueSummary = { id: "picaro", nombre: "Picaro" };
const fighterSummary = { id: "guerrero", nombre: "Guerrero" };

const rogueDetail = {
  id: "picaro",
  nombre: "Picaro",
  descripcion: "Clase picara",
  puntosGolpe: { dadoGolpe: "1d8" },
  lanzamientoConjuros: null,
  elecciones: [],
  subclases: [],
};

const fighterDetail = {
  id: "guerrero",
  nombre: "Guerrero",
  descripcion: "Clase guerrero",
  puntosGolpe: { dadoGolpe: "1d10" },
  lanzamientoConjuros: null,
  elecciones: [],
  subclases: [
    {
      id: "maestrobatalla",
      nombre: "Maestro de Batalla",
      descripcion: "Tactico marcial",
      nivelDesbloqueo: 3,
      tablas: [],
    },
  ],
};

const baseCharacter = {
  nombre: "Nim",
  nivel: 2,
  clases: [{ nombre: "Picaro", nivel: 2 }],
  habilidades: [],
  estadisticas: {
    Fuerza: 10,
    Destreza: 16,
    Constitucion: 12,
    Inteligencia: 14,
    Sabiduria: 10,
    Carisma: 8,
    Acrobacias: 2,
    Sigilo: 2,
    Investigacion: 2,
    Percepcion: 4,
    "Bonificador por competencia": 2,
  },
  tags: [],
};

describe("useLevelUpModalState (low-memory suite)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    apiMocks.fetchDndClassSummaries.mockResolvedValue([rogueSummary]);
    apiMocks.fetchDndClassDetail.mockResolvedValue(rogueDetail);
    apiMocks.fetchClassSkills.mockResolvedValue([]);
    apiMocks.fetchClassSubclassSkills.mockResolvedValue([]);
    apiMocks.fetchSpellDetailByName.mockResolvedValue(null);
    apiMocks.fetchAbilityCatalog.mockResolvedValue([]);
    apiMocks.fetchSpellCatalog.mockResolvedValue([]);
  });

  it("loads classes and selects target class", async () => {
    const { result } = renderHook(() =>
      useLevelUpModalState({
        token: "jwt-token",
        character: baseCharacter as never,
        classCompetencies: [],
        isOpen: true,
        mode: "up",
        onClose: vi.fn(),
        onSubmit: vi.fn().mockResolvedValue(undefined),
        onLevelDown: vi.fn().mockResolvedValue(undefined),
      }),
    );

    await waitFor(() => {
      expect(result.current.classSummaries).toHaveLength(1);
    });

    act(() => {
      result.current.setSelectedClassId("picaro");
    });

    await waitFor(() => {
      expect(result.current.selectedClassDetail?.id).toBe("picaro");
      expect(apiMocks.fetchDndClassDetail).toHaveBeenCalledWith(
        "jwt-token",
        "picaro",
        expect.any(AbortSignal),
      );
    });
  });

  it("loads fighter detail in alternate class flow", async () => {
    apiMocks.fetchDndClassSummaries.mockResolvedValue([fighterSummary]);
    apiMocks.fetchDndClassDetail.mockResolvedValue(fighterDetail);

    const { result } = renderHook(() =>
      useLevelUpModalState({
        token: "jwt-token",
        character: {
          ...baseCharacter,
          nivel: 2,
          clases: [{ nombre: "Guerrero", nivel: 2 }],
        } as never,
        classCompetencies: [],
        isOpen: true,
        mode: "up",
        onClose: vi.fn(),
        onSubmit: vi.fn().mockResolvedValue(undefined),
        onLevelDown: vi.fn().mockResolvedValue(undefined),
      }),
    );

    await waitFor(() => {
      expect(result.current.classSummaries).toHaveLength(1);
    });

    act(() => {
      result.current.setSelectedClassId("guerrero");
    });

    await waitFor(() => {
      expect(result.current.selectedClassDetail?.id).toBe("guerrero");
      expect(apiMocks.fetchClassSkills).toHaveBeenCalledWith(
        "jwt-token",
        "guerrero",
        expect.any(AbortSignal),
      );
    });
  });

  it("submits minimal payload in level-up mode", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      useLevelUpModalState({
        token: "jwt-token",
        character: baseCharacter as never,
        classCompetencies: [],
        isOpen: true,
        mode: "up",
        onClose,
        onSubmit,
        onLevelDown: vi.fn().mockResolvedValue(undefined),
      }),
    );

    await waitFor(() => {
      expect(result.current.classSummaries).toHaveLength(1);
    });

    act(() => {
      result.current.setSelectedClassId("picaro");
    });

    await waitFor(() => {
      expect(result.current.selectedClassDetail?.id).toBe("picaro");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        claseId: "picaro",
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onLevelDown in down mode", async () => {
    const onLevelDown = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      useLevelUpModalState({
        token: "jwt-token",
        character: baseCharacter as never,
        classCompetencies: [],
        isOpen: true,
        mode: "down",
        onClose,
        onSubmit: vi.fn().mockResolvedValue(undefined),
        onLevelDown,
      }),
    );

    await waitFor(() => {
      expect(result.current.classSummaries).toHaveLength(1);
    });

    act(() => {
      result.current.setSelectedClassId("picaro");
    });

    await waitFor(() => {
      expect(result.current.selectedClassDetail?.id).toBe("picaro");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onLevelDown).toHaveBeenCalledWith("picaro");
    expect(onClose).toHaveBeenCalled();
  });
});
