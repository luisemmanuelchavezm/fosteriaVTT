import "@3d-dice/dice-box/dist/style.css";
import { createPortal } from "react-dom";
import type { DiceRollSummary } from "./useDiceRoller";

interface DiceRollOverlayProps {
  diceBoxHostId: string;
  diceBoxError: string | null;
  isRolling: boolean;
  summary: DiceRollSummary | null;
  onDismiss?: () => void;
}

function formatModifier(modifier: number) {
  return `${modifier >= 0 ? "+" : "-"}${Math.abs(modifier)}`;
}

export default function DiceRollOverlay({
  diceBoxHostId,
  diceBoxError,
  isRolling,
  summary,
}: DiceRollOverlayProps) {
  return createPortal(
    <>
      <div
        className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
        aria-hidden="true"
      >
        <div
          id={diceBoxHostId}
          className="absolute left-1/2 top-1/2 h-[min(64vh,560px)] w-[min(92vw,860px)] -translate-x-1/2 -translate-y-1/2 [&_canvas]:h-full [&_canvas]:w-full"
        />
      </div>

      {isRolling ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center px-4">
          <div className="rounded-full border border-amber-300/30 bg-stone-950/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-100 shadow-[0_12px_35px_rgba(0,0,0,0.35)] backdrop-blur-md">
            Tirando dados
          </div>
        </div>
      ) : null}

      {diceBoxError ? (
        <div className="pointer-events-none fixed inset-x-0 top-6 z-50 flex justify-center px-4">
          <div className="rounded-full border border-rose-400/35 bg-rose-950/85 px-4 py-2 text-sm font-medium text-rose-100 shadow-[0_12px_35px_rgba(0,0,0,0.35)] backdrop-blur-md">
            {diceBoxError}
          </div>
        </div>
      ) : null}

      {summary ? (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            key={summary.id}
            className="min-w-[280px] max-w-[min(92vw,460px)] animate-in fade-in zoom-in-95 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,10,9,0.92),rgba(28,25,23,0.9))] px-6 py-5 text-white shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-md duration-300"
          >
            <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/80">
              Resultado
            </p>
            <h3 className="mt-2 text-center text-xl font-bold text-white">
              {summary.title}
            </h3>
            <p className="mt-1 text-center text-sm text-stone-300">
              {summary.expression}
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              {summary.diceValues.map((value, index) => (
                <div
                  key={`${summary.id}-${value}-${index}`}
                  className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-emerald-300/35 bg-emerald-300/15 text-lg font-bold text-emerald-50 shadow-[0_10px_24px_rgba(16,185,129,0.18)]"
                >
                  {value}
                </div>
              ))}

              {summary.modifier !== 0 || summary.diceValues.length === 0 ? (
                <div className="rounded-[14px] border border-white/10 bg-white/5 px-4 py-3 text-lg font-semibold text-stone-100">
                  {summary.modifierDisplay ?? formatModifier(summary.modifier)}
                </div>
              ) : null}
            </div>

            <p className="mt-5 text-center text-lg font-semibold text-stone-200">
              {summary.totalLabel ?? "Total"}:{" "}
              <span className="text-2xl font-bold text-amber-200">
                {summary.total}
              </span>
            </p>
          </div>
        </div>
      ) : null}
    </>,
    document.body,
  );
}
