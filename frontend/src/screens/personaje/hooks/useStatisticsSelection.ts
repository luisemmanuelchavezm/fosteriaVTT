import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildScoreFromDiceValues,
  createDiceRound,
  createInitialAssignments,
  CUSTOM_SCORE_MAX,
  MAX_DICE_ROUNDS,
  POINT_BUY_BASE_SCORE,
  POINT_BUY_COSTS,
  POINT_BUY_MAX,
  POINT_BUY_MIN,
  POINT_BUY_TOTAL,
  type ActiveRollContext,
  type DiceBoxRollResult,
  type DiceRound,
  type StatsMethod,
} from "../utils/statisticsUtils";

interface DiceBoxInstance {
  init?: () => Promise<void>;
  clear?: () => void;
  roll?: (notation: string | string[]) => unknown;
  show?: () => void;
}

export function useStatisticsSelection(racialBonuses: Record<string, number>) {
  const roundCounterRef = useRef(1);
  const roundAnimationTimeoutRef = useRef<number | null>(null);
  const diceClearTimeoutRef = useRef<number | null>(null);
  const diceBoxHostIdRef = useRef(
    `stats-dice-box-${Math.random().toString(36).slice(2, 10)}`,
  );
  const diceBoxInstanceRef = useRef<DiceBoxInstance | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<StatsMethod>("dice");
  const [diceRounds, setDiceRounds] = useState<DiceRound[]>(() => [
    createDiceRound(1),
  ]);
  const [enteringRoundId, setEnteringRoundId] = useState<string | null>(null);
  const [enteredRoundId, setEnteredRoundId] = useState<string | null>(null);
  const [activeRollContext, setActiveRollContext] =
    useState<ActiveRollContext | null>(null);
  const [isDiceBoxReady, setIsDiceBoxReady] = useState(false);
  const [diceBoxError, setDiceBoxError] = useState<string | null>(null);
  const [standardAssignments, setStandardAssignments] = useState<
    Record<string, string>
  >(() => createInitialAssignments(""));
  const [pointBuyScores, setPointBuyScores] = useState<Record<string, number>>(
    () => createInitialAssignments(POINT_BUY_BASE_SCORE),
  );
  const [customScores, setCustomScores] = useState<Record<string, string>>(() =>
    createInitialAssignments(""),
  );

  const clearRoundAnimationTimer = () => {
    if (roundAnimationTimeoutRef.current !== null) {
      window.clearTimeout(roundAnimationTimeoutRef.current);
      roundAnimationTimeoutRef.current = null;
    }
  };

  const clearDiceClearTimer = () => {
    if (diceClearTimeoutRef.current !== null) {
      window.clearTimeout(diceClearTimeoutRef.current);
      diceClearTimeoutRef.current = null;
    }
  };

  const scheduleDiceBoxClear = () => {
    clearDiceClearTimer();
    diceClearTimeoutRef.current = window.setTimeout(() => {
      diceBoxInstanceRef.current?.clear?.();
      diceClearTimeoutRef.current = null;
    }, 4000);
  };

  const runDiceSlotRoll = (roundId: string, slotIndex: number) => {
    clearDiceClearTimer();
    setActiveRollContext({ roundId, slotIndex });
    setDiceBoxError(null);
    setDiceRounds((current) =>
      current.map((round) =>
        round.id === roundId
          ? {
              ...round,
              slots: round.slots.map((slot, index) =>
                index === slotIndex
                  ? {
                      ...slot,
                      total: null,
                      rolls: [],
                      assignedStatId: "",
                    }
                  : slot,
              ),
            }
          : round,
      ),
    );

    diceBoxInstanceRef.current?.clear?.();

    try {
      const rollResult = diceBoxInstanceRef.current?.roll?.("4d6");

      if (
        rollResult &&
        typeof (rollResult as Promise<unknown>).then === "function"
      ) {
        void (rollResult as Promise<DiceBoxRollResult[]>)
          .then((results) => {
            const values = results
              .map((result) => result.value)
              .filter((value): value is number => typeof value === "number");

            if (values.length !== 4) {
              throw new Error("La tirada 3D no devolvio 4 resultados validos");
            }

            const scoreResult = buildScoreFromDiceValues(values);

            setDiceRounds((current) =>
              current.map((round) =>
                round.id === roundId
                  ? {
                      ...round,
                      slots: round.slots.map((slot, index) =>
                        index === slotIndex
                          ? {
                              total: scoreResult.total,
                              rolls: scoreResult.rolls,
                              assignedStatId: "",
                            }
                          : slot,
                      ),
                    }
                  : round,
              ),
            );
            setActiveRollContext(null);
            scheduleDiceBoxClear();
          })
          .catch((error) => {
            const message =
              error instanceof Error
                ? error.message
                : "Error desconocido al lanzar los dados 3D";
            setActiveRollContext(null);
            setDiceBoxError(`Dice-Box no pudo mostrar la tirada: ${message}`);
            scheduleDiceBoxClear();
          });
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error desconocido al lanzar los dados 3D";
      setActiveRollContext(null);
      setDiceBoxError(`Dice-Box no pudo mostrar la tirada: ${message}`);
      scheduleDiceBoxClear();
    }
  };

  useEffect(() => {
    if (selectedMethod !== "dice") {
      clearRoundAnimationTimer();
      clearDiceClearTimer();
      diceBoxInstanceRef.current?.clear?.();
      setActiveRollContext(null);
      return;
    }

    if (diceBoxInstanceRef.current || isDiceBoxReady || diceBoxError) {
      return;
    }

    let cancelled = false;

    const initDiceBox = async () => {
      try {
        const module = (await import("@3d-dice/dice-box")) as {
          default: new (config: {
            container: string;
            assetPath: string;
            offscreen?: boolean;
            scale?: number;
            throwForce?: number;
            spinForce?: number;
            startingHeight?: number;
          }) => DiceBoxInstance;
        };

        if (cancelled) {
          return;
        }

        const DiceBox = module.default;
        const instance = new DiceBox({
          container: `#${diceBoxHostIdRef.current}`,
          assetPath: "/assets/dice-box/",
          offscreen: false,
          scale: 3.1,
          throwForce: 3.2,
          spinForce: 3.8,
          startingHeight: 5,
        });

        await new Promise<void>((resolve) => {
          window.requestAnimationFrame(() => resolve());
        });

        await instance.init?.();

        if (cancelled) {
          return;
        }

        const host = document.getElementById(diceBoxHostIdRef.current);
        const canvas = host?.querySelector(
          "canvas",
        ) as HTMLCanvasElement | null;

        if (host) {
          host.style.position = "relative";
          host.style.width = "100%";
          host.style.height = "100%";
        }

        if (canvas) {
          canvas.style.display = "block";
          canvas.style.width = "100%";
          canvas.style.height = "100%";
          canvas.style.position = "absolute";
          canvas.style.inset = "0";
        }

        instance.show?.();

        await new Promise<void>((resolve) => {
          window.requestAnimationFrame(() => {
            window.dispatchEvent(new Event("resize"));
            resolve();
          });
        });

        diceBoxInstanceRef.current = instance;
        setIsDiceBoxReady(true);
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "Error desconocido";
          setDiceBoxError(`No se pudo inicializar Dice-Box: ${message}`);
          setIsDiceBoxReady(false);
        }
      }
    };

    void initDiceBox();

    return () => {
      cancelled = true;
    };
  }, [selectedMethod, isDiceBoxReady, diceBoxError]);

  useEffect(() => {
    return () => {
      clearRoundAnimationTimer();
      clearDiceClearTimer();
    };
  }, []);

  const remainingPointBuy = useMemo(() => {
    const spent = Object.values(pointBuyScores).reduce(
      (sum, score) => sum + POINT_BUY_COSTS[score],
      0,
    );
    return POINT_BUY_TOTAL - spent;
  }, [pointBuyScores]);

  const diceValueByStat = useMemo(() => {
    return diceRounds.reduce<Record<string, number | null>>(
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
  }, [diceRounds]);

  const usedStandardValues = useMemo(
    () => Object.values(standardAssignments).filter(Boolean),
    [standardAssignments],
  );

  const handleMethodChange = (method: StatsMethod) => {
    setSelectedMethod(method);

    if (method === "dice") {
      roundCounterRef.current = 1;
      setDiceRounds([createDiceRound(1)]);
      setActiveRollContext(null);
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
  };

  const handleAddDiceRound = () => {
    if (activeRollContext !== null) {
      return;
    }

    roundCounterRef.current += 1;
    const nextRound = createDiceRound(roundCounterRef.current);

    setDiceRounds((current) =>
      [nextRound, ...current].slice(0, MAX_DICE_ROUNDS),
    );

    clearRoundAnimationTimer();
    setEnteringRoundId(nextRound.id);
    setEnteredRoundId(null);
    window.requestAnimationFrame(() => {
      setEnteredRoundId(nextRound.id);
      roundAnimationTimeoutRef.current = window.setTimeout(() => {
        setEnteringRoundId(null);
        setEnteredRoundId(null);
        roundAnimationTimeoutRef.current = null;
      }, 650);
    });
  };

  const handleDiceAssignmentChange = (
    roundId: string,
    slotIndex: number,
    statId: string,
  ) => {
    setDiceRounds((current) =>
      current.map((round) => ({
        ...round,
        slots: round.slots.map((slot, index) => {
          if (statId && round.id !== roundId) {
            return {
              ...slot,
              assignedStatId: "",
            };
          }

          if (round.id === roundId && index === slotIndex) {
            return {
              ...slot,
              assignedStatId: statId,
            };
          }

          if (statId && slot.assignedStatId === statId) {
            return {
              ...slot,
              assignedStatId: "",
            };
          }

          return slot;
        }),
      })),
    );
  };

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

  const renderStatValue = (statId: string) => {
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
  };

  const getStatNumericValue = (statId: string) => {
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
  };

  return {
    selectedMethod,
    handleMethodChange,
    diceRounds,
    enteringRoundId,
    enteredRoundId,
    activeRollContext,
    isDiceBoxReady,
    diceBoxError,
    standardAssignments,
    usedStandardValues,
    pointBuyScores,
    remainingPointBuy,
    customScores,
    diceBoxHostId: diceBoxHostIdRef.current,
    diceStatusMessage:
      activeRollContext !== null
        ? "Dados en movimiento"
        : !isDiceBoxReady
          ? "Preparando Dice-Box"
          : null,
    handleAddDiceRound,
    runDiceSlotRoll,
    handleDiceAssignmentChange,
    handleStandardAssignmentChange,
    handlePointBuyChange,
    handleCustomScoreChange,
    renderStatValue,
    getStatNumericValue,
  };
}
