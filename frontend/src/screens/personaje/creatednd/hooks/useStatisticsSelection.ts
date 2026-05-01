import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  type DiceRound,
  type StatsMethod,
} from "../utils/statisticsUtils";

interface DiceBoxInstance {
  init?: () => Promise<void>;
  clear?: () => void;
  roll?: (notation: string | string[]) => unknown;
  show?: () => void;
}

type DiceBoxInitPromise = Promise<DiceBoxInstance>;
const STAT_DICE_NOTATION = "4d6";
const STAT_DICE_COUNT = 4;
const STAT_DICE_FACES = 6;

function rollLocally(diceCount: number, diceFaces: number) {
  return Array.from(
    { length: diceCount },
    () => Math.floor(Math.random() * diceFaces) + 1,
  );
}

function extractDiceValues(payload: unknown): number[] {
  if (typeof payload === "number") {
    return Number.isInteger(payload) ? [payload] : [];
  }

  if (Array.isArray(payload)) {
    return payload.flatMap((entry) => extractDiceValues(entry));
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;

  return [
    ...extractDiceValues(record.value),
    ...extractDiceValues(record.values),
    ...extractDiceValues(record.rolls),
    ...extractDiceValues(record.results),
    ...extractDiceValues(record.dice),
    ...extractDiceValues(record.sets),
  ];
}

function isIgnorableDiceBoxFaceError(message: string) {
  return (
    message.includes("colliderFaceMap") ||
    message.includes("No value found for d6 mesh face -1")
  );
}

function isValidD6Values(values: number[]) {
  return (
    values.length === STAT_DICE_COUNT &&
    values.every((value) => value >= 1 && value <= STAT_DICE_FACES)
  );
}

async function waitForDiceBoxHost(hostId: string, attempts = 10) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const host = document.getElementById(hostId);
    if (host) {
      return host;
    }

    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });
  }

  return document.getElementById(hostId);
}

