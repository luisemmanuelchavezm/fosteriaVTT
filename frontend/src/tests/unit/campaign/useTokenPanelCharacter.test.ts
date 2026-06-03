// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  getMaxHp,
  clampPercentage,
  getInitiative,
  getArmorClass,
  formatStatWithModifier,
  useTokenPanelCharacter,
} from "../../../screens/campaign/hooks/useTokenPanelCharacter";

// ── Mock API calls ────────────────────────────────────────────────────────────
vi.mock("../../../screens/personaje/utils/dndApi", () => ({
  fetchDndCharacterDetail: vi.fn().mockResolvedValue(null),
  updateDndCharacterResources: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../../components/dice/useDiceRoller", () => ({
  useDiceRoller: vi.fn(() => ({
    summary: null,
    roll: vi.fn(),
    clearSummary: vi.fn(),
  })),
}));

// ── Pure functions ────────────────────────────────────────────────────────────

describe("getMaxHp", () => {
  it("retorna Puntos de vida cuando está disponible", () => {
    expect(getMaxHp({ "Puntos de vida": 45 })).toBe(45);
  });

  it("retorna Vida maxima como fallback", () => {
    expect(getMaxHp({ "Vida maxima": 30 })).toBe(30);
  });

  it("retorna Vida como segundo fallback", () => {
    expect(getMaxHp({ Vida: 20 })).toBe(20);
  });

  it("retorna 1 cuando no hay estadísticas de vida", () => {
    expect(getMaxHp({})).toBe(1);
  });

  it("retorna al menos 1 aunque el valor sea 0", () => {
    expect(getMaxHp({ "Puntos de vida": 0 })).toBe(1);
  });

  it("retorna al menos 1 aunque el valor sea negativo", () => {
    expect(getMaxHp({ "Puntos de vida": -5 })).toBe(1);
  });

  it("Puntos de vida tiene prioridad sobre Vida maxima", () => {
    expect(getMaxHp({ "Puntos de vida": 50, "Vida maxima": 30 })).toBe(50);
  });
});

describe("clampPercentage", () => {
  it("retorna el valor dentro de [0, 100]", () => {
    expect(clampPercentage(50)).toBe(50);
  });

  it("clampea a 0 para valores negativos", () => {
    expect(clampPercentage(-10)).toBe(0);
  });

  it("clampea a 100 para valores mayores a 100", () => {
    expect(clampPercentage(150)).toBe(100);
  });

  it("retorna 0 para Infinity", () => {
    expect(clampPercentage(Infinity)).toBe(0);
  });

  it("retorna 0 para NaN", () => {
    expect(clampPercentage(NaN)).toBe(0);
  });

  it("retorna 0 exacto", () => {
    expect(clampPercentage(0)).toBe(0);
  });

  it("retorna 100 exacto", () => {
    expect(clampPercentage(100)).toBe(100);
  });
});

describe("getInitiative", () => {
  it("retorna Iniciativa cuando está presente", () => {
    expect(getInitiative({ Iniciativa: 3 })).toBe(3);
  });

  it("calcula iniciativa desde Destreza cuando no hay Iniciativa", () => {
    expect(getInitiative({ Destreza: 16 })).toBe(3); // floor((16-10)/2) = 3
  });

  it("calcula iniciativa desde Destreza 10 → 0", () => {
    expect(getInitiative({ Destreza: 10 })).toBe(0);
  });

  it("calcula iniciativa desde Destreza 8 → -1", () => {
    expect(getInitiative({ Destreza: 8 })).toBe(-1);
  });

  it("usa Destreza 10 como fallback cuando no hay ninguna estadística", () => {
    expect(getInitiative({})).toBe(0); // floor((10-10)/2) = 0
  });

  it("Iniciativa: 0 es válido", () => {
    expect(getInitiative({ Iniciativa: 0 })).toBe(0);
  });
});

describe("getArmorClass", () => {
  it("retorna CA cuando está disponible", () => {
    expect(getArmorClass({ CA: 16 })).toBe(16);
  });

  it("retorna Clase de armadura como fallback", () => {
    expect(getArmorClass({ "Clase de armadura": 14 })).toBe(14);
  });

  it("retorna 0 cuando no hay estadísticas de armadura", () => {
    expect(getArmorClass({})).toBe(0);
  });

  it("retorna al menos 0 (no negativo)", () => {
    expect(getArmorClass({ CA: -5 })).toBe(0);
  });

  it("CA tiene prioridad sobre Clase de armadura", () => {
    expect(getArmorClass({ CA: 18, "Clase de armadura": 14 })).toBe(18);
  });
});

