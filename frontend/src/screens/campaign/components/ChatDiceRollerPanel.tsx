import { Dices } from "lucide-react";
import { useState } from "react";

interface ChatDiceRollerPanelProps {
  onRollExpression: (title: string, expression: string) => void;
  disabled?: boolean;
}

const QUICK_DICE = [100, 20, 12, 8, 6, 4] as const;
const CUSTOM_ROLL_REGEX =
  /^\s*\d+\s*d\s*\d+(?:\s*[+-]\s*(?:\d+\s*d\s*\d+|\d+))*\s*$/i;

export default function ChatDiceRollerPanel({
  onRollExpression,
  disabled = false,
}: ChatDiceRollerPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customExpression, setCustomExpression] = useState("");
  const [formatError, setFormatError] = useState("");

  const handleQuickRoll = (faces: number) => {
    onRollExpression(`Tirada d${faces}`, `1d${faces}`);
    setFormatError("");
  };

  const handleCustomRoll = () => {
    const expression = customExpression.trim();

    if (!CUSTOM_ROLL_REGEX.test(expression)) {
      setFormatError("Formato incorrecto. Ejemplo: 1d4 + 1d8 - 3d5");
      return;
    }

    onRollExpression("Tirada personalizada", expression);
    setCustomExpression("");
    setFormatError("");
  };

  return (
    <div className="relative flex items-end">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-[rgba(0,0,0,0.5)] text-white transition hover:bg-black/65 disabled:cursor-not-allowed disabled:opacity-55"
        aria-label="Abrir panel de tiradas"
        disabled={disabled}
      >
        <Dices className="h-5 w-5" />
      </button>

      <div
        className={`absolute right-full bottom-0 mr-2 origin-right rounded-2xl border border-white/25 bg-black/55 p-3 shadow-[0_16px_35px_rgba(0,0,0,0.35)] backdrop-blur-sm transition-all duration-200 ${
          isOpen
            ? "pointer-events-auto w-[280px] scale-100 opacity-100"
            : "pointer-events-none w-0 scale-95 opacity-0"
        }`}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
          Tirar dados
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {QUICK_DICE.map((faces) => (
            <button
              key={faces}
              type="button"
              onClick={() => handleQuickRoll(faces)}
              className="flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-1 py-2 text-sm font-bold text-amber-100 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-55"
              disabled={disabled}
            >
              d{faces}
            </button>
          ))}
        </div>

        <label className="mt-3 block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">
          Personalizar tirada
        </label>

        <input
          type="text"
          value={customExpression}
          onChange={(event) => {
            setCustomExpression(event.target.value);
            if (formatError) {
              setFormatError("");
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleCustomRoll();
            }
          }}
          placeholder="1d4 + 1d8 - 3d5"
          className="mt-2 h-10 w-full rounded-xl border border-white/35 bg-transparent px-3 text-sm text-white outline-none transition placeholder:text-white/65 focus:border-white"
          disabled={disabled}
        />

        {formatError ? (
          <p className="mt-2 text-xs font-semibold text-red-200">
            {formatError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
