import { Trash2 } from "lucide-react";
import {
  SKILL_ROWS,
  SAVING_THROW_ROWS,
} from "../../../personaje/dndcharactersheet/data";
import type { SkillOverride, SaveOverride } from "../../utils/enemyUtils";

// ─── Props ────────────────────────────────────────────────────────────────────

interface SkillsAndSavesSectionProps {
  // Skills
  skillOverrides: SkillOverride[];
  usedSkills: string[];
  availableSkills: { name: string; displayName: string }[];
  addSkill: () => void;
  updateSkill: (
    index: number,
    field: "skill" | "bonus",
    value: string | number,
  ) => void;
  removeSkill: (index: number) => void;
  // Saves
  saveOverrides: SaveOverride[];
  usedSaves: string[];
  availableSaves: { statName: string; displayName: string }[];
  addSave: () => void;
  updateSave: (
    index: number,
    field: "ability" | "bonus",
    value: string | number,
  ) => void;
  removeSave: (index: number) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SkillsAndSavesSection({
  skillOverrides,
  usedSkills,
  availableSkills,
  addSkill,
  updateSkill,
  removeSkill,
  saveOverrides,
  usedSaves,
  availableSaves,
  addSave,
  updateSave,
  removeSave,
}: SkillsAndSavesSectionProps) {
  return (
    <>
      {/* Skills */}
      <DynamicSection
        title="Habilidades"
        onAdd={addSkill}
        addDisabled={availableSkills.length === 0}
        addLabel="+ Habilidad"
      >
        {skillOverrides.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <select
              value={entry.skill}
              onChange={(e) => updateSkill(index, "skill", e.target.value)}
              className="flex-1 rounded-lg border border-white/20 bg-black/40 px-2 py-1.5 text-xs text-white outline-none"
            >
              {SKILL_ROWS.filter(
                (r) => r.name === entry.skill || !usedSkills.includes(r.name),
              ).map((r) => (
                <option key={r.name} value={r.name}>
                  {r.displayName}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={-1}
              max={30}
              value={entry.bonus}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                updateSkill(
                  index,
                  "bonus",
                  Number.isNaN(v) ? 0 : Math.max(-1, Math.min(30, v)),
                );
              }}
              className="w-16 rounded-lg border border-white/20 bg-black/40 px-2 py-1.5 text-center text-xs text-white outline-none"
            />
            <button
              type="button"
              onClick={() => removeSkill(index)}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </DynamicSection>

      {/* Saving throws */}
      <DynamicSection
        title="Salvaciones"
        onAdd={addSave}
        addDisabled={availableSaves.length === 0}
        addLabel="+ Salvación"
      >
        {saveOverrides.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <select
              value={entry.ability}
              onChange={(e) => updateSave(index, "ability", e.target.value)}
              className="flex-1 rounded-lg border border-white/20 bg-black/40 px-2 py-1.5 text-xs text-white outline-none"
            >
              {SAVING_THROW_ROWS.filter(
                (r) =>
                  r.statName === entry.ability ||
                  !usedSaves.includes(r.statName),
              ).map((r) => (
                <option key={r.statName} value={r.statName}>
                  {r.displayName}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={-1}
              max={30}
              value={entry.bonus}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                updateSave(
                  index,
                  "bonus",
                  Number.isNaN(v) ? 0 : Math.max(-1, Math.min(30, v)),
                );
              }}
              className="w-16 rounded-lg border border-white/20 bg-black/40 px-2 py-1.5 text-center text-xs text-white outline-none"
            />
            <button
              type="button"
              onClick={() => removeSave(index)}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </DynamicSection>
    </>
  );
}

// ─── DynamicSection (local) ───────────────────────────────────────────────────

interface DynamicSectionProps {
  title: string;
  onAdd: () => void;
  addDisabled: boolean;
  addLabel: string;
  children: React.ReactNode;
}

function DynamicSection({
  title,
  onAdd,
  addDisabled,
  addLabel,
  children,
}: DynamicSectionProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-white/60">
          {title}
        </p>
        <button
          type="button"
          onClick={onAdd}
          disabled={addDisabled}
          className="flex items-center gap-1 rounded-lg border border-amber-400/50 bg-amber-700/15 px-2 py-1 text-[11px] font-bold text-amber-300 transition hover:bg-amber-700/30 disabled:opacity-40"
        >
          {addLabel}
        </button>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
