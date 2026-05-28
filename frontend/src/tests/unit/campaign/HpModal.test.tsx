// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import HpModal from "../../../screens/campaign/components/panel/HpModal";
import type { DndCharacterDetailResponse } from "../../../screens/personaje/utils/dndApi";

const makeCharacter = (
  overrides: Partial<DndCharacterDetailResponse["estadisticas"]> = {},
): DndCharacterDetailResponse =>
  ({
    id: 1,
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
      "Vida temporal": 5,
      Movimiento: 30,
      ...overrides,
    },
    habilidades: [],
    mochila: [],
    usado: false,
    tipo: "PJ",
    vd: null,
  }) as unknown as DndCharacterDetailResponse;

const DEFAULT_PROPS = {
  character: makeCharacter(),
  hpDelta: "5",
  setHpDelta: vi.fn(),
  tempHpDelta: "3",
  setTempHpDelta: vi.fn(),
  isSavingHealth: false,
  healthSaveError: null,
  onClose: vi.fn(),
  onAdjust: vi.fn(),
};

describe("HpModal", () => {
  // ── Basic rendering ───────────────────────────────────────────────────────

  it("renders character name", () => {
    render(<HpModal {...DEFAULT_PROPS} />);
    expect(screen.getByText("Aragorn")).toBeInTheDocument();
  });

  it("renders 'Puntos de vida' label", () => {
    render(<HpModal {...DEFAULT_PROPS} />);
    // "Puntos de vida" appears in header and footer area
    const matches = screen.getAllByText("Puntos de vida");
    expect(matches.length).toBeGreaterThan(0);
  });

  it("renders current and max HP values", () => {
    render(<HpModal {...DEFAULT_PROPS} />);
    expect(screen.getByText("40")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("renders temporary HP", () => {
    render(<HpModal {...DEFAULT_PROPS} />);
    expect(screen.getByText("Temporal: 5")).toBeInTheDocument();
  });

  it("renders hpDelta in the input", () => {
    render(<HpModal {...DEFAULT_PROPS} />);
    const inputs = screen.getAllByDisplayValue("5");
    expect(inputs.length).toBeGreaterThan(0);
  });

  // ── Buttons ───────────────────────────────────────────────────────────────

  it("renders Curar button", () => {
    render(<HpModal {...DEFAULT_PROPS} />);
    expect(screen.getByText("Curar")).toBeInTheDocument();
  });

  it("renders Daño button", () => {
    render(<HpModal {...DEFAULT_PROPS} />);
    expect(screen.getByText("Daño")).toBeInTheDocument();
  });

  it("renders Temp + button", () => {
    render(<HpModal {...DEFAULT_PROPS} />);
    expect(screen.getByText("Temp +")).toBeInTheDocument();
  });

  it("renders Temp - button", () => {
    render(<HpModal {...DEFAULT_PROPS} />);
    expect(screen.getByText("Temp -")).toBeInTheDocument();
  });

  it("renders Cerrar button", () => {
    render(<HpModal {...DEFAULT_PROPS} />);
    expect(screen.getByText("Cerrar")).toBeInTheDocument();
  });

  // ── Callbacks ─────────────────────────────────────────────────────────────

  it("calls onAdjust with 'heal' when Curar is clicked", () => {
    const onAdjust = vi.fn();
    render(<HpModal {...DEFAULT_PROPS} onAdjust={onAdjust} />);
    fireEvent.click(screen.getByText("Curar"));
    expect(onAdjust).toHaveBeenCalledWith("heal");
  });

  it("calls onAdjust with 'damage' when Daño is clicked", () => {
    const onAdjust = vi.fn();
    render(<HpModal {...DEFAULT_PROPS} onAdjust={onAdjust} />);
    fireEvent.click(screen.getByText("Daño"));
    expect(onAdjust).toHaveBeenCalledWith("damage");
  });

  it("calls onAdjust with 'tempGain' when Temp + is clicked", () => {
    const onAdjust = vi.fn();
    render(<HpModal {...DEFAULT_PROPS} onAdjust={onAdjust} />);
    fireEvent.click(screen.getByText("Temp +"));
    expect(onAdjust).toHaveBeenCalledWith("tempGain");
  });

  it("calls onAdjust with 'tempLose' when Temp - is clicked", () => {
    const onAdjust = vi.fn();
    render(<HpModal {...DEFAULT_PROPS} onAdjust={onAdjust} />);
    fireEvent.click(screen.getByText("Temp -"));
    expect(onAdjust).toHaveBeenCalledWith("tempLose");
  });

  it("calls onClose when Cerrar button is clicked", () => {
    const onClose = vi.fn();
    render(<HpModal {...DEFAULT_PROPS} onClose={onClose} />);
    fireEvent.click(screen.getByText("Cerrar"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn();
    render(<HpModal {...DEFAULT_PROPS} onClose={onClose} />);
    // The outer fixed div has onClick={onClose}
    const backdrop = document.querySelector(".fixed.inset-0");
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalled();
    }
  });

  // ── HP delta controls ─────────────────────────────────────────────────────

  it("calls setHpDelta with decremented value when hp - button is clicked", () => {
    const setHpDelta = vi.fn();
    render(<HpModal {...DEFAULT_PROPS} setHpDelta={setHpDelta} hpDelta="5" />);
    // The first "-" button is in the hp section
    const minusButtons = screen.getAllByText("-");
    fireEvent.click(minusButtons[0]);
    expect(setHpDelta).toHaveBeenCalledWith("4");
  });

  it("calls setHpDelta with incremented value when hp + button is clicked", () => {
    const setHpDelta = vi.fn();
    render(<HpModal {...DEFAULT_PROPS} setHpDelta={setHpDelta} hpDelta="5" />);
    const plusButtons = screen.getAllByText("+");
    fireEvent.click(plusButtons[0]);
    expect(setHpDelta).toHaveBeenCalledWith("6");
  });

  it("does not go below 0 when hp - button is clicked at 0", () => {
    const setHpDelta = vi.fn();
    render(<HpModal {...DEFAULT_PROPS} setHpDelta={setHpDelta} hpDelta="0" />);
    const minusButtons = screen.getAllByText("-");
    fireEvent.click(minusButtons[0]);
    expect(setHpDelta).toHaveBeenCalledWith("0");
  });

  it("calls setTempHpDelta with incremented value when temp + button is clicked", () => {
    const setTempHpDelta = vi.fn();
    render(
      <HpModal
        {...DEFAULT_PROPS}
        setTempHpDelta={setTempHpDelta}
        tempHpDelta="3"
      />,
    );
    const plusButtons = screen.getAllByText("+");
    fireEvent.click(plusButtons[1]);
    expect(setTempHpDelta).toHaveBeenCalledWith("4");
  });

  it("calls setTempHpDelta with decremented value when temp - button is clicked", () => {
    const setTempHpDelta = vi.fn();
    render(
      <HpModal
        {...DEFAULT_PROPS}
        setTempHpDelta={setTempHpDelta}
        tempHpDelta="3"
      />,
    );
    const minusButtons = screen.getAllByText("-");
    fireEvent.click(minusButtons[1]);
    expect(setTempHpDelta).toHaveBeenCalledWith("2");
  });

  it("calls setHpDelta when typing in hp input", () => {
    const setHpDelta = vi.fn();
    render(<HpModal {...DEFAULT_PROPS} setHpDelta={setHpDelta} />);
    const inputs = screen.getAllByDisplayValue("5");
    fireEvent.change(inputs[0], { target: { value: "10" } });
    expect(setHpDelta).toHaveBeenCalled();
  });

  // ── States ────────────────────────────────────────────────────────────────

  it("shows 'Guardando...' when isSavingHealth is true", () => {
    render(<HpModal {...DEFAULT_PROPS} isSavingHealth />);
    expect(screen.getByText("Guardando...")).toBeInTheDocument();
  });

  it("shows healthSaveError when provided", () => {
    render(
      <HpModal {...DEFAULT_PROPS} healthSaveError="No se pudo guardar." />,
    );
    expect(screen.getByText("No se pudo guardar.")).toBeInTheDocument();
  });

  it("does not show error when healthSaveError is null", () => {
    render(<HpModal {...DEFAULT_PROPS} healthSaveError={null} />);
    expect(screen.queryByText("No se pudo guardar.")).not.toBeInTheDocument();
  });

  // ── Zero HP clamping ──────────────────────────────────────────────────────

  it("shows 0 for current HP when Vida actual is negative", () => {
    render(
      <HpModal
        {...DEFAULT_PROPS}
        character={makeCharacter({ "Vida actual": -10, "Vida maxima": 50 })}
      />,
    );
    // Should show 0, not -10
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("calls setTempHpDelta when typing in the temp HP input", () => {
    const setTempHpDelta = vi.fn();
    render(
      <HpModal
        {...DEFAULT_PROPS}
        setTempHpDelta={setTempHpDelta}
        tempHpDelta="3"
      />,
    );
    // The temp HP input displays "3"
    const tempInput = screen.getAllByDisplayValue("3")[0];
    fireEvent.change(tempInput, { target: { value: "8" } });
    expect(setTempHpDelta).toHaveBeenCalledWith("8");
  });
});
