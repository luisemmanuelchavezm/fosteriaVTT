import { useMemo } from "react";
import type {
  CharacterAbilityResponse,
  DndCharacterDetailResponse,
} from "../../utils/dndApi";
import type { useSpellDetailInteractions } from "../../utils/useSpellDetailInteractions";
import {
  getActionDamageParts,
  getAbilityModifierByName,
} from "../utils/characterAbilities";

type DiceRoller = ReturnType<typeof useSpellDetailInteractions>["diceRoller"];

interface UseCharacterSheetRollActionsOptions {
  character: DndCharacterDetailResponse | null;
  diceRoller: DiceRoller;
}

export function useCharacterSheetRollActions({
  character,
  diceRoller,
}: UseCharacterSheetRollActionsOptions) {
  const dexterityScore = useMemo(
    () => character?.estadisticas.Destreza ?? 10,
    [character],
  );

  const initiative = useMemo(
    () =>
      character?.estadisticas.Iniciativa ??
      Math.floor((dexterityScore - 10) / 2),
    [character, dexterityScore],
  );

  const handleRollAbilityCheck = (statName: string) => {
    if (!character) {
      return;
    }
    diceRoller.rollD20Check(
      statName,
      getAbilityModifierByName(character, statName),
    );
  };

  const handleRollInitiative = () => {
    diceRoller.rollD20Check("Iniciativa", initiative);
  };

  const handleRollSavingThrow = (label: string, total: number) => {
    diceRoller.rollD20Check(`Salvacion de ${label}`, total);
  };

  const handleRollSkill = (label: string, total: number) => {
    diceRoller.rollD20Check(label, total);
  };

  const handleRollWeaponAttack = (weaponName: string, bonus: number | null) => {
    if (bonus === null) {
      return;
    }
    diceRoller.rollD20Check(`Ataque con ${weaponName}`, bonus);
  };

  const handleRollActionDamage = (action: CharacterAbilityResponse) => {
    if (!character) {
      return;
    }
    const expression = getActionDamageParts(character, action).expression;
    if (!expression) {
      return;
    }
    diceRoller.rollExpression(`Daño de ${action.nombre}`, expression);
  };

  const handleRollSpellAttack = (bonus: number) => {
    diceRoller.rollD20Check("Ataque de hechizo", bonus);
  };

  return {
    handleRollAbilityCheck,
    handleRollActionDamage,
    handleRollInitiative,
    handleRollSavingThrow,
    handleRollSkill,
    handleRollSpellAttack,
    handleRollWeaponAttack,
    initiative,
  };
}
