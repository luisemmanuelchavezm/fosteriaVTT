// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import IniciativaBar from "../../../screens/campaign/components/IniciativaBar";
import type { IniciativaEntrada } from "../../../screens/campaign/hooks/useCampaignRealtime";
import type { CampaignPositionResponse } from "../../../screens/campaign/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeEntrada = (
  overrides: Partial<IniciativaEntrada> = {},
): IniciativaEntrada =>
  ({
    personajeId: 1,
    nombre: "Aragorn",
    total: 18,
    tirada: 15,
    bonificacion: 3,
    retrato: null,
    ...overrides,
  }) as IniciativaEntrada;

const DEFAULT_PROPS = {
  entradas: [],
  isDM: false,
  onReordenar: vi.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("IniciativaBar", () => {
  // ── Header ─────────────────────────────────────────────────────────────────

  it("renders 'Turnos' header", () => {
    render(<IniciativaBar {...DEFAULT_PROPS} />);
    expect(screen.getByText("Turnos")).toBeInTheDocument();
  });

  // ── Empty state ────────────────────────────────────────────────────────────

  it("shows 'Esperando iniciativas...' when entries are empty", () => {
    render(<IniciativaBar {...DEFAULT_PROPS} />);
    expect(screen.getByText("Esperando iniciativas...")).toBeInTheDocument();
  });

  it("does not show empty message when there are entries", () => {
    render(<IniciativaBar {...DEFAULT_PROPS} entradas={[makeEntrada()]} />);
    expect(
      screen.queryByText("Esperando iniciativas..."),
    ).not.toBeInTheDocument();
  });

  // ── Renders entries ────────────────────────────────────────────────────────

  it("renders character name", () => {
    render(
      <IniciativaBar
        {...DEFAULT_PROPS}
        entradas={[makeEntrada({ nombre: "Legolas" })]}
      />,
    );
    expect(screen.getByText("Legolas")).toBeInTheDocument();
  });

  it("renders initiative total value", () => {
    render(
      <IniciativaBar
        {...DEFAULT_PROPS}
        entradas={[makeEntrada({ total: 20 })]}
      />,
    );
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("renders multiple entries", () => {
    render(
      <IniciativaBar
        {...DEFAULT_PROPS}
        entradas={[
          makeEntrada({ personajeId: 1, nombre: "Aragorn" }),
          makeEntrada({ personajeId: 2, nombre: "Legolas" }),
          makeEntrada({ personajeId: 3, nombre: "Gimli" }),
        ]}
      />,
    );
    expect(screen.getByText("Aragorn")).toBeInTheDocument();
    expect(screen.getByText("Legolas")).toBeInTheDocument();
    expect(screen.getByText("Gimli")).toBeInTheDocument();
  });

  it("renders portrait image when retrato is provided", () => {
    render(
      <IniciativaBar
        {...DEFAULT_PROPS}
        entradas={[makeEntrada({ retrato: "http://example.com/aragorn.png" })]}
      />,
    );
    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(img.getAttribute("src")).toBe("http://example.com/aragorn.png");
  });

  it("renders SVG placeholder when no retrato", () => {
    render(
      <IniciativaBar
        {...DEFAULT_PROPS}
        entradas={[makeEntrada({ retrato: null })]}
      />,
    );
    expect(document.querySelector("svg")).toBeTruthy();
  });

  it("renders positive bonificacion with + sign", () => {
    render(
      <IniciativaBar
        {...DEFAULT_PROPS}
        entradas={[makeEntrada({ bonificacion: 3, tirada: 15, total: 18 })]}
      />,
    );
    // Badge shows "(tirada+bonificacion)"
    const badge = document.querySelector(".bg-sky-500");
    expect(badge?.textContent).toContain("+");
  });

  // ── Callbacks ──────────────────────────────────────────────────────────────

  it("calls onTokenClick when portrait button is clicked", () => {
    const onTokenClick = vi.fn();
    render(
      <IniciativaBar
        {...DEFAULT_PROPS}
        entradas={[makeEntrada({ personajeId: 42 })]}
        onTokenClick={onTokenClick}
      />,
    );
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    expect(onTokenClick).toHaveBeenCalledWith(42);
  });

  it("calls onTokenRightClick when portrait is right-clicked", () => {
    const onTokenRightClick = vi.fn();
    render(
      <IniciativaBar
        {...DEFAULT_PROPS}
        entradas={[makeEntrada({ personajeId: 7 })]}
        onTokenRightClick={onTokenRightClick}
      />,
    );
    const btn = screen.getByRole("button");
    fireEvent.contextMenu(btn, { clientX: 100, clientY: 200 });
    expect(onTokenRightClick).toHaveBeenCalledWith(7, 100, 200);
  });

  it("calls onTokenClick on keyboard Enter press", () => {
    const onTokenClick = vi.fn();
    render(
      <IniciativaBar
        {...DEFAULT_PROPS}
        entradas={[makeEntrada({ personajeId: 5 })]}
        onTokenClick={onTokenClick}
      />,
    );
    const btn = screen.getByRole("button");
    fireEvent.keyDown(btn, { key: "Enter" });
    expect(onTokenClick).toHaveBeenCalledWith(5);
  });

  it("calls onTokenClick on keyboard Space press", () => {
    const onTokenClick = vi.fn();
    render(
      <IniciativaBar
        {...DEFAULT_PROPS}
        entradas={[makeEntrada({ personajeId: 5 })]}
        onTokenClick={onTokenClick}
      />,
    );
    const btn = screen.getByRole("button");
    fireEvent.keyDown(btn, { key: " " });
    expect(onTokenClick).toHaveBeenCalledWith(5);
  });

  // ── Drag and drop (DM only) ─────────────────────────────────────────────────

  it("calls onReordenar when dragging entries as DM", () => {
    const onReordenar = vi.fn();
    const entradas = [
      makeEntrada({ personajeId: 1, nombre: "A" }),
      makeEntrada({ personajeId: 2, nombre: "B" }),
    ];
    render(
      <IniciativaBar
        {...DEFAULT_PROPS}
        entradas={entradas}
        isDM
        onReordenar={onReordenar}
      />,
    );
    const cards = screen.getAllByRole("button");
    // Simulate drag-start on card[0], dragover on card[1], then drop
    fireEvent.dragStart(cards[0].parentElement!.parentElement!);
    fireEvent.dragOver(cards[1].parentElement!.parentElement!, {
      preventDefault: vi.fn(),
    });
    fireEvent.drop(cards[1].parentElement!.parentElement!, {
      preventDefault: vi.fn(),
    });
    expect(onReordenar).toHaveBeenCalledWith([2, 1]);
  });

  it("calls dragEnd handler to reset state", () => {
    const entradas = [
      makeEntrada({ personajeId: 1 }),
      makeEntrada({ personajeId: 2, nombre: "B" }),
    ];
    render(<IniciativaBar {...DEFAULT_PROPS} entradas={entradas} isDM />);
    const cards = screen.getAllByRole("button");
    fireEvent.dragStart(cards[0].parentElement!.parentElement!);
    fireEvent.dragEnd(cards[0].parentElement!.parentElement!);
    // No crash = success
  });

  it("drops on same source doesn't call onReordenar", () => {
    const onReordenar = vi.fn();
    const entradas = [
      makeEntrada({ personajeId: 1 }),
      makeEntrada({ personajeId: 2, nombre: "B" }),
    ];
    render(
      <IniciativaBar
        {...DEFAULT_PROPS}
        entradas={entradas}
        isDM
        onReordenar={onReordenar}
      />,
    );
    const cards = screen.getAllByRole("button");
    // Drag and drop on same element
    fireEvent.dragStart(cards[0].parentElement!.parentElement!);
    fireEvent.drop(cards[0].parentElement!.parentElement!, {
      preventDefault: vi.fn(),
    });
    expect(onReordenar).not.toHaveBeenCalled();
  });

  // ── MorkBorg mode ────────────────────────────────────────────────────────

  it("renders MorkBorg mode with unrolled positions", () => {
    const posicionesMB = [
      {
        personajeId: 5,
        personajeNombre: "Goblin",
        retrato: null,
        x: 0,
        y: 0,
        id: 1,
        campaignId: 1,
      },
    ] as unknown as CampaignPositionResponse[];

    render(
      <IniciativaBar
        {...DEFAULT_PROPS}
        isMorkBorg
        posicionesMB={posicionesMB}
        mbDadoIniciativa={null}
        entradas={[]}
      />,
    );
    expect(screen.getByText("Goblin")).toBeInTheDocument();
  });

  it("renders MorkBorg mode with rolled entries and unrolled positions", () => {
    const entradas = [
      makeEntrada({
        personajeId: 1,
        nombre: "Skald",
        total: 15,
        tirada: 12,
        bonificacion: 3,
      }),
    ];
    const posicionesMB = [
      {
        personajeId: 5,
        personajeNombre: "Goblin",
        retrato: null,
        x: 0,
        y: 0,
        id: 2,
        campaignId: 1,
      },
    ] as unknown as CampaignPositionResponse[];

    render(
      <IniciativaBar
        {...DEFAULT_PROPS}
        isMorkBorg
        entradas={entradas}
        posicionesMB={posicionesMB}
        mbDadoIniciativa={2}
      />,
    );
    expect(screen.getByText("Skald")).toBeInTheDocument();
    expect(screen.getByText("Goblin")).toBeInTheDocument();
  });

  it("shows enemies first when mbDadoIniciativa <= 3", () => {
    render(
      <IniciativaBar
        {...DEFAULT_PROPS}
        isMorkBorg
        mbDadoIniciativa={2}
        entradas={[]}
      />,
    );
    // The banner should say enemies go first
    expect(screen.getByText(/Empiezan los enemigos/)).toBeInTheDocument();
  });

  it("shows players first when mbDadoIniciativa > 3", () => {
    render(
      <IniciativaBar
        {...DEFAULT_PROPS}
        isMorkBorg
        mbDadoIniciativa={5}
        entradas={[]}
      />,
    );
    expect(screen.getByText(/Empiezan los jugadores/)).toBeInTheDocument();
  });

  it("does not call onReordenar when not isDM", () => {
    const onReordenar = vi.fn();
    const entradas = [
      makeEntrada({ personajeId: 1, nombre: "A" }),
      makeEntrada({ personajeId: 2, nombre: "B" }),
    ];
    render(
      <IniciativaBar
        {...DEFAULT_PROPS}
        entradas={entradas}
        isDM={false}
        onReordenar={onReordenar}
      />,
    );
    const cards = screen.getAllByRole("button");
    fireEvent.dragStart(cards[0].parentElement!.parentElement!);
    fireEvent.drop(cards[1].parentElement!.parentElement!, {
      preventDefault: vi.fn(),
    });
    expect(onReordenar).not.toHaveBeenCalled();
  });
});
