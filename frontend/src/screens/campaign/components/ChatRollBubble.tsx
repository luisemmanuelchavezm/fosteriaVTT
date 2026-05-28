import dadoPlaceholder from "../../../assets/dado placeholder.png";
import type { RollMessageData } from "./chatRollUtils";

export function ChatRollBubble({
  title,
  expression,
  diceValues,
  modifier,
  total,
  struck,
}: Omit<RollMessageData, "__type">) {
  return (
    <div className="py-0.5">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200/80">
        {title}
      </p>
      {expression && (
        <p className="mb-2 font-mono text-[10px] text-white/45">{expression}</p>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {diceValues.map((value, i) => (
          <div
            key={i}
            className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-white/25 bg-center bg-cover bg-no-repeat"
            style={{ backgroundImage: `url(${dadoPlaceholder})` }}
          >
            <span className="rounded bg-black/55 px-0.5 text-xs font-bold leading-none text-amber-100">
              {value}
            </span>
            {struck && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-px bg-white/80 rotate-[-8deg]" />
              </div>
            )}
          </div>
        ))}

        {modifier !== 0 && (
          <span className="text-sm font-semibold text-white/60">
            {modifier > 0 ? `+${modifier}` : modifier}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">
          Total
        </span>
        <div className="flex h-7 min-w-[1.75rem] items-center justify-center rounded-lg bg-emerald-500 px-2 text-sm font-bold text-white shadow-sm shadow-emerald-900/40">
          {total}
        </div>
      </div>
    </div>
  );
}
