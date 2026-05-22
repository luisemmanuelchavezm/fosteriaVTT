import type { CharacterAbilityResponse } from "../../../utils/dndApi";
import { formatSignedValue } from "../../utils/characterCore";
import { SpellRows } from "./shared";

interface SpellsTabProps {
  spellcastingModifier: number | null;
  spellAttackBonus: number | null;
  spellSaveDc: number | null;
  cantrips: CharacterAbilityResponse[];
  spellsByLevel: Array<{ level: number; spells: CharacterAbilityResponse[] }>;
  abilityUsage: Record<number, boolean>;
  characteristicName: string | null;
  isOwner?: boolean;
  onOpenAddSpell: () => void;
  onRollSpellAttack: (bonus: number) => void;
  onOpenSpellDetails: (spell: CharacterAbilityResponse) => void;
  onRollSpellExpression: (label: string, expression: string) => void;
  onToggleAbilityUsage: (abilityId: number) => void;
}

export default function SpellsTab({
  spellcastingModifier,
  spellAttackBonus,
  spellSaveDc,
  cantrips,
  spellsByLevel,
  abilityUsage,
  characteristicName,
  isOwner = true,
  onOpenAddSpell,
  onRollSpellAttack,
  onOpenSpellDetails,
  onRollSpellExpression,
  onToggleAbilityUsage,
}: SpellsTabProps) {
  return (
    <div className="mt-5 space-y-6">
      {isOwner ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onOpenAddSpell}
            className="rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-100"
          >
            Añadir hechizos
          </button>
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-4 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-400">
            Modificador
          </p>
          <p className="mt-2 text-2xl font-bold text-white">
            {spellcastingModifier === null
              ? "--"
              : formatSignedValue(spellcastingModifier)}
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-stone-500">
            {characteristicName ?? "--"}
          </p>
        </article>
        <button
          type="button"
          disabled={spellAttackBonus === null}
          onClick={() =>
            spellAttackBonus !== null && onRollSpellAttack(spellAttackBonus)
          }
          className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-4 text-center disabled:cursor-default"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-stone-400">
            Ataque de hechizos
          </p>
          <p className="mt-2 text-2xl font-bold text-white">
            {spellAttackBonus === null
              ? "--"
              : formatSignedValue(spellAttackBonus)}
          </p>
        </button>
        <article className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-4 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-400">
            Salvacion de hechizos
          </p>
          <p className="mt-2 text-2xl font-bold text-white">
            {spellSaveDc === null ? "--" : spellSaveDc}
          </p>
        </article>
      </div>
      <SpellRows
        title="Trucos"
        items={cantrips}
        abilityUsage={abilityUsage}
        emptyMessage="Todavía no hay trucos persistidos en el personaje para mostrarlos aquí."
        onOpenSpellDetails={onOpenSpellDetails}
        onRollSpellExpression={onRollSpellExpression}
        onToggleAbilityUsage={onToggleAbilityUsage}
      />
      {spellsByLevel.map((group) => (
        <SpellRows
          key={group.level}
          title={`Nivel ${group.level}`}
          items={group.spells}
          abilityUsage={abilityUsage}
          emptyMessage={`No hay hechizos de nivel ${group.level} persistidos para este personaje.`}
          onOpenSpellDetails={onOpenSpellDetails}
          onRollSpellExpression={onRollSpellExpression}
          onToggleAbilityUsage={onToggleAbilityUsage}
        />
      ))}
    </div>
  );
}
