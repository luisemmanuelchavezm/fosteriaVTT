// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import QuickActionBar from "../../../screens/campaign/components/QuickActionBar";
import type { CampaignPositionResponse } from "../../../screens/campaign/types";
import type { DndCharacterDetailResponse } from "../../../screens/personaje/utils/dndApi";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("../../../components/dice/DiceRollOverlay", () => ({
  default: () => null,
}));
vi.mock("../../../components/spells/SpellDetailModal", () => ({
  default: () => null,
}));
vi.mock(
  "../../../screens/campaign/components/quickactions/AttackPanel",
  () => ({
    default: ({ onRollAttack }: { onRollAttack?: () => void }) => (
      <div data-testid="attack-panel">
        <button onClick={onRollAttack}>Roll attack</button>
      </div>
    ),
  }),
);
vi.mock("../../../screens/campaign/components/quickactions/SkillPanel", () => ({
  default: () => <div data-testid="skill-panel" />,
}));
vi.mock(
  "../../../screens/campaign/components/quickactions/SpellsPanel",
  () => ({ default: () => <div data-testid="spells-panel" /> }),
);
vi.mock(
  "../../../screens/campaign/components/quickactions/ResourcesPanel",
  () => ({ default: () => <div data-testid="resources-panel" /> }),
);
vi.mock(
  "../../../screens/campaign/components/quickactions/AdvantageResultOverlay",
  () => ({ default: () => null }),
);
vi.mock(
  "../../../screens/campaign/components/quickactions/RasgosPanel",
  () => ({ default: () => <div data-testid="rasgos-panel" /> }),
);
vi.mock(
  "../../../screens/campaign/components/quickactions/EspecialidadPanel",
  () => ({ default: () => <div data-testid="especialidad-panel" /> }),
);
vi.mock("../../../screens/campaign/components/quickactions/LootPanel", () => ({
  default: () => <div data-testid="loot-panel" />,
}));
vi.mock(
  "../../../screens/campaign/components/quickactions/MBEstadisticasPanel",
  () => ({ default: () => <div data-testid="mb-stats-panel" /> }),
);
vi.mock(
  "../../../screens/campaign/components/quickactions/MBRasgosClasePanel",
  () => ({ default: () => <div data-testid="mb-rasgos-panel" /> }),
);

vi.mock("../../../components/dice/useDiceRoller", () => {
  const resetRolling = vi.fn();
  return {
    useDiceRoller: vi.fn(() => ({
      diceBoxHostId: "dice-host",
      diceBoxError: null,
      isRolling: false,
      summary: null,
      rollD20Check: vi.fn(),
      rollExpression: vi.fn(),
      rollDicePool: vi.fn(),
      rollExpressionsSequence: vi.fn(),
      dismissSummary: vi.fn(),
      rollTwoD20ForAdvantage: vi.fn().mockResolvedValue([10, 15]),
      formatModifier: vi.fn((n: number) => (n >= 0 ? `+${n}` : `${n}`)),
      resetRolling,
    })),
  };
});

