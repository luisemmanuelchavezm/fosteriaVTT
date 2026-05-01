import type {
  CharacterAbilityResponse,
  CharacterInventoryItemResponse,
} from "../../../utils/dndApi";
import {
  canTrackAbilityUsage,
  getAbilityResetLabel,
  getInventoryTagLabel,
  getLocalizedAbilityName,
} from "../../utils";
import { EmptyRowsMessage } from "../SheetPrimitives";
import { extractFirstRollableExpression } from "../../../../../components/spells/spellUtils";

export function CompetencyChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove?: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-stone-100">
      <span>{label}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="flex h-5 w-5 items-center justify-center rounded-full border border-rose-300/20 text-[11px] text-rose-100"
        >
          ×
        </button>
      ) : null}
    </span>
  );
}

export function SpellRows({
  title,
  items,
  abilityUsage,
  emptyMessage,
  onOpenSpellDetails,
  onRollSpellExpression,
  onToggleAbilityUsage,
}: {
  title: string;
  items: CharacterAbilityResponse[];
  abilityUsage: Record<number, boolean>;
  emptyMessage: string;
  onOpenSpellDetails: (spell: CharacterAbilityResponse) => void;
  onRollSpellExpression: (label: string, expression: string) => void;
  onToggleAbilityUsage: (abilityId: number) => void;
}) {
  return (
    <div className="space-y-4">
      <h4 className="text-lg font-bold text-white">{title}</h4>
      <div className="grid grid-cols-[28px_minmax(0,1.2fr)_88px] gap-3 border-b border-white/10 pb-2 text-xs uppercase tracking-[0.18em] text-stone-400">
        <span />
        <span>Nombre</span>
        <span className="text-right">Daño</span>
      </div>
      {items.length > 0 ? (
        items.map((spell) => {
          const rollableExpression = extractFirstRollableExpression(
            spell.formula,
          );
          const canTrack = canTrackAbilityUsage(spell);

          return (
            <div
              key={spell.id}
              className="grid grid-cols-[28px_minmax(0,1.2fr)_88px] gap-3 text-sm text-stone-200"
            >
              {canTrack ? (
                <label className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={abilityUsage[spell.id] ?? false}
                    onChange={() => onToggleAbilityUsage(spell.id)}
                    className="h-4 w-4 rounded border-white/30 bg-transparent accent-amber-200"
                  />
                </label>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => onOpenSpellDetails(spell)}
                className="truncate text-left text-sky-100 transition hover:text-amber-100"
              >
                {getLocalizedAbilityName(spell)}
              </button>
              {rollableExpression ? (
                <button
                  type="button"
                  onClick={() =>
                    onRollSpellExpression(
                      getLocalizedAbilityName(spell),
                      rollableExpression,
                    )
                  }
                  className="text-right text-stone-300 transition hover:text-amber-100"
                >
                  {rollableExpression}
                </button>
              ) : (
                <span className="text-right text-stone-400">--</span>
              )}
            </div>
          );
        })
      ) : (
        <EmptyRowsMessage message={emptyMessage} />
      )}
    </div>
  );
}

export function PassiveRows({
  items,
  abilityUsage,
  onToggleAbilityUsage,
  onOpenPassiveDetails,
}: {
  items: CharacterAbilityResponse[];
  abilityUsage: Record<number, boolean>;
  onToggleAbilityUsage: (abilityId: number) => void;
  onOpenPassiveDetails: (ability: CharacterAbilityResponse) => void;
}) {
  if (items.length === 0) {
    return (
      <EmptyRowsMessage message="Este personaje no tiene pasivas persistidas para mostrar aquí." />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[28px_minmax(0,1fr)_160px] gap-3 border-b border-white/10 pb-2 text-xs uppercase tracking-[0.18em] text-stone-400">
        <span />
        <span>Nombre</span>
        <span className="text-right">Recupera</span>
      </div>
      {items.map((ability) => {
        const canTrack = canTrackAbilityUsage(ability);

        return (
          <div
            key={ability.id}
            className="grid grid-cols-[28px_minmax(0,1fr)_160px] gap-3 text-sm text-stone-200"
          >
            {canTrack ? (
              <label className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={abilityUsage[ability.id] ?? false}
                  onChange={() => onToggleAbilityUsage(ability.id)}
                  className="h-4 w-4 rounded border-white/30 bg-transparent accent-amber-200"
                />
              </label>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => onOpenPassiveDetails(ability)}
              className="truncate text-left font-semibold text-white transition hover:text-amber-100"
            >
              {ability.nombre}
            </button>
            <span className="text-right text-stone-300">
              {getAbilityResetLabel(ability)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function InventoryRows({
  title,
  items,
  emptyMessage,
  onToggleInventoryEquip,
  onOpenInventoryDetails,
}: {
  title: string;
  items: CharacterInventoryItemResponse[];
  emptyMessage: string;
  onToggleInventoryEquip: (itemId: number, equipped: boolean) => void;
  onOpenInventoryDetails: (item: CharacterInventoryItemResponse) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <div className="grid grid-cols-[28px_minmax(0,1fr)_72px_88px] gap-3 border-b border-white/10 pb-2 text-xs uppercase tracking-[0.18em] text-stone-400">
        <span />
        <span>Nombre</span>
        <span className="text-right">Cantidad</span>
        <span className="text-right">Tags</span>
      </div>
      {items.length > 0 ? (
        items.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[28px_minmax(0,1fr)_72px_88px] gap-3 text-sm text-stone-200"
          >
            <label className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={item.equipado}
                onChange={() => onToggleInventoryEquip(item.id, !item.equipado)}
                className="h-4 w-4 rounded border-white/30 bg-transparent accent-amber-200"
              />
            </label>
            <button
              type="button"
              onClick={() => onOpenInventoryDetails(item)}
              className="truncate text-left text-white transition hover:text-amber-100"
            >
              {item.nombre}
            </button>
            <span className="text-right font-semibold text-white">
              {item.cantidad}
            </span>
            <span className="text-right text-stone-300">
              {getInventoryTagLabel(item)}
            </span>
          </div>
        ))
      ) : (
        <EmptyRowsMessage message={emptyMessage} />
      )}
    </div>
  );
}
