// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDiceRoller } from "../../../../components/dice/useDiceRoller";

const mockDiceBox = {
  init: vi.fn(async () => undefined),
  clear: vi.fn(),
  roll: vi.fn(async (notation: string | string[]) => {
    if (notation === "1d20") {
      return [{ value: 18 }];
    }

    if (Array.isArray(notation)) {
      return notation.flatMap((entry) => {
        if (entry === "1d12") {
          return [{ value: 9 }];
        }
        if (entry === "1d6") {
          return [{ value: 4 }];
        }
        return [{ value: 4 }];
      });
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

  it("resuelve sumas planas para resultados ya calculados", async () => {
    const { result } = renderHook(() => useDiceRoller());

    await act(async () => {
      result.current.rollExpression("Descanso corto", "4 + 2 + 6 + 2");
    });

    await waitFor(() => {
      expect(result.current.summary).toMatchObject({
        title: "Descanso corto",
        expression: "4 + 2 + 6 + 2",
        diceValues: [],
        modifier: 14,
        total: 14,
      });
    });
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

  it("lanza una pool compuesta con varios tipos de dado en una sola tirada", async () => {
    const { result } = renderHook(() => useDiceRoller());
    const host = document.createElement("div");
    host.id = result.current.diceBoxHostId;
    document.body.appendChild(host);

    let summary = null;
    await act(async () => {
      summary = await result.current.rollDicePool({
        title: "Descanso corto",
        dicePools: [
          { count: 1, faces: 12 },
          { count: 1, faces: 6 },
        ],
        modifier: 4,
        modifierDisplay: "+2 CON por dado",
        totalLabel: "Curacion",
      });
    });

    await waitFor(() => {
      expect(result.current.summary).toMatchObject({
        title: "Descanso corto",
        expression: "1d12 + 1d6 + 4",
        diceValues: [9, 4],
        modifier: 4,
        modifierDisplay: "+2 CON por dado",
        totalLabel: "Curacion",
        total: 17,
      });
    });

    expect(summary).toMatchObject({
      diceValues: [9, 4],
      total: 17,
    });
    expect(mockDiceBox.roll).toHaveBeenCalledWith(["1d12", "1d6"]);
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

  it("interpreta expresiones con varios dados y modificador plano", async () => {
    const { result } = renderHook(() => useDiceRoller());
    const host = document.createElement("div");
    host.id = result.current.diceBoxHostId;
    document.body.appendChild(host);

    await act(async () => {
      result.current.rollExpression("Arma custom", "1d12 + 1d6 + 2");
    });

    await waitFor(() => {
      expect(result.current.summary).toMatchObject({
        title: "Arma custom",
        expression: "1d12 + 1d6 + 2",
        diceValues: [9, 4],
        modifier: 2,
        total: 15,
      });
    });

    expect(mockDiceBox.roll).toHaveBeenCalledWith(["1d12", "1d6"]);
  });

  it("muestra error explicito cuando se excede el maximo de dados", async () => {
    const { result } = renderHook(() => useDiceRoller());
    const host = document.createElement("div");
    host.id = result.current.diceBoxHostId;
    document.body.appendChild(host);

    await act(async () => {
      result.current.rollExpression("Tirada enorme", "21d6");
    });

    await waitFor(() => {
      expect(result.current.diceBoxError).toBe(
        "El numero de dados maximos que puedes tirar es 20.",
      );
    });
  });
});
