// @vitest-environment jsdom
import { render, screen, fireEvent, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import CharacterTokenPanel from "../../../screens/campaign/components/CharacterTokenPanel";
import type {
  CampaignPositionResponse,
  CampaignChatMessage,
} from "../../../screens/campaign/types";
import type { DndCharacterDetailResponse } from "../../../screens/personaje/utils/dndApi";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("../../../components/dice/DiceRollOverlay", () => ({
  default: () => null,
}));

vi.mock(
  "../../../screens/campaign/components/panel/TokenCharacterCard",
  () => ({
    default: ({
      token,
      onSelectHealthCharacter,
    }: {
      token: CampaignPositionResponse;
      onSelectHealthCharacter?: (id: number) => void;
    }) => (
      <div data-testid={`token-card-${token.personajeId}`}>
        <span>{token.personajeNombre}</span>
        {onSelectHealthCharacter && (
          <button onClick={() => onSelectHealthCharacter(token.personajeId)}>
            HP
          </button>
        )}
      </div>
    ),
  }),
);

vi.mock("../../../screens/campaign/components/panel/HpModal", () => ({
  default: ({
    onClose,
    character,
  }: {
    onClose: () => void;
    character: DndCharacterDetailResponse;
  }) => (
    <div data-testid="hp-modal">
      <span>HP Modal: {character.nombre}</span>
      <button onClick={onClose}>Cerrar</button>
    </div>
  ),
}));

const mockDiceRoller = {
  summary: null,
  isRolling: false,
  diceBoxHostId: "dice-box",
  diceBoxError: null,
  rollExpression: vi.fn(),
  rollD20Check: vi.fn(),
  rollAttack: vi.fn(),
  rollSkill: vi.fn(),
  rollSave: vi.fn(),
  rollSpellAttack: vi.fn(),
  castSpell: vi.fn(),
};

const mockUseTokenPanelCharacter = {
  detailsByCharacterId: {} as Record<number, DndCharacterDetailResponse>,
  visibleTokens: [] as CampaignPositionResponse[],
  selectedHealthCharacter: null as DndCharacterDetailResponse | null,
  selectedHealthCharacterId: null as number | null,
  setSelectedHealthCharacterId: vi.fn(),
  hpDelta: "0",
  setHpDelta: vi.fn(),
  tempHpDelta: "0",
  setTempHpDelta: vi.fn(),
  healthSaveError: null as string | null,
  setHealthSaveError: vi.fn(),
  isSavingHealth: false,
  adjustHealth: vi.fn(),
  diceRoller: mockDiceRoller,
};

vi.mock("../../../screens/campaign/hooks/useTokenPanelCharacter", () => ({
  useTokenPanelCharacter: vi.fn(() => mockUseTokenPanelCharacter),
  getMaxHp: vi.fn(() => 50),
  clampPercentage: vi.fn((v: number) => v),
  getInitiative: vi.fn(() => 2),
  getArmorClass: vi.fn(() => 16),
  formatStatWithModifier: vi.fn((v: number) => String(v)),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makePosition = (
  overrides: Partial<CampaignPositionResponse> = {},
): CampaignPositionResponse => ({
  id: 1,
  pestanaId: 1,
  capa: "fichas",
  personajeId: 10,
  personajeNombre: "Aragorn",
  retrato: undefined,
  posicionX: 0,
  posicionY: 0,
  largo: 1,
  ancho: 1,
  tipo: "personaje",
  ...overrides,
});

const makeDetail = (
  overrides: Partial<DndCharacterDetailResponse> = {},
): DndCharacterDetailResponse =>
  ({
    id: 10,
    nombre: "Aragorn",
    retrato: null,
    biografia: null,
    sistemaDeJuego: "Dungeons and Dragons",
    raza: "Humano",
    subraza: null,
    clases: [],
    estadisticas: {
      Fuerza: 16,
      Destreza: 14,
      Constitucion: 15,
      Inteligencia: 10,
      Sabiduria: 12,
      Carisma: 11,
      "Vida actual": 40,
      "Vida maxima": 50,
      "Vida temporal": 0,
      Movimiento: 30,
      CA: 16,
      Iniciativa: 2,
    },
    habilidades: [],
    mochila: [],
    usado: false,
    tipo: "personaje",
    vd: null,
    ...overrides,
  }) as unknown as DndCharacterDetailResponse;

const makeMessage = (
  overrides: Partial<CampaignChatMessage> = {},
): CampaignChatMessage => ({
  id: 1,
  username: "player1",
  mensaje: "Hola",
  enviadoEn: "2024-01-01T10:00:00Z",
  ...overrides,
});

const DEFAULT_PROPS = {
  positions: [],
  isDM: false,
  chatMessages: [],
  onSendMessage: vi.fn().mockResolvedValue(undefined),
};

beforeEach(() => {
  vi.clearAllMocks();
  // Reset mock state
  mockUseTokenPanelCharacter.visibleTokens = [];
  mockUseTokenPanelCharacter.detailsByCharacterId = {};
  mockUseTokenPanelCharacter.selectedHealthCharacter = null;
  mockUseTokenPanelCharacter.selectedHealthCharacterId = null;
  DEFAULT_PROPS.onSendMessage = vi.fn().mockResolvedValue(undefined);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("CharacterTokenPanel", () => {
  // ── Basic rendering ────────────────────────────────────────────────────────

  it("renders Personajes tab", () => {
    render(<CharacterTokenPanel {...DEFAULT_PROPS} />);
    expect(screen.getByText("Personajes")).toBeInTheDocument();
  });

  it("renders Chat tab button", () => {
    render(<CharacterTokenPanel {...DEFAULT_PROPS} />);
    expect(screen.getByText("Chat")).toBeInTheDocument();
  });

  it("renders toggle button with title 'Ocultar panel'", () => {
    render(<CharacterTokenPanel {...DEFAULT_PROPS} />);
    expect(screen.getByTitle("Ocultar panel")).toBeInTheDocument();
  });

  it("shows 'No hay fichas en el tablero.' when no tokens", () => {
    render(<CharacterTokenPanel {...DEFAULT_PROPS} />);
    expect(
      screen.getByText("No hay fichas en el tablero."),
    ).toBeInTheDocument();
  });

  // ── DM-specific buttons ────────────────────────────────────────────────────

  it("shows folder button for DM", () => {
    render(<CharacterTokenPanel {...DEFAULT_PROPS} isDM />);
    expect(screen.getByTitle("Cambiar pestaña")).toBeInTheDocument();
  });

  it("does not show folder button for non-DM", () => {
    render(<CharacterTokenPanel {...DEFAULT_PROPS} isDM={false} />);
    expect(screen.queryByTitle("Cambiar pestaña")).not.toBeInTheDocument();
  });

  it("shows 'Teatro de la mente' button when onBack is provided", () => {
    render(<CharacterTokenPanel {...DEFAULT_PROPS} onBack={vi.fn()} />);
    expect(screen.getByTitle("Teatro de la mente")).toBeInTheDocument();
  });

  it("does not show 'Teatro de la mente' when onBack is not provided", () => {
    render(<CharacterTokenPanel {...DEFAULT_PROPS} />);
    expect(screen.queryByTitle("Teatro de la mente")).not.toBeInTheDocument();
  });

  it("shows 'Salir' button when onExit is provided", () => {
    render(<CharacterTokenPanel {...DEFAULT_PROPS} onExit={vi.fn()} />);
    expect(screen.getByTitle("Salir")).toBeInTheDocument();
  });

  it("calls onTabSwitcherToggle when folder button is clicked", () => {
    const onTabSwitcherToggle = vi.fn();
    render(
      <CharacterTokenPanel
        {...DEFAULT_PROPS}
        isDM
        onTabSwitcherToggle={onTabSwitcherToggle}
      />,
    );
    fireEvent.click(screen.getByTitle("Cambiar pestaña"));
    expect(onTabSwitcherToggle).toHaveBeenCalled();
  });

  it("calls onBack when back button is clicked", () => {
    const onBack = vi.fn();
    render(<CharacterTokenPanel {...DEFAULT_PROPS} onBack={onBack} />);
    fireEvent.click(screen.getByTitle("Teatro de la mente"));
    expect(onBack).toHaveBeenCalled();
  });

  it("calls onExit when exit button is clicked", () => {
    const onExit = vi.fn();
    render(<CharacterTokenPanel {...DEFAULT_PROPS} onExit={onExit} />);
    fireEvent.click(screen.getByTitle("Salir"));
    expect(onExit).toHaveBeenCalled();
  });

  // ── Panel toggle ───────────────────────────────────────────────────────────

  it("toggles panel on toggle button click", () => {
    render(<CharacterTokenPanel {...DEFAULT_PROPS} />);
    const toggleBtn = screen.getByTitle("Ocultar panel");
    fireEvent.click(toggleBtn);
    expect(screen.getByTitle("Mostrar panel")).toBeInTheDocument();
  });

  // ── Character sections ─────────────────────────────────────────────────────

  it("renders character token cards when visibleTokens has personajes", () => {
    const token = makePosition({
      personajeId: 10,
      personajeNombre: "Aragorn",
      tipo: "personaje",
    });
    mockUseTokenPanelCharacter.visibleTokens = [token];
    mockUseTokenPanelCharacter.detailsByCharacterId = {
      10: makeDetail({ tipo: "personaje" }),
    };
    render(<CharacterTokenPanel {...DEFAULT_PROPS} />);
    expect(screen.getByText("Aragorn")).toBeInTheDocument();
  });

  it("renders 'Personajes (1)' section header when one personaje is present", () => {
    const token = makePosition({ personajeId: 10, tipo: "personaje" });
    mockUseTokenPanelCharacter.visibleTokens = [token];
    mockUseTokenPanelCharacter.detailsByCharacterId = {
      10: makeDetail({ tipo: "personaje" }),
    };
    render(<CharacterTokenPanel {...DEFAULT_PROPS} />);
    expect(screen.getByText("Personajes (1)")).toBeInTheDocument();
  });

  it("renders 'Enemigos (1)' section header when one enemigo is present", () => {
    const token = makePosition({
      personajeId: 20,
      personajeNombre: "Goblin",
      tipo: "enemigo",
    });
    mockUseTokenPanelCharacter.visibleTokens = [token];
    mockUseTokenPanelCharacter.detailsByCharacterId = {
      20: makeDetail({ id: 20, nombre: "Goblin", tipo: "enemigo" }),
    };
    render(<CharacterTokenPanel {...DEFAULT_PROPS} />);
    expect(screen.getByText("Enemigos (1)")).toBeInTheDocument();
  });

  it("renders 'PNJ (1)' section header when one pnj is present", () => {
    const token = makePosition({
      personajeId: 30,
      personajeNombre: "Tabernero",
      tipo: "pnj",
    });
    mockUseTokenPanelCharacter.visibleTokens = [token];
    mockUseTokenPanelCharacter.detailsByCharacterId = {
      30: makeDetail({ id: 30, nombre: "Tabernero", tipo: "pnj" }),
    };
    render(<CharacterTokenPanel {...DEFAULT_PROPS} />);
    expect(screen.getByText("PNJ (1)")).toBeInTheDocument();
  });

  it("collapses section when section header is clicked", () => {
    const token = makePosition({
      personajeId: 10,
      personajeNombre: "Aragorn",
      tipo: "personaje",
    });
    mockUseTokenPanelCharacter.visibleTokens = [token];
    mockUseTokenPanelCharacter.detailsByCharacterId = {
      10: makeDetail({ tipo: "personaje" }),
    };
    render(<CharacterTokenPanel {...DEFAULT_PROPS} />);
    // Token is visible initially
    expect(screen.getByText("Aragorn")).toBeInTheDocument();
    // Click section header to collapse
    fireEvent.click(screen.getByText("Personajes (1)"));
    // Token should be hidden (not rendered)
    expect(screen.queryByText("Aragorn")).not.toBeInTheDocument();
  });

  // ── Chat tab ───────────────────────────────────────────────────────────────

  it("switches to Chat tab when Chat is clicked", () => {
    render(<CharacterTokenPanel {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByText("Chat"));
    expect(
      screen.getByPlaceholderText("Escribe un mensaje"),
    ).toBeInTheDocument();
  });

  it("shows 'No hay mensajes todavía.' in chat when messages is empty", () => {
    render(<CharacterTokenPanel {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByText("Chat"));
    expect(screen.getByText("No hay mensajes todavía.")).toBeInTheDocument();
  });

  it("renders chat messages", () => {
    render(
      <CharacterTokenPanel
        {...DEFAULT_PROPS}
        chatMessages={[makeMessage({ mensaje: "¡Al ataque!" })]}
      />,
    );
    fireEvent.click(screen.getByText("Chat"));
    expect(screen.getByText("¡Al ataque!")).toBeInTheDocument();
  });

  it("sends chat message on Enter", async () => {
    const onSendMessage = vi.fn().mockResolvedValue(undefined);
    render(
      <CharacterTokenPanel {...DEFAULT_PROPS} onSendMessage={onSendMessage} />,
    );
    fireEvent.click(screen.getByText("Chat"));
    const input = screen.getByPlaceholderText("Escribe un mensaje");
    fireEvent.change(input, { target: { value: "Hola DM" } });
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter", shiftKey: false });
    });
    expect(onSendMessage).toHaveBeenCalledWith("Hola DM");
  });

  it("does not send empty chat message", async () => {
    const onSendMessage = vi.fn().mockResolvedValue(undefined);
    render(
      <CharacterTokenPanel {...DEFAULT_PROPS} onSendMessage={onSendMessage} />,
    );
    fireEvent.click(screen.getByText("Chat"));
    await act(async () => {
      fireEvent.keyDown(screen.getByPlaceholderText("Escribe un mensaje"), {
        key: "Enter",
        shiftKey: false,
      });
    });
    expect(onSendMessage).not.toHaveBeenCalled();
  });

  it("shows chat error when onSendMessage rejects", async () => {
    const onSendMessage = vi.fn().mockRejectedValue(new Error("Error de red"));
    render(
      <CharacterTokenPanel {...DEFAULT_PROPS} onSendMessage={onSendMessage} />,
    );
    fireEvent.click(screen.getByText("Chat"));
    const input = screen.getByPlaceholderText("Escribe un mensaje");
    fireEvent.change(input, { target: { value: "hola" } });
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter", shiftKey: false });
    });
    expect(screen.getByText("Error de red")).toBeInTheDocument();
  });

  // ── HP Modal ───────────────────────────────────────────────────────────────

  it("shows HP Modal when selectedHealthCharacter is set", () => {
    mockUseTokenPanelCharacter.selectedHealthCharacter = makeDetail({
      nombre: "Legolas",
    });
    render(<CharacterTokenPanel {...DEFAULT_PROPS} />);
    expect(screen.getByTestId("hp-modal")).toBeInTheDocument();
    expect(screen.getByText("HP Modal: Legolas")).toBeInTheDocument();
  });

  it("does not show HP Modal when selectedHealthCharacter is null", () => {
    mockUseTokenPanelCharacter.selectedHealthCharacter = null;
    render(<CharacterTokenPanel {...DEFAULT_PROPS} />);
    expect(screen.queryByTestId("hp-modal")).not.toBeInTheDocument();
  });

  it("calls setSelectedHealthCharacterId(null) when HP modal is closed", () => {
    mockUseTokenPanelCharacter.selectedHealthCharacter = makeDetail({
      nombre: "Gimli",
    });
    render(<CharacterTokenPanel {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByText("Cerrar"));
    expect(
      mockUseTokenPanelCharacter.setSelectedHealthCharacterId,
    ).toHaveBeenCalledWith(null);
  });
});
