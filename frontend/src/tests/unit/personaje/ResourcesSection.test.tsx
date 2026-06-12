// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";

vi.mock(
  "../../../screens/personaje/dndcharactersheet/utils/characterResources",
  () => ({
    extractExtraResources: () => [
      { index: 1, current: 2, max: 3 },
      { index: 2, current: 0, max: 0 },
    ],
  }),
);

import ResourcesSection from "../../../screens/personaje/dndcharactersheet/components/ResourcesSection";

const character = {
  estadisticas: {
    "Hechizos nivel 1": 4,
    "Hechizos nivel 2": 2,
  },
} as never;

const baseProps = {
  character,
  currentSpellSlots: { 1: 3, 2: 1 },
  spellSlotMaximums: { 1: 4, 2: 2 },
  currentExtraResources: { 1: 1 },
  extraResourceMaximums: { 1: 5 },
  currentMoney: { ppt: 1, po: 9, pp: 3, pc: 12 },
  onAdjustSpellSlot: vi.fn(),
  onAdjustSpellSlotMax: vi.fn(),
  onAdjustExtraResource: vi.fn(),
  onAdjustExtraResourceMax: vi.fn(),
  onAdjustMoney: vi.fn(),
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ResourcesSection", () => {
  it("adjusts spell slots from the default spells tab", () => {
    render(<ResourcesSection {...baseProps} />);

    const spellOneCard = screen.getAllByText("1")[0].closest("article");
    expect(spellOneCard).not.toBeNull();

    const buttons = within(spellOneCard as HTMLElement).getAllByRole("button");
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);

    expect(baseProps.onAdjustSpellSlot).toHaveBeenNthCalledWith(1, 1, 1);
    expect(baseProps.onAdjustSpellSlot).toHaveBeenNthCalledWith(2, 1, -1);
  });

  it("shows and updates extra resources in edit mode", () => {
    render(<ResourcesSection {...baseProps} isEditMode />);

    fireEvent.click(screen.getByRole("button", { name: "Extra" }));

    expect(screen.getByText(/Gestionar recursos extra/i)).toBeInTheDocument();

    const extraOneCard = screen.getByText("Extra 1").closest("article");
    expect(extraOneCard).not.toBeNull();

    const buttons = within(extraOneCard as HTMLElement).getAllByRole("button");
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    fireEvent.click(buttons[2]);
    fireEvent.click(buttons[3]);

    expect(baseProps.onAdjustExtraResource).toHaveBeenNthCalledWith(1, 1, 1);
    expect(baseProps.onAdjustExtraResource).toHaveBeenNthCalledWith(2, 1, -1);
    expect(baseProps.onAdjustExtraResourceMax).toHaveBeenNthCalledWith(1, 1, 1);
    expect(baseProps.onAdjustExtraResourceMax).toHaveBeenNthCalledWith(
      2,
      1,
      -1,
    );
  });

  it("shows extra resources in non-edit mode (grid layout)", () => {
    // isEditMode is false by default — covers the 'grid' className branch
    render(<ResourcesSection {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Extra" }));
    expect(screen.getByText(/Gestionar recursos extra/i)).toBeInTheDocument();
    // Extra resources should be visible without edit-mode controls
    expect(screen.getByText("Extra 1")).toBeInTheDocument();
  });

  it("switches to money tab and adjusts currencies", () => {
    render(<ResourcesSection {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: "Dinero" }));

    const goldCard = screen.getByText("Oro").closest("article");
    expect(goldCard).not.toBeNull();

    const buttons = within(goldCard as HTMLElement).getAllByRole("button");
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);

    expect(baseProps.onAdjustMoney).toHaveBeenNthCalledWith(1, "po", -1);
    expect(baseProps.onAdjustMoney).toHaveBeenNthCalledWith(2, "po", 1);
  });
});
