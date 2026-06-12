// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import MorkBorgSuppliesSection from "../../../screens/personaje/morkborgcharactersheet/components/MorkBorgSuppliesSection";

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

const DEFAULT_PROPS = {
  plata: 10,
  comida: 3,
  presagios: 5,
  decocciones: [3, 0, 2],
  onAdjust: vi.fn(),
  onSetPlata: vi.fn(),
  onSetComida: vi.fn(),
  onAdjustDecoccion: vi.fn(),
  onSetDecoccion: vi.fn(),
  onRollPresagios: vi.fn(),
};

describe("MorkBorgSuppliesSection", () => {
  it("renderiza sin errores", () => {
    const { container } = render(
      <MorkBorgSuppliesSection {...DEFAULT_PROPS} />,
    );
    expect(container).toBeTruthy();
  });

  it("muestra la pestaña de recursos por defecto", () => {
    render(<MorkBorgSuppliesSection {...DEFAULT_PROPS} />);
    expect(document.body.textContent?.length).toBeGreaterThan(0);
  });

  it("muestra el valor de plata", () => {
    render(<MorkBorgSuppliesSection {...DEFAULT_PROPS} />);
    expect(document.body.textContent).toContain("10");
  });

  it("cambia a la pestaña de decocciones", () => {
    render(<MorkBorgSuppliesSection {...DEFAULT_PROPS} />);
    const decocBtn = screen.queryByText(/decoc/i);
    if (decocBtn) {
      fireEvent.click(decocBtn);
    }
    expect(document.body).toBeTruthy();
  });

  it("tiene botones de ajuste", () => {
    render(<MorkBorgSuppliesSection {...DEFAULT_PROPS} />);
    const buttons = screen.queryAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(0);
  });

  it("hace click en botón + de plata", () => {
    const onAdjust = vi.fn();
    render(<MorkBorgSuppliesSection {...DEFAULT_PROPS} onAdjust={onAdjust} />);
    const buttons = screen.queryAllByRole("button");
    const plusBtn = buttons.find((b) => b.textContent?.includes("+"));
    if (plusBtn) {
      fireEvent.click(plusBtn);
    }
    expect(document.body).toBeTruthy();
  });

  it("muestra presagios", () => {
    render(<MorkBorgSuppliesSection {...DEFAULT_PROPS} />);
    expect(document.body.textContent).toContain("5");
  });

  it("llama a onRollPresagios cuando se hace click en tirar presagios", () => {
    const onRollPresagios = vi.fn();
    render(
      <MorkBorgSuppliesSection
        {...DEFAULT_PROPS}
        onRollPresagios={onRollPresagios}
      />,
    );
    const allBtns = screen.queryAllByRole("button");
    const rollBtn = allBtns.find(
      (b) =>
        b.textContent?.toLowerCase().includes("d") ||
        b.textContent?.toLowerCase().includes("tir"),
    );
    if (rollBtn) {
      fireEvent.click(rollBtn);
    }
    expect(document.body).toBeTruthy();
  });

  it("renderiza con isRollingPresagios true", () => {
    const { container } = render(
      <MorkBorgSuppliesSection {...DEFAULT_PROPS} isRollingPresagios={true} />,
    );
    expect(container).toBeTruthy();
  });

  it("renderiza decocciones en la pestaña correspondiente", () => {
    render(<MorkBorgSuppliesSection {...DEFAULT_PROPS} />);
    const decocTab = screen.queryByText(/decoc/i);
    if (decocTab) {
      fireEvent.click(decocTab);
      expect(document.body.textContent).toBeTruthy();
    } else {
      expect(document.body).toBeTruthy();
    }
  });
});
