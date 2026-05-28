// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import DiceMethodSection from "../../../screens/personaje/creatednd/sections/statistics/DiceMethodSection";
import type {
  DiceRound,
  ActiveRollContext,
} from "../../../screens/personaje/creatednd/utils/statisticsUtils";

function makeSlot(
  total: number | null,
  rolls: number[] = [],
  assignedStatId = "",
) {
  return { total, rolls, assignedStatId };
}

function makeRound(
  id: string,
  slots: ReturnType<typeof makeSlot>[] = [],
): DiceRound {
  return { id, label: 1, slots };
}

const BASE_PROPS = {
  diceRounds: [] as DiceRound[],
  enteringRoundId: null,
  enteredRoundId: null,
  activeRollContext: null as ActiveRollContext | null,
  diceBoxError: null,
  diceStatusMessage: null,
  diceBoxHostId: "dice-box-host",
  onAddRound: vi.fn(),
  onRollSlot: vi.fn(),
  onAssignSlot: vi.fn(),
};

describe("DiceMethodSection", () => {
  it("renders the title and description", () => {
    render(<DiceMethodSection {...BASE_PROPS} />);
    expect(screen.getByText("Tirada de Dados")).toBeInTheDocument();
    expect(screen.getByText(/Cada ranura tira 4d6/)).toBeInTheDocument();
  });

  it("renders 'Nueva ronda' button", () => {
    render(<DiceMethodSection {...BASE_PROPS} />);
    expect(screen.getByText("Nueva ronda")).toBeInTheDocument();
  });

  it("calls onAddRound when 'Nueva ronda' is clicked", () => {
    const onAddRound = vi.fn();
    render(<DiceMethodSection {...BASE_PROPS} onAddRound={onAddRound} />);
    fireEvent.click(screen.getByText("Nueva ronda"));
    expect(onAddRound).toHaveBeenCalled();
  });

  it("'Nueva ronda' is disabled when activeRollContext is set", () => {
    render(
      <DiceMethodSection
        {...BASE_PROPS}
        activeRollContext={{ roundId: "r1", slotIndex: 0 }}
      />,
    );
    const btn = screen.getByText("Nueva ronda") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("shows diceBoxError when provided", () => {
    render(
      <DiceMethodSection
        {...BASE_PROPS}
        diceBoxError="Error al cargar dados"
      />,
    );
    expect(screen.getByText("Error al cargar dados")).toBeInTheDocument();
  });

  it("shows diceStatusMessage when provided", () => {
    render(
      <DiceMethodSection
        {...BASE_PROPS}
        diceStatusMessage="Tirando dados..."
      />,
    );
    expect(screen.getByText("Tirando dados...")).toBeInTheDocument();
  });

  it("renders a round with 6 dice slots", () => {
    const slots = Array.from({ length: 6 }, () => makeSlot(null, [], ""));
    const round = makeRound("round-1", slots);
    render(<DiceMethodSection {...BASE_PROPS} diceRounds={[round]} />);
    // Each slot shows "Tirada N" and "Tirar dados" button
    expect(screen.getAllByText("Tirar dados").length).toBe(6);
  });

  it("calls onRollSlot when 'Tirar dados' is clicked", () => {
    const onRollSlot = vi.fn();
    const slots = [makeSlot(null, [], "")];
    const round = makeRound("round-1", slots);
    render(
      <DiceMethodSection
        {...BASE_PROPS}
        diceRounds={[round]}
        onRollSlot={onRollSlot}
      />,
    );
    fireEvent.click(screen.getByText("Tirar dados"));
    expect(onRollSlot).toHaveBeenCalledWith("round-1", 0);
  });

  it("shows 'Tirando...' when that slot is actively rolling", () => {
    const slots = [makeSlot(null, [], "")];
    const round = makeRound("round-1", slots);
    render(
      <DiceMethodSection
        {...BASE_PROPS}
        diceRounds={[round]}
        activeRollContext={{ roundId: "round-1", slotIndex: 0 }}
      />,
    );
    expect(screen.getByText("Tirando...")).toBeInTheDocument();
  });

  it("shows slot total when slot has been rolled", () => {
    const slots = [makeSlot(14, [4, 5, 6, 3], "")];
    const round = makeRound("round-1", slots);
    render(<DiceMethodSection {...BASE_PROPS} diceRounds={[round]} />);
    expect(screen.getByText("14")).toBeInTheDocument();
  });

  it("shows dice rolls for each slot when rolled", () => {
    const slots = [makeSlot(15, [6, 5, 4, 3], "")];
    const round = makeRound("round-1", slots);
    render(<DiceMethodSection {...BASE_PROPS} diceRounds={[round]} />);
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("shows 'Aun no tirada' when slot has no rolls", () => {
    const slots = [makeSlot(null, [], "")];
    const round = makeRound("round-1", slots);
    render(<DiceMethodSection {...BASE_PROPS} diceRounds={[round]} />);
    expect(screen.getByText("Aun no tirada")).toBeInTheDocument();
  });

  it("shows assign select when slot has a total", () => {
    const slots = [makeSlot(14, [4, 5, 6, 3], "")];
    const round = makeRound("round-1", slots);
    render(<DiceMethodSection {...BASE_PROPS} diceRounds={[round]} />);
    // Should show a select with "Elige estadistica"
    expect(screen.getByText("Elige estadistica")).toBeInTheDocument();
  });

  it("calls onAssignSlot when stat is selected", () => {
    const onAssignSlot = vi.fn();
    const slots = [makeSlot(14, [4, 5, 6, 3], "")];
    const round = makeRound("round-1", slots);
    render(
      <DiceMethodSection
        {...BASE_PROPS}
        diceRounds={[round]}
        onAssignSlot={onAssignSlot}
      />,
    );
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "strength" } });
    expect(onAssignSlot).toHaveBeenCalledWith("round-1", 0, "strength");
  });

  it("renders multiple rounds", () => {
    const slot = makeSlot(null, [], "");
    const rounds = [makeRound("r1", [slot]), makeRound("r2", [slot])];
    render(<DiceMethodSection {...BASE_PROPS} diceRounds={rounds} />);
    const buttons = screen.getAllByText("Tirar dados");
    expect(buttons.length).toBe(2);
  });

  it("shows slot Tirada numbers (Tirada 1 through N)", () => {
    const slots = Array.from({ length: 6 }, () => makeSlot(null, [], ""));
    const round = makeRound("r1", slots);
    render(<DiceMethodSection {...BASE_PROPS} diceRounds={[round]} />);
    expect(screen.getByText("Tirada 1")).toBeInTheDocument();
    expect(screen.getByText("Tirada 6")).toBeInTheDocument();
  });
});