describe("formatStatWithModifier", () => {
  it("retorna solo el valor cuando el modificador es 0", () => {
    expect(formatStatWithModifier(10, 0)).toBe("10");
  });

  it("muestra modificador positivo con signo +", () => {
    expect(formatStatWithModifier(16, 3)).toBe("16(+3)");
  });

  it("muestra modificador negativo sin signo extra", () => {
    expect(formatStatWithModifier(8, -1)).toBe("8(-1)");
  });

  it("funciona con valor 0 y modificador positivo", () => {
    expect(formatStatWithModifier(0, 2)).toBe("0(+2)");
  });
});

// ── Hook: estado inicial ──────────────────────────────────────────────────────

describe("useTokenPanelCharacter - estado inicial", () => {
  beforeEach(() => {
    localStorage.removeItem("jwtToken");
  });

  function setup() {
    const onSendMessage = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useTokenPanelCharacter([], onSendMessage, false),
    );
    return { result, onSendMessage };
  }

  it("detailsByCharacterId empieza vacío", () => {
    const { result } = setup();
    expect(Object.keys(result.current.detailsByCharacterId)).toHaveLength(0);
  });

  it("visibleTokens empieza vacío con array vacío de positions", () => {
    const { result } = setup();
    expect(result.current.visibleTokens).toHaveLength(0);
  });

  it("selectedHealthCharacter empieza en null", () => {
    const { result } = setup();
    expect(result.current.selectedHealthCharacter).toBeNull();
  });

  it("selectedHealthCharacterId empieza en null", () => {
    const { result } = setup();
    expect(result.current.selectedHealthCharacterId).toBeNull();
  });

  it("hpDelta empieza en '0'", () => {
    const { result } = setup();
    expect(result.current.hpDelta).toBe("0");
  });

  it("tempHpDelta empieza en '0'", () => {
    const { result } = setup();
    expect(result.current.tempHpDelta).toBe("0");
  });

  it("healthSaveError empieza en null", () => {
    const { result } = setup();
    expect(result.current.healthSaveError).toBeNull();
  });

  it("isSavingHealth empieza en false", () => {
    const { result } = setup();
    expect(result.current.isSavingHealth).toBe(false);
  });

  it("diceRoller está disponible", () => {
    const { result } = setup();
    expect(result.current.diceRoller).toBeDefined();
  });
});

// ── Hook: setters simples ─────────────────────────────────────────────────────

describe("useTokenPanelCharacter - setters", () => {
  function setup() {
    const onSendMessage = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useTokenPanelCharacter([], onSendMessage, false),
    );
    return { result };
  }

  it("setSelectedHealthCharacterId cambia el ID seleccionado", () => {
    const { result } = setup();
    act(() => {
      result.current.setSelectedHealthCharacterId(42);
    });
    expect(result.current.selectedHealthCharacterId).toBe(42);
  });

  it("setHpDelta cambia el delta de HP", () => {
    const { result } = setup();
    act(() => {
      result.current.setHpDelta("15");
    });
    expect(result.current.hpDelta).toBe("15");
  });

  it("setTempHpDelta cambia el delta de HP temporal", () => {
    const { result } = setup();
    act(() => {
      result.current.setTempHpDelta("5");
    });
    expect(result.current.tempHpDelta).toBe("5");
  });

  it("setHealthSaveError cambia el error", () => {
    const { result } = setup();
    act(() => {
      result.current.setHealthSaveError("Error de prueba");
    });
    expect(result.current.healthSaveError).toBe("Error de prueba");
  });

  it("setHealthSaveError puede limpiar el error a null", () => {
    const { result } = setup();
    act(() => {
      result.current.setHealthSaveError("error");
    });
    act(() => {
      result.current.setHealthSaveError(null);
    });
    expect(result.current.healthSaveError).toBeNull();
  });
});

// ── Hook: visibleTokens con isDM ──────────────────────────────────────────────

