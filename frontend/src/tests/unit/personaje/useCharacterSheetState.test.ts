// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCharacterSheetState } from "../../../screens/personaje/dndcharactersheet/hooks/useCharacterSheetState";

vi.mock("../../../screens/personaje/utils/dndApi", () => ({
  fetchDndCharacterDetail: vi.fn(),
}));

vi.mock("../../../screens/personaje/dndcharactersheet/screenState", () => ({
  buildCharacterSheetState: vi.fn(),
}));

vi.mock(
  "../../../screens/personaje/dndcharactersheet/utils/characterCompetencies",
  () => ({
    getCharacterCompetencies: vi.fn().mockReturnValue([]),
    splitCharacterCompetencies: vi
      .fn()
      .mockReturnValue({ weaponArmor: [], tools: [] }),
  }),
);

import { fetchDndCharacterDetail } from "../../../screens/personaje/utils/dndApi";
import { buildCharacterSheetState } from "../../../screens/personaje/dndcharactersheet/screenState";

function makeSheetState(overrides = {}) {
  return {
    currentHp: 20,
    tempHp: 0,
    currentSpellSlots: {},
    currentExtraResources: {},
    currentHitDice: {},
    currentMoney: { ppt: 0, po: 0, pp: 0, pc: 0 },
    editableName: "Theron",
    editableAlignment: "Neutral",
    editablePersonalHistory: "",
    editableLanguagesText: "",
    editableStatScores: {},
    editableMovement: 30,
    editableMaxHp: 20,
    editableSpellSlotMaximums: {},
    editableExtraResourceMaximums: {},
    editableSavingThrowProficiencies: [],
    editableSkillProficiencyLevels: {},
    editableSkillProficiencies: [],
    editableSkillExpertise: [],
    ...overrides,
  };
}

function makeCharacter(id = 1) {
  return {
    id,
    nombre: "Theron",
    mochila: [],
    estadisticas: {},
    clases: [],
    habilidades: [],
  } as never;
}

function defaultOpts(overrides = {}) {
  return {
    characterId: "1",
    competencyCatalog: null,
    classCompetencies: [],
    healthCurrentStat: "Puntos de vida actuales",
    healthTempStat: "Puntos de vida temporales",
    healthTotalStat: "Puntos de vida",
    movementStat: "Movimiento",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  vi.mocked(buildCharacterSheetState).mockReturnValue(
    makeSheetState() as never,
  );
});

describe("useCharacterSheetState", () => {
  describe("sin token de autenticacion", () => {
    it("establece loadError y no carga el personaje", async () => {
      const { result } = renderHook(() =>
        useCharacterSheetState(defaultOpts()),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.loadError).toMatch(/autenticar/i);
      expect(result.current.character).toBeNull();
      expect(fetchDndCharacterDetail).not.toHaveBeenCalled();
    });
  });

  describe("con token de autenticacion", () => {
    beforeEach(() => {
      localStorage.setItem("jwtToken", "test-token");
    });

    it("carga el personaje exitosamente y establece estado inicial", async () => {
      const character = makeCharacter(1);
      vi.mocked(fetchDndCharacterDetail).mockResolvedValueOnce(
        character as never,
      );

      const { result } = renderHook(() =>
        useCharacterSheetState(defaultOpts()),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.character).toEqual(character);
      expect(result.current.loadError).toBeNull();
      expect(result.current.currentHp).toBe(20);
      expect(result.current.editableName).toBe("Theron");
    });

    it("establece loadError cuando la carga falla", async () => {
      vi.mocked(fetchDndCharacterDetail).mockRejectedValueOnce(
        new Error("No se pudo cargar"),
      );

      const { result } = renderHook(() =>
        useCharacterSheetState(defaultOpts()),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.loadError).toBe("No se pudo cargar");
      expect(result.current.character).toBeNull();
    });

    it("maneja error generico (no Error instance)", async () => {
      vi.mocked(fetchDndCharacterDetail).mockRejectedValueOnce(
        "error generico",
      );

      const { result } = renderHook(() =>
        useCharacterSheetState(defaultOpts()),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.loadError).toMatch(/cargar la hoja/i);
    });

    it("syncCharacterDetail actualiza el estado del personaje", async () => {
      const character = makeCharacter(1);
      vi.mocked(fetchDndCharacterDetail).mockResolvedValueOnce(
        character as never,
      );

      const { result } = renderHook(() =>
        useCharacterSheetState(defaultOpts()),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const updatedCharacter = makeCharacter(1);
      vi.mocked(buildCharacterSheetState).mockReturnValueOnce(
        makeSheetState({
          currentHp: 15,
          editableName: "Theron Actualizado",
        }) as never,
      );

      act(() => {
        result.current.syncCharacterDetail(updatedCharacter);
      });

      expect(result.current.currentHp).toBe(15);
      expect(result.current.editableName).toBe("Theron Actualizado");
    });

    it("syncCharacterDetail aplica competencias cuando hay competencyCatalog", async () => {
      const { splitCharacterCompetencies } =
        await import("../../../screens/personaje/dndcharactersheet/utils/characterCompetencies");

      const character = makeCharacter(1);
      vi.mocked(fetchDndCharacterDetail).mockResolvedValueOnce(
        character as never,
      );

      const competencyCatalog = {
        armas: [],
        armaduras: [],
        herramientas: [],
      } as never;
      const { result } = renderHook(() =>
        useCharacterSheetState(defaultOpts({ competencyCatalog })),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Set up the mock for the manual syncCharacterDetail call (after initial load)
      vi.mocked(splitCharacterCompetencies).mockReturnValueOnce({
        weaponArmor: ["Espadas"],
        tools: ["Herramientas de ladrón"],
      } as never);

      act(() => {
        result.current.syncCharacterDetail(character);
      });

      expect(result.current.editableWeaponArmorCompetencies).toEqual([
        "Espadas",
      ]);
      expect(result.current.editableToolCompetencies).toEqual([
        "Herramientas de ladrón",
      ]);
    });

    it("setCharacter permite actualizar el personaje manualmente", async () => {
      const character = makeCharacter(1);
      vi.mocked(fetchDndCharacterDetail).mockResolvedValueOnce(
        character as never,
      );

      const { result } = renderHook(() =>
        useCharacterSheetState(defaultOpts()),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.setCharacter(null);
      });

      expect(result.current.character).toBeNull();
    });

    it("setCurrentHp permite actualizar el HP actual", async () => {
      const character = makeCharacter(1);
      vi.mocked(fetchDndCharacterDetail).mockResolvedValueOnce(
        character as never,
      );

      const { result } = renderHook(() =>
        useCharacterSheetState(defaultOpts()),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.setCurrentHp(10);
      });

      expect(result.current.currentHp).toBe(10);
    });

    it("selectedInventoryItem se actualiza cuando el personaje cambia", async () => {
      const item = { id: 5, nombre: "Espada" } as never;
      const character = { ...makeCharacter(1), mochila: [item] } as never;
      vi.mocked(fetchDndCharacterDetail).mockResolvedValueOnce(
        character as never,
      );

      const { result } = renderHook(() =>
        useCharacterSheetState(defaultOpts()),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Seleccionar el item
      act(() => {
        result.current.setSelectedInventoryItem(item);
      });

      expect(result.current.selectedInventoryItem).toEqual(item);
    });
  });
});