export function useStatisticsSelection(racialBonuses: Record<string, number>) {
  const roundCounterRef = useRef(1);
  const roundAnimationTimeoutRef = useRef<number | null>(null);
  const diceClearTimeoutRef = useRef<number | null>(null);
  const diceBoxInitPromiseRef = useRef<DiceBoxInitPromise | null>(null);
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

  const clearRoundAnimationTimer = useCallback(() => {
    if (roundAnimationTimeoutRef.current !== null) {
      window.clearTimeout(roundAnimationTimeoutRef.current);
      roundAnimationTimeoutRef.current = null;
    }
  }, []);

  const clearDiceClearTimer = useCallback(() => {
    if (diceClearTimeoutRef.current !== null) {
      window.clearTimeout(diceClearTimeoutRef.current);
      diceClearTimeoutRef.current = null;
    }
  }, []);

  const scheduleDiceBoxClear = useCallback(() => {
    clearDiceClearTimer();
    diceClearTimeoutRef.current = window.setTimeout(() => {
      diceBoxInstanceRef.current?.clear?.();
      diceClearTimeoutRef.current = null;
    }, 1800);
  }, [clearDiceClearTimer]);

  const refreshDiceBoxLayout = useCallback(() => {
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
    });
  }, []);

  const resetDiceBox = useCallback(() => {
    diceBoxInstanceRef.current?.clear?.();
    diceBoxInstanceRef.current = null;
    diceBoxInitPromiseRef.current = null;
    setIsDiceBoxReady(false);
  }, []);

  const ensureDiceBoxReady = useCallback(async () => {
    if (diceBoxInstanceRef.current) {
      return diceBoxInstanceRef.current;
    }

    if (diceBoxInitPromiseRef.current) {
      return diceBoxInitPromiseRef.current;
    }

    diceBoxInitPromiseRef.current = (async () => {
      const host = await waitForDiceBoxHost(diceBoxHostIdRef.current);

      if (!host) {
        throw new Error(
          `DiceBox target DOM node: '#${diceBoxHostIdRef.current}' not found or not available yet.`,
        );
      }

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

      const DiceBox = module.default;
      const instance = new DiceBox({
        container: `#${diceBoxHostIdRef.current}`,
        assetPath: "/assets/dice-box/",
        offscreen: true,
        scale: 3.75,
        throwForce: 4.2,
        spinForce: 5.6,
        startingHeight: 4,
      });

      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve());
      });

      await instance.init?.();

      const canvas = host.querySelector("canvas") as HTMLCanvasElement | null;

      host.style.position = "relative";
      host.style.width = "100%";
      host.style.height = "100%";

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
      setDiceBoxError(null);
      refreshDiceBoxLayout();
      return instance;
    })();

    try {
      return await diceBoxInitPromiseRef.current;
    } catch (error) {
      diceBoxInitPromiseRef.current = null;
      throw error;
    }
  }, [refreshDiceBoxLayout]);

  const rollWithDiceBox = useCallback(async () => {
    const diceBox = await ensureDiceBoxReady();
    diceBox.clear?.();

    const rawRollResult = await Promise.resolve(
      diceBox.roll?.(STAT_DICE_NOTATION),
    );
    return extractDiceValues(rawRollResult).filter(
      (value) => value >= 1 && value <= STAT_DICE_FACES,
    );
  }, [ensureDiceBoxReady]);

  const finalizeDiceRoll = useCallback(
    (roundId: string, slotIndex: number, values: number[]) => {
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
    },
    [scheduleDiceBoxClear],
  );

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

    void (async () => {
      try {
        let values = await rollWithDiceBox();

        if (!isValidD6Values(values)) {
          resetDiceBox();
          values = await rollWithDiceBox();
        }

        if (!isValidD6Values(values)) {
          values = rollLocally(STAT_DICE_COUNT, STAT_DICE_FACES);
        }

        finalizeDiceRoll(roundId, slotIndex, values);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Error desconocido al lanzar los dados 3D";

        if (isIgnorableDiceBoxFaceError(message)) {
          try {
            resetDiceBox();
            const retryValues = await rollWithDiceBox();

            if (isValidD6Values(retryValues)) {
              finalizeDiceRoll(roundId, slotIndex, retryValues);
              return;
            }
          } catch {
            resetDiceBox();
          }
        }

        if (!isIgnorableDiceBoxFaceError(message)) {
          setDiceBoxError(`Dice-Box no pudo mostrar la tirada: ${message}`);
        }
        finalizeDiceRoll(
          roundId,
          slotIndex,
          rollLocally(STAT_DICE_COUNT, STAT_DICE_FACES),
        );
      }
    })();
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

    void ensureDiceBoxReady().catch((error) => {
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      setDiceBoxError(`No se pudo inicializar Dice-Box: ${message}`);
      setIsDiceBoxReady(false);
    });
  }, [
    clearDiceClearTimer,
    clearRoundAnimationTimer,
    diceBoxError,
    ensureDiceBoxReady,
    isDiceBoxReady,
    selectedMethod,
  ]);

  const preloadDiceBox = useCallback(() => {
    if (selectedMethod !== "dice") {
      return;
    }

    if (diceBoxInstanceRef.current) {
      diceBoxInstanceRef.current.show?.();
      refreshDiceBoxLayout();
      return;
    }

    void ensureDiceBoxReady().catch((error) => {
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      setDiceBoxError(`No se pudo inicializar Dice-Box: ${message}`);
      setIsDiceBoxReady(false);
    });
  }, [ensureDiceBoxReady, refreshDiceBoxLayout, selectedMethod]);

  useEffect(() => {
    return () => {
      clearRoundAnimationTimer();
      clearDiceClearTimer();
      diceBoxInitPromiseRef.current = null;
    };
  }, [clearDiceClearTimer, clearRoundAnimationTimer]);

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

  const handleMethodChange = useCallback((method: StatsMethod) => {
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
  }, []);

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
    diceRounds,
    enteringRoundId,
    enteredRoundId,
    activeRollContext,
    isDiceBoxReady,
    diceBoxError,
    preloadDiceBox,
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
