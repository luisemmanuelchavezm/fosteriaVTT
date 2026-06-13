import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  imgAtaque,
  imgAtaqueVentaja,
  imgAtaqueDesventaja,
  imgDanoNeutral,
  imgDanoVentaja,
} from "../../utils/quickActionImages";
import {
  buildCriticalExpression,
  type AdvantageResult,
  type AttackRollAction,
  type WeaponOption,
} from "./attackTypes";
import { serializeRollMessage } from "../chatRollUtils";
import {
  type useDiceRoller,
  type DiceRollSummary,
} from "../../../../components/dice/useDiceRoller";

type UseAttackRollActionsParams = {
  selectedWeapon: WeaponOption | null;
  isMB: boolean;
  isMBEnemy: boolean;
  diceRoller: ReturnType<typeof useDiceRoller>;
  onRollResult?: (text: string) => void;
};

export function useAttackRollActions({
  selectedWeapon,
  isMB,
  isMBEnemy,
  diceRoller,
  onRollResult,
}: UseAttackRollActionsParams) {
  const onRollResultRef = useRef(onRollResult);
  useEffect(() => {
    onRollResultRef.current = onRollResult;
  }, [onRollResult]);

  const pendingMBCritRef = useRef(false);
  const lastSeenSummaryIdRef = useRef(-1);
  const [critDisplaySummary, setCritDisplaySummary] =
    useState<DiceRollSummary | null>(null);
  const [advantageResult, setAdvantageResult] =
    useState<AdvantageResult | null>(null);
  const advantageTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!diceRoller.summary) {
      setCritDisplaySummary(null);
      return;
    }
    if (diceRoller.summary.id === lastSeenSummaryIdRef.current) return;
    lastSeenSummaryIdRef.current = diceRoller.summary.id;

    const { title, expression, diceValues, modifier } = diceRoller.summary;
    let { total } = diceRoller.summary;

    if (pendingMBCritRef.current) {
      pendingMBCritRef.current = false;
      total = total * 2;
      setCritDisplaySummary({
        ...diceRoller.summary,
        total,
        diceValues,
        totalLabel: "Daño crítico (×2)",
      });
    } else {
      setCritDisplaySummary(null);
    }

    onRollResultRef.current?.(
      serializeRollMessage(
        title,
        diceValues,
        modifier,
        total,
        undefined,
        expression,
      ),
    );
  }, [diceRoller.summary]);

  const attackRollActions = useMemo<AttackRollAction[]>(() => {
    if (!selectedWeapon) return [];
    const attackModifier = selectedWeapon.attackBonus ?? 0;
    const damageExpr = selectedWeapon.damageExpression;
    const critExpr = buildCriticalExpression(damageExpr);

    if (isMBEnemy) {
      return [
        {
          id: "dmg-neutral",
          label: "Daño",
          image: imgDanoNeutral,
          onClick: () => {
            if (damageExpr) {
              pendingMBCritRef.current = false;
              diceRoller.rollExpression(
                `Daño · ${selectedWeapon.name}`,
                damageExpr,
              );
            }
          },
        },
        {
          id: "dmg-crit",
          label: "Daño crítico",
          image: imgDanoVentaja,
          onClick: () => {
            if (damageExpr) {
              pendingMBCritRef.current = true;
              diceRoller.rollExpression(
                `Daño crítico · ${selectedWeapon.name}`,
                damageExpr,
              );
            }
          },
        },
      ];
    }

    if (isMB) {
      return [
        {
          id: "atk-neutral",
          label: "Ataque",
          image: imgAtaque,
          onClick: () =>
            diceRoller.rollD20Check(
              `Ataque con ${selectedWeapon.name}`,
              attackModifier,
            ),
        },
        {
          id: "dmg-neutral",
          label: "Daño",
          image: imgDanoNeutral,
          onClick: () => {
            if (damageExpr)
              diceRoller.rollExpression(
                `Daño · ${selectedWeapon.name}`,
                damageExpr,
              );
          },
        },
        {
          id: "dmg-crit",
          label: "Daño crítico",
          image: imgDanoVentaja,
          onClick: () => {
            if (damageExpr) {
              pendingMBCritRef.current = true;
              diceRoller.rollExpression(
                `Daño crítico · ${selectedWeapon.name}`,
                damageExpr,
              );
            }
          },
        },
      ];
    }

    function scheduleAdvantageRoll(
      die1: number,
      die2: number,
      type: "ventaja" | "desventaja",
    ) {
      if (advantageTimeoutRef.current !== null)
        window.clearTimeout(advantageTimeoutRef.current);
      setAdvantageResult({
        die1,
        die2,
        modifier: attackModifier,
        weaponName: selectedWeapon!.name,
        type,
      });
      advantageTimeoutRef.current = window.setTimeout(() => {
        setAdvantageResult(null);
        advantageTimeoutRef.current = null;
      }, 5000);
    }

    const modExpr =
      attackModifier === 0
        ? "1d20"
        : attackModifier > 0
          ? `1d20 + ${attackModifier}`
          : `1d20 - ${Math.abs(attackModifier)}`;

    return [
      {
        id: "atk-adv",
        label: "Ataque con ventaja",
        image: imgAtaqueVentaja,
        onClick: () =>
          void diceRoller.rollTwoD20ForAdvantage().then(([die1, die2]) => {
            scheduleAdvantageRoll(die1, die2, "ventaja");
            const used = Math.max(die1, die2);
            onRollResultRef.current?.(
              serializeRollMessage(
                `${selectedWeapon.name} · Con ventaja`,
                [die1],
                attackModifier,
                die1 + attackModifier,
                die1 < used,
                modExpr,
              ),
            );
            onRollResultRef.current?.(
              serializeRollMessage(
                `${selectedWeapon.name} · Con ventaja`,
                [die2],
                attackModifier,
                die2 + attackModifier,
                die2 < used,
                modExpr,
              ),
            );
          }),
      },
      {
        id: "atk-neutral",
        label: "Ataque",
        image: imgAtaque,
        onClick: () =>
          diceRoller.rollD20Check(
            `Ataque con ${selectedWeapon.name}`,
            attackModifier,
          ),
      },
      {
        id: "atk-dis",
        label: "Ataque con desventaja",
        image: imgAtaqueDesventaja,
        onClick: () =>
          void diceRoller.rollTwoD20ForAdvantage().then(([die1, die2]) => {
            scheduleAdvantageRoll(die1, die2, "desventaja");
            const used = Math.min(die1, die2);
            onRollResultRef.current?.(
              serializeRollMessage(
                `${selectedWeapon.name} · Con desventaja`,
                [die1],
                attackModifier,
                die1 + attackModifier,
                die1 > used,
                modExpr,
              ),
            );
            onRollResultRef.current?.(
              serializeRollMessage(
                `${selectedWeapon.name} · Con desventaja`,
                [die2],
                attackModifier,
                die2 + attackModifier,
                die2 > used,
                modExpr,
              ),
            );
          }),
      },
      {
        id: "dmg-neutral",
        label: "Daño",
        image: imgDanoNeutral,
        onClick: () => {
          if (damageExpr)
            diceRoller.rollExpression(
              `Daño · ${selectedWeapon.name}`,
              damageExpr,
            );
        },
      },
      {
        id: "dmg-crit",
        label: "Daño critico",
        image: imgDanoVentaja,
        onClick: () => {
          if (critExpr)
            diceRoller.rollExpression(
              `Daño critico · ${selectedWeapon.name}`,
              critExpr,
            );
        },
      },
    ];
  }, [diceRoller, isMB, isMBEnemy, selectedWeapon, setAdvantageResult]);

  const clearAdvantage = useCallback(() => {
    if (advantageTimeoutRef.current !== null) {
      window.clearTimeout(advantageTimeoutRef.current);
      advantageTimeoutRef.current = null;
    }
    setAdvantageResult(null);
  }, []);

  return {
    attackRollActions,
    critDisplaySummary,
    advantageResult,
    clearAdvantage,
  };
}
