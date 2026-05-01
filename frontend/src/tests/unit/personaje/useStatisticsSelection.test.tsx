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
