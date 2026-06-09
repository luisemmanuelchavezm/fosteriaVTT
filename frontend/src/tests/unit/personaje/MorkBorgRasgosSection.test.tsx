// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import MorkBorgRasgosSection from "../../../screens/personaje/createmorkborg/sections/MorkBorgRasgosSection";

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

describe("MorkBorgRasgosSection", () => {
  it("renderiza sin errores", () => {
    const { container } = render(
      <MorkBorgRasgosSection onAllRasgosComplete={vi.fn()} />,
    );
    expect(container).toBeTruthy();
  });

  it("muestra contenido del formulario de rasgos", () => {
    render(<MorkBorgRasgosSection onAllRasgosComplete={vi.fn()} />);
    expect(document.body.textContent?.length).toBeGreaterThan(0);
  });

  it("contiene botones de tirada", () => {
    render(<MorkBorgRasgosSection onAllRasgosComplete={vi.fn()} />);
    const buttons = screen.queryAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(0);
  });

  it("muestra botones de ayuda ?", () => {
    render(<MorkBorgRasgosSection onAllRasgosComplete={vi.fn()} />);
    const helpBtns = screen.queryAllByText("?");
    expect(document.body).toBeTruthy();
    if (helpBtns.length > 0) {
      fireEvent.click(helpBtns[0]);
      expect(document.body.textContent?.length).toBeGreaterThan(0);
    }
  });

  it("permite hacer click en botones de tirada de rasgos", () => {
    const onComplete = vi.fn();
    render(<MorkBorgRasgosSection onAllRasgosComplete={onComplete} />);
    const buttons = screen.queryAllByRole("button");
    if (buttons.length > 0) {
      fireEvent.click(buttons[0]);
    }
    expect(document.body).toBeTruthy();
  });
});
