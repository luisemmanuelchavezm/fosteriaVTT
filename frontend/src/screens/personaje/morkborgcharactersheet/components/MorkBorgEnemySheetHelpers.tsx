import { createPortal } from "react-dom";

// ── HP/Moral mini-panel ──────────────────────────────────────────────────────

export interface StatPanelProps {
  label: string;
  current: number;
  max: number;
  disabled?: boolean;
  disabledLabel?: string;
  readOnly?: boolean;
  healLabel?: string;
  damageLabel?: string;
  onHeal: () => void;
  onDamage: () => void;
  delta: string;
  setDelta: (v: string) => void;
  isSaving?: boolean;
  healColor?: string;
  damageColor?: string;
}

export function StatPanel({
  label,
  current,
  max,
  disabled,
  disabledLabel,
  readOnly = false,
  healLabel = "Curar",
  damageLabel = "Daño",
  onHeal,
  onDamage,
  delta,
  setDelta,
  isSaving,
  healColor = "border-emerald-300/35 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/15",
  damageColor = "border-rose-300/35 bg-rose-400/10 text-rose-100 hover:bg-rose-400/15",
}: StatPanelProps) {
  if (disabled || readOnly) {
    const displayVal = disabled
      ? (disabledLabel ?? "-/-")
      : `${current}/${max}`;
    return (
      <div
        className="rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.18))] p-3 flex flex-col items-center justify-center gap-1.5"
        style={{ minHeight: "110px" }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
          {label}
        </p>
        <p
          className={`text-2xl font-bold ${disabled ? "text-white/40" : "text-white"}`}
        >
          {displayVal}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.18))] p-2.5">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
        {label}
      </p>
      <div className="grid grid-cols-[90px_minmax(0,1fr)] gap-2">
        <div className="grid grid-rows-[32px_32px_32px] gap-1">
          <button
            type="button"
            onClick={onHeal}
            className={`rounded-[10px] border px-1 text-[11px] font-semibold transition ${healColor}`}
          >
            {healLabel}
          </button>
          <div className="rounded-[10px] border border-white/10 bg-black/25 px-1.5">
            <div className="grid grid-cols-[18px_1fr_18px] items-center gap-1 h-full">
              <button
                type="button"
                onClick={() =>
                  setDelta(
                    String(Math.max(0, (Number.parseInt(delta, 10) || 0) - 1)),
                  )
                }
                className="h-5 w-5 flex items-center justify-center rounded-full border border-white/10 text-xs text-white"
              >
                -
              </button>
              <input
                type="text"
                inputMode="numeric"
                value={delta}
                onChange={(e) =>
                  setDelta(e.target.value.replace(/\D+/g, "") || "0")
                }
                className="w-full bg-transparent text-center text-xs font-semibold text-white outline-none"
              />
              <button
                type="button"
                onClick={() =>
                  setDelta(String((Number.parseInt(delta, 10) || 0) + 1))
                }
                className="h-5 w-5 flex items-center justify-center rounded-full border border-white/10 text-xs text-white"
              >
                +
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={onDamage}
            className={`rounded-[10px] border px-1 text-[11px] font-semibold transition ${damageColor}`}
          >
            {damageLabel}
          </button>
        </div>
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-baseline gap-1.5">
            <p className="text-[1.8rem] font-bold leading-none text-white">
              {current}
            </p>
            <span className="text-[1.5rem] font-bold leading-none text-white/40">
              /
            </span>
            <p className="text-[1.8rem] font-bold leading-none text-white">
              {max}
            </p>
          </div>
          {isSaving && <p className="mt-0.5 text-[10px] text-white/40">…</p>}
        </div>
      </div>
    </div>
  );
}

// ── Special-weapon overlay ────────────────────────────────────────────────────

export interface SpecialWeaponOverlayProps {
  expression: string;
  onClose: () => void;
}

export function SpecialWeaponOverlay({
  expression,
  onClose,
}: SpecialWeaponOverlayProps) {
  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="rounded-[20px] border border-amber-400/30 bg-zinc-900 p-5 text-center shadow-2xl min-w-[220px] max-w-[300px]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs uppercase tracking-widest text-stone-400 mb-2">
          {expression}
        </p>
        <p className="text-base font-semibold text-amber-200 italic">
          leer efecto del especial
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 rounded-full border border-white/15 px-4 py-1 text-xs font-semibold text-white/70 hover:bg-white/10"
        >
          Cerrar
        </button>
      </div>
    </div>,
    document.body,
  );
}
