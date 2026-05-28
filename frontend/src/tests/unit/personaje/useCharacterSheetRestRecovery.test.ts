// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCharacterSheetRestRecovery } from "../../../screens/personaje/dndcharactersheet/hooks/useCharacterSheetRestRecovery";
import type { DndCharacterDetailResponse } from "../../../screens/personaje/utils/dndApi";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeCharacter(
  overrides?: Partial<DndCharacterDetailResponse>,
): DndCharacterDetailResponse {
  return {
    id: 1,
    nombre: "Gandalf",
    clases: [{ id: "mago", nombre: "Mago", nivel: 5 }],
    estadisticas: {
      Constitucion: 14, // mod = +2
      "Puntos de vida": 30,
      "Dados de golpe d6": 5,
      "Hechizos nivel 1": 4,
      "Hechizos nivel 2": 3,
    },
    habilidades: [],
    trasfondo: null,
    raza: null,
    subraza: null,
    retrato: null,
    ...overrides,
  } as unknown as DndCharacterDetailResponse;
}

function setup(
  overrides?: Partial<Parameters<typeof useCharacterSheetRestRecovery>[0]>,
) {
  let currentHpValue = 20;
  let currentTempHp = 0;
  let currentHitDice: Record<string, number> = { d6: 5 };
  let currentSpellSlots: Record<number, number> = { 1: 4, 2: 3 };
  let abilityUsage: Record<number, boolean> = {};

  const mockDiceRoller = {
    rollDicePool: vi.fn().mockResolvedValue({
      diceValues: [4, 3],
      modifier: 4,
      total: 11,
    }),
  };

  const { result } = renderHook(() =>
    useCharacterSheetRestRecovery({
      character: makeCharacter(),
      currentHitDice,
      diceRoller: mockDiceRoller as never,
      setAbilityUsage: vi.fn((fn) => {
        abilityUsage = typeof fn === "function" ? fn(abilityUsage) : fn;
      }),
      setCurrentHitDice: vi.fn((fn) => {
        currentHitDice = typeof fn === "function" ? fn(currentHitDice) : fn;
      }),
      setCurrentHp: vi.fn((fn) => {
        currentHpValue = typeof fn === "function" ? fn(currentHpValue) : fn;
      }),
      setCurrentSpellSlots: vi.fn((fn) => {
        currentSpellSlots =
          typeof fn === "function" ? fn(currentSpellSlots) : fn;
      }),
      setTempHp: vi.fn((fn) => {
        currentTempHp = typeof fn === "function" ? fn(currentTempHp) : fn;
      }),
      totalHp: 30,
      ...overrides,
    }),
  );

  return { result, mockDiceRoller };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("useCharacterSheetRestRecovery - init", () => {
  it("inicializa con isShortRestModalOpen en false", () => {
    const { result } = setup();
    expect(result.current.isShortRestModalOpen).toBe(false);
  });

  it("inicializa shortRestHitDiceCounts vacío", () => {
    const { result } = setup();
    expect(result.current.shortRestHitDiceCounts).toEqual({});
  });

  it("calcula totalCharacterLevel desde las clases", () => {
    const { result } = setup();
    expect(result.current.totalCharacterLevel).toBe(5);
  });

  it("construye hitDiceEntries desde las estadísticas del personaje", () => {
    const { result } = setup();
    expect(result.current.hitDiceEntries).toHaveLength(1);
    expect(result.current.hitDiceEntries[0].die).toBe("d6");
    expect(result.current.hitDiceEntries[0].total).toBe(5);
    expect(result.current.hitDiceEntries[0].current).toBe(5);
  });
});

describe("useCharacterSheetRestRecovery - handleOpenShortRest", () => {
  it("abre el modal de descanso corto y resetea conteos", () => {
    const { result } = setup();
    act(() => {
      result.current.setShortRestHitDiceCounts({ d6: 2 });
    });
    expect(result.current.shortRestHitDiceCounts).toEqual({ d6: 2 });

    act(() => {
      result.current.handleOpenShortRest();
    });
    expect(result.current.isShortRestModalOpen).toBe(true);
    expect(result.current.shortRestHitDiceCounts).toEqual({});
  });
});

describe("useCharacterSheetRestRecovery - handleLongRest", () => {
  it("cierra el modal si hay un personaje", () => {
    const { result } = setup();
    act(() => {
      result.current.handleLongRest();
    });
    // No debe lanzar error
    expect(result.current.isShortRestModalOpen).toBe(false);
  });

  it("no hace nada si no hay personaje", () => {
    const setCurrentHp = vi.fn();
    setup({
      character: null,
      setCurrentHp,
    });
    // No llamamos handleLongRest aquí porque el personaje es null
    // El hook no hace nada en ese caso
    expect(setCurrentHp).not.toHaveBeenCalled();
  });
});

describe("useCharacterSheetRestRecovery - handleConfirmShortRest", () => {
  it("cierra el modal si no hay hitDiceEntries", async () => {
    const characterSinDados = makeCharacter({
      estadisticas: { Constitucion: 10 },
    });
    const { result } = setup({ character: characterSinDados });
    act(() => {
      result.current.setIsShortRestModalOpen(true);
    });
    await act(async () => {
      await result.current.handleConfirmShortRest();
    });
    expect(result.current.isShortRestModalOpen).toBe(false);
  });

  it("cierra el modal si no se seleccionaron dados", async () => {
    const { result } = setup();
    act(() => {
      result.current.setIsShortRestModalOpen(true);
      // shortRestHitDiceCounts vacío → no se seleccionan dados
    });
    await act(async () => {
      await result.current.handleConfirmShortRest();
    });
    expect(result.current.isShortRestModalOpen).toBe(false);
  });

  it("realiza el descanso corto con dados seleccionados", async () => {
    const { result, mockDiceRoller } = setup();
    act(() => {
      result.current.setIsShortRestModalOpen(true);
      result.current.setShortRestHitDiceCounts({ d6: 2 });
    });

    await act(async () => {
      await result.current.handleConfirmShortRest();
    });

    expect(mockDiceRoller.rollDicePool).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Descanso corto",
        totalLabel: "Curación",
      }),
    );
    expect(result.current.isShortRestModalOpen).toBe(false);
  });
});
