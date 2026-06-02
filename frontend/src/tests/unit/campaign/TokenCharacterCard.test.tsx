// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import TokenCharacterCard from "../../../screens/campaign/components/panel/TokenCharacterCard";
import type { CampaignPositionResponse } from "../../../screens/campaign/types";
import type { DndCharacterDetailResponse } from "../../../screens/personaje/utils/dndApi";

// ─── Stubs ────────────────────────────────────────────────────────────────────

const makeDiceRoller = () => ({
  diceBoxHostId: "test-host",
  diceBoxError: null,
  isDiceBoxReady: false,
  isRolling: false,
  summary: null,
  rollD20Check: vi.fn(),
  rollExpression: vi.fn(),
  rollDicePool: vi.fn(),
  rollExpressionsSequence: vi.fn(),
  dismissSummary: vi.fn(),
  rollTwoD20ForAdvantage: vi
    .fn()
    .mockResolvedValue([10, 15] as [number, number]),
  formatModifier: vi.fn(),
});

const makeToken = (overrides = {}): CampaignPositionResponse =>
  ({
    id: 1,
    personajeId: 10,
    personajeNombre: "Aragorn",
    retrato: null,
    x: 5,
    y: 3,
    campaignId: 1,
    ...overrides,
  }) as unknown as CampaignPositionResponse;

const makeDetail = (
  overrides: Partial<DndCharacterDetailResponse["estadisticas"]> = {},
): DndCharacterDetailResponse =>
  ({
    id: 10,
    nombre: "Aragorn",
    retrato: null,
    biografia: null,
    sistemaDeJuego: "Dungeons and Dragons",
    raza: "Humano",
    subraza: null,
    clases: [{ id: "fighter", nombre: "Guerrero", nivel: 5, subclase: null }],
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
      ...overrides,
    },
    habilidades: [],
    mochila: [],
    usado: false,
    tipo: "PJ",
    vd: null,
  }) as unknown as DndCharacterDetailResponse;

const DEFAULT_PROPS = {
  token: makeToken(),
  detail: makeDetail(),
  articleCls: "border-white/10 bg-black/30",
  portraitCls: "border-white/20",
  iniciativaActiva: false,
  diceRoller: makeDiceRoller(),
  onSelectHealthCharacter: vi.fn(),
};

