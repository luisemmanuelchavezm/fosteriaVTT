import { useCallback, useMemo, useState } from "react";
import {
  createInitialAssignments,
  CUSTOM_SCORE_MAX,
  POINT_BUY_BASE_SCORE,
  POINT_BUY_COSTS,
  POINT_BUY_MAX,
  POINT_BUY_MIN,
  POINT_BUY_TOTAL,
  type StatsMethod,
} from "../utils/statisticsUtils";
import { useStatisticsDiceBox } from "./useStatisticsDiceBox";

export function useStatisticsSelection(racialBonuses: Record<string, number>) {
  const [selectedMethod, setSelectedMethod] = useState<StatsMethod>("dice");
  const [standardAssignments, setStandardAssignments] = useState<
    Record<string, string>
  >(() => createInitialAssignments(""));
  const [pointBuyScores, setPointBuyScores] = useState<Record<string, number>>(
    () => createInitialAssignments(POINT_BUY_BASE_SCORE),
  );
  const [customScores, setCustomScores] = useState<Record<string, string>>(() =>
    createInitialAssignments(""),
  );
  const diceBox = useStatisticsDiceBox(selectedMethod);

  const remainingPointBuy = useMemo(() => {
    const spent = Object.values(pointBuyScores).reduce(
      (sum, score) => sum + POINT_BUY_COSTS[score],
      0,
    );
    return POINT_BUY_TOTAL - spent;
  }, [pointBuyScores]);

  const diceValueByStat = useMemo(() => {
    return diceBox.diceRounds.reduce<Record<string, number | null>>(
      (accumulator, round) => {
        round.slots.forEach((slot) => {
          if (slot.assignedStatId && slot.total !== null) {
            accumulator[slot.assignedStatId] = slot.total;
          }
        });
        return accumulator;
      },
      createInitialAssignments<number | null>(null),
    );
  }, [diceBox.diceRounds]);

  const usedStandardValues = useMemo(
    () => Object.values(standardAssignments).filter(Boolean),
    [standardAssignments],
  );

  const handleMethodChange = useCallback(
    (method: StatsMethod) => {
      setSelectedMethod(method);

      if (method === "dice") {
        diceBox.resetDiceState();
        return;
      }

      if (method === "standard") {
        setStandardAssignments(createInitialAssignments(""));
        return;
      }

      if (method === "point-buy") {
        setPointBuyScores(createInitialAssignments(POINT_BUY_BASE_SCORE));
        return;
      }

      setCustomScores(createInitialAssignments(""));
    },
    [diceBox],
  );

  const handleStandardAssignmentChange = (statId: string, value: string) => {
    setStandardAssignments((current) => ({
      ...current,
      [statId]: value,
    }));
  };

  const handlePointBuyChange = (statId: string, delta: 1 | -1) => {
    setPointBuyScores((current) => {
      const currentScore = current[statId];
      const nextScore = currentScore + delta;

      if (nextScore < POINT_BUY_MIN || nextScore > POINT_BUY_MAX) {
        return current;
      }

      const currentCost = POINT_BUY_COSTS[currentScore];
      const nextCost = POINT_BUY_COSTS[nextScore];
      const nextRemaining =
        POINT_BUY_TOTAL -
        (Object.values(current).reduce(
          (sum, score) => sum + POINT_BUY_COSTS[score],
          0,
        ) -
          currentCost +
          nextCost);

      if (nextRemaining < 0) {
        return current;
      }

      return {
        ...current,
        [statId]: nextScore,
      };
    });
  };

  const handleCustomScoreChange = (statId: string, value: string) => {
    const digitsOnly = value.replace(/\D/g, "");

    if (digitsOnly === "") {
      setCustomScores((current) => ({
        ...current,
        [statId]: "",
      }));
      return;
    }

    const nextValue = Math.min(Number(digitsOnly), CUSTOM_SCORE_MAX).toString();
    setCustomScores((current) => ({
      ...current,
      [statId]: nextValue,
    }));
  };

  const renderStatValue = useCallback(
    (statId: string) => {
      const bonus = racialBonuses[statId] ?? 0;

      if (selectedMethod === "dice") {
        const baseValue = diceValueByStat[statId];
        return baseValue !== null && baseValue !== undefined
          ? bonus > 0
            ? `${baseValue}+${bonus}`
            : baseValue
          : "-";
      }

      if (selectedMethod === "standard") {
        const assignedValue = standardAssignments[statId]
          ? Number(standardAssignments[statId].split("-")[0])
          : null;
        return assignedValue !== null
          ? bonus > 0
            ? `${assignedValue}+${bonus}`
            : assignedValue
          : "-";
      }

      if (selectedMethod === "point-buy") {
        return bonus > 0
          ? `${pointBuyScores[statId]}+${bonus}`
          : pointBuyScores[statId];
      }

      return customScores[statId] || "";
    },
    [
      customScores,
      diceValueByStat,
      pointBuyScores,
      racialBonuses,
      selectedMethod,
      standardAssignments,
    ],
  );

  const getStatNumericValue = useCallback(
    (statId: string) => {
      if (selectedMethod === "dice") {
        const baseValue = diceValueByStat[statId];
        return baseValue !== null
          ? baseValue + (racialBonuses[statId] ?? 0)
          : null;
      }

      if (selectedMethod === "standard") {
        const assignedValue = standardAssignments[statId];
        return assignedValue
          ? Number(assignedValue.split("-")[0]) + (racialBonuses[statId] ?? 0)
          : null;
      }

      if (selectedMethod === "point-buy") {
        return pointBuyScores[statId] + (racialBonuses[statId] ?? 0);
      }

      return customScores[statId]
        ? Number(customScores[statId]) + (racialBonuses[statId] ?? 0)
        : null;
    },
    [
      customScores,
      diceValueByStat,
      pointBuyScores,
      racialBonuses,
      selectedMethod,
      standardAssignments,
    ],
  );

  return {
    selectedMethod,
    handleMethodChange,
    diceRounds: diceBox.diceRounds,
    enteringRoundId: diceBox.enteringRoundId,
    enteredRoundId: diceBox.enteredRoundId,
    activeRollContext: diceBox.activeRollContext,
    isDiceBoxReady: diceBox.isDiceBoxReady,
    diceBoxError: diceBox.diceBoxError,
    preloadDiceBox: diceBox.preloadDiceBox,
    standardAssignments,
    usedStandardValues,
    pointBuyScores,
    remainingPointBuy,
    customScores,
    diceBoxHostId: diceBox.diceBoxHostId,
    diceStatusMessage: diceBox.diceStatusMessage,
    handleAddDiceRound: diceBox.handleAddDiceRound,
    runDiceSlotRoll: diceBox.runDiceSlotRoll,
    handleDiceAssignmentChange: diceBox.handleDiceAssignmentChange,
    handleStandardAssignmentChange,
    handlePointBuyChange,
    handleCustomScoreChange,
    renderStatValue,
    getStatNumericValue,
  };
}