describe("useTokenPanelCharacter - visibleTokens", () => {
  const makePosition = (id: number, capa: string, tipo = "personaje") =>
    ({
      id,
      capa,
      tipo,
      personajeId: id,
      posicionX: 0,
      posicionY: 0,
      ancho: 1,
      largo: 1,
      rotation: 0,
    }) as never;

  it("isDM true muestra fichas y dm", () => {
    const positions = [
      makePosition(1, "fichas"),
      makePosition(2, "dm"),
      makePosition(3, "niebla"),
    ];
    const onSendMessage = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useTokenPanelCharacter(positions, onSendMessage, true),
    );
    expect(result.current.visibleTokens).toHaveLength(2);
  });

  it("isDM false solo muestra fichas no enemigas", () => {
    const positions = [
      makePosition(1, "fichas", "personaje"),
      makePosition(2, "fichas", "enemigo"),
      makePosition(3, "dm", "personaje"),
    ];
    const onSendMessage = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useTokenPanelCharacter(positions, onSendMessage, false),
    );
    // Only personaje on fichas layer
    expect(result.current.visibleTokens).toHaveLength(1);
    expect(result.current.visibleTokens[0].id).toBe(1);
  });

  it("adjustHealth no hace nada cuando no hay character seleccionado", async () => {
    const onSendMessage = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useTokenPanelCharacter([], onSendMessage, false),
    );
    await act(async () => {
      await result.current.adjustHealth("heal");
    });
    expect(result.current.isSavingHealth).toBe(false);
  });
});

// ── Hook: CHARACTER_UPDATED_EVENT listener ────────────────────────────────────

describe("useTokenPanelCharacter - CHARACTER_UPDATED_EVENT", () => {
  it("actualiza detailsByCharacterId al recibir el evento", async () => {
    const onSendMessage = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useTokenPanelCharacter([], onSendMessage, false),
    );

    const mockCharacter = {
      id: 42,
      nombre: "Aria",
      retrato: "",
      biografia: null,
      sistemaDeJuego: "Dungeons and Dragons",
      raza: "humano",
      subraza: null,
      clases: [],
      caracteristicaLanzamientoConjuros: null,
      estadisticas: {
        "Vida actual": 30,
        "Vida temporal": 0,
        "Puntos de vida": 50,
      },
      habilidades: [],
      mochila: [],
      usado: "{}",
    };

    act(() => {
      window.dispatchEvent(
        new CustomEvent("fosteria:character-updated", {
          detail: mockCharacter,
        }),
      );
    });

    expect(result.current.detailsByCharacterId[42]).toEqual(mockCharacter);
  });

  it("ignora eventos con detail sin id", async () => {
    const onSendMessage = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useTokenPanelCharacter([], onSendMessage, false),
    );

    act(() => {
      window.dispatchEvent(
        new CustomEvent("fosteria:character-updated", {
          detail: { nombre: "sin id" },
        }),
      );
    });

    expect(Object.keys(result.current.detailsByCharacterId)).toHaveLength(0);
  });
});

// ── Hook: adjustHealth con character seleccionado ─────────────────────────────

