import type {
  CharacterAbilityResponse,
  DndCharacterDetailResponse,
} from "../../../utils/dndApi";
import { EmptyRowsMessage } from "../SheetPrimitives";
import {
  formatSignedValue,
  getActionDamageParts,
  getLocalizedAbilityName,
} from "../../utils";

interface ActionsTabProps {
  character: DndCharacterDetailResponse;
  actionAbilities: CharacterAbilityResponse[];
  onRollWeaponAttack: (weaponName: string, bonus: number | null) => void;
  onRollActionDamage: (action: CharacterAbilityResponse) => void;
}

export default function ActionsTab({
  character,
  actionAbilities,
  onRollWeaponAttack,
  onRollActionDamage,
}: ActionsTabProps) {
  return (
    <div className="mt-5 space-y-4">
      <h3 className="text-lg font-bold text-white">Ataque</h3>
      <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,0.9fr)_88px_110px] gap-3 border-b border-white/10 pb-2 text-xs uppercase tracking-[0.18em] text-stone-400">
        <span>Nombre</span>
        <span>Tipo</span>
        <span className="text-right">Bonif.</span>
        <span className="text-right">Daño</span>
      </div>
      {actionAbilities.length > 0 ? (
        actionAbilities.map((action) => {
          const actionDamage = getActionDamageParts(character, action);
          return (
            <div
              key={action.id}
              className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,0.9fr)_88px_110px] gap-3 text-sm text-stone-200"
            >
              <span className="truncate">
                {getLocalizedAbilityName(action)}
              </span>
              <span>{actionDamage.damageType}</span>
              <button
                type="button"
                disabled={action.bonificacion === null}
                onClick={() =>
                  onRollWeaponAttack(
                    getLocalizedAbilityName(action),
                    action.bonificacion,
                  )
                }
                className="text-right text-stone-300 disabled:cursor-default disabled:opacity-100"
              >
                {action.bonificacion === null
                  ? "--"
                  : formatSignedValue(action.bonificacion)}
              </button>
              <button
                type="button"
                disabled={actionDamage.expression === null}
                onClick={() => onRollActionDamage(action)}
                className="text-right text-stone-300 disabled:cursor-default disabled:opacity-100"
              >
                {actionDamage.damage}
              </button>
            </div>
          );
        })
      ) : (
        <EmptyRowsMessage message="Este personaje no tiene acciones persistidas para mostrar aquí." />
      )}
    </div>
  );
}
