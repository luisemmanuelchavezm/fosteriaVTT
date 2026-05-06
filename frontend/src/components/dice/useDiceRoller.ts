import { useEffect, useRef, useState } from "react";
import { secureRandomBase36, secureRandomInt } from "../../lib/secureRandom";

interface DiceBoxInstance {
  init?: () => Promise<void>;
  clear?: () => void;
  roll?: (notation: string | string[]) => unknown;
  show?: () => void;
}

interface DiceBoxRollResult {
  value?: number;
}

export interface DiceRollSummary {
  id: number;
  title: string;
  expression: string;
  diceValues: number[];
  modifier: number;
  total: number;
  modifierDisplay?: string | null;
  totalLabel?: string | null;
}

interface QueuedRollRequest {
  title: string;
  expression: string;
}

interface DicePoolRequest {
  title: string;
  dicePools: Array<{
    count: number;
    faces: number;
  }>;
  modifier?: number;
  modifierDisplay?: string | null;
  totalLabel?: string | null;
}

interface ParsedRollExpression {
  notation: string | null;
  diceCount: number;
  diceFaces: number;
  modifier: number;
  normalizedExpression: string;
}

const MAX_VISIBLE_DICE = 20;

function formatModifier(modifier: number) {
  return `${modifier >= 0 ? "+" : "-"}${Math.abs(modifier)}`;
}

function buildExpression(notation: string, modifier: number) {
  return modifier === 0
    ? notation
    : `${notation} ${modifier >= 0 ? "+" : "-"} ${Math.abs(modifier)}`;
}

