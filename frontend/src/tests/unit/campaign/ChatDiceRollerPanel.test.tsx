// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import ChatDiceRollerPanel from "../../../screens/campaign/components/ChatDiceRollerPanel";

const DEFAULT_PROPS = {
  onRollExpression: vi.fn(),
};

describe("ChatDiceRollerPanel", () => {
  // ── Toggle button ─────────────────────────────────────────────────────────

  it("renders the toggle button with aria-label", () => {
    render(<ChatDiceRollerPanel {...DEFAULT_PROPS} />);
    expect(screen.getByLabelText("Abrir panel de tiradas")).toBeInTheDocument();
  });

  it("panel text is present in DOM (CSS-hidden by default), visible after click", () => {
    render(<ChatDiceRollerPanel {...DEFAULT_PROPS} />);
    // Panel is in DOM but pointer-events-none; after click toggle it becomes interactive
    const toggleBtn = screen.getByLabelText("Abrir panel de tiradas");
    fireEvent.click(toggleBtn);
    // After opening, the panel container has scale-100 / opacity-100 class
    const panel = document.querySelector(".scale-100");
    expect(panel).toBeTruthy();
    expect(screen.getByText("Tirar dados")).toBeInTheDocument();
  });

  it("closes the panel when toggle button is clicked twice", () => {
    render(<ChatDiceRollerPanel {...DEFAULT_PROPS} />);
    const toggleBtn = screen.getByLabelText("Abrir panel de tiradas");
    fireEvent.click(toggleBtn);
    expect(screen.getByText("Tirar dados")).toBeInTheDocument();
    fireEvent.click(toggleBtn);
    // Panel should be hidden (pointer-events-none / opacity-0) but still in DOM
    expect(screen.getByText("Tirar dados")).toBeInTheDocument();
  });

  it("disables toggle button when disabled prop is true", () => {
    render(<ChatDiceRollerPanel {...DEFAULT_PROPS} disabled />);
    const btn = screen.getByLabelText(
      "Abrir panel de tiradas",
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  // ── Quick dice buttons ─────────────────────────────────────────────────────

  it("renders quick dice buttons: d100, d20, d12, d8, d6, d4", () => {
    render(<ChatDiceRollerPanel {...DEFAULT_PROPS} />);
    expect(screen.getByText("d100")).toBeInTheDocument();
    expect(screen.getByText("d20")).toBeInTheDocument();
    expect(screen.getByText("d12")).toBeInTheDocument();
    expect(screen.getByText("d8")).toBeInTheDocument();
    expect(screen.getByText("d6")).toBeInTheDocument();
    expect(screen.getByText("d4")).toBeInTheDocument();
  });

  it("calls onRollExpression with correct title and expression for d20", () => {
    const onRollExpression = vi.fn();
    render(
      <ChatDiceRollerPanel
        {...DEFAULT_PROPS}
        onRollExpression={onRollExpression}
      />,
    );
    fireEvent.click(screen.getByText("d20"));
    expect(onRollExpression).toHaveBeenCalledWith("Tirada d20", "1d20");
  });

  it("calls onRollExpression with correct title and expression for d6", () => {
    const onRollExpression = vi.fn();
    render(
      <ChatDiceRollerPanel
        {...DEFAULT_PROPS}
        onRollExpression={onRollExpression}
      />,
    );
    fireEvent.click(screen.getByText("d6"));
    expect(onRollExpression).toHaveBeenCalledWith("Tirada d6", "1d6");
  });

  it("calls onRollExpression for d100", () => {
    const onRollExpression = vi.fn();
    render(
      <ChatDiceRollerPanel
        {...DEFAULT_PROPS}
        onRollExpression={onRollExpression}
      />,
    );
    fireEvent.click(screen.getByText("d100"));
    expect(onRollExpression).toHaveBeenCalledWith("Tirada d100", "1d100");
  });

  // ── Custom expression ──────────────────────────────────────────────────────

  it("renders the custom expression input with placeholder", () => {
    render(<ChatDiceRollerPanel {...DEFAULT_PROPS} />);
    expect(screen.getByPlaceholderText("1d4 + 1d8 - 3d5")).toBeInTheDocument();
  });

  it("calls onRollExpression with valid custom expression via input change + Enter", () => {
    const onRollExpression = vi.fn();
    render(
      <ChatDiceRollerPanel
        {...DEFAULT_PROPS}
        onRollExpression={onRollExpression}
      />,
    );
    const input = screen.getByPlaceholderText("1d4 + 1d8 - 3d5");
    fireEvent.change(input, { target: { value: "2d6+3" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onRollExpression).toHaveBeenCalledWith(
      "Tirada personalizada",
      "2d6+3",
    );
  });

  it("does not call onRollExpression when expression format is invalid", () => {
    const onRollExpression = vi.fn();
    render(
      <ChatDiceRollerPanel
        {...DEFAULT_PROPS}
        onRollExpression={onRollExpression}
      />,
    );
    const input = screen.getByPlaceholderText("1d4 + 1d8 - 3d5");
    fireEvent.change(input, { target: { value: "invalid expression" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onRollExpression).not.toHaveBeenCalled();
  });

  it("shows format error message when expression is invalid and Enter is pressed", () => {
    render(<ChatDiceRollerPanel {...DEFAULT_PROPS} />);
    const input = screen.getByPlaceholderText("1d4 + 1d8 - 3d5");
    fireEvent.change(input, { target: { value: "no valido" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(
      screen.getByText("Formato incorrecto. Ejemplo: 1d4 + 1d8 - 3d5"),
    ).toBeInTheDocument();
  });

  it("clears format error when input changes after an error", () => {
    render(<ChatDiceRollerPanel {...DEFAULT_PROPS} />);
    const input = screen.getByPlaceholderText("1d4 + 1d8 - 3d5");
    // Trigger error
    fireEvent.change(input, { target: { value: "invalid" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(
      screen.getByText("Formato incorrecto. Ejemplo: 1d4 + 1d8 - 3d5"),
    ).toBeInTheDocument();
    // Clear error on new input
    fireEvent.change(input, { target: { value: "1d6" } });
    expect(
      screen.queryByText("Formato incorrecto. Ejemplo: 1d4 + 1d8 - 3d5"),
    ).not.toBeInTheDocument();
  });

  it("does not trigger roll when Enter key is not pressed", () => {
    const onRollExpression = vi.fn();
    render(
      <ChatDiceRollerPanel
        {...DEFAULT_PROPS}
        onRollExpression={onRollExpression}
      />,
    );
    const input = screen.getByPlaceholderText("1d4 + 1d8 - 3d5");
    fireEvent.change(input, { target: { value: "2d6" } });
    fireEvent.keyDown(input, { key: "Space" });
    expect(onRollExpression).not.toHaveBeenCalled();
  });

  it("clears input after successful custom roll", () => {
    render(<ChatDiceRollerPanel {...DEFAULT_PROPS} />);
    const input = screen.getByPlaceholderText(
      "1d4 + 1d8 - 3d5",
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "3d8" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(input.value).toBe("");
  });
});
