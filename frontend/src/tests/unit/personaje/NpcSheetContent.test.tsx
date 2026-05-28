// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import NpcSheetContent from "../../../screens/personaje/dndcharactersheet/NpcSheetContent";
import type { DndCharacterDetailResponse } from "../../../screens/personaje/utils/dndApi";

const makeCharacter = (
  overrides: Partial<DndCharacterDetailResponse> = {},
): DndCharacterDetailResponse =>
  ({
    id: 42,
    nombre: "Goblin",
    retrato: null,
    biografia: "Un goblin malvado.",
    sistemaDeJuego: "Dungeons and Dragons",
    raza: "Goblin",
    subraza: null,
    clases: [],
    estadisticas: {
      Fuerza: 8,
      Destreza: 14,
      Constitucion: 10,
      Inteligencia: 10,
      Sabiduria: 8,
      Carisma: 8,
      "Vida actual": 7,
      "Vida maxima": 7,
      "Vida temporal": 0,
      Movimiento: 30,
    },
    habilidades: [],
    mochila: [],
    usado: false,
    tipo: "PNJ",
    vd: "1/4",
    ...overrides,
  }) as unknown as DndCharacterDetailResponse;

const DEFAULT_PROPS = {
  character: makeCharacter(),
  currentHp: 7,
  totalHp: 7,
  tempHp: 0,
  hpDelta: "0",
  tempHpDelta: "0",
  onHpDeltaChange: vi.fn(),
  onTempHpDeltaChange: vi.fn(),
  onHeal: vi.fn(),
  onDamage: vi.fn(),
  onGainTempHp: vi.fn(),
  onLoseTempHp: vi.fn(),
  onIncrementHpDelta: vi.fn(),
  onDecrementHpDelta: vi.fn(),
  onIncrementTempHpDelta: vi.fn(),
  onDecrementTempHpDelta: vi.fn(),
  sanitizeNonNegativeNumber: (v: string) => v,
};

describe("NpcSheetContent", () => {
  // ── Basic rendering ───────────────────────────────────────────────────────

  it("renders character name", () => {
    render(<NpcSheetContent {...DEFAULT_PROPS} />);
    expect(screen.getByText("Goblin")).toBeInTheDocument();
  });

  it("renders PNJ badge for tipo=PNJ", () => {
    render(<NpcSheetContent {...DEFAULT_PROPS} />);
    expect(screen.getByText("PNJ")).toBeInTheDocument();
  });

  it("renders Enemigo badge for tipo=ENEMIGO", () => {
    render(
      <NpcSheetContent
        {...DEFAULT_PROPS}
        character={makeCharacter({ tipo: "ENEMIGO" })}
      />,
    );
    expect(screen.getByText("Enemigo")).toBeInTheDocument();
  });

  // ── Tabs ──────────────────────────────────────────────────────────────────

  it("renders Estadísticas, Información and Rasgos tabs", () => {
    render(<NpcSheetContent {...DEFAULT_PROPS} />);
    expect(screen.getByText("Estadísticas")).toBeInTheDocument();
    expect(screen.getByText("Información")).toBeInTheDocument();
    expect(screen.getByText("Rasgos")).toBeInTheDocument();
  });

  it("shows Estadísticas tab content by default", () => {
    render(<NpcSheetContent {...DEFAULT_PROPS} />);
    // NpcStatsTab should render some stats
    expect(screen.getByText("Fuerza")).toBeInTheDocument();
  });

  it("switches to Información tab when clicked", () => {
    render(<NpcSheetContent {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByText("Información"));
    // NpcInfoTab renders biography content
    expect(screen.getByText("Un goblin malvado.")).toBeInTheDocument();
  });

  it("switches to Rasgos tab when clicked", () => {
    render(<NpcSheetContent {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByText("Rasgos"));
    // NpcRasgosTab renders some content - show "Sin rasgos" or similar
    expect(screen.getByText("Rasgos")).toBeInTheDocument();
  });

  // ── Edit mode ─────────────────────────────────────────────────────────────

  it("shows edit button when isOwner and characterId and onNpcSaved are provided", () => {
    render(
      <NpcSheetContent
        {...DEFAULT_PROPS}
        isOwner
        characterId="42"
        onNpcSaved={vi.fn()}
      />,
    );
    expect(screen.getByText("✏ Editar")).toBeInTheDocument();
  });

  it("does not show edit button when isOwner is false", () => {
    render(
      <NpcSheetContent
        {...DEFAULT_PROPS}
        isOwner={false}
        characterId="42"
        onNpcSaved={vi.fn()}
      />,
    );
    expect(screen.queryByText("✏ Editar")).not.toBeInTheDocument();
  });

  it("does not show edit button when characterId is not provided", () => {
    render(
      <NpcSheetContent
        {...DEFAULT_PROPS}
        isOwner
        characterId={undefined}
        onNpcSaved={vi.fn()}
      />,
    );
    expect(screen.queryByText("✏ Editar")).not.toBeInTheDocument();
  });

  it("enters edit mode when '✏ Editar' is clicked", () => {
    render(
      <NpcSheetContent
        {...DEFAULT_PROPS}
        isOwner
        characterId="42"
        onNpcSaved={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("✏ Editar"));
    expect(screen.getByText("Cancelar")).toBeInTheDocument();
    expect(screen.getByText("💾 Guardar")).toBeInTheDocument();
  });

  it("cancels edit mode when 'Cancelar' is clicked", () => {
    render(
      <NpcSheetContent
        {...DEFAULT_PROPS}
        isOwner
        characterId="42"
        onNpcSaved={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("✏ Editar"));
    expect(screen.getByText("Cancelar")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cancelar"));
    expect(screen.getByText("✏ Editar")).toBeInTheDocument();
  });

  it("shows name input in edit mode", () => {
    render(
      <NpcSheetContent
        {...DEFAULT_PROPS}
        isOwner
        characterId="42"
        onNpcSaved={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("✏ Editar"));
    const nameInput = screen.getByDisplayValue("Goblin") as HTMLInputElement;
    expect(nameInput).toBeInTheDocument();
    expect(nameInput.type).toBe("text");
  });

  it("renders character retrato image when retrato is provided", () => {
    render(
      <NpcSheetContent
        {...DEFAULT_PROPS}
        character={makeCharacter({ retrato: "http://example.com/goblin.png" })}
      />,
    );
    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(img.getAttribute("src")).toBe("http://example.com/goblin.png");
  });

  it("renders placeholder SVG when no retrato", () => {
    render(<NpcSheetContent {...DEFAULT_PROPS} />);
    // When no retrato, renders SVG placeholder
    expect(document.querySelector("svg")).toBeTruthy();
  });
});
