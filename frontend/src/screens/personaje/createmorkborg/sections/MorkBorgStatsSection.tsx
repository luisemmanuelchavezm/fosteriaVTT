import { useEffect, useRef, useState } from "react";
import DiceRollOverlay from "../../../../components/dice/DiceRollOverlay";
import { useDiceRoller } from "../../../../components/dice/useDiceRoller";
import {
  getMbHpDice,
  getMbModifier,
  getMbPresagiosExpression,
  getMbStatExpression,
  mbUsesDropLowest,
  type MorkBorgClass,
} from "../utils/morkBorgUtils";

// ── Estadísticas principales (orden L → R en la matriz 2×2) ──────────────────
const MAIN_STATS = [
  { id: "fuerza", label: "Fuerza" },
  { id: "agilidad", label: "Agilidad" },
  { id: "presencia", label: "Presencia" },
  { id: "resistencia", label: "Resistencia" },
];

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface StatValue {
  total: number;
  modifier: number;
}
type StatsState = Partial<Record<string, StatValue>>;

// IDs internos para distinguir tiradas de stats calculadas
const ROLL_VIDA = "__vida__";
const ROLL_PRESAGIOS = "__presagios__";

function formatMod(mod: number) {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

// ── Caja de estadística calculada ─────────────────────────────────────────────
interface CalculatedStatBoxProps {
  label: string;
  formula: string; // texto informativo, ej. "Mod. RES (−1) + 1d8"
  value: number | null;
  canRoll: boolean; // se muestra el botón solo cuando el prerrequisito está tirado
  isRollingThis: boolean;
  isRollingAny: boolean;
  pendingWarning?: boolean;
  onRoll: () => void;
}

function CalculatedStatBox({
  label,
  formula,
  value,
  canRoll,
  isRollingThis,
  isRollingAny,
  pendingWarning = false,
  onRoll,
}: CalculatedStatBoxProps) {
  return (
    <div className="flex flex-col gap-3 rounded-[22px] border border-[#4A3520] bg-[#2A1F12] px-6 py-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Nombre */}
        <p className="w-44 text-sm font-bold uppercase tracking-[0.18em] text-amber-300/80">
          {label}
        </p>

        {/* Número */}
        <div className="flex h-12 w-20 items-center justify-center rounded-[14px] border border-stone-300/15 bg-stone-900/65 text-2xl font-bold">
          {isRollingThis ? (
            <span className="text-stone-500 animate-pulse">…</span>
          ) : value !== null ? (
            <span className="text-white">{value}</span>
          ) : (
            <span className="text-stone-600">—</span>
          )}
        </div>

        {/* Fórmula */}
        {canRoll ? <p className="text-xs text-stone-200">{formula}</p> : null}

        {/* Botón — solo cuando se cumple el prerrequisito */}
        {canRoll ? (
          <button
            type="button"
            onClick={onRoll}
            disabled={isRollingAny}
            className="ml-auto rounded-full border border-stone-600 bg-stone-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-stone-800 active:scale-95 disabled:opacity-50"
          >
            {isRollingThis
              ? "Tirando…"
              : value !== null
                ? "🎲 Volver a tirar"
                : "🎲 Tirar"}
          </button>
        ) : null}
      </div>

      {pendingWarning ? (
        <p className="animate-pulse rounded-xl border border-red-500/60 bg-red-950/80 px-3 py-2 text-xs font-bold text-red-300 shadow-[0_0_12px_rgba(220,38,38,0.3)]">
          ⚠ Tirada pendiente
        </p>
      ) : null}
    </div>
  );
}

// ── Caja de estadística principal ─────────────────────────────────────────────
interface MainStatBoxProps {
  label: string;
  expression: string;
  value: StatValue | undefined;
  isRollingThis: boolean;
  isRollingAny: boolean;
  pendingWarning?: boolean;
  onRoll: () => void;
}

function MainStatBox({
  label,
  expression,
  value,
  isRollingThis,
  isRollingAny,
  pendingWarning = false,
  onRoll,
}: MainStatBoxProps) {
  const hasValue = value !== undefined;

  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-[22px] border px-4 py-5 transition ${
        isRollingThis || hasValue
          ? "border-amber-300/60 bg-gradient-to-r from-stone-900/95 to-amber-400/12"
          : "border-[#4A3520] bg-[#2A1F12]"
      }`}
    >
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-300/80">
        {label}
      </p>
      <p className="text-xs font-semibold text-stone-200">{expression}</p>

      <div className="flex flex-col items-center">
        {isRollingThis ? (
          <p className="text-2xl font-bold text-stone-500 animate-pulse">…</p>
        ) : hasValue ? (
          <>
            <p className="text-4xl font-bold text-white">{value.total}</p>
            <p
              className={`mt-1 text-lg font-bold ${
                value.modifier > 0
                  ? "text-emerald-400"
                  : value.modifier < 0
                    ? "text-red-400"
                    : "text-stone-500"
              }`}
            >
              {formatMod(value.modifier)}
            </p>
          </>
        ) : (
          <p className="text-3xl font-bold text-stone-600">—</p>
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
          : hasValue
            ? "🎲 Volver a tirar"
            : "🎲 Tirar"}
      </button>

      {pendingWarning ? (
        <p className="w-full animate-pulse rounded-xl border border-red-500/60 bg-red-950/80 px-3 py-2 text-center text-xs font-bold text-red-300 shadow-[0_0_12px_rgba(220,38,38,0.3)]">
          ⚠ Tirada pendiente
        </p>
      ) : null}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
import type { MbStatsSnapshot } from "../hooks/useCreateMorkBorgCharacter";

interface MorkBorgStatsSectionProps {
  selectedClass: MorkBorgClass | null;
  hasError?: boolean;
  hasAttemptedCreation?: boolean;
  /** Llamado cada vez que se tira (o re-tira) Presencia con su modificador. */
  onPresenciaRolled?: (modifier: number) => void;
  /** Llamado cuando las 4 estadísticas principales ya tienen valor. */
  onAllMainStatsRolled?: () => void;
  /** Llamado cuando TODAS las tiradas (4 stats + Vida + Presagios + Carga) están hechas. */
  onAllStatsComplete?: () => void;
  /** Llamado con los valores reales cuando TODAS las tiradas están completas. */
  onStatsSnapshot?: (data: MbStatsSnapshot) => void;
}

export default function MorkBorgStatsSection({
  selectedClass,
  hasError = false,
  hasAttemptedCreation = false,
  onPresenciaRolled,
  onAllMainStatsRolled,
  onAllStatsComplete,
  onStatsSnapshot,
}: MorkBorgStatsSectionProps) {
  const disabled = !selectedClass;

  // ── Dados ──────────────────────────────────────────────────────────────────
  const { diceBoxHostId, diceBoxError, isRolling, summary, rollExpression } =
    useDiceRoller();

  // Ref que indica qué stat está siendo tirada ahora mismo
  const rollingStatIdRef = useRef<string | null>(null);
  // Modificador acumulado que se añade a la tirada de las stats calculadas
  const pendingModifierRef = useRef<number>(0);
  // true cuando Presagios se tiró como d4 simulando d2
  const rollingD2PresRef = useRef(false);
  // true cuando la tirada es 4d6 descarta el menor (sin clase)
  const dropLowestRef = useRef(false);
  const onPresenciaRolledRef = useRef(onPresenciaRolled);
  const onAllMainStatsRolledRef = useRef(onAllMainStatsRolled);
  const onAllStatsCompleteRef = useRef(onAllStatsComplete);
  const onStatsSnapshotRef = useRef(onStatsSnapshot);
  useEffect(() => {
    onPresenciaRolledRef.current = onPresenciaRolled;
    onAllMainStatsRolledRef.current = onAllMainStatsRolled;
    onAllStatsCompleteRef.current = onAllStatsComplete;
    onStatsSnapshotRef.current = onStatsSnapshot;
  }, [
    onPresenciaRolled,
    onAllMainStatsRolled,
    onAllStatsComplete,
    onStatsSnapshot,
  ]);

  const [statValues, setStatValues] = useState<StatsState>({});
  const [activeStatId, setActiveStatId] = useState<string | null>(null);
  const [vidaValue, setVidaValue] = useState<number | null>(null);
  const [presagiosValue, setPresagiosValue] = useState<number | null>(null);

  // Resetear todo al cambiar de clase
  useEffect(() => {
    setStatValues({});
    setActiveStatId(null);
    setVidaValue(null);
    setPresagiosValue(null);
    rollingStatIdRef.current = null;
    rollingD2PresRef.current = false;
    dropLowestRef.current = false;
  }, [selectedClass?.id]);

  // Notificar cuando las 4 stats principales tienen valor
  useEffect(() => {
    const allRolled = MAIN_STATS.every((s) => statValues[s.id] !== undefined);
    if (allRolled) onAllMainStatsRolledRef.current?.();
  }, [statValues]);

  // Notificar cuando TODAS las tiradas (4 main + Vida + Presagios + Carga) están hechas
  useEffect(() => {
    const allMain = MAIN_STATS.every((s) => statValues[s.id] !== undefined);
    const cargaAuto = allMain
      ? Math.max(1, (statValues["fuerza"]?.modifier ?? 0) + 8)
      : null;
    const allCalc =
      vidaValue !== null && presagiosValue !== null && cargaAuto !== null;
    if (allMain && allCalc) {
      onAllStatsCompleteRef.current?.();
      onStatsSnapshotRef.current?.({
        fuerza: statValues["fuerza"]!.total,
        modFuerza: statValues["fuerza"]!.modifier,
        agilidad: statValues["agilidad"]!.total,
        modAgilidad: statValues["agilidad"]!.modifier,
        presencia: statValues["presencia"]!.total,
        modPresencia: statValues["presencia"]!.modifier,
        resistencia: statValues["resistencia"]!.total,
        modResistencia: statValues["resistencia"]!.modifier,
        vida: vidaValue!,
        presagios: presagiosValue!,
        carga: cargaAuto,
      });
    }
  }, [statValues, vidaValue, presagiosValue]);

  // Capturar el resultado y asignarlo
  useEffect(() => {
    const statId = rollingStatIdRef.current;
    if (!summary || isRolling || !statId) return;

    if (statId === ROLL_VIDA) {
      // Vida: dado + modificador de Resistencia, mínimo 1
      const result = Math.max(1, summary.total + pendingModifierRef.current);
      setVidaValue(result);
    } else if (statId === ROLL_PRESAGIOS) {
      // Presagios: si se rodó como d4 simulando d2, mapear resultado
      const raw = summary.total;
      const mapped = rollingD2PresRef.current && raw > 2 ? raw - 2 : raw;
      rollingD2PresRef.current = false;
      setPresagiosValue(Math.max(1, mapped));
    } else {
      // Stat principal: suma total → valor + modificador
      let rawTotal = summary.total;

      // 4d6 descarta el menor (sin clase): ignorar summary.total y recalcular
      if (dropLowestRef.current) {
        const sorted = [...summary.diceValues].sort((a, b) => a - b);
        sorted.shift(); // descarta el dado de menor valor
        rawTotal = sorted.reduce((acc, v) => acc + v, 0);
        dropLowestRef.current = false;
      }

      const total = Math.max(1, rawTotal);
      const modifier = getMbModifier(total);
      setStatValues((prev) => ({
        ...prev,
        [statId]: { total, modifier },
      }));
      if (statId === "presencia") {
        onPresenciaRolledRef.current?.(modifier);
      }
    }

    rollingStatIdRef.current = null;
    setActiveStatId(null);
  }, [summary, isRolling]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleRollStat = (statId: string, statLabel: string) => {
    if (isRolling || disabled) return;
    const expression = getMbStatExpression(selectedClass?.id, statId);
    dropLowestRef.current = mbUsesDropLowest(selectedClass?.id);
    rollingStatIdRef.current = statId;
    setActiveStatId(statId);
    rollExpression(`Tirada de ${statLabel}`, expression);
  };

  const handleRollVida = () => {
    const res = statValues["resistencia"];
    if (isRolling || disabled || !res) return;
    const faces = getMbHpDice(selectedClass?.id);
    pendingModifierRef.current = res.modifier;
    rollingStatIdRef.current = ROLL_VIDA;
    setActiveStatId(ROLL_VIDA);
    rollExpression("Tirada de Vida", `1d${faces}`);
  };

  const handleRollPresagios = () => {
    if (isRolling || disabled) return;
    const expr = getMbPresagiosExpression(selectedClass?.id);
    const isD2 = expr === "1d2";
    rollingD2PresRef.current = isD2;
    rollingStatIdRef.current = ROLL_PRESAGIOS;
    setActiveStatId(ROLL_PRESAGIOS);
    // d2 no existe en el motor 3D → rodamos d4 y mapeamos en la captura
    rollExpression("Tirada de Presagios", isD2 ? "1d4" : expr);
  };

  // ── Datos para las cajas calculadas ────────────────────────────────────────
  const resValue = statValues["resistencia"];
  const fueValue = statValues["fuerza"];
  const hpDice = getMbHpDice(selectedClass?.id);

  const vidaFormula = resValue
    ? `Mod. RES (${formatMod(resValue.modifier)}) + 1d${hpDice}`
    : "";
  const cargaValue = fueValue ? Math.max(1, fueValue.modifier + 8) : null;
  const cargaFormula = fueValue
    ? `Mod. FUE (${formatMod(fueValue.modifier)}) + 8`
    : "";

  return (
    <>
      <DiceRollOverlay
        diceBoxHostId={diceBoxHostId}
        diceBoxError={diceBoxError}
        isRolling={isRolling}
        summary={null}
      />

      <section
        data-validation-error={hasError && !disabled ? "true" : undefined}
        className={`relative mt-6 rounded-[28px] border p-6 transition-all duration-300 ${
          disabled
            ? "border-stone-600/30 bg-stone-800/40"
            : hasError
              ? "border-rose-400/50 bg-rose-950/15"
              : "border-stone-300/10 bg-[linear-gradient(180deg,rgba(12,10,9,0.72),rgba(41,37,36,0.18))]"
        }`}
      >
        {/* Mensaje de bloqueo */}
        {disabled ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[28px]">
            <p className="animate-pulse rounded-full border border-red-500/60 bg-red-950/80 px-6 py-3 text-sm font-bold text-red-300 shadow-[0_0_24px_rgba(220,38,38,0.35)]">
              Debes escoger una clase antes de asignar estadísticas
            </p>
          </div>
        ) : null}

        <div
          className={
            disabled ? "pointer-events-none select-none opacity-30" : ""
          }
        >
          {/* Cabecera */}
          <h2 className="text-2xl font-bold text-amber-200">Estadísticas</h2>
          {selectedClass ? (
            <p className="mt-1 text-sm text-stone-200">
              Las tiradas dependen de tu clase:{" "}
              <span className="font-semibold text-white">
                {selectedClass.nombre}
              </span>
            </p>
          ) : null}

          {/* Layout de stats */}
          <div className="mt-6 flex flex-col gap-3">
            {/* ── Vida y Presagios — dos columnas ── */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <CalculatedStatBox
                label="Vida"
                formula={vidaFormula}
                value={vidaValue}
                canRoll={!!resValue}
                isRollingThis={activeStatId === ROLL_VIDA && isRolling}
                isRollingAny={isRolling}
                pendingWarning={
                  hasAttemptedCreation &&
                  !!resValue &&
                  vidaValue === null &&
                  !(activeStatId === ROLL_VIDA && isRolling)
                }
                onRoll={handleRollVida}
              />
              <CalculatedStatBox
                label="Presagios"
                formula={getMbPresagiosExpression(selectedClass?.id)}
                value={presagiosValue}
                canRoll={true}
                isRollingThis={activeStatId === ROLL_PRESAGIOS && isRolling}
                isRollingAny={isRolling}
                pendingWarning={
                  hasAttemptedCreation &&
                  presagiosValue === null &&
                  !(activeStatId === ROLL_PRESAGIOS && isRolling)
                }
                onRoll={handleRollPresagios}
              />
            </div>

            {/* ── Matriz 2×2 ── */}
            <div className="grid grid-cols-2 gap-3">
              {MAIN_STATS.map((stat) => (
                <MainStatBox
                  key={stat.id}
                  label={stat.label}
                  expression={
                    mbUsesDropLowest(selectedClass?.id)
                      ? "4d6 descarta el menor"
                      : getMbStatExpression(selectedClass?.id, stat.id)
                  }
                  value={statValues[stat.id]}
                  isRollingThis={activeStatId === stat.id && isRolling}
                  isRollingAny={isRolling}
                  pendingWarning={
                    hasAttemptedCreation &&
                    statValues[stat.id] === undefined &&
                    !(activeStatId === stat.id && isRolling)
                  }
                  onRoll={() => handleRollStat(stat.id, stat.label)}
                />
              ))}
            </div>

            {/* ── Capacidad de carga — ancho completo ── */}
            <CalculatedStatBox
              label="Capacidad de carga"
              formula={cargaFormula}
              value={cargaValue}
              canRoll={false}
              isRollingThis={false}
              isRollingAny={isRolling}
              onRoll={() => {}}
            />
          </div>

          {/* Tabla de referencia */}
          <div className="mt-5 rounded-2xl border border-stone-300/10 bg-stone-900/40 px-4 py-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-300/80">
              Tabla de modificadores
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-stone-200">
              {(
                [
                  ["1–4", "−3"],
                  ["5–6", "−2"],
                  ["7–8", "−1"],
                  ["9–12", "0"],
                  ["13–14", "+1"],
                  ["15–16", "+2"],
                  ["17–20", "+3"],
                ] as [string, string][]
              ).map(([range, mod]) => (
                <span key={range}>
                  <span className="font-semibold text-white">{range}</span>
                  {" → "}
                  <span className="font-bold text-amber-300">{mod}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