describe("useTokenPanelCharacter - adjustHealth", () => {
  beforeEach(() => {
    localStorage.setItem("jwtToken", "test-token");
    vi.mocked(vi.fn()).mockResolvedValue(undefined);
  });

  function setupWithCharacter() {
    const onSendMessage = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useTokenPanelCharacter([], onSendMessage, false),
    );

    const mockCharacter = {
      id: 1,
      nombre: "Aria",
      retrato: "",
      biografia: null,
      sistemaDeJuego: "Dungeons and Dragons",
      raza: "humano",
      subraza: null,
      clases: [],
      caracteristicaLanzamientoConjuros: null,
      estadisticas: {
        "Vida actual": 30,
        "Vida temporal": 5,
        "Puntos de vida": 50,
      },
      habilidades: [],
      mochila: [],
      usado: "{}",
    };

    // Populate character via event
    act(() => {
      window.dispatchEvent(
        new CustomEvent("fosteria:character-updated", {
          detail: mockCharacter,
        }),
      );
    });

    // Select the character
    act(() => {
      result.current.setSelectedHealthCharacterId(1);
    });

    return { result };
  }

  it("heal no hace nada si hpDelta no es positivo", async () => {
    const { result } = setupWithCharacter();
    act(() => {
      result.current.setHpDelta("0");
    });
    await act(async () => {
      await result.current.adjustHealth("heal");
    });
    expect(result.current.isSavingHealth).toBe(false);
  });

  it("heal aplica curación con un hpDelta positivo", async () => {
    const { result } = setupWithCharacter();
    act(() => {
      result.current.setHpDelta("10");
    });
    await act(async () => {
      await result.current.adjustHealth("heal");
    });
    // After heal, character's vida actual should be updated
    expect(result.current.isSavingHealth).toBe(false);
  });

  it("damage no hace nada si hpDelta no es positivo", async () => {
    const { result } = setupWithCharacter();
    act(() => {
      result.current.setHpDelta("0");
    });
    await act(async () => {
      await result.current.adjustHealth("damage");
    });
    expect(result.current.isSavingHealth).toBe(false);
  });

  it("damage aplica daño con un hpDelta positivo", async () => {
    const { result } = setupWithCharacter();
    act(() => {
      result.current.setHpDelta("5");
    });
    await act(async () => {
      await result.current.adjustHealth("damage");
    });
    expect(result.current.isSavingHealth).toBe(false);
  });

  it("tempGain no hace nada si tempHpDelta no es positivo", async () => {
    const { result } = setupWithCharacter();
    act(() => {
      result.current.setTempHpDelta("0");
    });
    await act(async () => {
      await result.current.adjustHealth("tempGain");
    });
    expect(result.current.isSavingHealth).toBe(false);
  });

  it("tempGain aplica HP temporal con valor positivo", async () => {
    const { result } = setupWithCharacter();
    act(() => {
      result.current.setTempHpDelta("3");
    });
    await act(async () => {
      await result.current.adjustHealth("tempGain");
    });
    expect(result.current.isSavingHealth).toBe(false);
  });

  it("tempLose no hace nada si tempHpDelta no es positivo", async () => {
    const { result } = setupWithCharacter();
    act(() => {
      result.current.setTempHpDelta("0");
    });
    await act(async () => {
      await result.current.adjustHealth("tempLose");
    });
    expect(result.current.isSavingHealth).toBe(false);
  });

  it("tempLose reduce HP temporal con valor positivo", async () => {
    const { result } = setupWithCharacter();
    act(() => {
      result.current.setTempHpDelta("3");
    });
    await act(async () => {
      await result.current.adjustHealth("tempLose");
    });
    expect(result.current.isSavingHealth).toBe(false);
  });

  it("sin token setea healthSaveError", async () => {
    localStorage.removeItem("jwtToken");
    const { result } = setupWithCharacter();
    act(() => {
      result.current.setHpDelta("10");
    });
    await act(async () => {
      await result.current.adjustHealth("heal");
    });
    expect(result.current.healthSaveError).toBeTruthy();
  });
});

// ── Dice roller summary effect ────────────────────────────────────────────────

describe("useTokenPanelCharacter - dice roller summary", () => {
  beforeEach(() => {
    localStorage.setItem("jwtToken", "token");
  });

  it("llama onSendMessage cuando summary cambia", async () => {
    const { useDiceRoller } =
      await import("../../../components/dice/useDiceRoller");
    const onSendMessage = vi.fn().mockResolvedValue(undefined);
    const fakeSummary = {
      id: 42,
      title: "Tirada de Fuerza",
      expression: "1d20+2",
      diceValues: [15],
      modifier: 2,
      total: 17,
    };

    vi.mocked(useDiceRoller).mockReturnValue({
      summary: fakeSummary,
      roll: vi.fn(),
      clearSummary: vi.fn(),
      diceBoxHostId: "host",
      diceBoxError: null,
      isRolling: false,
      rollD20Check: vi.fn(),
      rollExpression: vi.fn(),
      rollDicePool: vi.fn(),
      rollExpressionsSequence: vi.fn(),
      dismissSummary: vi.fn(),
      rollTwoD20ForAdvantage: vi.fn(),
      formatModifier: vi.fn(),
    } as never);

    renderHook(() => useTokenPanelCharacter([], onSendMessage, false));

    await act(async () => {});
    expect(onSendMessage).toHaveBeenCalled();

    // Reset mock
    vi.mocked(useDiceRoller).mockReturnValue({
      summary: null,
      roll: vi.fn(),
      clearSummary: vi.fn(),
      diceBoxHostId: "host",
      diceBoxError: null,
      isRolling: false,
      rollD20Check: vi.fn(),
      rollExpression: vi.fn(),
      rollDicePool: vi.fn(),
      rollExpressionsSequence: vi.fn(),
      dismissSummary: vi.fn(),
      rollTwoD20ForAdvantage: vi.fn(),
      formatModifier: vi.fn(),
    } as never);
  });
});
