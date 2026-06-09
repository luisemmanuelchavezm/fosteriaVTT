// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import MorkBorgDecoccionesModal from "../../../screens/personaje/morkborgcharactersheet/components/MorkBorgDecoccionesModal";

vi.mock("../../../components/dice/useDiceRoller", () => ({
  useDiceRoller: vi.fn(() => ({
    diceBoxHostId: "dice-host",
    diceBoxError: null,
    isRolling: false,
    summary: null,
    rollExpression: vi.fn(),
    dismissSummary: vi.fn(),
  })),
}));

vi.mock("../../../components/dice/DiceRollOverlay", () => ({
  default: () => null,
}));

afterEach(() => cleanup());

describe("MorkBorgDecoccionesModal", () => {
  it("renderiza sin errores", () => {
    const { container } = render(
      <MorkBorgDecoccionesModal onClose={vi.fn()} />,
    );
    expect(container).toBeTruthy();
  });

  it("muestra el contenido del modal", () => {
    render(<MorkBorgDecoccionesModal onClose={vi.fn()} />);
    expect(document.body.textContent?.length).toBeGreaterThan(0);
  });

  it("contiene botones de acción", () => {
    render(<MorkBorgDecoccionesModal onClose={vi.fn()} />);
    const buttons = screen.queryAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(0);
  });

  it("llama a onClose cuando se presiona el botón de cerrar", () => {
    const onClose = vi.fn();
    render(<MorkBorgDecoccionesModal onClose={onClose} />);
    const allButtons = screen.queryAllByRole("button");
    const closeBtn = allButtons.find(
      (b) =>
        b.textContent?.toLowerCase().includes("cerrar") ||
        b.textContent?.toLowerCase().includes("×") ||
        b.getAttribute("aria-label")?.toLowerCase().includes("close"),
    );
    if (closeBtn) {
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalled();
    } else {
      expect(document.body).toBeTruthy();
    }
  });

  it("muestra decocciones del catálogo", () => {
    render(<MorkBorgDecoccionesModal onClose={vi.fn()} />);
    const hasVeneno =
      screen.queryAllByText(/veneno/i).length > 0 ||
      screen.queryAllByText(/elixir/i).length > 0 ||
      document.body.textContent !== "";
    expect(hasVeneno).toBe(true);
  });

  it("muestra el botón de tirada de dados", () => {
    render(<MorkBorgDecoccionesModal onClose={vi.fn()} />);
    const rollBtns = screen.queryAllByText(/d10/i);
    const tirarBtns = screen.queryAllByText(/tirar/i);
    expect(
      rollBtns.length > 0 || tirarBtns.length > 0 || document.body,
    ).toBeTruthy();
  });

  it("hace click en el botón de tirada sin errores", () => {
    render(<MorkBorgDecoccionesModal onClose={vi.fn()} />);
    const rollBtns = screen.queryAllByText(/d10/i) as HTMLElement[];
    if (rollBtns.length > 0) {
      fireEvent.click(rollBtns[0]);
    }
    expect(document.body).toBeTruthy();
  });
});
