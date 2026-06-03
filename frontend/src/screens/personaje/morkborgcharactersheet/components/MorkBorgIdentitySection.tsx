import { useRef } from "react";
import type { DndCharacterDetailResponse } from "../../utils/dndApi";
import { MORK_BORG_CLASSES } from "../../createmorkborg/utils/morkBorgUtils";

function extractClassId(tags: string | null | undefined): string | null {
  if (!tags) return null;
  const match = tags.match(/clase;([^,]+)/);
  return match?.[1] ?? null;
}

interface MorkBorgIdentitySectionProps {
  character: DndCharacterDetailResponse;
  editableName?: string;
  isEditMode: boolean;
  isOwner?: boolean;
  onShortRest: () => void;
  onLongRest: () => void;
  onToggleEditMode: () => void;
  onDeleteCharacter: () => void;
  onMejorar?: () => void;
  onEditableNameChange?: (value: string) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  onPortraitChange?: (file: File) => void;
}

export default function MorkBorgIdentitySection({
  character,
  editableName,
  isEditMode,
  isOwner = true,
  onShortRest,
  onLongRest,
  onToggleEditMode,
  onDeleteCharacter,
  onMejorar,
  onEditableNameChange,
  onSaveEdit,
  onCancelEdit,
  onPortraitChange,
}: MorkBorgIdentitySectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const classId = extractClassId(
    (character as unknown as { tags?: string }).tags,
  );
  const classData = MORK_BORG_CLASSES.find((c) => c.id === classId);
  const className = classData?.nombre ?? classId ?? "Sin clase";

  return (
    <section className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
      <div className="relative overflow-hidden rounded-[28px] border border-rose-300/30 bg-black/25 shadow-[0_18px_40px_rgba(0,0,0,0.24)]">
        {character.retrato ? (
          <img
            src={character.retrato}
            alt={character.nombre}
            className="aspect-square h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex aspect-square items-center justify-center bg-[radial-gradient(circle_at_top,#ef4444_0%,#1c1917_55%,#0c0a09_100%)] text-6xl font-semibold text-rose-100/90">
            {character.nombre.slice(0, 1).toUpperCase()}
          </div>
        )}
        {isEditMode && isOwner && onPortraitChange && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onPortraitChange(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity hover:opacity-100"
            >
              <span className="text-3xl">📷</span>
              <span className="text-xs font-semibold text-white">
                Cambiar imagen
              </span>
            </button>
          </>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          {isEditMode ? (
            <input
              type="text"
              value={editableName ?? character.nombre}
              onChange={(event) => onEditableNameChange?.(event.target.value)}
              className="w-full rounded-[16px] border border-white/10 bg-black/30 px-4 py-3 text-3xl font-bold text-white outline-none md:text-4xl"
            />
          ) : (
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              {character.nombre}
            </h2>
          )}
          <p className="mt-2 text-lg font-medium text-stone-200">{className}</p>
          {isOwner && onMejorar ? (
            <button
              type="button"
              onClick={onMejorar}
              className="mt-2 rounded-full border border-sky-300/25 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-100 transition hover:bg-sky-400/20"
            >
              Mejorar
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-end justify-start gap-3 md:justify-end">
          {isOwner && isEditMode ? (
            <button
              type="button"
              onClick={onDeleteCharacter}
              className="rounded-full border border-rose-300/30 bg-rose-400/10 px-5 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/20"
            >
              Eliminar personaje
            </button>
          ) : null}
          <button
            type="button"
            onClick={onShortRest}
            className="min-w-[180px] rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-stone-100 transition hover:bg-white/10 md:min-w-[220px]"
          >
            Descanso corto
          </button>
          <button
            type="button"
            onClick={onLongRest}
            className="min-w-[180px] rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-stone-100 transition hover:bg-white/10 md:min-w-[220px]"
          >
            Descanso largo
          </button>
          {isOwner && !isEditMode ? (
            <button
              type="button"
              onClick={onToggleEditMode}
              className="rounded-full border border-rose-300/30 bg-rose-300/10 px-5 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-300/15"
            >
              Editar
            </button>
          ) : null}
          {isOwner && isEditMode ? (
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-stone-100"
            >
              Cancelar cambios
            </button>
          ) : null}
          {isOwner && isEditMode ? (
            <button
              type="button"
              onClick={onSaveEdit}
              className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-5 py-3 text-sm font-semibold text-emerald-100"
            >
              Guardar edición
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
