import type { DndCharacterDetailResponse } from "../../utils/dndApi";
import { ABILITY_ABBREVIATIONS, SAVING_THROW_ROWS, SKILL_ROWS } from "../data";
import { formatSignedValue, getAbilityModifierByName } from "../utils";
import { CircleIndicator, SectionTableHeader } from "./SheetPrimitives";

interface ChecksSectionProps {
  character: DndCharacterDetailResponse;
}

export default function ChecksSection({ character }: ChecksSectionProps) {
  const savingThrows = SAVING_THROW_ROWS.map((item) => {
    const modifier = getAbilityModifierByName(character, item.statName);
    const proficiency =
      character.estadisticas[`Salvacion de ${item.statName}`] ?? 0;

    return {
      ...item,
      proficiency,
      total: modifier + proficiency,
    };
  });

  const skills = SKILL_ROWS.map((item) => {
    const modifier = getAbilityModifierByName(character, item.statName);
    const proficiency = character.estadisticas[item.name] ?? 0;

    return {
      ...item,
      proficiency,
      total: modifier + proficiency,
    };
  });

  return (
    <>
      <div className="rounded-[28px] border border-white/10 bg-black/15 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
        <h3 className="text-xl font-bold text-white">Tiradas de salvacion</h3>

        <div className="mt-5 space-y-3">
          <SectionTableHeader leftLabel="Nombre" />

          {savingThrows.map((item) => (
            <div
              key={item.statName}
              className="grid grid-cols-[minmax(0,1fr)_72px] gap-3 text-sm text-stone-200"
            >
              <div className="flex items-center gap-2">
                <CircleIndicator filled={item.proficiency > 0} />
                <span>
                  {item.displayName} ({ABILITY_ABBREVIATIONS[item.statName]})
                </span>
              </div>
              <span className="text-right font-semibold text-white">
                {formatSignedValue(item.total)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-black/15 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
        <h3 className="text-xl font-bold text-white">Habilidades</h3>

        <div className="mt-5 space-y-3">
          <SectionTableHeader leftLabel="Nombre" />

          {skills.map((item) => (
            <div
              key={item.name}
              className="grid grid-cols-[minmax(0,1fr)_72px] gap-3 text-sm text-stone-200"
            >
              <div className="flex items-center gap-2">
                <CircleIndicator filled={item.proficiency > 0} />
                <span>
                  {item.displayName} ({ABILITY_ABBREVIATIONS[item.statName]})
                </span>
              </div>
              <span className="text-right font-semibold text-white">
                {formatSignedValue(item.total)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
