import { Trash2 } from "lucide-react";
import type { PassiveEntry, ActionEntry } from "../../utils/enemyUtils";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ActionsSectionProps {
  // Pasivas
  pasivas: PassiveEntry[];
  addPasiva: () => void;
  updatePasiva: (
    index: number,
    field: "nombre" | "descripcion",
    value: string,
  ) => void;
  removePasiva: (index: number) => void;
  fieldErrorsPasivas?: Partial<Record<number, string>>;
  // Acciones
  acciones: ActionEntry[];
  addAccion: () => void;
  updateAccion: (
    index: number,
    field: "nombre" | "descripcion",
    value: string,
  ) => void;
  removeAccion: (index: number) => void;
  fieldErrorsAcciones?: Partial<Record<number, string>>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ActionsSection({
  pasivas,
  addPasiva,
  updatePasiva,
  removePasiva,
  fieldErrorsPasivas,
  acciones,
  addAccion,
  updateAccion,
  removeAccion,
  fieldErrorsAcciones,
}: ActionsSectionProps) {
  return (
    <>
      {/* Pasivas */}
      <DynamicSection
        title="Pasivas"
        onAdd={addPasiva}
        addDisabled={pasivas.length >= 20}
        addLabel="+ Pasiva"
      >
        {pasivas.map((entry, index) => (
          <div
            key={index}
            className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 space-y-1.5"
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-1.5">
                <input
                  type="text"
                  value={entry.nombre}
                  onChange={(e) =>
                    updatePasiva(index, "nombre", e.target.value.slice(0, 100))
                  }
                  placeholder="Nombre de la pasiva"
                  maxLength={100}
                  className={`w-full rounded-lg border bg-white/5 px-3 py-2 text-xs text-white outline-none transition placeholder:text-white/40 focus:border-amber-400/60 ${fieldErrorsPasivas?.[index] ? "border-red-400/70" : "border-white/20"}`}
                />
                {fieldErrorsPasivas?.[index] && (
                  <p data-field-error className="text-xs text-red-400">
                    {fieldErrorsPasivas[index]}
                  </p>
                )}
                <div>
                  <textarea
                    value={entry.descripcion}
                    onChange={(e) =>
                      updatePasiva(
                        index,
                        "descripcion",
                        e.target.value.slice(0, 500),
                      )
                    }
                    placeholder="Descripción..."
                    rows={2}
                    maxLength={500}
                    className="w-full resize-none rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs text-white outline-none transition placeholder:text-white/40 focus:border-amber-400/60"
                  />
                  {entry.descripcion.length > 400 && (
                    <p
                      className={`mt-0.5 text-right text-[9px] ${entry.descripcion.length >= 500 ? "text-red-400" : "text-amber-400"}`}
                    >
                      {entry.descripcion.length}/500
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removePasiva(index)}
                className="mt-0.5 text-red-400 hover:text-red-300"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </DynamicSection>

      {/* Acciones */}
      <DynamicSection
        title="Acciones"
        onAdd={addAccion}
        addDisabled={acciones.length >= 20}
        addLabel="+ Acción"
      >
        {acciones.map((entry, index) => (
          <div
            key={index}
            className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 space-y-1.5"
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-1.5">
                <input
                  type="text"
                  value={entry.nombre}
                  onChange={(e) =>
                    updateAccion(index, "nombre", e.target.value.slice(0, 100))
                  }
                  placeholder="Nombre de la acción"
                  maxLength={100}
                  className={`w-full rounded-lg border bg-white/5 px-3 py-2 text-xs text-white outline-none transition placeholder:text-white/40 focus:border-amber-400/60 ${fieldErrorsAcciones?.[index] ? "border-red-400/70" : "border-white/20"}`}
                />
                {fieldErrorsAcciones?.[index] && (
                  <p data-field-error className="text-xs text-red-400">
                    {fieldErrorsAcciones[index]}
                  </p>
                )}
                <div>
                  <textarea
                    value={entry.descripcion}
                    onChange={(e) =>
                      updateAccion(
                        index,
                        "descripcion",
                        e.target.value.slice(0, 500),
                      )
                    }
                    placeholder="Descripción..."
                    rows={2}
                    maxLength={500}
                    className="w-full resize-none rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs text-white outline-none transition placeholder:text-white/40 focus:border-amber-400/60"
                  />
                  {entry.descripcion.length > 400 && (
                    <p
                      className={`mt-0.5 text-right text-[9px] ${entry.descripcion.length >= 500 ? "text-red-400" : "text-amber-400"}`}
                    >
                      {entry.descripcion.length}/500
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeAccion(index)}
                className="mt-0.5 text-red-400 hover:text-red-300"
              >
                <Trash2 size={14} />
              </button>
            </div>
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
