import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { DndCharacterDetailResponse } from "../../utils/dndApi";
import type { useSpellDetailInteractions } from "../../utils/useSpellDetailInteractions";
import { secureRandomInt } from "../../../../lib/secureRandom";
import {
  extractHitDiceStats,
  recoverHitDiceOnLongRest,
} from "../utils/characterResources";
import {
  getAbilityModifierByName,
  shouldResetAbilityUsageOnRest,
} from "../utils/characterAbilities";
import { MAX_CURRENT_HP } from "./characterSheetConstants";

type DiceRoller = ReturnType<typeof useSpellDetailInteractions>["diceRoller"];

interface HitDiceEntry {
  die: string;
  total: number;
  current: number;
}

interface UseCharacterSheetRestRecoveryOptions {
  character: DndCharacterDetailResponse | null;
  currentHitDice: Record<string, number>;
  diceRoller: DiceRoller;
  setAbilityUsage: Dispatch<SetStateAction<Record<number, boolean>>>;
  setCurrentHitDice: Dispatch<SetStateAction<Record<string, number>>>;
  setCurrentHp: Dispatch<SetStateAction<number>>;
  setCurrentSpellSlots: Dispatch<SetStateAction<Record<number, number>>>;
  setTempHp: Dispatch<SetStateAction<number>>;
  totalHp: number;
}

export function useCharacterSheetRestRecovery({
  character,
  currentHitDice,
  diceRoller,
  setAbilityUsage,
  setCurrentHitDice,
  setCurrentHp,
  setCurrentSpellSlots,
  setTempHp,
  totalHp,
}: UseCharacterSheetRestRecoveryOptions) {
  const [isShortRestModalOpen, setIsShortRestModalOpen] = useState(false);
  const [shortRestHitDiceCounts, setShortRestHitDiceCounts] = useState<
    Record<string, number>
  >({});

  const constitutionModifier = useMemo(
    () => getAbilityModifierByName(character, "Constitucion"),
    [character],
  );

  const hitDiceEntries = useMemo<HitDiceEntry[]>(
    () =>
      extractHitDiceStats(character?.estadisticas ?? {}).map((entry) => ({
        ...entry,
        current: currentHitDice[entry.die] ?? entry.total,
      })),
    [character, currentHitDice],
  );

  const totalCharacterLevel = useMemo(
    () => character?.clases.reduce((sum, item) => sum + item.nivel, 0) ?? 0,
    [character],
  );

  const resetAbilityUsageForRest = (restType: "short" | "long") => {
    if (!character) {
      return;
    }

    setAbilityUsage((current) =>
      Object.fromEntries(
        Object.entries(current).map(([key, value]) => {
          const ability = character.habilidades.find(
            (item) => item.id === Number(key),
          );
          if (!ability || !value) {
            return [key, value];
          }
          return [
            key,
            shouldResetAbilityUsageOnRest(ability, restType) ? false : value,
          ];
        }),
      ),
    );
  };

  const handleConfirmShortRest = async () => {
    if (hitDiceEntries.length === 0) {
      setIsShortRestModalOpen(false);
      return;
    }

    const nextHitDice = { ...currentHitDice };
    const selectedDicePools: Array<{ count: number; faces: number }> = [];
    let totalUsedDice = 0;
    for (const entry of hitDiceEntries) {
      const usedDice = Math.min(
        shortRestHitDiceCounts[entry.die] ?? 0,
        currentHitDice[entry.die] ?? entry.total,
      );
      if (usedDice <= 0) {
        continue;
      }
      nextHitDice[entry.die] = Math.max(
        0,
        (currentHitDice[entry.die] ?? entry.total) - usedDice,
      );
      const faces = Number.parseInt(entry.die.replace(/\D+/g, ""), 10);
      if (!Number.isNaN(faces) && faces > 0) {
        selectedDicePools.push({ count: usedDice, faces });
        totalUsedDice += usedDice;
      }
    }

    if (selectedDicePools.length === 0) {
      setIsShortRestModalOpen(false);
      return;
    }

    const totalModifier = constitutionModifier * totalUsedDice;
    const modifierDisplay =
      constitutionModifier === 0
        ? null
        : `${constitutionModifier >= 0 ? "+" : "-"}${Math.abs(
            constitutionModifier,
          )} CON por dado`;

    setShortRestHitDiceCounts({});
    setIsShortRestModalOpen(false);

    const rollSummary = await diceRoller.rollDicePool({
      title: "Descanso corto",
      dicePools: selectedDicePools,
      modifier: totalModifier,
      modifierDisplay,
      totalLabel: "Curación",
    });

    const healedDiceValues =
      rollSummary?.diceValues.length === totalUsedDice
        ? rollSummary.diceValues
        : selectedDicePools.flatMap((pool) =>
            Array.from({ length: pool.count }, () =>
              secureRandomInt(1, pool.faces),
            ),
          );

    const totalHealedAmount = healedDiceValues.reduce(
      (sum, value) => sum + Math.max(0, value + constitutionModifier),
      0,
    );

    setCurrentHitDice(nextHitDice);
    setCurrentHp((current) =>
      Math.min(Math.min(totalHp, MAX_CURRENT_HP), current + totalHealedAmount),
    );
    resetAbilityUsageForRest("short");
  };

  const handleOpenShortRest = () => {
    setShortRestHitDiceCounts({});
    setIsShortRestModalOpen(true);
  };

  const handleLongRest = () => {
    if (!character) {
      return;
    }

    setCurrentHp(Math.min(totalHp, MAX_CURRENT_HP));
    setTempHp(0);
    setCurrentSpellSlots(
      Object.fromEntries(
        Array.from({ length: 9 }, (_, index) => index + 1)
          .map((level) => [
            level,
            character.estadisticas[`Hechizos nivel ${level}`] ?? 0,
          ])
          .filter(([, amount]) => amount > 0),
      ),
    );
    setCurrentHitDice((current) =>
      recoverHitDiceOnLongRest(
        Object.fromEntries(
          extractHitDiceStats(character.estadisticas).map((entry) => [
            entry.die,
            entry.total,
          ]),
        ),
        current,
        character.clases.reduce((total, item) => total + item.nivel, 0),
      ),
    );
    resetAbilityUsageForRest("long");
  };

  return {
    handleConfirmShortRest,
    handleLongRest,
    handleOpenShortRest,
    hitDiceEntries,
    isShortRestModalOpen,
    setIsShortRestModalOpen,
    setShortRestHitDiceCounts,
    shortRestHitDiceCounts,
    totalCharacterLevel,
  };
}
