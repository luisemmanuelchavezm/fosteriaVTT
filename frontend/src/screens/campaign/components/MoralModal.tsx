import { useState } from "react";
import { saveMBEnemyMoral } from "../../personaje/utils/mbApi";

interface MoralModalProps {
  characterId: number;
  detail: {
    nombre: string;
    estadisticas: Record<string, number>;
  };
  onClose: () => void;
  updateCharacterStat: (id: number, updates: Record<string, number>) => void;
}

export default function MoralModal({
  characterId,
  detail,
  onClose,
  updateCharacterStat,
}: MoralModalProps) {
  const [moralDelta, setMoralDelta] = useState("1");
  const [isSavingMoral, setIsSavingMoral] = useState(false);

  const moralActual = detail.estadisticas["Moral actual"] ?? 0;
  const moralMaxima = detail.estadisticas["Moral maxima"] ?? 0;
  const moralPercent =
    moralMaxima > 0
      ? Math.min(100, Math.max(0, (moralActual / moralMaxima) * 100))
      : 0;

  const handleMoral = async (mode: "aumentar" | "disminuir") => {
    const token = localStorage.getItem("jwtToken");
    if (!token) return;
    const delta = Number.parseInt(moralDelta, 10) || 0;
    if (delta <= 0) return;
    const next =
      mode === "aumentar"
        ? Math.min(moralMaxima, moralActual + delta)
        : Math.max(0, moralActual - delta);
    updateCharacterStat(characterId, { "Moral actual": next });
    setIsSavingMoral(true);
    try {
      await saveMBEnemyMoral(token, characterId, next);
    } finally {
      setIsSavingMoral(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 px-6 py-8 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-[24px] border border-white/15 bg-[linear-gradient(180deg,rgba(20,20,20,0.98)_0%,rgba(10,10,10,0.99)_100%)] p-6 text-white shadow-[0_24px_70px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-100/75">
              Moral
            </p>
            <h3 className="mt-1 text-xl font-bold text-white">
              {detail.nombre}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white/80 hover:bg-white/10"
          >
            Cerrar
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-[150px_minmax(0,1fr)]">
          <div className="grid grid-rows-[48px_48px_48px] gap-2">
            <button
              type="button"
              onClick={() => void handleMoral("aumentar")}
              className="rounded-[16px] border border-sky-300/35 bg-sky-400/10 px-3 text-sm font-semibold text-sky-100 transition hover:bg-sky-400/15"
            >
              Aumentar
            </button>
            <div className="rounded-[16px] border border-white/10 bg-black/25 px-2 py-1.5">
              <div className="grid grid-cols-[28px_minmax(0,1fr)_28px] items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setMoralDelta(
                      String(
                        Math.max(0, (Number.parseInt(moralDelta, 10) || 0) - 1),
                      ),
                    )
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs text-white"
                >
                  -
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  value={moralDelta}
                  onChange={(e) =>
                    setMoralDelta(e.target.value.replace(/\D+/g, "") || "0")
                  }
                  className="h-full w-full bg-transparent text-center text-lg font-semibold text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    setMoralDelta(
                      String((Number.parseInt(moralDelta, 10) || 0) + 1),
                    )
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs text-white"
                >
                  +
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleMoral("disminuir")}
              className="rounded-[16px] border border-rose-300/35 bg-rose-400/10 px-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/15"
            >
              Disminuir
            </button>
          </div>

          <div className="flex min-h-[156px] flex-col items-center justify-center px-2 text-center">
            <div className="flex items-center justify-center gap-3">
              <p className="text-[2.3rem] font-bold leading-none text-white">
                {moralActual}
              </p>
              <span className="text-[2rem] font-bold leading-none text-white/45">
                /
              </span>
              <p className="text-[2.3rem] font-bold leading-none text-white">
                {moralMaxima}
              </p>
            </div>
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.22em] text-stone-400">
              Moral
            </p>
            <div className="mt-3 h-3 w-full overflow-hidden rounded-full border border-sky-300/30 bg-black/30">
              <div
                className="h-full bg-sky-600 transition-all"
                style={{ width: `${moralPercent}%` }}
              />
            </div>
            {isSavingMoral && (
              <p className="mt-2 text-xs text-white/50">Guardando...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
