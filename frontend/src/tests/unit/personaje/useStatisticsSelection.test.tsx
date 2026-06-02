// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useStatisticsSelection } from "../../../screens/personaje/creatednd/hooks/useStatisticsSelection";

const diceBoxState = {
  init: vi.fn(async () => undefined),
  clear: vi.fn(),
  show: vi.fn(),
  roll: vi.fn(),
};

vi.mock("@3d-dice/dice-box", () => ({
  default: vi.fn(() => ({ ...diceBoxState })),
}));

describe("creacion de personaje - useStatisticsSelection", () => {
  beforeEach(() => {
    diceBoxState.init.mockClear();
    diceBoxState.clear.mockClear();
    diceBoxState.show.mockClear();
    diceBoxState.roll.mockReset();
    document.body.innerHTML = "";
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("espera a Dice-Box y devuelve una tirada 3D valida cuando el host existe", async () => {
    const { result } = renderHook(() => useStatisticsSelection({}));
    const host = document.createElement("div");
    host.id = result.current.diceBoxHostId;
    document.body.appendChild(host);

    diceBoxState.roll.mockResolvedValueOnce([
      { value: 6 },
      { value: 5 },
      { value: 4 },
      { value: 1 },
    ]);

    await act(async () => {
      result.current.runDiceSlotRoll(result.current.diceRounds[0].id, 0);
    });

    await waitFor(() => {
      expect(result.current.activeRollContext).toBeNull();
      const slot = result.current.diceRounds[0].slots[0];
      expect(slot.rolls).toEqual([6, 5, 4, 1]);
      expect(slot.total).toBe(15);
    });
  });

  it("descarta resultados 0 del 3D y usa una tirada valida de respaldo", async () => {
    const { result } = renderHook(() => useStatisticsSelection({}));
    const host = document.createElement("div");
    host.id = result.current.diceBoxHostId;
    document.body.appendChild(host);

    diceBoxState.roll.mockResolvedValueOnce([
      { value: 0 },
      { value: 0 },
      { value: 0 },
      { value: 0 },
    ]);

    const randomSpy = vi
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.99)
      .mockReturnValueOnce(0.83)
      .mockReturnValueOnce(0.66)
      .mockReturnValueOnce(0.16);

    await waitFor(() => {
      expect(result.current.isDiceBoxReady).toBe(true);
    });

    await act(async () => {
      result.current.runDiceSlotRoll(result.current.diceRounds[0].id, 0);
    });

    await waitFor(() => {
      const slot = result.current.diceRounds[0].slots[0];
      expect(slot.rolls).toHaveLength(4);
      expect(slot.rolls.every((value) => value >= 1 && value <= 6)).toBe(true);
      expect(slot.total).toBe(
        [...slot.rolls]
          .sort((left, right) => right - left)
          .slice(0, 3)
          .reduce((sum, value) => sum + value, 0),
      );
      expect(result.current.diceBoxError).toBeNull();
    });

    randomSpy.mockRestore();
  });

  it("handleMethodChange cambia a standard y resetea asignaciones", () => {
    const { result } = renderHook(() => useStatisticsSelection({}));
    act(() => result.current.handleMethodChange("standard"));
    expect(result.current.selectedMethod).toBe("standard");
    Object.values(result.current.standardAssignments).forEach((v) =>
      expect(v).toBe(""),
    );
  });

  it("handleMethodChange cambia a point-buy y resetea puntuaciones", () => {
    const { result } = renderHook(() => useStatisticsSelection({}));
    act(() => result.current.handleMethodChange("point-buy"));
    expect(result.current.selectedMethod).toBe("point-buy");
    Object.values(result.current.pointBuyScores).forEach((v) =>
      expect(v).toBe(8),
    );
  });

  it("handleMethodChange cambia a custom y resetea puntuaciones", () => {
    const { result } = renderHook(() => useStatisticsSelection({}));
    act(() => result.current.handleMethodChange("custom"));
    expect(result.current.selectedMethod).toBe("custom");
  });

  it("handleStandardAssignmentChange actualiza asignación", () => {
    const { result } = renderHook(() => useStatisticsSelection({}));
    act(() => result.current.handleMethodChange("standard"));
    act(() =>
      result.current.handleStandardAssignmentChange("strength", "15-3-3-3"),
    );
    expect(result.current.standardAssignments["strength"]).toBe("15-3-3-3");
  });

  it("handlePointBuyChange incrementa puntuación dentro del rango", () => {
    const { result } = renderHook(() => useStatisticsSelection({}));
    act(() => result.current.handleMethodChange("point-buy"));
    const initial = result.current.pointBuyScores["strength"];
    act(() => result.current.handlePointBuyChange("strength", 1));
    expect(result.current.pointBuyScores["strength"]).toBe(initial + 1);
  });

  it("handlePointBuyChange no baja de POINT_BUY_MIN (8)", () => {
    const { result } = renderHook(() => useStatisticsSelection({}));
    act(() => result.current.handleMethodChange("point-buy"));
    act(() => result.current.handlePointBuyChange("strength", -1));
    expect(result.current.pointBuyScores["strength"]).toBe(8);
  });

  it("handleCustomScoreChange actualiza puntuación personalizada", () => {
    const { result } = renderHook(() => useStatisticsSelection({}));
    act(() => result.current.handleMethodChange("custom"));
    act(() => result.current.handleCustomScoreChange("strength", "16"));
    expect(result.current.customScores["strength"]).toBe("16");
  });

  it("handleCustomScoreChange ignora caracteres no numéricos", () => {
    const { result } = renderHook(() => useStatisticsSelection({}));
    act(() => result.current.handleMethodChange("custom"));
    act(() => result.current.handleCustomScoreChange("strength", "abc"));
    expect(result.current.customScores["strength"]).toBe("");
  });

  it("renderStatValue retorna '-' cuando no hay valor asignado en standard", () => {
    const { result } = renderHook(() => useStatisticsSelection({}));
    act(() => result.current.handleMethodChange("standard"));
    expect(result.current.renderStatValue("strength")).toBe("-");
  });

  it("renderStatValue retorna puntuación en point-buy", () => {
    const { result } = renderHook(() => useStatisticsSelection({}));
    act(() => result.current.handleMethodChange("point-buy"));
    const value = result.current.renderStatValue("strength");
    expect(value).toBe(8);
  });

  it("renderStatValue incluye bonus racial en point-buy", () => {
    const { result } = renderHook(() =>
      useStatisticsSelection({ strength: 2 }),
    );
    act(() => result.current.handleMethodChange("point-buy"));
    expect(result.current.renderStatValue("strength")).toBe("8+2");
  });

  it("renderStatValue retorna string vacío en custom cuando no hay valor", () => {
    const { result } = renderHook(() => useStatisticsSelection({}));
    act(() => result.current.handleMethodChange("custom"));
    expect(result.current.renderStatValue("strength")).toBe("");
  });

  it("getStatNumericValue retorna null en dice cuando no hay tirada", () => {
    const { result } = renderHook(() => useStatisticsSelection({}));
    expect(result.current.getStatNumericValue("strength")).toBeNull();
  });

  it("getStatNumericValue retorna null en standard sin asignación", () => {
    const { result } = renderHook(() => useStatisticsSelection({}));
    act(() => result.current.handleMethodChange("standard"));
    expect(result.current.getStatNumericValue("strength")).toBeNull();
  });

  it("getStatNumericValue retorna puntuación + bonus en point-buy", () => {
    const { result } = renderHook(() =>
      useStatisticsSelection({ strength: 2 }),
    );
    act(() => result.current.handleMethodChange("point-buy"));
    expect(result.current.getStatNumericValue("strength")).toBe(10);
  });

  it("getStatNumericValue retorna null en custom sin valor", () => {
    const { result } = renderHook(() => useStatisticsSelection({}));
    act(() => result.current.handleMethodChange("custom"));
    expect(result.current.getStatNumericValue("strength")).toBeNull();
  });

  it("getStatNumericValue retorna número en custom con valor", () => {
    const { result } = renderHook(() => useStatisticsSelection({}));
    act(() => result.current.handleMethodChange("custom"));
    act(() => result.current.handleCustomScoreChange("strength", "14"));
    expect(result.current.getStatNumericValue("strength")).toBe(14);
  });

  it("reintenta tras el error conocido de face -1 y recupera una tirada 3D valida", async () => {
    const { result } = renderHook(() => useStatisticsSelection({}));
    const host = document.createElement("div");
    host.id = result.current.diceBoxHostId;
    document.body.appendChild(host);

    diceBoxState.roll
      .mockRejectedValueOnce(
        new Error("colliderFaceMap Error: No value found for d6 mesh face -1"),
      )
      .mockResolvedValueOnce([
        { value: 6 },
        { value: 6 },
        { value: 4 },
        { value: 2 },
      ]);

    await waitFor(() => {
      expect(result.current.isDiceBoxReady).toBe(true);
    });

    await act(async () => {
      result.current.runDiceSlotRoll(result.current.diceRounds[0].id, 0);
    });

    await waitFor(() => {
      const slot = result.current.diceRounds[0].slots[0];
      expect(slot.rolls).toEqual([6, 6, 4, 2]);
      expect(slot.total).toBe(16);
      expect(result.current.diceBoxError).toBeNull();
    });

    expect(diceBoxState.roll).toHaveBeenCalledTimes(2);
  });
});
