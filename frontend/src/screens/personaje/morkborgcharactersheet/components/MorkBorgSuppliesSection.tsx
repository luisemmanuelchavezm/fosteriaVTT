import { useState, useRef, useEffect } from "react";
import { useDiceRoller } from "../../../../components/dice/useDiceRoller";
import DiceRollOverlay from "../../../../components/dice/DiceRollOverlay";

interface MorkBorgSuppliesSectionProps {
  plata: number;
  comida: number;
  presagios: number;
  decocciones: number[];
  isRollingPresagios?: boolean;
  onAdjust: (supply: "plata" | "comida" | "presagios", delta: number) => void;
  onSetPlata: (value: number) => void;
  onSetComida: (value: number) => void;
  onAdjustDecoccion: (index: number, delta: number) => void;
  onSetDecoccion: (index: number, value: number) => void;
  onRollPresagios: () => void;
}

type ActiveTab = "recursos" | "decocciones";

function EditableNumber({
  value,
  min,
  max,
  onSet,
}: {
  value: number;
  min: number;
  max: number;
  onSet: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setDraft(String(value));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commit = () => {
    const n = Number.parseInt(draft, 10);
    if (!Number.isNaN(n)) onSet(Math.min(max, Math.max(min, n)));
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-[52px] bg-transparent text-center text-2xl font-bold leading-none text-white outline-none"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      className="min-w-[36px] text-center text-2xl font-bold leading-none text-white hover:text-amber-200 transition-colors"
    >
      {value}
    </button>
  );
}

export default function MorkBorgSuppliesSection({
  plata,
  comida,
  presagios,
  decocciones,
  isRollingPresagios = false,
  onAdjust,
  onSetPlata,
  onSetComida,
  onAdjustDecoccion,
  onSetDecoccion,
  onRollPresagios,
}: MorkBorgSuppliesSectionProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("recursos");

  // Dado 3D propio para decocciones
  const pendingDecoccionRef = useRef<number | null>(null);
  const [pendingDecoccionIndex, setPendingDecoccionIndex] = useState<
    number | null
  >(null);
  const {
    diceBoxHostId: decDiceHostId,
    diceBoxError: decDiceError,
    isRolling: isRollingDec,
    summary: decSummary,
    rollExpression: rollDecExpression,
  } = useDiceRoller();

  useEffect(() => {
    if (pendingDecoccionRef.current === null || !decSummary || isRollingDec)
      return;
    const idx = pendingDecoccionRef.current;
    pendingDecoccionRef.current = null;
    setPendingDecoccionIndex(null);
    const raw = decSummary.diceValues[0] ?? decSummary.total;
    onSetDecoccion(idx, Math.max(0, Math.min(10, raw)));
  }, [decSummary, isRollingDec, onSetDecoccion]);

  const handleD4Roll = (index: number) => {
    if (isRollingDec) return;
    pendingDecoccionRef.current = index;
    setPendingDecoccionIndex(index);
    rollDecExpression("Decocción d4", "1d4");
  };

  const tabs: { id: ActiveTab; label: string }[] = [
    { id: "recursos", label: "Recursos" },
    { id: "decocciones", label: "Decocciones" },
  ];

  return (
    <>
      <DiceRollOverlay
        diceBoxHostId={decDiceHostId}
        diceBoxError={decDiceError}
        isRolling={isRollingDec}
        summary={decSummary}
      />

      <section className="[contain:inline-size] w-full rounded-[22px] border border-white/10 bg-black/15 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
        {/* Tab bar */}
        <div className="flex gap-2 border-b border-white/10 pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-amber-200 text-stone-950"
                  : "border border-white/10 bg-white/5 text-stone-200 hover:bg-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Recursos tab */}
        {activeTab === "recursos" && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {/* Plata */}
            <article className="rounded-[14px] border border-white/10 bg-black/20 px-2.5 py-3 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-400">
                Plata
              </p>
              <div className="mt-2 flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onAdjust("plata", -1)}
                  className="rounded-full border border-white/10 px-2.5 py-0.5 text-sm text-stone-200"
                >
                  −
                </button>
                <EditableNumber
                  value={plata}
                  min={-999}
                  max={999}
                  onSet={onSetPlata}
                />
                <button
                  type="button"
                  onClick={() => onAdjust("plata", 1)}
                  className="rounded-full border border-white/10 px-2.5 py-0.5 text-sm text-stone-200"
                >
                  +
                </button>
              </div>
            </article>

            {/* Comida */}
            <article className="rounded-[14px] border border-white/10 bg-black/20 px-2.5 py-3 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-400">
                Comida
              </p>
              <div className="mt-2 flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onAdjust("comida", -1)}
                  className="rounded-full border border-white/10 px-2.5 py-0.5 text-sm text-stone-200"
                >
                  −
                </button>
                <EditableNumber
                  value={comida}
                  min={0}
                  max={99}
                  onSet={onSetComida}
                />
                <button
                  type="button"
                  onClick={() => onAdjust("comida", 1)}
                  className="rounded-full border border-white/10 px-2.5 py-0.5 text-sm text-stone-200"
                >
                  +
                </button>
              </div>
            </article>

            {/* Presagios */}
            <article className="rounded-[14px] border border-white/10 bg-black/20 px-2.5 py-3 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-400">
                Presagios
              </p>
              <div className="mt-2 flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onAdjust("presagios", -1)}
                  className="rounded-full border border-white/10 px-2.5 py-0.5 text-sm text-stone-200"
                >
                  −
                </button>
                <p className="min-w-[36px] text-center text-2xl font-bold leading-none text-white">
                  {isRollingPresagios ? "…" : presagios}
                </p>
                <button
                  type="button"
                  onClick={() => onAdjust("presagios", 1)}
                  className="rounded-full border border-white/10 px-2.5 py-0.5 text-sm text-stone-200"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={onRollPresagios}
                disabled={isRollingPresagios}
                className="mt-2 w-full rounded-full border border-stone-600/60 bg-stone-900/60 py-0.5 text-lg leading-none disabled:opacity-40 transition hover:bg-stone-800"
              >
                🎲
              </button>
            </article>
          </div>
        )}

        {/* Decocciones tab */}
        {activeTab === "decocciones" && (
          <div className="mt-3 overflow-x-auto pb-1">
            <div className="flex min-w-max gap-2">
              {decocciones.map((val, i) => (
                <article
                  key={i}
                  className="min-w-[110px] flex-shrink-0 rounded-[14px] border border-white/10 bg-black/20 px-2.5 py-3 text-center"
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-stone-400">
                    Dec. {i + 1}
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onAdjustDecoccion(i, -1)}
                      className="rounded-full border border-white/10 px-2.5 py-0.5 text-sm text-stone-200"
                    >
                      −
                    </button>
                    <EditableNumber
                      value={val}
                      min={0}
                      max={10}
                      onSet={(v) => onSetDecoccion(i, v)}
                    />
                    <button
                      type="button"
                      onClick={() => onAdjustDecoccion(i, 1)}
                      className="rounded-full border border-white/10 px-2.5 py-0.5 text-sm text-stone-200"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleD4Roll(i)}
                    disabled={isRollingDec}
                    className="mt-2 w-full rounded-full border border-stone-600/60 bg-stone-900/60 py-0.5 text-lg leading-none transition hover:bg-stone-800 disabled:opacity-40"
                    title="Tirar d4"
                  >
                    {isRollingDec && pendingDecoccionIndex === i ? "…" : "🎲"}
                  </button>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
