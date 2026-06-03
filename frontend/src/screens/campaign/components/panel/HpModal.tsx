import type { DndCharacterDetailResponse } from "../../../personaje/utils/dndApi";
import { getMaxHp } from "../../hooks/useTokenPanelCharacter";

interface HpModalProps {
  character: DndCharacterDetailResponse;
  hpDelta: string;
  setHpDelta: (v: string) => void;
  tempHpDelta: string;
  setTempHpDelta: (v: string) => void;
  isSavingHealth: boolean;
  healthSaveError: string | null;
  onClose: () => void;
  onAdjust: (mode: "heal" | "damage" | "tempGain" | "tempLose") => void;
  isMB?: boolean;
}

export default function HpModal({
  character,
  hpDelta,
  setHpDelta,
  tempHpDelta,
  setTempHpDelta,
  isSavingHealth,
  healthSaveError,
  onClose,
  onAdjust,
  isMB = false,
}: HpModalProps) {
  const currentHp = Math.max(0, character.estadisticas["Vida actual"] ?? 0);
  const tempHp = Math.max(0, character.estadisticas["Vida temporal"] ?? 0);
  const maxHp = getMaxHp(character.estadisticas);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 px-6 py-8 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-[820px] overflow-y-auto rounded-[24px] border border-white/15 bg-[linear-gradient(180deg,rgba(20,20,20,0.98)_0%,rgba(10,10,10,0.99)_100%)] p-6 text-white shadow-[0_24px_70px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-100/75">
              Puntos de vida
            </p>
            <h3 className="mt-1 text-xl font-bold text-white">
              {character.nombre}
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

        <div
          className={`grid gap-4 ${isMB ? "md:grid-cols-[150px_minmax(0,1fr)]" : "md:grid-cols-[150px_150px_minmax(0,1fr)]"}`}
        >
          {/* Current HP column */}
          <div className="grid grid-rows-[48px_48px_48px] gap-2">
            <button
              type="button"
              onClick={() => onAdjust("heal")}
              className="rounded-[16px] border border-emerald-300/35 bg-emerald-400/10 px-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/15"
            >
              Curar
            </button>

            <div className="rounded-[16px] border border-white/10 bg-black/25 px-2 py-1.5">
              <div className="grid grid-cols-[28px_minmax(0,1fr)_28px] items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setHpDelta(
                      String(
                        Math.max(0, (Number.parseInt(hpDelta, 10) || 0) - 1),
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
                  value={hpDelta}
                  onChange={(e) =>
                    setHpDelta(e.target.value.replace(/\D+/g, "") || "0")
                  }
                  className="h-full w-full bg-transparent text-center text-lg font-semibold text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    setHpDelta(String((Number.parseInt(hpDelta, 10) || 0) + 1))
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs text-white"
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onAdjust("damage")}
              className="rounded-[16px] border border-rose-300/35 bg-rose-400/10 px-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/15"
            >
              Daño
            </button>
          </div>

          {/* Temp HP column — hidden for Mork Borg */}
          {!isMB && (
            <div className="grid grid-rows-[48px_48px_48px] gap-2">
              <button
                type="button"
                onClick={() => onAdjust("tempGain")}
                className="rounded-[16px] border border-sky-300/35 bg-sky-400/10 px-3 text-sm font-semibold text-sky-100 transition hover:bg-sky-400/15"
              >
                Temp +
              </button>

              <div className="rounded-[16px] border border-white/10 bg-black/25 px-2 py-1.5">
                <div className="grid grid-cols-[28px_minmax(0,1fr)_28px] items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setTempHpDelta(
                        String(
                          Math.max(
                            0,
                            (Number.parseInt(tempHpDelta, 10) || 0) - 1,
                          ),
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
                    value={tempHpDelta}
                    onChange={(e) =>
                      setTempHpDelta(e.target.value.replace(/\D+/g, "") || "0")
                    }
                    className="h-full w-full bg-transparent text-center text-lg font-semibold text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setTempHpDelta(
                        String((Number.parseInt(tempHpDelta, 10) || 0) + 1),
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
                onClick={() => onAdjust("tempLose")}
                className="rounded-[16px] border border-cyan-300/35 bg-cyan-400/10 px-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/15"
              >
                Temp -
              </button>
            </div>
          )}

          {/* HP display */}
          <div className="flex min-h-[180px] flex-col items-center justify-center px-3 text-center">
            <div className="flex items-center justify-center gap-3">
              <p className="text-[2.3rem] font-bold leading-none text-white">
                {currentHp}
              </p>
              <span className="text-[2rem] font-bold leading-none text-white/45">
                /
              </span>
              <p className="text-[2.3rem] font-bold leading-none text-white">
                {maxHp}
              </p>
            </div>
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.22em] text-stone-400">
              Puntos de vida
            </p>
            {!isMB && (
              <p className="mt-3 text-base font-semibold text-sky-100/90">
                Temporal: {tempHp}
              </p>
            )}
            {isSavingHealth ? (
              <p className="mt-3 text-xs text-white/60">Guardando...</p>
            ) : null}
            {healthSaveError ? (
              <p className="mt-3 text-xs text-rose-200">{healthSaveError}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
