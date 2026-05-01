import { useCallback, useState } from "react";
import { useDiceRoller } from "../../../components/dice/useDiceRoller";
import type { CharacterAbilityResponse } from "./dndApi";
import { fetchSpellDetailByName } from "./dndApi";

export type SpellDetailInteractionsController = ReturnType<
  typeof useSpellDetailInteractions
>;

export function useSpellDetailInteractions() {
  const diceRoller = useDiceRoller();
  const [selectedSpell, setSelectedSpell] =
    useState<CharacterAbilityResponse | null>(null);

  const openSpellDetail = useCallback(
    (spell: CharacterAbilityResponse | null) => {
      setSelectedSpell(spell);
    },
    [],
  );

  const closeSpellDetail = useCallback(() => {
    setSelectedSpell(null);
  }, []);

  const openSpellDetailByName = useCallback(
    async (token: string | null, spellName: string) => {
      if (!token) {
        return;
      }

      try {
        const spell = await fetchSpellDetailByName(token, spellName);
        if (spell) {
          setSelectedSpell(spell);
        }
      } catch {
        // Este modal es auxiliar; no interrumpimos el flujo si falla su carga.
      }
    },
    [],
  );

  const rollSpellExpression = useCallback(
    (spellName: string, expression: string) => {
      diceRoller.rollExpression(`Hechizo: ${spellName}`, expression);
    },
    [diceRoller],
  );

  return {
    diceRoller,
    selectedSpell,
    openSpellDetail,
    openSpellDetailByName,
    closeSpellDetail,
    rollSpellExpression,
  };
}
