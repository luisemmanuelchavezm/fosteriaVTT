// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

vi.mock("../../../screens/personaje/utils/statisticsUtils", () => ({
  ABILITY_STATS: [
    { id: "fue", name: "Fuerza" },
    { id: "des", name: "Destreza" },
  ],
  formatAbilityModifier: (value: number) => `${value >= 10 ? "+" : ""}${value}`,
}));
vi.mock("../../../screens/personaje/dndcharactersheet/utils", () => ({
  getProficiencyBonus: () => 2,
  getStatValue: (_character: unknown, statName: string) =>
    statName === "Fuerza" ? 14 : 12,
}));

import StatisticsSection from "../../../screens/personaje/dndcharactersheet/components/StatisticsSection";

const baseProps = {
  character: { estadisticas: {} } as never,
  isEditMode: false,
  editableStatScores: { Fuerza: 15, Destreza: 13 },
  editableMovement: 35,
  editableMaxHp: 26,
  movement: 30,
  initiative: 3,
  armorClass: 16,
  hpDelta: "4",
  tempHpDelta: "2",
  currentHp: 22,
  tempHp: 5,
  totalHp: 24,
  onHpDeltaChange: vi.fn(),
  onTempHpDeltaChange: vi.fn(),
  onHeal: vi.fn(),
  onDamage: vi.fn(),
  onGainTempHp: vi.fn(),
  onLoseTempHp: vi.fn(),
  onRollAbilityCheck: vi.fn(),
  onRollInitiative: vi.fn(),
  onIncrementHpDelta: vi.fn(),
  onDecrementHpDelta: vi.fn(),
  onIncrementTempHpDelta: vi.fn(),
  onDecrementTempHpDelta: vi.fn(),
  onStatScoreChange: vi.fn(),
  onMovementChange: vi.fn(),
  onMaxHpChange: vi.fn(),
  resourcesSlot: <div data-testid="resources-slot">resources</div>,
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("StatisticsSection", () => {
  it("renders read-only stats and triggers action buttons", () => {
    render(<StatisticsSection {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: /Fuerza/i }));
    fireEvent.click(screen.getByRole("button", { name: /Iniciativa/i }));
    fireEvent.click(screen.getByRole("button", { name: "Curar" }));
    fireEvent.click(screen.getByRole("button", { name: "Danio" }));
    fireEvent.click(screen.getByRole("button", { name: "Temp +" }));
    fireEvent.click(screen.getByRole("button", { name: "Temp -" }));

    expect(baseProps.onRollAbilityCheck).toHaveBeenCalledWith("Fuerza");
    expect(baseProps.onRollInitiative).toHaveBeenCalled();
    expect(baseProps.onHeal).toHaveBeenCalled();
    expect(baseProps.onDamage).toHaveBeenCalled();
    expect(baseProps.onGainTempHp).toHaveBeenCalled();
    expect(baseProps.onLoseTempHp).toHaveBeenCalled();
    expect(screen.getByTestId("resources-slot")).toBeInTheDocument();
  });

  it("supports edit mode inputs for stats, movement and max hp", () => {
    render(<StatisticsSection {...baseProps} isEditMode />);

    fireEvent.change(screen.getByDisplayValue("15"), {
      target: { value: "18" },
    });
    fireEvent.change(screen.getByDisplayValue("13"), {
      target: { value: "16" },
    });
    fireEvent.change(screen.getByDisplayValue("35"), {
      target: { value: "40" },
    });
    fireEvent.change(screen.getByDisplayValue("26"), {
      target: { value: "30" },
    });

    const textInputs = screen.getAllByRole("textbox");
    fireEvent.change(textInputs[0], { target: { value: "7" } });
    fireEvent.change(textInputs[1], { target: { value: "3" } });

    fireEvent.click(screen.getAllByRole("button", { name: "+" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "-" })[0]);

    expect(baseProps.onStatScoreChange).toHaveBeenCalledWith("Fuerza", 18);
    expect(baseProps.onStatScoreChange).toHaveBeenCalledWith("Destreza", 16);
    expect(baseProps.onMovementChange).toHaveBeenCalledWith(40);
    expect(baseProps.onMaxHpChange).toHaveBeenCalledWith(30);
    expect(baseProps.onHpDeltaChange).toHaveBeenCalledWith("7");
    expect(baseProps.onTempHpDeltaChange).toHaveBeenCalledWith("3");
    expect(baseProps.onDecrementHpDelta).toHaveBeenCalled();
  });
});
