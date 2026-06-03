import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useDiceRoller } from "../../../../components/dice/useDiceRoller";
import DiceRollOverlay from "../../../../components/dice/DiceRollOverlay";

const DECOCCIONES_CATALOGO = [
  { idx: 1, nombre: "Veneno rojo", efecto: "Resistencia CD12 o −d10 PV." },
  {
    idx: 2,
    nombre: "Vapores de Ezumiels",
    efecto:
      "Pasa una prueba CD14 o alucinaciones graves (y posiblemente divertidas) durante d4 horas.",
  },
  {
    idx: 3,
    nombre: "Estofado de rana sureña",
    efecto:
      "Vomita durante d4 horas, pasa una prueba CD14 o no puedes hacer nada más.",
  },
  {
    idx: 4,
    nombre: "Elixir Vitalis",
    efecto: "Cura d6 PV y detiene la infección. Puede crear hábito.",
  },
  {
    idx: 5,
    nombre: "Sopa de araña-búho",
    efecto: "Ver en la oscuridad, trepar por las paredes durante 30 minutos.",
  },
  {
    idx: 6,
    nombre: "Filtro de Fernor",
    efecto:
      "Aceite translúcido, debe aplicarse directamente en el ojo. Cura la infección y da +2 en las pruebas de Presencia durante d4 horas.",
  },
  {
    idx: 7,
    nombre: "Rapé enervante de Hyphos",
    efecto:
      "¡Berkerser! Dos ataques por asalto pero defiende con CD14. Dura una pelea. Debe ser inhalado, provoca estornudos.",
  },
  {
    idx: 8,
    nombre: "Veneno negro",
    efecto: "Resistencia CD14 o −d6 PV y cegado durante una hora.",
  },
];

interface MorkBorgDecoccionesModalProps {
  onClose: () => void;
}

export default function MorkBorgDecoccionesModal({
  onClose,
}: MorkBorgDecoccionesModalProps) {
  const [d10Result, setD10Result] = useState<number | null>(null);
  const pendingD10Ref = useRef(false);

  const { diceBoxHostId, diceBoxError, isRolling, summary, rollExpression } =
    useDiceRoller();

  useEffect(() => {
    if (!pendingD10Ref.current || !summary || isRolling) return;
    pendingD10Ref.current = false;
    const raw = summary.diceValues[0] ?? summary.total;
    setD10Result(Math.max(1, Math.min(10, raw)));
  }, [summary, isRolling]);

  const handleRollD10 = () => {
    if (isRolling) return;
    pendingD10Ref.current = true;
    rollExpression("Decocción d10", "1d10");
  };

  return createPortal(
    <>
      <DiceRollOverlay
        diceBoxHostId={diceBoxHostId}
        diceBoxError={diceBoxError}
        isRolling={isRolling}
        summary={summary}
      />
      <div
        className="fixed inset-0 z-[60] overflow-y-auto bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-[24px] border border-white/10 bg-[#1a1410] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-amber-200">
                  Catálogo de Decocciones
                </h3>
                <button
                  type="button"
                  onClick={handleRollD10}
                  disabled={isRolling}
                  className="flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-950/40 px-3 py-1.5 text-sm font-bold text-amber-200 transition hover:bg-amber-900/50 disabled:opacity-50"
                >
                  <span className="text-base">{isRolling ? "…" : "🎲"}</span>
                  d10
                  {d10Result !== null && !isRolling ? (
                    <span className="text-amber-400">({d10Result})</span>
                  ) : null}
                </button>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/10 px-3 py-1 text-sm text-stone-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {DECOCCIONES_CATALOGO.map((dec) => (
                <div
                  key={dec.idx}
                  className={`rounded-[14px] border px-4 py-3 transition ${
                    d10Result === dec.idx
                      ? "border-amber-400/60 bg-amber-950/40"
                      : "border-white/10 bg-black/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 mt-0.5 text-sm font-bold tabular-nums text-stone-500">
                      {dec.idx}.
                    </span>
                    <div>
                      <p className="text-base font-semibold text-amber-100">
                        {dec.nombre}
                      </p>
                      <p className="mt-1 text-sm leading-5 text-stone-300">
                        {dec.efecto}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
