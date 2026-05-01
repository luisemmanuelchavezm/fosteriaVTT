// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDiceRoller } from "../../../../components/dice/useDiceRoller";

const mockDiceBox = {
  init: vi.fn(async () => undefined),
  clear: vi.fn(),
  roll: vi.fn(async (notation: string) => {
    if (notation === "1d20") {
      return [{ value: 18 }];
    }

    return [{ value: 4 }, { value: 5 }];
  }),
  show: vi.fn(),
};

vi.mock("@3d-dice/dice-box", () => ({
  default: vi.fn(() => ({ ...mockDiceBox })),
}));

describe("lanzamiento de dados - useDiceRoller", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    mockDiceBox.init.mockClear();
    mockDiceBox.clear.mockClear();
    mockDiceBox.roll.mockClear();
    mockDiceBox.show.mockClear();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("informa un error cuando la expresion no se puede interpretar", async () => {
    const { result } = renderHook(() => useDiceRoller());

    await act(async () => {
      result.current.rollExpression("Ataque", "foo");
    });

    expect(result.current.diceBoxError).toBe(
      "No se pudo interpretar la tirada: foo",
    );
  });

  it("resuelve expresiones planas sin depender de Dice-Box", async () => {
    const { result } = renderHook(() => useDiceRoller());

    await act(async () => {
      result.current.rollExpression("Bono plano", "5");
    });

    await waitFor(() => {
      expect(result.current.summary).toMatchObject({
        title: "Bono plano",
        expression: "5",
        diceValues: [],
        modifier: 5,
        total: 5,
      });
    });

    expect(result.current.isDiceBoxReady).toBe(false);
  });

  it("lanza un d20 con Dice-Box cuando existe el host y genera el resumen", async () => {
    const { result } = renderHook(() => useDiceRoller());
    const host = document.createElement("div");
    host.id = result.current.diceBoxHostId;
    document.body.appendChild(host);

    await act(async () => {
      result.current.rollD20Check("Iniciativa", 2);
    });

    await waitFor(() => {
      expect(result.current.isDiceBoxReady).toBe(true);
      expect(result.current.summary).toMatchObject({
        title: "Iniciativa",
        expression: "1d20 + 2",
        diceValues: [18],
        modifier: 2,
        total: 20,
      });
    });

    expect(mockDiceBox.init).toHaveBeenCalled();
    expect(mockDiceBox.roll).toHaveBeenCalledWith("1d20");
  });

  it("muestra un error de inicializacion si el host del canvas no existe", async () => {
    const { result } = renderHook(() => useDiceRoller());

    await act(async () => {
      result.current.rollExpression("Dano", "2d6 + 1");
    });

    await waitFor(() => {
      expect(result.current.diceBoxError).toContain("target DOM node");
    });
  });
});
