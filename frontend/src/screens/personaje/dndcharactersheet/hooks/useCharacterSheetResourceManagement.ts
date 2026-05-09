import { useEffect, useMemo, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { DndCharacterDetailResponse } from "../../utils/dndApi";
import { updateDndCharacterResources } from "../../utils/dndApi";
import type { useSpellDetailInteractions } from "../../utils/useSpellDetailInteractions";
import { getCharacterMoney } from "../utils/characterInventory";
import { extractExtraResources } from "../utils/characterResources";
import {
  HEALTH_CURRENT_STAT,
  HEALTH_TEMP_STAT,
} from "./characterSheetConstants";
import { useCharacterSheetHealth } from "./useCharacterSheetHealth";
import { useCharacterSheetRollActions } from "./useCharacterSheetRollActions";
import { useCharacterSheetRestRecovery } from "./useCharacterSheetRestRecovery";

type DiceRoller = ReturnType<typeof useSpellDetailInteractions>["diceRoller"];

interface UseCharacterSheetResourceManagementOptions {
  character: DndCharacterDetailResponse | null;
  currentExtraResources: Record<number, number>;
  currentHitDice: Record<string, number>;
  currentHp: number;
  currentMoney: Record<string, number>;
  currentSpellSlots: Record<number, number>;
  diceRoller: DiceRoller;
  editableExtraResourceMaximums: Record<number, number>;
  editableSpellSlotMaximums: Record<number, number>;
  isEditMode: boolean;
  isLoading: boolean;
  loadError: string | null;
  setAbilityUsage: Dispatch<SetStateAction<Record<number, boolean>>>;
  setCharacter: Dispatch<SetStateAction<DndCharacterDetailResponse | null>>;
  setCurrentExtraResources: Dispatch<SetStateAction<Record<number, number>>>;
  setCurrentHitDice: Dispatch<SetStateAction<Record<string, number>>>;
  setCurrentHp: Dispatch<SetStateAction<number>>;
  setCurrentMoney: Dispatch<SetStateAction<Record<string, number>>>;
  setCurrentSpellSlots: Dispatch<SetStateAction<Record<number, number>>>;
  setEditableExtraResourceMaximums: Dispatch<
    SetStateAction<Record<number, number>>
  >;
  setEditableSpellSlotMaximums: Dispatch<
    SetStateAction<Record<number, number>>
  >;
  setResourceSaveError: Dispatch<SetStateAction<string | null>>;
  setTempHp: Dispatch<SetStateAction<number>>;
  tempHp: number;
}

export function useCharacterSheetResourceManagement({
  character,
  currentExtraResources,
  currentHitDice,
  currentHp,
  currentMoney,
  currentSpellSlots,
  diceRoller,
  editableExtraResourceMaximums,
  editableSpellSlotMaximums,
  isEditMode,
  isLoading,
  loadError,
  setAbilityUsage,
  setCharacter,
  setCurrentExtraResources,
  setCurrentHitDice,
  setCurrentHp,
  setCurrentMoney,
  setCurrentSpellSlots,
  setEditableExtraResourceMaximums,
  setEditableSpellSlotMaximums,
  setResourceSaveError,
  setTempHp,
  tempHp,
}: UseCharacterSheetResourceManagementOptions) {
  const resourceSaveSequence = useRef(0);
  const health = useCharacterSheetHealth({
    character,
    currentHp,
    setCurrentHp,
    setTempHp,
    tempHp,
  });
  const rollActions = useCharacterSheetRollActions({ character, diceRoller });
  const restRecovery = useCharacterSheetRestRecovery({
    character,
    currentHitDice,
    diceRoller,
    setAbilityUsage,
    setCurrentHitDice,
    setCurrentHp,
    setCurrentSpellSlots,
    setTempHp,
    totalHp: health.totalHp,
  });
  const persistedSpellSlots = useMemo(
    () =>
      Object.fromEntries(
        Array.from({ length: 9 }, (_, index) => index + 1)
          .map((level) => [
            level,
            character?.estadisticas[`Hechizos nivel ${level} gastados`] ??
              character?.estadisticas[`Hechizos nivel ${level}`] ??
              0,
          ])
          .filter(([, amount]) => amount > 0),
      ),
    [character],
  );
  const persistedMoney = useMemo(
    () => getCharacterMoney(character),
    [character],
  );
  const persistedExtraResources = useMemo(
    () =>
      Object.fromEntries(
        extractExtraResources(character?.estadisticas ?? {})
          .filter((entry) => entry.max > 0)
          .map((entry) => [entry.index, entry.current]),
      ),
    [character],
  );

  useEffect(() => {
    if (!character || isLoading || loadError || isEditMode) {
      return;
    }

    const changedSpellSlots = Object.fromEntries(
      Object.entries(currentSpellSlots).filter(
        ([level, amount]) => persistedSpellSlots[Number(level)] !== amount,
      ),
    ) as Record<number, number>;

    const hasResourceChanges =
      currentHp !== (character.estadisticas[HEALTH_CURRENT_STAT] ?? 0) ||
      tempHp !== (character.estadisticas[HEALTH_TEMP_STAT] ?? 0) ||
      Object.keys(changedSpellSlots).length > 0 ||
      Object.keys(currentExtraResources).some(
        (resourceIndex) =>
          persistedExtraResources[Number(resourceIndex)] !==
          currentExtraResources[Number(resourceIndex)],
      ) ||
      Object.keys(currentMoney).some(
        (currency) => persistedMoney[currency] !== currentMoney[currency],
      );

    if (!hasResourceChanges) {
      return;
    }

    const authToken = localStorage.getItem("jwtToken");
    if (!authToken) {
      return;
    }

    const requestId = resourceSaveSequence.current + 1;
    resourceSaveSequence.current = requestId;
    const timeoutId = window.setTimeout(() => {
      void updateDndCharacterResources(authToken, character.id, {
        vidaActual: currentHp,
        vidaTemporal: tempHp,
        espaciosConjuroActuales: changedSpellSlots,
        recursosExtraActuales: currentExtraResources,
        dinero: currentMoney,
      })
        .then(() => {
          if (resourceSaveSequence.current !== requestId) {
            return;
          }

          setCharacter((current) => {
            if (!current) {
              return current;
            }

            return {
              ...current,
              estadisticas: {
                ...current.estadisticas,
                [HEALTH_CURRENT_STAT]: currentHp,
                [HEALTH_TEMP_STAT]: tempHp,
                ...Object.fromEntries(
                  Object.entries(changedSpellSlots).map(([level, amount]) => [
                    `Hechizos nivel ${level} gastados`,
                    amount,
                  ]),
                ),
              },
            };
          });
          setResourceSaveError(null);
        })
        .catch((error) => {
          if (resourceSaveSequence.current !== requestId) {
            return;
          }

          setResourceSaveError(
            error instanceof Error
              ? error.message
              : "No se pudieron guardar los recursos del personaje.",
          );
        });
    }, 450);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    character,
    currentHp,
    currentExtraResources,
    currentMoney,
    currentSpellSlots,
    isEditMode,
    isLoading,
    loadError,
    persistedExtraResources,
    persistedMoney,
    persistedSpellSlots,
    setCharacter,
    setResourceSaveError,
    tempHp,
  ]);

  const handleAdjustSpellSlot = (level: number, delta: number) => {
    if (!character) {
      return;
    }
    if (isEditMode) {
      const maxSlots = editableSpellSlotMaximums[level] ?? 0;
      setCurrentSpellSlots((current) => ({
        ...current,
        [level]: Math.max(
          0,
          Math.min(maxSlots, (current[level] ?? maxSlots) + delta),
        ),
      }));
      return;
    }

    const totalSlots = character.estadisticas[`Hechizos nivel ${level}`] ?? 0;
    if (totalSlots <= 0) {
      return;
    }

    setCurrentSpellSlots((current) => {
      const nextValue = Math.min(
        totalSlots,
        Math.max(0, (current[level] ?? totalSlots) + delta),
      );
      return { ...current, [level]: nextValue };
    });
  };

  const handleAdjustSpellSlotMax = (level: number, delta: number) => {
    setEditableSpellSlotMaximums((current) => {
      const nextMax = Math.max(0, Math.min(30, (current[level] ?? 0) + delta));
      setCurrentSpellSlots((currentSlots) => ({
        ...currentSlots,
        [level]:
          nextMax === 0 ? 0 : Math.min(nextMax, currentSlots[level] ?? nextMax),
      }));
      return { ...current, [level]: nextMax };
    });
  };

  const handleAdjustExtraResource = (resourceIndex: number, delta: number) => {
    const maxValue = isEditMode
      ? (editableExtraResourceMaximums[resourceIndex] ?? 0)
      : (extractExtraResources(character?.estadisticas ?? {}).find(
          (entry) => entry.index === resourceIndex,
        )?.max ?? 0);
    setCurrentExtraResources((current) => ({
      ...current,
      [resourceIndex]: Math.max(
        0,
        Math.min(maxValue, (current[resourceIndex] ?? maxValue) + delta),
      ),
    }));
  };

  const handleAdjustExtraResourceMax = (
    resourceIndex: number,
    delta: number,
  ) => {
    setEditableExtraResourceMaximums((current) => {
      const nextMax = Math.max(
        0,
        Math.min(30, (current[resourceIndex] ?? 0) + delta),
      );
      setCurrentExtraResources((currentResources) => ({
        ...currentResources,
        [resourceIndex]:
          nextMax === 0
            ? 0
            : Math.min(nextMax, currentResources[resourceIndex] ?? nextMax),
      }));
      return { ...current, [resourceIndex]: nextMax };
    });
  };

  const handleAdjustMoney = (currency: string, delta: number) => {
    setCurrentMoney((current) => ({
      ...current,
      [currency]: Math.max(0, (current[currency] ?? 0) + delta),
    }));
  };

  return {
    currentHitDice,
    handleAdjustExtraResource,
    handleAdjustExtraResourceMax,
    handleAdjustMoney,
    handleAdjustSpellSlot,
    handleAdjustSpellSlotMax,
    handleConfirmShortRest: restRecovery.handleConfirmShortRest,
    handleDamage: health.handleDamage,
    handleDecrementHpDelta: health.handleDecrementHpDelta,
    handleDecrementTempHpDelta: health.handleDecrementTempHpDelta,
    handleGainTempHp: health.handleGainTempHp,
    handleHeal: health.handleHeal,
    handleIncrementHpDelta: health.handleIncrementHpDelta,
    handleIncrementTempHpDelta: health.handleIncrementTempHpDelta,
    handleLongRest: restRecovery.handleLongRest,
    handleLoseTempHp: health.handleLoseTempHp,
    handleOpenShortRest: restRecovery.handleOpenShortRest,
    handleRollAbilityCheck: rollActions.handleRollAbilityCheck,
    handleRollActionDamage: rollActions.handleRollActionDamage,
    handleRollInitiative: rollActions.handleRollInitiative,
    handleRollSavingThrow: rollActions.handleRollSavingThrow,
    handleRollSkill: rollActions.handleRollSkill,
    handleRollSpellAttack: rollActions.handleRollSpellAttack,
    handleRollWeaponAttack: rollActions.handleRollWeaponAttack,
    hitDiceEntries: restRecovery.hitDiceEntries,
    hpDelta: health.hpDelta,
    initiative: rollActions.initiative,
    isShortRestModalOpen: restRecovery.isShortRestModalOpen,
    setHpDelta: health.setHpDelta,
    setIsShortRestModalOpen: restRecovery.setIsShortRestModalOpen,
    setShortRestHitDiceCounts: restRecovery.setShortRestHitDiceCounts,
    setTempHpDelta: health.setTempHpDelta,
    shortRestHitDiceCounts: restRecovery.shortRestHitDiceCounts,
    tempHpDelta: health.tempHpDelta,
    totalCharacterLevel: restRecovery.totalCharacterLevel,
    totalHp: health.totalHp,
  };
}
