import { Trash2 } from "lucide-react";
import type {
  CharacterAbilityResponse,
  DndCharacterDetailResponse,
} from "../../../utils/dndApi";
import { normalizeText } from "../../utils/characterText";

interface NpcInfoTabProps {
  character: DndCharacterDetailResponse;
  isEditMode: boolean;
  editVd: string;
  onEditVdChange: (v: string) => void;
  editBiografia: string;
  onEditBiografiaChange: (v: string) => void;
  displayHabilidades: CharacterAbilityResponse[];
  onDeleteHabilidad: (id: number) => void;
  newIdioma: string;
  onNewIdiomaChange: (v: string) => void;
  isAddingIdioma: boolean;
  onAddIdioma: () => void;
}

/** Pestaña de información del NPC: valor de desafío, idiomas y descripción. */
export default function NpcInfoTab({
  character,
  isEditMode,
  editVd,
  onEditVdChange,
  editBiografia,
  onEditBiografiaChange,
  displayHabilidades,
  onDeleteHabilidad,
  newIdioma,
  onNewIdiomaChange,
  isAddingIdioma,
  onAddIdioma,
}: NpcInfoTabProps) {
  return (
    <div className="space-y-4">
      {/* Valor de Desafío */}
      {(isEditMode || character.vd) && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-400/20 bg-amber-900/15 px-4 py-3">
          <span className="shrink-0 text-xs font-bold uppercase tracking-widest text-amber-300/70">
            Valor de Desafío
          </span>
          {isEditMode ? (
            <input
              type="text"
              value={editVd}
              onChange={(e) => onEditVdChange(e.target.value)}
              placeholder="Ej. 5 (1.800 PX)"
              className="flex-1 rounded-lg border border-amber-400/30 bg-black/30 px-2 py-1 text-sm font-bold text-amber-200 outline-none placeholder:text-amber-400/30 focus:border-amber-400/60"
            />
          ) : (
            <span className="text-lg font-bold text-amber-200">
              {character.vd}
            </span>
          )}
        </div>
      )}

      {/* Idiomas */}
      {(() => {
        const idiomaHabilidades = displayHabilidades.filter((h) =>
          normalizeText(h.nombre).startsWith(normalizeText("Idioma")),
        );
        const idiomaNames = idiomaHabilidades
          .map((h) =>
            h.nombre.replace(/^Idioma(?:\s+dote)?\s*:\s*/i, "").trim(),
          )
          .filter(Boolean);

        if (!isEditMode && idiomaHabilidades.length === 0) return null;

        return (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-400">
              Idiomas
            </p>
            {isEditMode ? (
              <>
                <div className="mb-3 flex flex-wrap gap-2">
                  {idiomaHabilidades.length === 0 ? (
                    <span className="text-sm text-white/30">Sin idiomas</span>
                  ) : (
                    idiomaHabilidades.map((h) => {
                      const name = h.nombre
                        .replace(/^Idioma(?:\s+dote)?\s*:\s*/i, "")
                        .trim();
                      return (
                        <span
                          key={h.id}
                          className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm text-white/80"
                        >
                          {name}
                          <button
                            type="button"
                            onClick={() => onDeleteHabilidad(h.id)}
                            className="rounded p-0.5 text-red-400/50 transition hover:bg-red-900/25 hover:text-red-400"
                            title="Eliminar idioma"
                          >
                            <Trash2 size={12} />
                          </button>
                        </span>
                      );
                    })
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newIdioma}
                    onChange={(e) => onNewIdiomaChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onAddIdioma();
                    }}
                    placeholder="Ej. Común, Élfico…"
                    className="flex-1 rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-amber-400/60"
                  />
                  <button
                    type="button"
                    onClick={onAddIdioma}
                    disabled={!newIdioma.trim() || isAddingIdioma}
                    className="rounded-lg bg-amber-600/25 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-600/40 disabled:opacity-40"
                  >
                    {isAddingIdioma ? "…" : "+ Agregar"}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-white/80">{idiomaNames.join(", ")}</p>
            )}
          </div>
        );
      })()}

      {/* Descripción / Biografía */}
      {isEditMode ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-400">
            Descripción
          </p>
          <textarea
            value={editBiografia}
            onChange={(e) => onEditBiografiaChange(e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/60"
            placeholder="Descripción del NPC..."
          />
        </div>
      ) : character.biografia ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-400">
            Descripción
          </p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">
            {character.biografia}
          </p>
        </div>
      ) : (
        <p className="text-center text-sm text-white/30">Sin descripción</p>
      )}
    </div>
  );
}
