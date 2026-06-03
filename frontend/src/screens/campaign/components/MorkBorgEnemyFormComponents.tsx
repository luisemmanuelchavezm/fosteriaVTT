import { Plus, Trash2 } from "lucide-react";
import type { EquipmentEntry } from "./MorkBorgEnemyEquipmentPicker";
import { clampNumber } from "./MorkBorgEnemyFormUtils";

export const MAX_TEXT_LENGTH = 500;
export const MAX_ENTRY_COUNT = 6;

export type {
  EquipmentKind,
  RandomTable,
  BiografiaJson,
} from "./MorkBorgEnemyFormUtils";

export function StepperCard({
  label,
  value,
  onChange,
  helper,
  min = 0,
  max = 999,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  helper?: string;
  min?: number;
  max?: number;
}) {
  const handleInputChange = (rawValue: string) => {
    const digitsOnly = rawValue.replace(/\D+/g, "");
    if (!digitsOnly) {
      onChange(min);
      return;
    }
    onChange(clampNumber(Number.parseInt(digitsOnly, 10), min, max));
  };

  return (
    <section className="rounded-[22px] border border-white/10 bg-black/20 p-4">
      <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-white/75">
        {label}
      </p>
      <div className="flex items-center justify-between rounded-[18px] border border-white/10 bg-black/25 px-4 py-4">
        <button
          type="button"
          onClick={() => onChange(clampNumber(value - 1, min, max))}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-xl text-white transition hover:bg-white/10"
        >
          -
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={String(value)}
          onChange={(event) => handleInputChange(event.target.value)}
          aria-label={label}
          className="w-24 bg-transparent text-center text-4xl font-black text-white outline-none"
        />
        <button
          type="button"
          onClick={() => onChange(clampNumber(value + 1, min, max))}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-xl text-white transition hover:bg-white/10"
        >
          +
        </button>
      </div>
      {helper ? <p className="mt-2 text-xs text-white/45">{helper}</p> : null}
    </section>
  );
}

export function EquipmentList({
  title,
  entries,
  onAdd,
  onRemove,
  addDisabled = false,
}: {
  title: string;
  entries: EquipmentEntry[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  addDisabled?: boolean;
}) {
  return (
    <section className="rounded-[22px] border border-white/10 bg-black/20 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/80">
          {title}
        </p>
        <button
          type="button"
          onClick={onAdd}
          disabled={addDisabled}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Plus size={16} />
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-stone-400">Nada</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <div
              key={`${entry.nombre}-${entry.formula}-${index}`}
              className="flex items-start justify-between gap-3 rounded-[16px] border border-white/10 bg-black/25 px-3 py-3"
            >
              <div className="min-w-0">
                <p className="font-semibold text-white">{entry.nombre}</p>
                <p className="mt-1 font-mono text-sm text-amber-200">
                  {entry.formula}
                </p>
                {entry.descripcion ? (
                  <p className="mt-2 text-sm leading-6 text-stone-300">
                    {entry.descripcion}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="rounded-full border border-red-500/35 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20"
                aria-label={`Eliminar ${entry.nombre}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function TextEntrySection({
  title,
  values,
  onAdd,
  onUpdate,
  onRemove,
}: {
  title: string;
  values: string[];
  onAdd: () => void;
  onUpdate: (index: number, value: string) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <section className="rounded-[22px] border border-white/10 bg-black/20 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/80">
            {title}
          </p>
          <p className="mt-1 text-xs text-white/45">
            Hasta {MAX_ENTRY_COUNT}. Si queda 0 o 1, se guardará como texto
            normal.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={values.length >= MAX_ENTRY_COUNT}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Plus size={16} />
        </button>
      </div>

      {values.length === 0 ? (
        <p className="text-sm text-stone-400">Nada</p>
      ) : (
        <div className="space-y-2">
          {values.map((value, index) => (
            <div key={`${title}-${index}`} className="flex items-start gap-2">
              <textarea
                value={value}
                onChange={(event) =>
                  onUpdate(index, event.target.value.slice(0, MAX_TEXT_LENGTH))
                }
                rows={2}
                maxLength={MAX_TEXT_LENGTH}
                placeholder={`${title} ${index + 1}`}
                className="min-h-[74px] flex-1 resize-none rounded-[16px] border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30"
              />
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="rounded-full border border-red-500/35 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20"
                aria-label={`Eliminar ${title.toLowerCase()} ${index + 1}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
