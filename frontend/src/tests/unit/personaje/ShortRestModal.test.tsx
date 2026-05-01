// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import ShortRestModal from "../../../screens/personaje/dndcharactersheet/components/ShortRestModal";

afterEach(() => {
  cleanup();
});

const hitDiceEntries = [
  { die: "d10", total: 3, current: 3 },
  { die: "d6", total: 2, current: 2 },
];

const defaultProps = {
  isOpen: true,
  hitDiceEntries,
  currentHitDice: { d10: 3, d6: 2 },
  shortRestHitDiceCounts: { d10: 0, d6: 0 },
  onCountsChange: vi.fn(),
  onClose: vi.fn(),
  onConfirm: vi.fn(),
};

describe("ShortRestModal", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <ShortRestModal {...defaultProps} isOpen={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when hitDiceEntries is empty", () => {
    const { container } = render(
      <ShortRestModal {...defaultProps} hitDiceEntries={[]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders modal with die entries when open", () => {
    render(<ShortRestModal {...defaultProps} />);

    expect(screen.getByText("Descanso corto")).toBeInTheDocument();
    expect(screen.getByText(/dados d10/)).toBeInTheDocument();
    expect(screen.getByText(/dados d6/)).toBeInTheDocument();
  });

  it("calls onClose when Cancelar button is clicked", () => {
    const onClose = vi.fn();
    render(<ShortRestModal {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByText("Cancelar"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm when Aplicar descanso button is clicked", () => {
    const onConfirm = vi.fn();
    render(<ShortRestModal {...defaultProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByText("Aplicar descanso"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCountsChange with increment when + button is clicked", () => {
    const onCountsChange = vi.fn();
    render(
      <ShortRestModal {...defaultProps} onCountsChange={onCountsChange} />,
    );

    // Find all + buttons and click the first one (d10 entry)
    const plusButtons = screen.getAllByText("+");
    fireEvent.click(plusButtons[0]);
    expect(onCountsChange).toHaveBeenCalledTimes(1);

    // Verify the updater function increments correctly
    const updater = onCountsChange.mock.calls[0][0];
    const result = updater({ d10: 0, d6: 0 });
    expect(result.d10).toBe(1);
  });

  it("calls onCountsChange with decrement when - button is clicked", () => {
    const onCountsChange = vi.fn();
    render(
      <ShortRestModal
        {...defaultProps}
        shortRestHitDiceCounts={{ d10: 2, d6: 1 }}
        onCountsChange={onCountsChange}
      />,
    );

    const minusButtons = screen.getAllByText("-");
    fireEvent.click(minusButtons[0]);
    expect(onCountsChange).toHaveBeenCalledTimes(1);

    const updater = onCountsChange.mock.calls[0][0];
    const result = updater({ d10: 2, d6: 1 });
    expect(result.d10).toBe(1);
  });
});
