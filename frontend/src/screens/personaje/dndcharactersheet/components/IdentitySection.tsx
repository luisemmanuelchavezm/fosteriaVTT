import type { DndCharacterDetailResponse } from "../../utils/dndApi";
import {
  formatClassSummary,
  getExperienceProgress,
  getRaceSummary,
} from "../utils/characterCore";

interface IdentitySectionProps {
  character: DndCharacterDetailResponse;
  editableName?: string;
  onShortRest: () => void;
  onLongRest: () => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onOpenLevelManagement: () => void;
  onDeleteCharacter: () => void;
  isOwner?: boolean;
  onEditableNameChange?: (value: string) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
}

export default function IdentitySection({
  character,
  editableName,
  onShortRest,
  onLongRest,
  isEditMode,
  isOwner = true,
  onToggleEditMode,
  onOpenLevelManagement,
  onDeleteCharacter,
  onEditableNameChange,
  onSaveEdit,
  onCancelEdit,
}: IdentitySectionProps) {
  const raceSummary = getRaceSummary(character.raza, character.subraza);
  const classSummary =
    character.clases.length > 0 ? formatClassSummary(character.clases) : "-";
  const experience = getExperienceProgress(
    character.clases,
    character.estadisticas,
  );

  return (
    <section className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
      <div className="overflow-hidden rounded-[28px] border border-amber-200/30 bg-black/25 shadow-[0_18px_40px_rgba(0,0,0,0.24)]">
        {character.retrato ? (
          <img
            src={character.retrato}
            alt={character.nombre}
            className="aspect-square h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex aspect-square items-center justify-center bg-[radial-gradient(circle_at_top,#f59e0b_0%,#292524_55%,#0c0a09_100%)] text-6xl font-semibold text-amber-100/90">
            {character.nombre.slice(0, 1).toUpperCase()}
          </div>
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
          <p className="mt-2 text-lg font-medium text-stone-200">
            {raceSummary}
          </p>
          <p className="mt-2 text-sm font-medium text-stone-300">
            {classSummary}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm font-medium text-stone-400">
            <p>
              Exp {experience.currentXp}
              {experience.nextLevelXp === null
                ? " / max"
                : ` / ${experience.nextLevelXp}`}
            </p>
            {isOwner ? (
              <button
                type="button"
                onClick={onOpenLevelManagement}
                className="rounded-full border border-sky-300/25 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-100 transition hover:bg-sky-400/20"
              >
                Modificar nivel
              </button>
            ) : null}
          </div>
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
              className="rounded-full border border-amber-300/30 bg-amber-300/10 px-5 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/15"
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
