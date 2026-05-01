interface HitDiceEntry {
  die: string;
  total: number;
  current: number;
}

interface ShortRestModalProps {
  isOpen: boolean;
  hitDiceEntries: HitDiceEntry[];
  currentHitDice: Record<string, number>;
  shortRestHitDiceCounts: Record<string, number>;
  onCountsChange: (
    updater: (current: Record<string, number>) => Record<string, number>,
  ) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ShortRestModal({
  isOpen,
  hitDiceEntries,
  currentHitDice,
  shortRestHitDiceCounts,
  onCountsChange,
  onClose,
  onConfirm,
}: ShortRestModalProps) {
  if (!isOpen || hitDiceEntries.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,10,9,0.98),rgba(28,25,23,0.96))] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
        <h3 className="text-2xl font-bold text-white">Descanso corto</h3>
        <p className="mt-3 text-sm leading-6 text-stone-300">
          Elige cuántos dados de vida quieres gastar de cada clase o dado
          disponible.
        </p>
        <div className="mt-6 space-y-4">
          {hitDiceEntries.map((entry) => (
            <div
              key={entry.die}
              className="flex items-center justify-center gap-4"
            >
              <button
                type="button"
                onClick={() =>
                  onCountsChange((current) => ({
                    ...current,
                    [entry.die]: Math.max(0, (current[entry.die] ?? 0) - 1),
                  }))
                }
                className="rounded-full border border-white/10 px-4 py-2 text-lg font-semibold text-white"
              >
                -
              </button>
              <div className="min-w-[160px] rounded-[18px] border border-white/10 bg-black/20 px-6 py-4 text-center">
                <p className="text-4xl font-bold text-white">
                  {shortRestHitDiceCounts[entry.die] ?? 0}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-stone-400">
                  dados {entry.die} disponibles{" "}
                  {currentHitDice[entry.die] ?? entry.total}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onCountsChange((current) => ({
                    ...current,
                    [entry.die]: Math.min(
                      (current[entry.die] ?? 0) + 1,
                      currentHitDice[entry.die] ?? entry.total,
                    ),
                  }))
                }
                className="rounded-full border border-white/10 px-4 py-2 text-lg font-semibold text-white"
              >
                +
              </button>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-stone-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full border border-amber-300/30 bg-amber-300/10 px-5 py-3 text-sm font-semibold text-amber-100"
          >
            Aplicar descanso
          </button>
        </div>
      </div>
    </div>
  );
}
