// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import StatisticsSelectionSection from "../../../screens/personaje/creatednd/sections/StatisticsSelectionSection";
import { ABILITY_STATS } from "../../../screens/personaje/creatednd/utils/statisticsUtils";

const hookState = vi.hoisted(() => ({
  current: {} as Record<string, unknown>,
}));

const useStatisticsSelectionMock = vi.hoisted(() => vi.fn());
const computeRaceAbilityBonusesMock = vi.hoisted(() => vi.fn());

vi.mock(
  "../../../screens/personaje/creatednd/hooks/useStatisticsSelection",
  () => ({
    useStatisticsSelection: useStatisticsSelectionMock,
  }),
);

vi.mock("../../../screens/personaje/creatednd/utils/raceBonuses", () => ({
  computeRaceAbilityBonuses: computeRaceAbilityBonusesMock,
}));

vi.mock(
  "../../../screens/personaje/creatednd/sections/statistics/StatisticsSummaryGrid",
  () => ({
    default: () => <div>statistics-summary-grid</div>,
  }),
);

vi.mock(
  "../../../screens/personaje/creatednd/sections/statistics/DiceMethodSection",
  () => ({
    default: () => <div>dice-method-section</div>,
  }),
);

vi.mock(
  "../../../screens/personaje/creatednd/sections/statistics/StandardMethodSection",
  () => ({
    default: () => <div>standard-method-section</div>,
  }),
);

vi.mock(
  "../../../screens/personaje/creatednd/sections/statistics/PointBuyMethodSection",
  () => ({
    default: () => <div>point-buy-method-section</div>,
  }),
);

function buildStatisticsState(
  overrides: Partial<Record<string, unknown>> = {},
) {
  return {
    customScores: {},
    diceRounds: [],
    enteredRoundId: null,
    enteringRoundId: null,
    activeRollContext: null,
    diceBoxError: null,
    diceStatusMessage: null,
    diceBoxHostId: "dice-host",
    handleAddDiceRound: vi.fn(),
    runDiceSlotRoll: vi.fn(),
    handleDiceAssignmentChange: vi.fn(),
    handleMethodChange: vi.fn(),
    handleCustomScoreChange: vi.fn(),
    handleStandardAssignmentChange: vi.fn(),
    handlePointBuyChange: vi.fn(),
    preloadDiceBox: vi.fn(),
    renderStatValue: vi.fn(),
    getStatNumericValue: vi.fn((statId: string) =>
      statId === "fuerza" ? 15 : 10,
    ),
    pointBuyScores: {},
    remainingPointBuy: 27,
    selectedMethod: "dice",
    standardAssignments: {},
    usedStandardValues: [],
    ...overrides,
  };
}

describe("creacion de personaje - StatisticsSelectionSection", () => {
  beforeEach(() => {
    hookState.current = buildStatisticsState();
    useStatisticsSelectionMock.mockImplementation(() => hookState.current);
    computeRaceAbilityBonusesMock.mockReturnValue({ bonuses: { fuerza: 2 } });
  });

  it("emite el snapshot resuelto y precarga los dados cuando la sección está activa", async () => {
    const onSelectionChange = vi.fn();

    render(
      <StatisticsSelectionSection
        raceSelection={{ selectedRaceId: "elf" } as never}
        isActive
        onSelectionChange={onSelectionChange}
      />,
    );

    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalled();
    });

    expect(computeRaceAbilityBonusesMock).toHaveBeenCalledWith({
      selectedRaceId: "elf",
    });
    expect(useStatisticsSelectionMock).toHaveBeenCalledWith({ fuerza: 2 });
    expect(hookState.current.preloadDiceBox).toHaveBeenCalledTimes(1);
    expect(onSelectionChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        selectedMethod: "dice",
        resolvedScores: ABILITY_STATS.reduce<Record<string, number | null>>(
          (accumulator, stat) => {
            accumulator[stat.id] = stat.id === "fuerza" ? 15 : 10;
            return accumulator;
          },
          {},
        ),
      }),
    );
    expect(screen.getByText("dice-method-section")).toBeInTheDocument();
    expect(screen.getByText("statistics-summary-grid")).toBeInTheDocument();
  });

  it("delegá el cambio de método y muestra el bloque estándar", () => {
    hookState.current = buildStatisticsState({ selectedMethod: "standard" });

    render(
      <StatisticsSelectionSection
        raceSelection={null}
        onSelectionChange={vi.fn()}
      />,
    );

    expect(screen.getByText("standard-method-section")).toBeInTheDocument();
    expect(screen.queryByText("dice-method-section")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Metodo de generacion"), {
      target: { value: "custom" },
    });

    expect(hookState.current.handleMethodChange).toHaveBeenCalledWith("custom");
    expect(hookState.current.preloadDiceBox).not.toHaveBeenCalled();
  });

  it("muestra los bloques de point-buy y custom según el método activo", () => {
    hookState.current = buildStatisticsState({ selectedMethod: "point-buy" });

    const { rerender } = render(
      <StatisticsSelectionSection
        raceSelection={null}
        onSelectionChange={vi.fn()}
      />,
    );

    expect(screen.getByText("point-buy-method-section")).toBeInTheDocument();

    hookState.current = buildStatisticsState({ selectedMethod: "custom" });
    rerender(
      <StatisticsSelectionSection
        raceSelection={null}
        onSelectionChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Custom")).toBeInTheDocument();
    expect(
      screen.queryByText("point-buy-method-section"),
    ).not.toBeInTheDocument();
  });
});
