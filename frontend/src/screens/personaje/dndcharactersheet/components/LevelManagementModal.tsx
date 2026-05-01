import { useEffect, useState } from "react";

interface LevelManagementModalProps {
  isOpen: boolean;
  currentXp: number;
  nextLevelXp: number | null;
  canLevelDown: boolean;
  onClose: () => void;
  onSaveExperience: (experience: number) => Promise<void>;
  onOpenLevelUp: () => void;
  onOpenLevelDown: () => void;
}

export default function LevelManagementModal({
  isOpen,
  currentXp,
  nextLevelXp,
  canLevelDown,
  onClose,
  onSaveExperience,
  onOpenLevelUp,
  onOpenLevelDown,
}: LevelManagementModalProps) {
  const [experienceValue, setExperienceValue] = useState(String(currentXp));
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setExperienceValue(String(currentXp));
    setSaveError(null);
  }, [currentXp, isOpen]);

  if (!isOpen) {
    return null;
  }

  const parsed = Number.parseInt(experienceValue, 10);
  const maxExperience = nextLevelXp ?? Math.max(currentXp, 0);
  const safeExperience = Number.isNaN(parsed)
    ? 0
    : Math.max(0, Math.min(maxExperience, parsed));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-[28px] border border-stone-300/12 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.08),_rgba(12,10,9,0.96)_52%)] p-6 text-stone-50 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-amber-200/75">
              Progresión
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              Modificar nivel
            </h3>
            <p className="mt-3 text-sm leading-6 text-stone-300">
              Ajusta la experiencia acumulada del personaje. El valor se limita
              al máximo del nivel actual.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-300/15 bg-black/45 text-xl text-white"
          >
            ×
          </button>
        </div>

        <div className="mt-6 rounded-[22px] border border-stone-300/10 bg-black/25 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-400">
            Experiencia
          </p>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                setExperienceValue(String(Math.max(0, safeExperience - 100)))
              }
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-lg text-white"
            >
              -
            </button>
            <input
              type="text"
              inputMode="numeric"
              value={experienceValue}
              onChange={(event) =>
                setExperienceValue(event.target.value.replace(/\D+/g, ""))
              }
              className="flex-1 rounded-[16px] border border-white/10 bg-black/35 px-4 py-3 text-center text-lg font-semibold text-white outline-none"
            />
            <button
              type="button"
              onClick={() =>
                setExperienceValue(
                  String(Math.min(maxExperience, safeExperience + 100)),
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-lg text-white"
            >
              +
            </button>
          </div>
          <p className="mt-3 text-sm text-stone-400">
            Máximo permitido ahora: {nextLevelXp ?? currentXp}
          </p>
        </div>

        {saveError ? (
          <div className="mt-4 rounded-[18px] border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {saveError}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          {canLevelDown ? (
            <button
              type="button"
              onClick={onOpenLevelDown}
              className="rounded-full border border-rose-300/30 bg-rose-400/10 px-5 py-3 text-sm font-semibold text-rose-100"
            >
              Eliminar un nivel
            </button>
          ) : null}
          <button
            type="button"
            onClick={() =>
              void (async () => {
                try {
                  setIsSaving(true);
                  setSaveError(null);
                  await onSaveExperience(safeExperience);
                  onClose();
                } catch (error) {
                  setSaveError(
                    error instanceof Error
                      ? error.message
                      : "No se pudo actualizar la experiencia.",
                  );
                } finally {
                  setIsSaving(false);
                }
              })()
            }
            disabled={isSaving}
            className="rounded-full border border-sky-300/30 bg-sky-400/10 px-5 py-3 text-sm font-semibold text-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Guardar experiencia
          </button>
          <button
            type="button"
            onClick={onOpenLevelUp}
            className="rounded-full border border-amber-300/30 bg-amber-300/10 px-5 py-3 text-sm font-semibold text-amber-100"
          >
            Subir de nivel
          </button>
        </div>
      </div>
    </div>
  );
}