describe("TokenCharacterCard", () => {
  // ── Basic rendering ───────────────────────────────────────────────────────

  it("renders character name from detail", () => {
    render(<TokenCharacterCard {...DEFAULT_PROPS} />);
    expect(screen.getByText("Aragorn")).toBeInTheDocument();
  });

  it("renders character name from token when detail is undefined", () => {
    render(<TokenCharacterCard {...DEFAULT_PROPS} detail={undefined} />);
    expect(screen.getByText("Aragorn")).toBeInTheDocument();
  });

  it("renders HP bar showing currentHp/maxHp", () => {
    render(<TokenCharacterCard {...DEFAULT_PROPS} />);
    expect(screen.getByText("40/50")).toBeInTheDocument();
  });

  it("renders 0/maxHp when vida actual is 0", () => {
    render(
      <TokenCharacterCard
        {...DEFAULT_PROPS}
        detail={makeDetail({ "Vida actual": 0, "Vida maxima": 50 })}
      />,
    );
    expect(screen.getByText("0/50")).toBeInTheDocument();
  });

  it("renders CA stat", () => {
    render(<TokenCharacterCard {...DEFAULT_PROPS} />);
    expect(screen.getByText("CA")).toBeInTheDocument();
    expect(screen.getByText("16")).toBeInTheDocument();
  });

  it("renders MOV stat", () => {
    render(<TokenCharacterCard {...DEFAULT_PROPS} />);
    expect(screen.getByText("MOV")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
  });

  it("renders INI stat", () => {
    render(<TokenCharacterCard {...DEFAULT_PROPS} />);
    expect(screen.getByText("INI")).toBeInTheDocument();
  });

  it("renders six ability stat abbreviations", () => {
    render(<TokenCharacterCard {...DEFAULT_PROPS} />);
    expect(screen.getByText("Fue")).toBeInTheDocument();
    expect(screen.getByText("Des")).toBeInTheDocument();
    expect(screen.getByText("Con")).toBeInTheDocument();
    expect(screen.getByText("Int")).toBeInTheDocument();
    expect(screen.getByText("Sab")).toBeInTheDocument();
    expect(screen.getByText("Car")).toBeInTheDocument();
  });

  // ── Callbacks ─────────────────────────────────────────────────────────────

  it("calls onSelectHealthCharacter when HP bar is clicked", () => {
    const onSelectHealthCharacter = vi.fn();
    render(
      <TokenCharacterCard
        {...DEFAULT_PROPS}
        onSelectHealthCharacter={onSelectHealthCharacter}
      />,
    );
    fireEvent.click(screen.getByTitle("Gestionar puntos de vida"));
    expect(onSelectHealthCharacter).toHaveBeenCalledWith(10);
  });

  it("calls onOpenCharacterSheet when portrait button is clicked", () => {
    const onOpenCharacterSheet = vi.fn();
    render(
      <TokenCharacterCard
        {...DEFAULT_PROPS}
        onOpenCharacterSheet={onOpenCharacterSheet}
      />,
    );
    const portraitBtn = screen.getByTitle(
      "Abrir hoja de personaje (click derecho → opciones)",
    );
    fireEvent.click(portraitBtn);
    expect(onOpenCharacterSheet).toHaveBeenCalledWith(
      10,
      "Dungeons and Dragons",
    );
  });

  it("calls onTokenSelect when portrait button is clicked", () => {
    const onTokenSelect = vi.fn();
    render(
      <TokenCharacterCard {...DEFAULT_PROPS} onTokenSelect={onTokenSelect} />,
    );
    const portraitBtn = screen.getByTitle(
      "Abrir hoja de personaje (click derecho → opciones)",
    );
    fireEvent.click(portraitBtn);
    expect(onTokenSelect).toHaveBeenCalledWith(1);
  });

  it("calls diceRoller.rollD20Check when an ability stat button is clicked", () => {
    const diceRoller = makeDiceRoller();
    render(<TokenCharacterCard {...DEFAULT_PROPS} diceRoller={diceRoller} />);
    // Click Fuerza stat
    const fuerza = screen.getByTitle("Tirar Fuerza");
    fireEvent.click(fuerza);
    expect(diceRoller.rollD20Check).toHaveBeenCalled();
  });

  it("calls onTirarIniciativa when INI button is clicked with iniciativaActiva", () => {
    const onTirarIniciativa = vi.fn();
    render(
      <TokenCharacterCard
        {...DEFAULT_PROPS}
        iniciativaActiva
        onTirarIniciativa={onTirarIniciativa}
      />,
    );
    const iniciativaBtn = screen.getByTitle("Tirar iniciativa");
    fireEvent.click(iniciativaBtn);
    expect(onTirarIniciativa).toHaveBeenCalledWith(10, "Aragorn", null, 2);
  });

  // ── Temp HP ───────────────────────────────────────────────────────────────

  it("shows temp HP section when tempHp > 0", () => {
    render(
      <TokenCharacterCard
        {...DEFAULT_PROPS}
        detail={makeDetail({ "Vida temporal": 8 })}
      />,
    );
    expect(screen.getByText("Temporal")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("does not show temp HP section when tempHp is 0", () => {
    render(<TokenCharacterCard {...DEFAULT_PROPS} />);
    expect(screen.queryByText("Temporal")).not.toBeInTheDocument();
  });

  // ── Retrato ───────────────────────────────────────────────────────────────

  it("renders portrait image when detail has retrato", () => {
    render(
      <TokenCharacterCard
        {...DEFAULT_PROPS}
        detail={makeDetail()}
        token={makeToken({ retrato: "http://example.com/portrait.png" })}
      />,
    );
    // portrait is shown from token.retrato when detail.retrato is null
    const img = screen.getByRole("img");
    expect(img).toBeTruthy();
  });

  // ── Context menu ──────────────────────────────────────────────────────────

  it("calls onTokenRightClick when portrait is right-clicked", () => {
    const onTokenRightClick = vi.fn();
    render(
      <TokenCharacterCard
        {...DEFAULT_PROPS}
        onTokenRightClick={onTokenRightClick}
      />,
    );
    const btn = screen.getByTitle(
      "Abrir hoja de personaje (click derecho → opciones)",
    );
    fireEvent.contextMenu(btn, { clientX: 100, clientY: 200 });
    expect(onTokenRightClick).toHaveBeenCalledWith(1, 100, 200);
  });

  // ── Iniciativa in active mode ─────────────────────────────────────────────

  it("shows INI value as text (not button) when iniciativaActiva is false", () => {
    render(<TokenCharacterCard {...DEFAULT_PROPS} iniciativaActiva={false} />);
    expect(screen.queryByTitle("Tirar iniciativa")).not.toBeInTheDocument();
  });

  it("highlights INI button when character has already rolled iniciativa", () => {
    render(
      <TokenCharacterCard
        {...DEFAULT_PROPS}
        iniciativaActiva
        onTirarIniciativa={vi.fn()}
        personajesConIniciativa={new Set([10])}
      />,
    );
    const iniBtn = screen.getByTitle("Tirar iniciativa");
    expect(iniBtn.className).toContain("amber");
  });
});
