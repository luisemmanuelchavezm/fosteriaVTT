import type { DndCharacterDetailResponse } from "../../utils/dndApi";
import { ABILITY_ABBREVIATIONS, SAVING_THROW_ROWS, SKILL_ROWS } from "../data";
import {
  formatSignedValue,
  getAbilityModifierByName,
  getProficiencyBonus,
} from "../utils";
import { CircleIndicator, SectionTableHeader } from "./SheetPrimitives";

interface ChecksSectionProps {
  character: DndCharacterDetailResponse;
  isEditMode?: boolean;
  editableSavingThrowProficiencies?: string[];
  editableSkillProficiencies?: string[];
  onRollSavingThrow: (label: string, total: number) => void;
  onRollSkill: (label: string, total: number) => void;
  onToggleSavingThrowProficiency?: (statName: string) => void;
  onToggleSkillProficiency?: (skillName: string) => void;
}

export default function ChecksSection({
  character,
  isEditMode = false,
  editableSavingThrowProficiencies = [],
  editableSkillProficiencies = [],
  onRollSavingThrow,
  onRollSkill,
  onToggleSavingThrowProficiency,
  onToggleSkillProficiency,
}: ChecksSectionProps) {
  const proficiencyBonus = getProficiencyBonus(character);
  const savingThrows = SAVING_THROW_ROWS.map((item) => {
    const modifier = getAbilityModifierByName(character, item.statName);
    const isProficient = isEditMode
      ? editableSavingThrowProficiencies.includes(item.statName)
      : (character.estadisticas[`Salvación de ${item.statName}`] ??
          character.estadisticas[`Salvacion de ${item.statName}`] ??
          0) > 0;
    const proficiency = isProficient ? proficiencyBonus : 0;

    return {
      ...item,
      isProficient,
      proficiency,
      total: modifier + proficiency,
    };
  });

  const skills = SKILL_ROWS.map((item) => {
    const modifier = getAbilityModifierByName(character, item.statName);
    const isProficient = isEditMode
      ? editableSkillProficiencies.includes(item.name)
      : (character.estadisticas[item.name] ?? 0) > 0;
    const proficiency = isProficient ? proficiencyBonus : 0;

    return {
      ...item,
      isProficient,
      proficiency,
      total: modifier + proficiency,
    };
  });

  return (
    <>
      <div className="rounded-[28px] border border-white/10 bg-black/15 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
        <h3 className="text-xl font-bold text-white">Tiradas de salvación</h3>

        <div className="mt-5 space-y-3">
          <SectionTableHeader leftLabel="Nombre" />

          {savingThrows.map((item) => (
            <button
              key={item.statName}
              type="button"
              onClick={() => {
                if (isEditMode) {
                  onToggleSavingThrowProficiency?.(item.statName);
                  return;
                }
                onRollSavingThrow(item.displayName, item.total);
              }}
              className="grid w-full grid-cols-[minmax(0,1fr)_72px] items-center gap-3 text-left text-sm text-stone-200"
            >
              <div className="flex items-center gap-2">
                <CircleIndicator filled={item.isProficient} />
                <span>
                  {item.displayName} ({ABILITY_ABBREVIATIONS[item.statName]})
                </span>
              </div>
              <span className="text-right font-semibold text-white">
                {formatSignedValue(item.total)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-black/15 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
        <h3 className="text-xl font-bold text-white">Habilidades</h3>

        <div className="mt-5 space-y-3">
          <SectionTableHeader leftLabel="Nombre" />

          {skills.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => {
                if (isEditMode) {
                  onToggleSkillProficiency?.(item.name);
                  return;
                }
                onRollSkill(item.displayName, item.total);
              }}
              className="grid w-full grid-cols-[minmax(0,1fr)_72px] items-center gap-3 text-left text-sm text-stone-200"
            >
              <div className="flex items-center gap-2">
                <CircleIndicator filled={item.isProficient} />
                <span>
                  {item.displayName} ({ABILITY_ABBREVIATIONS[item.statName]})
                </span>
              </div>
              <span className="text-right font-semibold text-white">
                {formatSignedValue(item.total)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
