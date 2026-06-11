import { useEffect, useRef, useState } from "react";
import DiceRollOverlay from "../../../../components/dice/DiceRollOverlay";
import { useDiceRoller } from "../../../../components/dice/useDiceRoller";
import type { MorkBorgClass } from "../utils/morkBorgUtils";

// IDs especiales
const ID_HERBORISTA = "herborista-ocultista";
const ID_REALEZA = "realeza-desgracia";

// Mapeo 1d6 → clase (en orden canónico Mork Borg)
const D6_CLASS_MAP = [
  "desertor-colmilludo", // 1
  "escoria-alcantarillas", // 2
  "ermitano-esoterico", // 3
  "realeza-desgracia", // 4
  "sacerdote-hereje", // 5
  "herborista-ocultista", // 6
];

interface MorkBorgClassSelectionSectionProps {
  classes: MorkBorgClass[];
  selectedClass: MorkBorgClass | null;
  hasError?: boolean;
  selectionError?: string;
  hasAttemptedCreation?: boolean;
  onClassClick: (item: MorkBorgClass) => void;
  onClearSelection?: () => void;
  /** Llamado cada vez que se obtiene una opción de clase (índices 0-based). */
  onOpcionRolled?: (indices: number[]) => void;
}

export default function MorkBorgClassSelectionSection({
  classes,
  selectedClass,
  hasError = false,
  selectionError,
  hasAttemptedCreation = false,
  onClassClick,
  onClearSelection,
  onOpcionRolled,
}: MorkBorgClassSelectionSectionProps) {
  const visibleClasses = selectedClass
    ? classes.filter((item) => item.id === selectedClass.id)
    : classes;

  // ── Dado ──────────────────────────────────────────────────────────────────
  const { diceBoxHostId, diceBoxError, isRolling, summary, rollExpression } =
    useDiceRoller();

  // Ref que distingue si estamos tirando para seleccionar clase (1d6) o para opción
  const d6ClassRef = useRef(false);
  const classesRef = useRef(classes);
  const onClassClickRef = useRef(onClassClick);
  const onOpcionRolledRef = useRef(onOpcionRolled);
  useEffect(() => {
    classesRef.current = classes;
    onClassClickRef.current = onClassClick;
    onOpcionRolledRef.current = onOpcionRolled;
  }, [classes, onClassClick, onOpcionRolled]);

  // Índices de opciones iluminadas (puede ser 1 o 2 para Realeza)
  const [rolledIndices, setRolledIndices] = useState<number[]>([]);

  const isHerborista = selectedClass?.id === ID_HERBORISTA;
  const isRealeza = selectedClass?.id === ID_REALEZA;
  const isRealezaRef = useRef(isRealeza);
  const opcionesLengthRef = useRef(selectedClass?.opciones?.length);
  useEffect(() => {
    isRealezaRef.current = isRealeza;
    opcionesLengthRef.current = selectedClass?.opciones?.length;
  }, [isRealeza, selectedClass?.opciones?.length]);

  // Resetear al cambiar de clase
  useEffect(() => {
    setRolledIndices([]);
  }, [selectedClass?.id]);

  // ID del último summary procesado — evita reprocesar cuando cambian otras deps
  const lastProcessedSummaryIdRef = useRef<number | null>(null);

  // Capturar resultado — distingue entre tirada de clase y tirada de opción
  useEffect(() => {
    if (!summary || isRolling) return;
    if (lastProcessedSummaryIdRef.current === summary.id) return;
    lastProcessedSummaryIdRef.current = summary.id;

    // ── Tirada 1d6 de selección de clase ──
    if (d6ClassRef.current) {
      d6ClassRef.current = false;
      const classId = D6_CLASS_MAP[summary.total - 1];
      const found = classesRef.current.find((c) => c.id === classId);
      if (found) onClassClickRef.current(found);
      return;
    }

    // ── Tirada de opciones de clase ──
    if (isRealezaRef.current) {
      const [v1, initialV2] = summary.diceValues;
      let v2 = initialV2;
      if (v1 === v2) {
        const max = opcionesLengthRef.current ?? 6;
        do {
          v2 = (crypto.getRandomValues(new Uint32Array(1))[0] % max) + 1;
        } while (v2 === v1);
      }
      const indices = [v1 - 1, v2 - 1];
      setRolledIndices(indices);
      onOpcionRolledRef.current?.(indices);
    } else {
      const indices = [summary.total - 1];
      setRolledIndices(indices);
      onOpcionRolledRef.current?.(indices);
    }
  }, [summary, isRolling]);

  const handleRollClass = () => {
    if (isRolling || selectedClass) return;
    d6ClassRef.current = true;
    rollExpression("Clase aleatoria", "1d6");
  };

  const handleRollDice = () => {
    if (isRolling || !selectedClass?.opciones) return;
    if (isRealeza) {
      rollExpression("Característica aleatoria", "2d6");
    } else {
      rollExpression(
        "Característica aleatoria",
        `1d${selectedClass.opciones.length}`,
      );
    }
  };

  const hasOpciones = !!(
    selectedClass?.opciones && selectedClass.opciones.length > 0
  );
  // Herborista no tiene botón de dado
  const showDiceButton = hasOpciones && !isHerborista;

  // Opciones obtenidas (puede ser 1 o 2)
  const rolledOpciones = rolledIndices
    .map((i) => selectedClass?.opciones?.[i])
    .filter(Boolean);

  const hasResult = rolledOpciones.length > 0;

  return (
    <>
      <DiceRollOverlay
        diceBoxHostId={diceBoxHostId}
        diceBoxError={diceBoxError}
        isRolling={isRolling}
        summary={null}
      />

      <section
        data-validation-error={hasError ? "true" : undefined}
        className={`mt-10 rounded-[28px] border p-6 transition ${
          hasError ? "border-rose-400/50 bg-rose-950/15" : "border-transparent"
        }`}
      >
        {/* Cabecera */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-2xl font-bold text-amber-200">Clases</h2>
          <div className="flex items-center gap-2">
            {/* Botón 1d6 — solo cuando no hay clase seleccionada */}
            {!selectedClass ? (
              <button
                type="button"
                onClick={handleRollClass}
                disabled={isRolling}
                className="rounded-full border border-stone-600 bg-stone-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-stone-800 active:scale-95 disabled:opacity-50"
              >
                🎲 Clase al azar (1d6)
              </button>
            ) : null}
            {selectedClass && onClearSelection ? (
              <button
                type="button"
                onClick={onClearSelection}
                className="rounded-full border border-stone-300/15 bg-stone-950/70 px-4 py-2 text-sm font-semibold text-white transition hover:border-amber-300/25 hover:bg-stone-900"
              >
                Eliminar elección
              </button>
            ) : null}
          </div>
        </div>

        {selectedClass ? (
          <p className="mt-2 text-sm text-stone-200">
            Clase elegida:{" "}
            <span className="font-semibold text-white">
              {selectedClass.nombre}
            </span>
          </p>
        ) : null}

        {/* Grid de tarjetas — zigzag negro/marrón por fila */}
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {visibleClasses.map((item, idx) => {
            const isSelected = selectedClass?.id === item.id;
            // Zigzag: (floor(i/2) + i) % 2 != 0 → marrón, si no → negro
            const isBrown =
              !selectedClass && (Math.floor(idx / 2) + idx) % 2 !== 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onClassClick(item)}
                className={`group relative flex w-full items-center gap-4 overflow-hidden rounded-[24px] border px-4 py-4 text-left transition ${
                  isSelected
                    ? "border-amber-300/60 bg-gradient-to-r from-stone-900/95 to-amber-400/12 shadow-[0_4px_18px_rgba(0,0,0,0.35)]"
                    : isBrown
                      ? "border-[#4A3520] bg-[#2A1F12] hover:border-amber-900/60 hover:bg-[rgba(55,40,22,0.55)]"
                      : "border-stone-300/15 bg-stone-900/50 hover:border-amber-300/25 hover:bg-stone-900/70"
                }`}
              >
                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] border text-sm font-bold text-stone-100 shadow-[0_6px_16px_rgba(0,0,0,0.3)] ${
                    isBrown
                      ? "border-[#4A3520] bg-[rgba(20,14,6,0.9)]"
                      : "border-stone-600/30 bg-stone-800"
                  }`}
                >
                  {item.insignia}
                </div>
                <p
                  className={`text-lg font-semibold ${isSelected ? "text-amber-100" : "text-stone-200"}`}
                >
                  {item.nombre}
                </p>
              </button>
            );
          })}
        </div>

        {selectionError ? (
          <p className="mt-4 animate-pulse rounded-xl border border-red-500/60 bg-red-950/80 px-4 py-3 text-sm font-bold text-red-300 shadow-[0_0_16px_rgba(220,38,38,0.3)]">
            ⚠ {selectionError}
          </p>
        ) : null}

        {/* Panel de detalle */}
        {selectedClass ? (
          <div className="mt-6 rounded-[24px] border border-stone-300/10 bg-[linear-gradient(180deg,rgba(12,10,9,0.72),rgba(41,37,36,0.18))] p-5">
            {/* Descripción */}
            <p className="text-sm leading-6 text-white">
              {selectedClass.descripcion}
            </p>

            {/* Características — alternancia por FILA (marrón/negro) */}
            <div className="mt-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300/80">
                Características
              </h3>
              {selectedClass.rasgos.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {selectedClass.rasgos.map((rasgo, rIdx) => {
                    const colonIndex = rasgo.indexOf(":");
                    const title =
                      colonIndex !== -1
                        ? rasgo.slice(0, colonIndex).trim()
                        : null;
                    const description =
                      colonIndex !== -1
                        ? rasgo.slice(colonIndex + 1).trim()
                        : rasgo;
                    // Fila par → marrón, fila impar → negro
                    const isRasgoBrown = Math.floor(rIdx / 2) % 2 === 0;
                    return (
                      <div
                        key={rasgo}
                        className={`rounded-xl border px-3 py-2.5 text-sm ${
                          isRasgoBrown
                            ? "border-[#4A3520] bg-[#2A1F12]"
                            : "border-stone-300/10 bg-stone-900/40"
                        }`}
                      >
                        {title ? (
                          <span className="font-bold text-amber-200">
                            {title}:{" "}
                          </span>
                        ) : null}
                        <span className="text-white">{description}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 text-sm italic text-stone-500">
                  Esta clase no tiene características especiales.
                </p>
              )}
            </div>

            {/* ── Opciones ── */}
            {hasOpciones ? (
              <div className="mt-6">
                {/* Cabecera de opciones + botón (si aplica) */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300/80">
                    {selectedClass.descripcionOpciones}
                  </h3>

                  {showDiceButton ? (
                    <button
                      type="button"
                      onClick={handleRollDice}
                      disabled={isRolling}
                      className="flex items-center gap-2 self-start rounded-full border border-stone-600 bg-stone-900 px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(0,0,0,0.4)] transition hover:bg-stone-800 active:scale-95 disabled:opacity-50 sm:self-auto"
                    >
                      {isRealeza
                        ? "🎲🎲 Obtener características (2d6)"
                        : "🎲 Obtener característica"}
                    </button>
                  ) : null}
                </div>

                {/* Panel de resultado */}
                {showDiceButton && (isRolling || hasResult) ? (
                  <div className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-300 px-5 py-4 shadow-[0_0_32px_rgba(253,224,71,0.45)]">
                    {isRolling ? (
                      <p className="text-sm font-semibold text-stone-900 animate-pulse">
                        Tirando {isRealeza ? "2d6" : "el dado"}…
                      </p>
                    ) : rolledOpciones.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {rolledOpciones.map((opcion, i) => (
                          <div key={opcion!.numero}>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-600">
                              {isRealeza ? `Característica ${i + 1} · ` : ""}
                              resultado {rolledIndices[i]! + 1}
                            </p>
                            <p className="mt-0.5 text-xl font-bold text-red-800">
                              {opcion!.nombre}
                            </p>
                            <p className="mt-0.5 text-sm leading-5 text-stone-800">
                              {opcion!.descripcion}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* Aviso de tirada pendiente */}
                {hasAttemptedCreation &&
                showDiceButton &&
                !hasResult &&
                !isRolling ? (
                  <p className="mt-3 animate-pulse rounded-xl border border-red-500/60 bg-red-950/80 px-4 py-2.5 text-xs font-bold text-red-300 shadow-[0_0_14px_rgba(220,38,38,0.3)]">
                    ⚠ Tirada pendiente — tira el dado para obtener tu
                    característica de clase
                  </p>
                ) : null}

                {/* Grid de opciones — alternancia por FILA (marrón/negro), resultado en ROJO */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {selectedClass.opciones!.map((opcion, index) => {
                    const isRolled = rolledIndices.includes(index);
                    // Fila par → marrón, fila impar → negro
                    const isOpBrown = Math.floor(index / 2) % 2 === 0;
                    return (
                      <div
                        key={opcion.numero}
                        className={`rounded-xl border px-3 py-2.5 text-sm transition ${
                          isRolled
                            ? "animate-pulse border-red-600/70 bg-gradient-to-r from-stone-900/95 to-red-900/25 [animation-duration:2.5s]"
                            : isOpBrown
                              ? "border-[#4A3520] bg-[#2A1F12]"
                              : "border-stone-300/10 bg-stone-900/40"
                        }`}
                      >
                        <p
                          className={`font-bold ${isRolled ? "text-red-400" : "text-amber-200"}`}
                        >
                          <span
                            className={`mr-1 ${isRolled ? "text-red-600" : "text-stone-500"}`}
                          >
                            {opcion.numero}.
                          </span>
                          {opcion.nombre}
                          {isRolled ? (
                            <span className="ml-2 text-[10px] font-semibold tracking-wide text-red-500">
                              ← resultado
                            </span>
                          ) : null}
                        </p>
                        <p
                          className={`mt-1.5 leading-5 ${isRolled ? "text-red-200" : "text-stone-200"}`}
                        >
                          {opcion.descripcion}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </>
  );
}