function parseRollExpression(
  expression: string | null | undefined,
): ParsedRollExpression | null {
  const normalized = (expression ?? "").replace(/\s+/g, " ").trim();

  if (!normalized) {
    return null;
  }

  const diceMatch = normalized.match(/^(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?$/i);
  if (diceMatch) {
    const diceCount = Number.parseInt(diceMatch[1], 10);
    const diceFaces = Number.parseInt(diceMatch[2], 10);
    const modifierMagnitude = Number.parseInt(diceMatch[4] ?? "0", 10);
    const modifier =
      diceMatch[3] === "-" ? -modifierMagnitude : modifierMagnitude;

    return {
      notation: `${diceCount}d${diceFaces}`,
      diceCount,
      diceFaces,
      modifier,
      normalizedExpression: buildExpression(
        `${diceCount}d${diceFaces}`,
        modifier,
      ),
    };
  }

  const flatMatch = normalized.match(/^[+-]?\d+$/);
  if (flatMatch) {
    const modifier = Number.parseInt(normalized, 10);

    return {
      notation: null,
      diceCount: 0,
      diceFaces: 0,
      modifier,
      normalizedExpression: normalized,
    };
  }

  const flatSumMatch = normalized.match(/^[+-]?\d+(?:\s*[+-]\s*\d+)+$/);
  if (flatSumMatch) {
    const parts = normalized.match(/[+-]?\s*\d+/g);
    if (!parts) {
      return null;
    }

    const modifier = parts.reduce(
      (total, part) => total + Number.parseInt(part.replace(/\s+/g, ""), 10),
      0,
    );

    return {
      notation: null,
      diceCount: 0,
      diceFaces: 0,
      modifier,
      normalizedExpression: normalized,
    };
  }

  return null;
}

function rollLocally(diceCount: number, diceFaces: number) {
  return Array.from({ length: diceCount }, () => secureRandomInt(1, diceFaces));
}

function extractDiceValues(payload: unknown): number[] {
  if (Array.isArray(payload)) {
    return payload.flatMap((entry) => extractDiceValues(entry));
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;
  const directValue = record.value;
  const values = [
    ...(typeof directValue === "number" ? [directValue] : []),
    ...extractDiceValues(record.values),
    ...extractDiceValues(record.rolls),
    ...extractDiceValues(record.results),
    ...extractDiceValues(record.dice),
    ...extractDiceValues(record.sets),
  ];

  return values.filter((value): value is number => typeof value === "number");
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

export function useDiceRoller() {
  const diceBoxHostIdRef = useRef(`sheet-dice-box-${secureRandomBase36(8)}`);
  const diceBoxInstanceRef = useRef<DiceBoxInstance | null>(null);
  const summaryTimeoutRef = useRef<number | null>(null);
  const diceClearTimeoutRef = useRef<number | null>(null);
  const summaryQueueRef = useRef<DiceRollSummary[]>([]);
  const activeDiceCountRef = useRef(0);
  const activeRollCountRef = useRef(0);
  const hasVisibleSummaryRef = useRef(false);
  const summaryIdRef = useRef(0);
  const [isDiceBoxReady, setIsDiceBoxReady] = useState(false);
  const [diceBoxError, setDiceBoxError] = useState<string | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [summary, setSummary] = useState<DiceRollSummary | null>(null);

  const clearSummaryTimer = () => {
    if (summaryTimeoutRef.current !== null) {
      window.clearTimeout(summaryTimeoutRef.current);
      summaryTimeoutRef.current = null;
    }
  };

  const clearDiceTimer = () => {
    if (diceClearTimeoutRef.current !== null) {
      window.clearTimeout(diceClearTimeoutRef.current);
      diceClearTimeoutRef.current = null;
    }
  };

  const showNextSummary = () => {
    clearSummaryTimer();
    const nextSummary = summaryQueueRef.current.shift() ?? null;
    hasVisibleSummaryRef.current = nextSummary !== null;
    setSummary(nextSummary);

    if (nextSummary) {
      summaryTimeoutRef.current = window.setTimeout(() => {
        showNextSummary();
      }, 3000);
    }
  };

  const enqueueSummary = (nextSummary: DiceRollSummary) => {
    summaryQueueRef.current.push(nextSummary);
    if (!hasVisibleSummaryRef.current) {
      showNextSummary();
    }
  };

  const scheduleDiceClear = () => {
    clearDiceTimer();
    diceClearTimeoutRef.current = window.setTimeout(() => {
      diceBoxInstanceRef.current?.clear?.();
      activeDiceCountRef.current = 0;
      diceClearTimeoutRef.current = null;
    }, 4200);
  };

  const ensureDiceBoxReady = async () => {
    if (diceBoxInstanceRef.current) {
      return diceBoxInstanceRef.current;
    }

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
      scale: 3.8,
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
    return instance;
  };

  useEffect(
    () => () => {
      clearSummaryTimer();
      clearDiceTimer();
      summaryQueueRef.current = [];
      hasVisibleSummaryRef.current = false;
      activeDiceCountRef.current = 0;
      activeRollCountRef.current = 0;
    },
    [],
  );

  const runRoll = async (title: string, expression: string) => {
    const parsed = parseRollExpression(expression);

    if (!parsed) {
      setDiceBoxError(`No se pudo interpretar la tirada: ${expression}`);
      return;
    }

    clearDiceTimer();
    setDiceBoxError(null);
    activeRollCountRef.current += 1;
    setIsRolling(true);

    try {
      let diceValues: number[] = [];

      if (parsed.notation) {
        const diceBox = await ensureDiceBoxReady();

        if (activeDiceCountRef.current + parsed.diceCount > MAX_VISIBLE_DICE) {
          diceBox.clear?.();
          activeDiceCountRef.current = 0;
        }

        const rollResult = diceBox.roll?.(parsed.notation);
        if (
          rollResult &&
          typeof (rollResult as Promise<unknown>).then === "function"
        ) {
          const resolved = (await rollResult) as DiceBoxRollResult[];
          diceValues = resolved
            .map((item) => item.value)
            .filter((value): value is number => typeof value === "number");
        } else {
          diceValues = rollLocally(parsed.diceCount, parsed.diceFaces);
        }

        if (diceValues.length !== parsed.diceCount) {
          throw new Error("La tirada no devolvio todos los dados esperados");
        }

        activeDiceCountRef.current += diceValues.length;
      }

      const total =
        diceValues.reduce((sum, value) => sum + value, 0) + parsed.modifier;

      summaryIdRef.current += 1;
      enqueueSummary({
        id: summaryIdRef.current,
        title,
        expression: parsed.normalizedExpression,
        diceValues,
        modifier: parsed.modifier,
        total,
        modifierDisplay: null,
        totalLabel: null,
      });
      scheduleDiceClear();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      setDiceBoxError(`Dice-Box no pudo mostrar la tirada: ${message}`);
      scheduleDiceClear();
    } finally {
      activeRollCountRef.current = Math.max(0, activeRollCountRef.current - 1);
      setIsRolling(activeRollCountRef.current > 0);
    }
  };

  const runDicePool = async ({
    title,
    dicePools,
    modifier = 0,
    modifierDisplay = null,
    totalLabel = null,
  }: DicePoolRequest): Promise<DiceRollSummary | null> => {
    const normalizedPools = dicePools.filter(
      (pool) => pool.count > 0 && pool.faces > 0,
    );
    if (normalizedPools.length === 0) {
      return null;
    }

    clearDiceTimer();
    setDiceBoxError(null);
    activeRollCountRef.current += 1;
    setIsRolling(true);

    try {
      const notationEntries = normalizedPools.map(
        (pool) => `${pool.count}d${pool.faces}`,
      );
      const diceCount = normalizedPools.reduce(
        (sum, pool) => sum + pool.count,
        0,
      );

      const diceBox = await ensureDiceBoxReady();

      if (activeDiceCountRef.current + diceCount > MAX_VISIBLE_DICE) {
        diceBox.clear?.();
        activeDiceCountRef.current = 0;
      }

      const notationArg =
        notationEntries.length === 1 ? notationEntries[0] : notationEntries;
      const rollResult = diceBox.roll?.(notationArg);
      let diceValues: number[] = [];

      if (
        rollResult &&
        typeof (rollResult as Promise<unknown>).then === "function"
      ) {
        const resolved = await (rollResult as Promise<unknown>);
        diceValues = extractDiceValues(resolved);
      } else {
        diceValues = normalizedPools.flatMap((pool) =>
          rollLocally(pool.count, pool.faces),
        );
      }

      if (diceValues.length !== diceCount) {
        throw new Error("La tirada no devolvio todos los dados esperados");
      }

      activeDiceCountRef.current += diceValues.length;

      const expression = buildExpression(notationEntries.join(" + "), modifier);
      const total =
        diceValues.reduce((sum, value) => sum + value, 0) + modifier;
      const summary: DiceRollSummary = {
        id: ++summaryIdRef.current,
        title,
        expression,
        diceValues,
        modifier,
        total,
        modifierDisplay,
        totalLabel,
      };

      enqueueSummary(summary);
      scheduleDiceClear();
      return summary;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      setDiceBoxError(`Dice-Box no pudo mostrar la tirada: ${message}`);
      scheduleDiceClear();
      return null;
    } finally {
      activeRollCountRef.current = Math.max(0, activeRollCountRef.current - 1);
      setIsRolling(activeRollCountRef.current > 0);
    }
  };

  return {
    diceBoxHostId: diceBoxHostIdRef.current,
    diceBoxError,
    isDiceBoxReady,
    isRolling,
    summary,
    rollD20Check: (title: string, modifier: number) => {
      void runRoll(title, buildExpression("1d20", modifier));
    },
    rollExpression: (title: string, expression: string) => {
      void runRoll(title, expression);
    },
    rollDicePool: (request: DicePoolRequest) => runDicePool(request),
    rollExpressionsSequence: (requests: QueuedRollRequest[]) => {
      for (const request of requests) {
        void runRoll(request.title, request.expression);
      }
    },
    formatModifier,
  };
}
