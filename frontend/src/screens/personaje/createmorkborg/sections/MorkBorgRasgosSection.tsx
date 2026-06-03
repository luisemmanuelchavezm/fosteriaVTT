import { useEffect, useRef, useState } from "react";
import DiceRollOverlay from "../../../../components/dice/DiceRollOverlay";
import type { MbTraitsData } from "../hooks/useCreateMorkBorgCharacter";
import { useDiceRoller } from "../../../../components/dice/useDiceRoller";
import {
  MB_RASGOS_TERRIBLES,
  MB_CUERPOS_ROTOS,
  MB_HABITOS,
  MB_HISTORIAS_PERTURBADORAS,
  type MbTrait,
} from "../utils/morkBorgUtils";

const Z_RASGOS = "rasgos_terribles";
const Z_CUERPO = "cuerpo_roto";
const Z_HABITO = "habito";
const Z_HISTORIA = "historia";

// ── Dropdown anclado al ? (mismo patrón que modal de armas) ───────────────────
interface TraitDropdownProps {
  title: string;
  subtitle: string;
  traits: MbTrait[];
  onClose: () => void;
}

function TraitDropdown({
  title,
  subtitle,
  traits,
  onClose,
  openUpward = false,
}: TraitDropdownProps & { openUpward?: boolean }) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div
        className={`absolute right-0 z-20 w-[500px] max-w-[90vw] max-h-80 overflow-y-auto rounded-2xl border border-stone-300/15 bg-stone-950 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.8)] ${openUpward ? "bottom-8" : "top-8"}`}
      >
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-amber-300/80">
          {title} · {subtitle}
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {traits.map((t) => (
            <div key={t.idx} className="flex gap-2 text-xs">
              <span className="w-5 shrink-0 font-bold text-white">{t.idx}</span>
              <span className="text-stone-300">{t.nombre}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Botón ? con dropdown integrado ────────────────────────────────────────────
function HelpButton({
  title,
  subtitle,
  traits,
  openUpward = false,
}: {
  title: string;
  subtitle: string;
  traits: MbTrait[];
  openUpward?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-6 w-6 items-center justify-center rounded-full border border-stone-600 bg-stone-900 text-xs font-bold text-stone-200 transition hover:bg-stone-800 hover:text-white"
      >
        ?
      </button>
      {open ? (
        <TraitDropdown
          title={title}
          subtitle={subtitle}
          traits={traits}
          openUpward={openUpward}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}

// ── Subsección de tirada simple (1d20) ────────────────────────────────────────
interface SingleTraitSubProps {
  title: string;
  subtitle: string;
  traits: MbTrait[];
  value: number | null;
  isRollingThis: boolean;
  isRollingAny: boolean;
  openUpward?: boolean;
  onRoll: () => void;
}

function SingleTraitSubsection({
  title,
  subtitle,
  traits,
  value,
  isRollingThis,
  isRollingAny,
  openUpward = false,
  onRoll,
}: SingleTraitSubProps) {
  const trait =
    value !== null ? (traits.find((t) => t.idx === value) ?? null) : null;

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-amber-100">{title}</h3>
          <p className="text-xs text-stone-300">Tira {subtitle}</p>
        </div>
        <HelpButton
          title={title}
          subtitle={subtitle}
          traits={traits}
          openUpward={openUpward}
        />
        <button
          type="button"
          onClick={onRoll}
          disabled={isRollingAny}
          className="shrink-0 rounded-full border border-stone-600 bg-stone-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-stone-800 active:scale-95 disabled:opacity-50"
        >
          {isRollingThis
            ? "Tirando…"
            : value !== null
              ? "🎲 Volver a tirar"
              : "🎲 Tirar"}
        </button>
      </div>

      <div
        className={`mt-3 rounded-[22px] border px-5 py-4 transition ${
          value !== null
            ? "border-amber-300/50 bg-gradient-to-r from-stone-900/95 to-amber-400/12"
            : "border-[#4A3520] bg-[#2A1F12]"
        }`}
      >
        {trait ? (
          <p className="text-sm text-stone-100">
            <span className="mr-1 font-bold text-amber-300">{value}.</span>
            {trait.nombre}
          </p>
        ) : (
          <p className="text-xl font-bold text-stone-600">—</p>
        )}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
interface MorkBorgRasgosSectionProps {
  onAllRasgosComplete?: (complete: boolean, data?: MbTraitsData) => void;
}

export default function MorkBorgRasgosSection({
  onAllRasgosComplete,
}: MorkBorgRasgosSectionProps) {
  const { diceBoxHostId, diceBoxError, isRolling, summary, rollExpression } =
    useDiceRoller();

  const activeZoneRef = useRef<string | null>(null);
  const onAllRasgosCompleteRef = useRef(onAllRasgosComplete);
  useEffect(() => {
    onAllRasgosCompleteRef.current = onAllRasgosComplete;
  }, [onAllRasgosComplete]);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [rasgoValues, setRasgoValues] = useState<
    [number | null, number | null]
  >([null, null]);
  const [cuerpoValue, setCuerpoValue] = useState<number | null>(null);
  const [habitoValue, setHabitoValue] = useState<number | null>(null);
  const [historiaValue, setHistoriaValue] = useState<number | null>(null);

  useEffect(() => {
    const complete =
      rasgoValues[0] !== null &&
      rasgoValues[1] !== null &&
      cuerpoValue !== null &&
      habitoValue !== null &&
      historiaValue !== null;
    onAllRasgosCompleteRef.current?.(complete, {
      rasgoTerrible1: rasgoValues[0],
      rasgoTerrible2: rasgoValues[1],
      cuerpoRoto: cuerpoValue,
      habito: habitoValue,
      historiaperturbadora: historiaValue,
    });
  }, [rasgoValues, cuerpoValue, habitoValue, historiaValue]);

  useEffect(() => {
    const zone = activeZoneRef.current;
    if (!summary || isRolling || !zone) return;

    if (zone === Z_RASGOS) {
      const a = summary.diceValues[0];
      let b = summary.diceValues[1];
      if (a === b) {
        do {
          b = (crypto.getRandomValues(new Uint32Array(1))[0] % 20) + 1;
        } while (b === a);
      }
      setRasgoValues([a, b]);
    } else if (zone === Z_CUERPO) {
      setCuerpoValue(summary.diceValues[0]);
    } else if (zone === Z_HABITO) {
      setHabitoValue(summary.diceValues[0]);
    } else if (zone === Z_HISTORIA) {
      setHistoriaValue(summary.diceValues[0]);
    }

    activeZoneRef.current = null;
    setActiveZone(null);
  }, [summary, isRolling]);

  const doRoll = (zone: string, label: string, expr: string) => {
    if (isRolling) return;
    activeZoneRef.current = zone;
    setActiveZone(zone);
    rollExpression(label, expr);
  };

  const hasRasgos = rasgoValues[0] !== null && rasgoValues[1] !== null;

  return (
    <>
      <DiceRollOverlay
        diceBoxHostId={diceBoxHostId}
        diceBoxError={diceBoxError}
        isRolling={isRolling}
        summary={null}
      />

      <section className="relative mt-6 rounded-[28px] border border-stone-300/10 bg-[linear-gradient(180deg,rgba(12,10,9,0.72),rgba(41,37,36,0.18))] p-6">
        <h2 className="text-2xl font-bold text-amber-200">Rasgos</h2>
        <p className="mt-1 text-sm text-stone-200">
          Los rasgos definen la personalidad, apariencia y pasado de tu
          personaje.
        </p>

        <div className="mt-6 flex flex-col gap-6">
          {/* ── Rasgos terribles (2d20) ── */}
          <div>
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-amber-100">
                  Rasgos terribles
                </h3>
                <p className="text-xs text-stone-300">
                  Tira 2d20 (sin repetición)
                </p>
              </div>
              <HelpButton
                title="Rasgos terribles"
                subtitle="2d20"
                traits={MB_RASGOS_TERRIBLES}
              />
              <button
                type="button"
                onClick={() => doRoll(Z_RASGOS, "Rasgos terribles", "2d20")}
                disabled={isRolling}
                className="shrink-0 rounded-full border border-stone-600 bg-stone-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-stone-800 active:scale-95 disabled:opacity-50"
              >
                {activeZone === Z_RASGOS && isRolling
                  ? "Tirando…"
                  : hasRasgos
                    ? "🎲 Volver a tirar"
                    : "🎲 Tirar"}
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              {([0, 1] as const).map((i) => {
                const val = rasgoValues[i];
                const trait =
                  val !== null
                    ? (MB_RASGOS_TERRIBLES.find((t) => t.idx === val) ?? null)
                    : null;
                return (
                  <div
                    key={i}
                    className={`rounded-[22px] border px-4 py-4 transition ${
                      val !== null
                        ? "border-amber-300/50 bg-gradient-to-r from-stone-900/95 to-amber-400/12"
                        : "border-[#4A3520] bg-[#2A1F12]"
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-300/60">
                      {i === 0 ? "1.er rasgo" : "2.o rasgo"}
                    </p>
                    {trait ? (
                      <p className="mt-2 text-sm text-stone-100">
                        <span className="mr-1 font-bold text-amber-300">
                          {val}.
                        </span>
                        {trait.nombre}
                      </p>
                    ) : (
                      <p className="mt-2 text-xl font-bold text-stone-600">—</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-stone-300/10" />

          <SingleTraitSubsection
            title="Cuerpo roto"
            subtitle="1d20"
            traits={MB_CUERPOS_ROTOS}
            value={cuerpoValue}
            isRollingThis={activeZone === Z_CUERPO && isRolling}
            isRollingAny={isRolling}
            onRoll={() => doRoll(Z_CUERPO, "Cuerpo roto", "1d20")}
          />
          <div className="border-t border-stone-300/10" />
          <SingleTraitSubsection
            title="Hábito"
            subtitle="1d20"
            traits={MB_HABITOS}
            value={habitoValue}
            isRollingThis={activeZone === Z_HABITO && isRolling}
            isRollingAny={isRolling}
            onRoll={() => doRoll(Z_HABITO, "Hábito", "1d20")}
          />
          <div className="border-t border-stone-300/10" />
          <SingleTraitSubsection
            title="Historia perturbadora"
            subtitle="1d20"
            traits={MB_HISTORIAS_PERTURBADORAS}
            value={historiaValue}
            isRollingThis={activeZone === Z_HISTORIA && isRolling}
            isRollingAny={isRolling}
            openUpward
            onRoll={() => doRoll(Z_HISTORIA, "Historia perturbadora", "1d20")}
          />
        </div>
      </section>
    </>
  );
}
