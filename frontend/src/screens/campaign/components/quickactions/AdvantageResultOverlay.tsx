import type { AdvantageResult } from "./attackTypes";

interface AdvantageResultOverlayProps {
  advantageResult: AdvantageResult;
}

export default function AdvantageResultOverlay({
  advantageResult,
}: AdvantageResultOverlayProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center gap-4 px-4">
      {([advantageResult.die1, advantageResult.die2] as const).map((die, i) => {
        const modFmt =
          advantageResult.modifier === 0
            ? null
            : `${advantageResult.modifier >= 0 ? "+" : "-"}${Math.abs(advantageResult.modifier)}`;
        const expression = modFmt ? `1d20 ${modFmt}` : "1d20";
        const total = die + advantageResult.modifier;
        const typeLabel =
          advantageResult.type === "ventaja" ? "Con ventaja" : "Con desventaja";
        return (
          <div
            key={i}
            className="min-w-[260px] animate-in fade-in zoom-in-95 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,10,9,0.92),rgba(28,25,23,0.9))] px-6 py-5 text-white shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-md duration-300"
          >
            <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/80">
              Resultado
            </p>
            <h3 className="mt-2 text-center text-xl font-bold text-white">
              {advantageResult.weaponName} · {typeLabel}
            </h3>
            <p className="mt-1 text-center text-sm text-stone-300">
              {expression}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-emerald-300/35 bg-emerald-300/15 text-lg font-bold text-emerald-50 shadow-[0_10px_24px_rgba(16,185,129,0.18)]">
                {die}
              </div>
              {advantageResult.modifier !== 0 && (
                <div className="rounded-[14px] border border-white/10 bg-white/5 px-4 py-3 text-lg font-semibold text-stone-100">
                  {modFmt}
                </div>
              )}
            </div>
            <p className="mt-5 text-center text-lg font-semibold text-stone-200">
              Total:{" "}
              <span className="text-2xl font-bold text-amber-200">{total}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}
