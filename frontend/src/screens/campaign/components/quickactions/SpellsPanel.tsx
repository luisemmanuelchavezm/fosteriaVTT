import type {
  DndCharacterDetailResponse,
  CharacterAbilityResponse,
} from "../../../personaje/utils/dndApi";
import { formatSignedValue } from "../../../personaje/dndcharactersheet/utils/characterCore";

interface SpellsPanelProps {
  detail: DndCharacterDetailResponse;
  spellsByLevel: Map<number, CharacterAbilityResponse[]>;
  spellcastingModifier: number | null;
  spellAttackBonus: number | null;
  spellSaveDc: number | null;
  onCastSpell: (spell: CharacterAbilityResponse) => void;
  onRollSpellAttack: (bonus: number) => void;
}

export default function SpellsPanel({
  detail,
  spellsByLevel,
  spellcastingModifier,
  spellAttackBonus,
  spellSaveDc,
  onCastSpell,
  onRollSpellAttack,
}: SpellsPanelProps) {
  const levelOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
  const sortedLevels = levelOrder.filter((level) => spellsByLevel.has(level));

  const headerStats = (
    <div className="grid grid-cols-3 gap-2 mb-4">
      <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-center">
        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-stone-400">
          Modificador
        </p>
        <p className="mt-1 text-lg font-bold text-white leading-none">
          {spellcastingModifier !== null && spellcastingModifier !== undefined
            ? formatSignedValue(spellcastingModifier)
            : "--"}
        </p>
        <p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-stone-500 truncate">
          {detail.caracteristicaLanzamientoConjuros ?? "--"}
        </p>
      </div>
      <button
        type="button"
        disabled={spellAttackBonus === null}
        onClick={() =>
          spellAttackBonus !== null && onRollSpellAttack(spellAttackBonus)
        }
        className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-center disabled:cursor-default hover:bg-white/10 transition-colors"
      >
        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-stone-400">
          Ataque de hechizos
        </p>
        <p className="mt-1 text-lg font-bold text-white leading-none">
          {spellAttackBonus !== null && spellAttackBonus !== undefined
            ? formatSignedValue(spellAttackBonus)
            : "--"}
        </p>
      </button>
      <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-center">
        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-stone-400">
          Salvación
        </p>
        <p className="mt-1 text-lg font-bold text-white leading-none">
          {spellSaveDc === null ? "--" : spellSaveDc}
        </p>
      </div>
    </div>
  );

  if (spellsByLevel.size === 0) {
    return (
      <div className="absolute bottom-[calc(100%+10px)] left-1/2 w-[380px] max-w-[90vw] -translate-x-1/2 rounded-xl border border-white/20 bg-black/85 p-4 shadow-2xl">
        <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.16em] text-amber-100/85">
          Hechizos
        </p>
        {headerStats}
        <p className="text-center text-[12px] text-white/60">
          No se conoce ningún hechizo
        </p>
      </div>
    );
  }

  return (
    <div className="absolute bottom-[calc(100%+10px)] left-1/2 w-[380px] max-w-[90vw] -translate-x-1/2 max-h-[450px] rounded-xl border border-white/20 bg-black/85 p-4 shadow-2xl overflow-y-auto">
      <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.16em] text-amber-100/85">
        Hechizos
      </p>
      {headerStats}
      <div className="space-y-4">
        {sortedLevels.map((level) => {
          const spells = spellsByLevel.get(level) ?? [];
          const levelLabel = level === 0 ? "Trucos" : `Nivel ${level}`;
          return (
            <div key={level}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60 mb-2">
                {levelLabel}
              </p>
              <div className="space-y-1.5">
                {spells.map((spell) => (
                  <button
                    key={spell.id}
                    type="button"
                    onClick={() => onCastSpell(spell)}
                    className="w-full block text-left rounded-lg px-3 py-2 text-[11px] text-white/80 hover:text-amber-100 hover:bg-white/10 transition-colors truncate font-medium"
                    title={spell.nombre}
                  >
                    {spell.nombre}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