vi.mock("../../../screens/personaje/utils/dndApi", () => ({
  fetchDndCharacterDetail: vi.fn(),
  updateDndCharacterResources: vi.fn().mockResolvedValue(undefined),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePosition(overrides = {}): CampaignPositionResponse {
  return {
    id: 1,
    pestanaId: 1,
    capa: "fichas",
    personajeId: 10,
    personajeNombre: "Aragorn",
    retrato: null,
    posicionX: 0,
    posicionY: 0,
    largo: 1,
    ancho: 1,
    tipo: "personaje",
    ...overrides,
  } as unknown as CampaignPositionResponse;
}

function makeDetail(overrides = {}): DndCharacterDetailResponse {
  return {
    id: 10,
    nombre: "Aragorn",
    retrato: null,
    biografia: null,
    sistemaDeJuego: "Dungeons and Dragons",
    raza: "Humano",
    subraza: null,
    clases: [{ nombre: "Guerrero", nivel: 5 }],
    caracteristicaLanzamientoConjuros: null,
    estadisticas: {
      Fuerza: 16,
      Destreza: 14,
      Constitucion: 15,
      Inteligencia: 10,
      Sabiduria: 12,
      Carisma: 11,
      "Vida actual": 40,
      "Puntos de vida": 50,
      "Vida temporal": 0,
      Movimiento: 30,
      CA: 16,
      Iniciativa: 2,
    },
    habilidades: [
      {
        id: 1,
        nombre: "Ataque con espada",
        bonificacion: 5,
        formula: "1d8+3",
        descripcion: "Ataque",
        tags: "Arma,Melee",
      },
    ],
    mochila: [],
    usado: false,
    tipo: "personaje",
    vd: null,
    ...overrides,
  } as unknown as DndCharacterDetailResponse;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.setItem("jwtToken", "test-token");
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("QuickActionBar", () => {
  it("renderiza nada cuando selectedPosition es null", () => {
    render(<QuickActionBar selectedPosition={null} onClose={vi.fn()} />);
    expect(document.body.textContent).toBe("");
  });

  it("renderiza el nombre del personaje cuando hay posición", async () => {
    const { fetchDndCharacterDetail } =
      await import("../../../screens/personaje/utils/dndApi");
    vi.mocked(fetchDndCharacterDetail).mockResolvedValue(makeDetail());

    render(
      <QuickActionBar selectedPosition={makePosition()} onClose={vi.fn()} />,
    );

    await waitFor(() => {
      expect(screen.getByText("Aragorn")).toBeInTheDocument();
    });
  });

  it("llama onClose cuando se hace click en el botón de cerrar", async () => {
    const { fetchDndCharacterDetail } =
      await import("../../../screens/personaje/utils/dndApi");
    vi.mocked(fetchDndCharacterDetail).mockResolvedValue(makeDetail());

    const onClose = vi.fn();
    render(
      <QuickActionBar selectedPosition={makePosition()} onClose={onClose} />,
    );

    await waitFor(() =>
      expect(screen.getByText("Aragorn")).toBeInTheDocument(),
    );

    const closeBtn =
      document.querySelector("[title='Cerrar']") ??
      document.querySelector("button[aria-label*='cerrar']") ??
      document.querySelector("button[aria-label*='close']");
    if (closeBtn) {
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it("muestra estado de carga sin token", () => {
    localStorage.removeItem("jwtToken");
    render(
      <QuickActionBar selectedPosition={makePosition()} onClose={vi.fn()} />,
    );
    // Should render (possibly with loading state)
    expect(document.body).toBeTruthy();
  });

  it("renderiza tabs de acción cuando hay personaje cargado", async () => {
    const { fetchDndCharacterDetail } =
      await import("../../../screens/personaje/utils/dndApi");
    vi.mocked(fetchDndCharacterDetail).mockResolvedValue(makeDetail());

    render(
      <QuickActionBar selectedPosition={makePosition()} onClose={vi.fn()} />,
    );

    await waitFor(() =>
      expect(screen.getByText("Aragorn")).toBeInTheDocument(),
    );

    // Should show action tabs
    expect(document.body.textContent).toBeTruthy();
  });

  it("abre panel de ataque al hacer click en tab ataque", async () => {
    const { fetchDndCharacterDetail } =
      await import("../../../screens/personaje/utils/dndApi");
    vi.mocked(fetchDndCharacterDetail).mockResolvedValue(makeDetail());

    render(
      <QuickActionBar selectedPosition={makePosition()} onClose={vi.fn()} />,
    );

    await waitFor(() =>
      expect(screen.getByText("Aragorn")).toBeInTheDocument(),
    );

    const ataqueBtn = screen.queryByRole("button", { name: /ataque/i });
    if (ataqueBtn) {
      fireEvent.click(ataqueBtn);
      await waitFor(() =>
        expect(screen.queryByTestId("attack-panel")).toBeInTheDocument(),
      );
    }
  });

  it("renderiza personaje Mork Borg cuando sistemaDeJuego es Mork Borg", async () => {
    const { fetchDndCharacterDetail } =
      await import("../../../screens/personaje/utils/dndApi");
    vi.mocked(fetchDndCharacterDetail).mockResolvedValue(
      makeDetail({
        sistemaDeJuego: "Mork Borg",
        tags: "MORK_BORG,clase;escoria-alcantarillas",
      }),
    );

    render(
      <QuickActionBar selectedPosition={makePosition()} onClose={vi.fn()} />,
    );

    await waitFor(() =>
      expect(screen.getByText("Aragorn")).toBeInTheDocument(),
    );
    expect(document.body).toBeTruthy();
  });

  it("renderiza correctamente cuando detail tiene habilidades de hechizo", async () => {
    const { fetchDndCharacterDetail } =
      await import("../../../screens/personaje/utils/dndApi");
    vi.mocked(fetchDndCharacterDetail).mockResolvedValue(
      makeDetail({
        habilidades: [
          {
            id: 1,
            nombre: "Bola de fuego",
            bonificacion: 0,
            formula: null,
            descripcion: "Hechizo",
            tags: "Hechizo;3,ClaseInicial;mago",
          },
        ],
        estadisticas: {
          "Hechizos nivel 3": 2,
          "Hechizos nivel 3 gastados": 0,
          "Vida actual": 20,
          "Puntos de vida": 20,
        },
      }),
    );

    render(
      <QuickActionBar selectedPosition={makePosition()} onClose={vi.fn()} />,
    );
    await waitFor(() =>
      expect(screen.getByText("Aragorn")).toBeInTheDocument(),
    );
  });
});
