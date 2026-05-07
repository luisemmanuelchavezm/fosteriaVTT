import { useEffect } from "react";
import "@3d-dice/dice-box/dist/style.css";
import DiceMethodSection from "./statistics/DiceMethodSection";
import PointBuyMethodSection from "./statistics/PointBuyMethodSection";
import StandardMethodSection from "./statistics/StandardMethodSection";
import StatisticsSummaryGrid from "./statistics/StatisticsSummaryGrid";
import { useStatisticsSelection } from "../hooks/useStatisticsSelection";
import type {
  CharacterStatisticsSnapshot,
  RaceSelectionSnapshot,
} from "../../types";
import { computeRaceAbilityBonuses } from "../utils/raceBonuses";
import {
  ABILITY_STATS,
  METHOD_OPTIONS,
  PANEL_CLASSES,
  SELECT_CLASSES,
} from "../utils/statisticsUtils";

interface StatisticsSelectionSectionProps {
  raceSelection: RaceSelectionSnapshot | null;
  isActive?: boolean;
  onSelectionChange?: (selection: CharacterStatisticsSnapshot) => void;
  fieldErrors?: Record<string, string>;
  hasError?: boolean;
}

export default function StatisticsSelectionSection({
  raceSelection,
  isActive = false,
  onSelectionChange,
  fieldErrors = {},
  hasError = false,
}: StatisticsSelectionSectionProps) {
  const racialBonuses = computeRaceAbilityBonuses(raceSelection);
  const statistics = useStatisticsSelection(racialBonuses.bonuses);
  const {
    customScores,
    diceRounds,
    getStatNumericValue,
    pointBuyScores,
    selectedMethod,
    standardAssignments,
  } = statistics;

  useEffect(() => {
    onSelectionChange?.({
      selectedMethod,
      diceRounds,
      standardAssignments,
      pointBuyScores,
      customScores,
      resolvedScores: ABILITY_STATS.reduce<Record<string, number | null>>(
        (accumulator, stat) => {
          accumulator[stat.id] = getStatNumericValue(stat.id);
          return accumulator;
        },
        {},
      ),
    });
  }, [
    customScores,
    diceRounds,
    getStatNumericValue,
    onSelectionChange,
    pointBuyScores,
    selectedMethod,
    standardAssignments,
  ]);

  useEffect(() => {
    if (!isActive || statistics.selectedMethod !== "dice") {
      return;
    }

    statistics.preloadDiceBox();
  }, [isActive, statistics]);

  return (
    <section className="mt-10">
      <div
        className={`rounded-[28px] border bg-[linear-gradient(180deg,rgba(12,10,9,0.72),rgba(41,37,36,0.18))] p-6 transition ${
          hasError ? "border-rose-400/45" : "border-stone-300/10"
        }`}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Estadísticas</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-300">
              Define las seis puntuaciones base de tu personaje eligiendo entre
              tirada de dados, puntuaciones estandar, compra de puntuaciones o
              un modo custom editable.
            </p>
          </div>

          <div className="w-full md:max-w-[380px]">
            <label
              className="mb-2 block text-sm font-semibold text-amber-100/85"
              htmlFor="stats-method-select"
            >
              Metodo de generacion
            </label>
            <div className="relative">
              <select
                id="stats-method-select"
                value={statistics.selectedMethod}
                onChange={(event) =>
                  statistics.handleMethodChange(
                    event.target.value as (typeof METHOD_OPTIONS)[number]["id"],
                  )
                }
                className={`${SELECT_CLASSES} pr-10`}
              >
                {METHOD_OPTIONS.map((method) => (
                  <option
                    key={method.id}
                    value={method.id}
                    className="bg-stone-950 text-white"
                  >
                    {method.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone-300">
                ▾
              </span>
            </div>
          </div>
        </div>

        <StatisticsSummaryGrid
          selectedMethod={statistics.selectedMethod}
          renderStatValue={statistics.renderStatValue}
          getStatNumericValue={statistics.getStatNumericValue}
          onCustomScoreChange={statistics.handleCustomScoreChange}
          fieldErrors={fieldErrors}
        />

        <div className="mt-8 space-y-6">
          {statistics.selectedMethod === "dice" ? (
            <DiceMethodSection
              diceRounds={statistics.diceRounds}
              enteringRoundId={statistics.enteringRoundId}
              enteredRoundId={statistics.enteredRoundId}
              activeRollContext={statistics.activeRollContext}
              diceBoxError={statistics.diceBoxError}
              diceStatusMessage={statistics.diceStatusMessage}
              diceBoxHostId={statistics.diceBoxHostId}
              onAddRound={statistics.handleAddDiceRound}
              onRollSlot={statistics.runDiceSlotRoll}
              onAssignSlot={statistics.handleDiceAssignmentChange}
            />
          ) : null}

          {statistics.selectedMethod === "standard" ? (
            <StandardMethodSection
              standardAssignments={statistics.standardAssignments}
              usedStandardValues={statistics.usedStandardValues}
              fieldErrors={fieldErrors}
              onAssignmentChange={statistics.handleStandardAssignmentChange}
            />
          ) : null}

          {statistics.selectedMethod === "point-buy" ? (
            <PointBuyMethodSection
              pointBuyScores={statistics.pointBuyScores}
              remainingPointBuy={statistics.remainingPointBuy}
              onScoreChange={statistics.handlePointBuyChange}
            />
          ) : null}

          {statistics.selectedMethod === "custom" ? (
            <div className={`${PANEL_CLASSES} p-6`}>
              <h3 className="text-lg font-semibold text-white">Custom</h3>
              <p className="mt-2 text-sm leading-6 text-stone-300">
                Pulsa directamente en las casillas blancas de arriba y escribe
                el valor que quieras para cada estadistica. El maximo permitido
                por casilla es 30.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
