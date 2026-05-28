import type { DndCharacterDetailResponse } from "../../../personaje/utils/dndApi";
import { SAVING_THROW_ROWS } from "../../../personaje/dndcharactersheet/data";
import { SAVING_THROWS_WITH_IMAGES } from "../../utils/quickActionUtils";
import {
  getSavingThrowTotal,
  getEnemySaveBonus,
} from "../../utils/quickActionHelpers";
import { getProficiencyBonus } from "../../../personaje/dndcharactersheet/utils/characterCore";

interface SavePanelProps {
  detail: DndCharacterDetailResponse;
  isEnemy: boolean;
  onRollSave: (displayName: string, total: number) => void;
}

export default function SavePanel({
  detail,
  isEnemy,
  onRollSave,
}: SavePanelProps) {
  const proficiencyBonus = getProficiencyBonus(detail);

  return (
    <div className="absolute bottom-[calc(100%+10px)] left-1/2 w-[760px] max-w-[96vw] -translate-x-1/2 rounded-xl border border-white/20 bg-black/85 p-4 shadow-2xl">
      <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.16em] text-amber-100/85">
        Salvaciones
      </p>
      <div className="grid grid-cols-6 gap-3">
        {SAVING_THROW_ROWS.map((save, idx) => {
          const total = isEnemy
            ? getEnemySaveBonus(detail, save.statName)
            : getSavingThrowTotal(detail, save.statName, proficiencyBonus);
          const modLabel = total >= 0 ? `+${total}` : `${total}`;
          const image = SAVING_THROWS_WITH_IMAGES[idx]?.image;
          return (
            <button
              key={save.statName}
              type="button"
              onClick={() => onRollSave(save.displayName, total)}
              className="group flex flex-col items-center gap-1.5 rounded-lg px-2 py-2 transition-colors hover:bg-white/10"
              title={`${save.displayName} (${modLabel})`}
            >
              {image && (
                <img
                  src={image}
                  alt={save.displayName}
                  className="h-16 w-16 shrink-0 object-cover object-center rounded-2xl"
                />
              )}
              <span className="block text-[13px] font-medium leading-tight text-white/80 group-hover:text-amber-100 text-center">
                {save.displayName}
              </span>
              <span className="block text-[12px] font-bold leading-none text-amber-300/70">
                {modLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
