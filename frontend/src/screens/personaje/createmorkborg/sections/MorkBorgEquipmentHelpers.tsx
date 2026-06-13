import { useState } from "react";

// ── SubRollButton ─────────────────────────────────────────────────────────────
export function SubRollButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-2 flex items-center gap-1 rounded-full border border-stone-600 bg-stone-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-stone-800 active:scale-95 disabled:opacity-50"
    >
      🎲 {label}
    </button>
  );
}

// ── PresenciaNota ─────────────────────────────────────────────────────────────
export function PresenciaNota({ modifier }: { modifier: number | null }) {
  if (modifier !== null) return null;
  return (
    <p className="mt-1 text-xs italic text-amber-400/80">
      ↑ Tira Presencia en la fase de Estadísticas
    </p>
  );
}

// ── ResultChip ────────────────────────────────────────────────────────────────
export function ResultChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full border border-amber-300/60 bg-stone-800 px-2.5 py-0.5 text-xs font-bold text-amber-200">
      {children}
    </span>
  );
}

// ── PendingRollWarning ────────────────────────────────────────────────────────
export function PendingRollWarning({
  message = "Tirada pendiente",
  className = "",
}: {
  message?: string;
  className?: string;
}) {
  return (
    <p
      className={`animate-pulse rounded-xl border border-red-500/60 bg-red-950/80 px-3 py-2 text-xs font-bold text-red-300 shadow-[0_0_12px_rgba(220,38,38,0.3)] ${className}`}
    >
      ⚠ {message}
    </p>
  );
}

// ── TableBox ──────────────────────────────────────────────────────────────────
interface TableInfo {
  label: string;
  description: string;
}

export interface TableBoxProps {
  label: string;
  dice: string;
  hasResult: boolean;
  isRollingThis: boolean;
  isRollingAny: boolean;
  onRoll: () => void;
  children: React.ReactNode;
  tableInfo?: TableInfo[];
  pendingWarning?: boolean;
}

export function TableBox({
  label,
  dice,
  hasResult,
  isRollingThis,
  isRollingAny,
  onRoll,
  children,
  tableInfo,
  pendingWarning = false,
}: TableBoxProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div
      className={`relative flex flex-col gap-3 rounded-[22px] border px-4 py-5 transition ${hasResult ? "border-amber-300/60 bg-gradient-to-r from-stone-900/95 to-amber-400/12" : "border-[#4A3520] bg-[#2A1F12]"}`}
    >
      {/* Cabecera con ? opcional */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-300/80">
            {label}
          </p>
          <p className="text-xs font-semibold text-stone-200">{dice}</p>
        </div>
        {tableInfo ? (
          <button
            type="button"
            onClick={() => setShowModal((v) => !v)}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-stone-600 bg-stone-900 text-xs font-bold text-stone-200 transition hover:bg-stone-800 hover:text-white"
          >
            ?
          </button>
        ) : null}
      </div>

      {/* Modal */}
      {showModal && tableInfo ? (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowModal(false)}
          />
          <div className="absolute right-0 top-14 z-20 w-72 rounded-2xl border border-stone-300/15 bg-stone-950 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-amber-300/80">
              {label} · {dice}
            </p>
            <div className="flex flex-col gap-1.5">
              {tableInfo.map((e) => (
                <div key={e.label} className="flex gap-2 text-xs">
                  <span className="w-8 shrink-0 font-bold text-white">
                    {e.label}
                  </span>
                  <span className="text-white">{e.description}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {/* Contenido */}
      <div className="min-h-[3rem]">
        {isRollingThis ? (
          <p className="text-2xl font-bold text-stone-500 animate-pulse">…</p>
        ) : hasResult ? (
          <div className="text-white">{children}</div>
        ) : (
          <span className="text-3xl font-bold text-stone-600">—</span>
        )}
      </div>

      <button
        type="button"
        onClick={onRoll}
        disabled={isRollingAny}
        className="w-full rounded-full border border-stone-600 bg-stone-900 py-2 text-xs font-bold text-white transition hover:bg-stone-800 active:scale-95 disabled:opacity-50"
      >
        {isRollingThis
          ? "Tirando…"
          : hasResult
            ? "🎲 Volver a tirar"
            : "🎲 Tirar"}
      </button>

      {pendingWarning ? (
        <p className="animate-pulse rounded-xl border border-red-500/60 bg-red-950/80 px-3 py-2 text-xs font-bold text-red-300 shadow-[0_0_12px_rgba(220,38,38,0.3)]">
          ⚠ Tirada pendiente
        </p>
      ) : null}
    </div>
  );
}
