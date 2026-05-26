import type { DndCharacterDetailResponse } from "../../../personaje/utils/dndApi";
import { SKILLS } from "../../utils/quickActionImages";
import {
  getSkillTotal,
  getEnemySkillBonus,
} from "../../utils/quickActionHelpers";
import { getProficiencyBonus } from "../../../personaje/dndcharactersheet/utils/characterCore";

interface SkillPanelProps {
  detail: DndCharacterDetailResponse | null;
  isLoadingDetail: boolean;
  isEnemy: boolean;
  onRollSkill: (displayName: string, total: number) => void;
}

export default function SkillPanel({
  detail,
  isLoadingDetail,
  isEnemy,
  onRollSkill,
}: SkillPanelProps) {
  return (
    <div className="absolute bottom-[calc(100%+10px)] left-1/2 w-[700px] max-w-[95vw] -translate-x-1/2 rounded-xl border border-white/20 bg-black/85 p-3 shadow-2xl">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-100/85">
        Habilidades
      </p>
      {isLoadingDetail ? (
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
          Cargando...
        </div>
      ) : (
        <div className="grid grid-cols-9 gap-2">
          {SKILLS.map((skill) => {
            const proficiencyBonus = getProficiencyBonus(detail);
            const total = isEnemy
              ? getEnemySkillBonus(detail, skill)
              : getSkillTotal(detail, skill, proficiencyBonus);
            const modLabel = total >= 0 ? `+${total}` : `${total}`;
            return (
              <button
                key={skill.name}
                type="button"
                onClick={() => onRollSkill(skill.displayName, total)}
                className="group flex flex-col items-center gap-0.5 rounded-lg px-1 py-1 transition-colors hover:bg-white/10"
                title={`${skill.displayName} (${modLabel})`}
              >
                <img
                  src={skill.image}
                  alt={skill.displayName}
                  className="h-16 w-16 shrink-0 object-cover rounded-2xl"
                />
                <span className="block text-[10px] leading-tight text-white/80 group-hover:text-amber-100 text-center max-w-[64px] whitespace-normal break-words">
                  {skill.displayName}
                </span>
                <span className="block text-[10px] leading-none text-amber-300/70">
                  {modLabel}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
