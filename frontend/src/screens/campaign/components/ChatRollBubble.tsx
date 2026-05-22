/* eslint-disable react-refresh/only-export-components */
import dadoPlaceholder from "../../../assets/dado placeholder.png";

export interface RollMessageData {
  __type: "roll";
  title: string;
  diceValues: number[];
  modifier: number;
  total: number;
  struck?: boolean;
}

export function serializeRollMessage(
  title: string,
  diceValues: number[],
  modifier: number,
  total: number,
  struck?: boolean,
): string {
  const data: RollMessageData = {
    __type: "roll",
    title,
    diceValues,
    modifier,
    total,
  };
  if (struck) data.struck = true;
  return JSON.stringify(data);
}

export function parseRollMessage(mensaje: string): RollMessageData | null {
  if (!mensaje.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(mensaje) as Partial<RollMessageData>;
    if (parsed.__type !== "roll") return null;
    if (typeof parsed.title !== "string") return null;
    if (!Array.isArray(parsed.diceValues)) return null;
    if (typeof parsed.modifier !== "number") return null;
    if (typeof parsed.total !== "number") return null;
    return {
      __type: "roll",
      title: parsed.title,
      diceValues: parsed.diceValues as number[],
      modifier: parsed.modifier,
      total: parsed.total,
      struck: parsed.struck === true,
    };
  } catch {
    return null;
  }
}

export function ChatRollBubble({
  title,
  diceValues,
  modifier,
  total,
  struck,
}: Omit<RollMessageData, "__type">) {
  return (
    <div className={`py-0.5 ${struck ? "opacity-50" : ""}`}>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200/80">
        {title}
      </p>

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

        {!struck && modifier !== 0 && (
          <span className="text-sm font-semibold text-white/60">
            {modifier > 0 ? `+${modifier}` : modifier}
          </span>
        )}
      </div>

      {!struck && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">
            Total
          </span>
          <div className="flex h-7 min-w-[1.75rem] items-center justify-center rounded-lg bg-emerald-500 px-2 text-sm font-bold text-white shadow-sm shadow-emerald-900/40">
            {total}
          </div>
        </div>
      )}
    </div>
  );
}
