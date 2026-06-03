import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useDiceRoller } from "../../../../components/dice/useDiceRoller";
import DiceRollOverlay from "../../../../components/dice/DiceRollOverlay";
import type { CharacterAbilityResponse } from "../../utils/dndApi";

interface StatMods {
  fuerza: number;
  agilidad: number;
  presencia: number;
  resistencia: number;
}

interface EscoriaSlotChange {
  eliminarId: number | null; // null = primera mejora (slot nuevo)
  nuevoIdx: number | null; // resultado del d6
}

interface Props {
  currentMods: StatMods;
  currentMaxHp: number;
  classId: string | null;
  characterAbilities: CharacterAbilityResponse[];
  onClose: () => void;
  onSave: (changes: {
    modFuerza?: number;
    modAgilidad?: number;
    modPresencia?: number;
    modResistencia?: number;
    vidaMaxima?: number;
    plataGanada?: number;
  }) => void;
  onSaveEscoriaEspecialidades: (
    habilidadesAEliminar: number[],
    nuevosIdxs: number[],
  ) => void;
}

type PendingRoll =
  | { kind: "stat"; stat: keyof StatMods }
  | { kind: "hp6d10" }
  | { kind: "hpd6" }
  | { kind: "escombros" }
  | { kind: "plata3d10" }
  | { kind: "scrolld10" }
  | { kind: "escoria"; slotIdx: number };

const STAT_LABELS: Record<keyof StatMods, string> = {
  fuerza: "Fuerza",
  agilidad: "Agilidad",
  presencia: "Presencia",
  resistencia: "Resistencia",
};

const ESCORIA_ESPECIALIDADES: Record<number, string> = {
  1: "El pinchazo del cobarde",
  2: "Dedos sucios",
  3: "Escupidor abominable",
  4: "Escapar del destino",
  5: "Sigilo excretor",
  6: "Esquivar la muerte",
};

function computeNewMod(current: number, d6: number): number {
  const MIN = -3,
    MAX = 6;
  if (current <= 1)
    return d6 === 1 ? Math.max(MIN, current - 1) : Math.min(MAX, current + 1);
  return d6 >= current ? Math.min(MAX, current + 1) : current - 1;
}

function formatMod(v: number) {
  return v >= 0 ? `+${v}` : `${v}`;
}

function extractEscoriaIdx(tags: string | null | undefined): number | null {
  const match = tags?.match(/EscEspecialidadIdx;(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

export default function MorkBorgImprovementModal({
  currentMods,
  currentMaxHp,
  classId,
  characterAbilities,
  onClose,
  onSave,
  onSaveEscoriaEspecialidades,
}: Props) {
  const [pendingRoll, setPendingRoll] = useState<PendingRoll | null>(null);
  const { diceBoxHostId, diceBoxError, isRolling, summary, rollExpression } =
    useDiceRoller();

  // ── Stats ────────────────────────────────────────────────────────────────
  const [statD6, setStatD6] = useState<Partial<Record<keyof StatMods, number>>>(
    {},
  );

  // ── HP ────────────────────────────────────────────────────────────────────
  const [hp6d10, setHp6d10] = useState<number | null>(null);
  const [hpD6, setHpD6] = useState<number | null>(null);

  // ── Escombros ─────────────────────────────────────────────────────────────
  const [escombrosRoll, setEscombrosRoll] = useState<number | null>(null);
  const [plata3d10, setPlata3d10] = useState<number | null>(null);
  const [scrollD10, setScrollD10] = useState<number | null>(null);

  // ── Escoria especialidades ────────────────────────────────────────────────
  const isEscoria = classId === "escoria-alcantarillas";
  const escoriaAbilities = characterAbilities.filter((h) =>
    h.tags?.includes("EscEspecialidadIdx"),
  );
  // slotChanges: array de slots (1 para primera mejora, 2 para siguientes)
  const numSlots = escoriaAbilities.length === 1 ? 1 : 2;
  const [escoriaSlots, setEscoriaSlots] = useState<EscoriaSlotChange[]>(() =>
    escoriaAbilities.length === 1
      ? [{ eliminarId: null, nuevoIdx: null }]
      : escoriaAbilities.map((a) => ({ eliminarId: a.id, nuevoIdx: null })),
  );

  // ── Capture dice results ──────────────────────────────────────────────────
  useEffect(() => {
    const p = pendingRoll;
    if (!p || !summary || isRolling) return;
    setPendingRoll(null);
    const raw = summary.total;
    const dice = summary.diceValues;

    if (p.kind === "stat") {
      setStatD6((prev) => ({ ...prev, [p.stat]: dice[0] ?? raw }));
    } else if (p.kind === "hp6d10") {
      setHp6d10(raw);
    } else if (p.kind === "hpd6") {
      setHpD6(dice[0] ?? raw);
    } else if (p.kind === "escombros") {
      const val = Math.max(1, Math.min(6, dice[0] ?? raw));
      setEscombrosRoll(val);
      setPlata3d10(null);
      setScrollD10(null);
    } else if (p.kind === "plata3d10") {
      setPlata3d10(raw);
    } else if (p.kind === "scrolld10") {
      setScrollD10(dice[0] ?? raw);
    } else if (p.kind === "escoria") {
      const idx = Math.max(1, Math.min(6, dice[0] ?? raw));
      setEscoriaSlots((prev) =>
        prev.map((s, i) => (i === p.slotIdx ? { ...s, nuevoIdx: idx } : s)),
      );
    }
  }, [isRolling, pendingRoll, summary]);

  const roll = useCallback(
    (pending: PendingRoll, expr: string, label: string) => {
      if (isRolling) return;
      setPendingRoll(pending);
      rollExpression(label, expr);
    },
    [isRolling, rollExpression],
  );

  // ── Computed ──────────────────────────────────────────────────────────────
  const newMods: Partial<StatMods> = {};
  for (const stat of Object.keys(currentMods) as (keyof StatMods)[]) {
    const d6 = statD6[stat];
    if (d6 !== undefined) newMods[stat] = computeNewMod(currentMods[stat], d6);
  }
  const newMaxHp = hpD6 !== null ? Math.min(100, currentMaxHp + hpD6) : null;
  const hpCanImprove = hp6d10 !== null && hp6d10 >= currentMaxHp;

  const hasMainChanges =
    Object.keys(newMods).length > 0 || newMaxHp !== null || plata3d10 !== null;
  const hasEscoriaChanges =
    isEscoria && escoriaSlots.some((s) => s.nuevoIdx !== null);
  const hasAnyChange = hasMainChanges || hasEscoriaChanges;

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (hasMainChanges) {
      const changes: Parameters<typeof onSave>[0] = {};
      if (newMods.fuerza !== undefined) changes.modFuerza = newMods.fuerza;
      if (newMods.agilidad !== undefined)
        changes.modAgilidad = newMods.agilidad;
      if (newMods.presencia !== undefined)
        changes.modPresencia = newMods.presencia;
      if (newMods.resistencia !== undefined)
        changes.modResistencia = newMods.resistencia;
      if (newMaxHp !== null) changes.vidaMaxima = newMaxHp;
      if (plata3d10 !== null) changes.plataGanada = plata3d10;
      onSave(changes);
    }
    if (hasEscoriaChanges) {
      const changedSlots = escoriaSlots.filter((s) => s.nuevoIdx !== null);
      const habilidadesAEliminar = changedSlots
        .map((s) => s.eliminarId)
        .filter((id): id is number => id !== null);
      const nuevosIdxs = changedSlots.map((s) => s.nuevoIdx!);
      onSaveEscoriaEspecialidades(habilidadesAEliminar, nuevosIdxs);
    }
    if (!hasMainChanges && !hasEscoriaChanges) onClose();
  };

  return createPortal(
    <>
      <DiceRollOverlay
        diceBoxHostId={diceBoxHostId}
        diceBoxError={diceBoxError}
        isRolling={isRolling}
        summary={summary}
      />

      {/* Backdrop scrollable — el contenido no tiene scroll interno */}
      <div
        className="fixed inset-0 z-[60] overflow-y-auto bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      >
        <div className="flex min-h-full items-center justify-center p-6">
          <div
            className="relative w-full max-w-lg rounded-[28px] border border-white/10 bg-[#14100c] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-amber-200">
                ✦ Mejorar personaje
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/10 px-3 py-1 text-sm text-stone-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* VIDA — 2 cols */}
              <div className="col-span-2 rounded-[18px] border border-emerald-500/25 bg-emerald-950/20 px-4 py-4">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-400">
                  Puntos de vida
                </p>
                <p className="mt-1 text-xs text-stone-400">
                  Tira 6d10. Si el resultado ≥ PV máximos ({currentMaxHp}),
                  auméntalos con un d6.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={isRolling}
                    onClick={() =>
                      roll({ kind: "hp6d10" }, "6d10", "Comprobación de vida")
                    }
                    className="flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-950/50 px-4 py-2 text-sm font-bold text-emerald-200 transition hover:bg-emerald-900/60 disabled:opacity-40"
                  >
                    🎲 6d10
                  </button>
                  {hp6d10 !== null && (
                    <span
                      className={`text-lg font-bold ${hpCanImprove ? "text-emerald-300" : "text-stone-400"}`}
                    >
                      = {hp6d10}{" "}
                      {hpCanImprove ? "✓" : `(necesitas ≥ ${currentMaxHp})`}
                    </span>
                  )}
                  {hpCanImprove && hpD6 === null && (
                    <button
                      type="button"
                      disabled={isRolling}
                      onClick={() =>
                        roll({ kind: "hpd6" }, "1d6", "Mejora de vida")
                      }
                      className="flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-950/50 px-4 py-2 text-sm font-bold text-emerald-200 transition hover:bg-emerald-900/60 disabled:opacity-40"
                    >
                      🎲 +d6 PV
                    </button>
                  )}
                  {hpD6 !== null && (
                    <span className="text-lg font-bold text-emerald-300">
                      +{hpD6} PV → {Math.min(100, currentMaxHp + hpD6)} máx.
                    </span>
                  )}
                </div>
              </div>

              {/* STATS 2×2 */}
              {(Object.keys(currentMods) as (keyof StatMods)[]).map((stat) => {
                const cur = currentMods[stat];
                const d6 = statD6[stat];
                const newMod = d6 !== undefined ? computeNewMod(cur, d6) : null;
                const delta = newMod !== null ? newMod - cur : null;
                return (
                  <div
                    key={stat}
                    className={`rounded-[18px] border px-4 py-4 transition ${
                      delta === null
                        ? "border-white/10 bg-black/20"
                        : delta > 0
                          ? "border-emerald-500/30 bg-emerald-950/20"
                          : delta < 0
                            ? "border-rose-500/30 bg-rose-950/20"
                            : "border-white/10 bg-black/25"
                    }`}
                  >
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-400">
                      {STAT_LABELS[stat]}
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {formatMod(cur)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isRolling}
                        onClick={() =>
                          roll(
                            { kind: "stat", stat },
                            "1d6",
                            `d6 ${STAT_LABELS[stat]}`,
                          )
                        }
                        className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm font-bold text-stone-200 transition hover:bg-white/10 disabled:opacity-40"
                      >
                        🎲 d6
                      </button>
                      {d6 !== undefined && (
                        <span className="text-sm text-stone-300">= {d6}</span>
                      )}
                      {newMod !== null && (
                        <span
                          className={`text-sm font-bold ${delta! > 0 ? "text-emerald-300" : delta! < 0 ? "text-rose-300" : "text-stone-400"}`}
                        >
                          → {formatMod(newMod)}{" "}
                          {delta! > 0 ? "▲" : delta! < 0 ? "▼" : "="}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* ESCORIA ESPECIALIDADES — 2 cols, solo si es Escoria */}
              {isEscoria && (
                <div className="col-span-2 rounded-[18px] border border-amber-500/25 bg-amber-950/15 px-4 py-4">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-400">
                    Especialidades
                  </p>
                  <p className="mt-1 text-xs text-stone-400">
                    {escoriaAbilities.length === 1
                      ? "Primera mejora: tira 1d6 para obtener una nueva especialidad."
                      : "Puedes volver a tirar una o ambas especialidades."}
                  </p>
                  <div className="mt-3 space-y-3">
                    {Array.from({ length: numSlots }, (_, slotIdx) => {
                      const slot = escoriaSlots[slotIdx];
                      const existingAbility =
                        escoriaAbilities.length >= 2
                          ? escoriaAbilities[slotIdx]
                          : null;
                      const existingIdx = existingAbility
                        ? extractEscoriaIdx(existingAbility.tags ?? null)
                        : null;
                      const newEspecialidad =
                        slot.nuevoIdx !== null
                          ? ESCORIA_ESPECIALIDADES[slot.nuevoIdx]
                          : null;
                      const isPendingThisSlot =
                        pendingRoll?.kind === "escoria" &&
                        pendingRoll.slotIdx === slotIdx;

                      return (
                        <div
                          key={slotIdx}
                          className={`rounded-[14px] border px-3 py-3 transition ${
                            slot.nuevoIdx !== null
                              ? "border-amber-400/40 bg-amber-950/25"
                              : "border-white/10 bg-black/20"
                          }`}
                        >
                          {existingAbility && existingIdx !== null && (
                            <p className="text-xs text-stone-400 mb-1">
                              Actual:{" "}
                              <span className="text-stone-200">
                                {existingAbility.nombre}
                              </span>
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              disabled={isRolling}
                              onClick={() =>
                                roll(
                                  { kind: "escoria", slotIdx },
                                  "1d6",
                                  "Especialidad Escoria",
                                )
                              }
                              className="rounded-full border border-amber-400/40 bg-amber-950/40 px-3 py-1.5 text-sm font-bold text-amber-200 transition hover:bg-amber-900/50 disabled:opacity-40"
                            >
                              {isRolling && isPendingThisSlot ? "…" : "🎲"} d6
                            </button>
                            {slot.nuevoIdx !== null && (
                              <span className="text-sm font-semibold text-amber-200">
                                = {slot.nuevoIdx} → {newEspecialidad}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ESCOMBROS — 2 cols */}
              <div className="col-span-2 rounded-[18px] border border-stone-600/30 bg-stone-900/30 px-4 py-4">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-stone-400">
                  Encuentras tirado en los escombros…
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  1-3 nada · 4 plata · 5 pergamino impuro · 6 pergamino sagrado
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={isRolling}
                    onClick={() =>
                      roll({ kind: "escombros" }, "1d6", "Escombros")
                    }
                    className="flex items-center gap-2 rounded-full border border-stone-500/40 bg-stone-900/60 px-4 py-2 text-sm font-bold text-stone-200 transition hover:bg-stone-800/60 disabled:opacity-40"
                  >
                    🎲 d6
                  </button>
                  {escombrosRoll !== null && (
                    <span className="text-base font-semibold text-amber-200">
                      {escombrosRoll} —{" "}
                      {escombrosRoll <= 3
                        ? "Nada."
                        : escombrosRoll === 4
                          ? "¡Plata! Tira 3d10."
                          : escombrosRoll === 5
                            ? "¡Pergamino impuro!"
                            : "¡Pergamino sagrado!"}
                    </span>
                  )}
                </div>

                {escombrosRoll === 4 && (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={isRolling || plata3d10 !== null}
                      onClick={() =>
                        roll(
                          { kind: "plata3d10" },
                          "3d10",
                          "Plata en escombros",
                        )
                      }
                      className="flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-950/40 px-4 py-2 text-sm font-bold text-amber-200 transition hover:bg-amber-900/50 disabled:opacity-40"
                    >
                      🎲 3d10 plata
                    </button>
                    {plata3d10 !== null && (
                      <span className="text-lg font-bold text-amber-300">
                        +{plata3d10} plata
                      </span>
                    )}
                  </div>
                )}
                {(escombrosRoll === 5 || escombrosRoll === 6) && (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={isRolling}
                      onClick={() =>
                        roll(
                          { kind: "scrolld10" },
                          "1d10",
                          escombrosRoll === 5
                            ? "Pergamino impuro"
                            : "Pergamino sagrado",
                        )
                      }
                      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition disabled:opacity-40 ${escombrosRoll === 5 ? "border-purple-500/40 bg-purple-950/40 text-purple-200 hover:bg-purple-900/50" : "border-yellow-500/40 bg-yellow-950/40 text-yellow-200 hover:bg-yellow-900/50"}`}
                    >
                      🎲 d10
                    </button>
                    {scrollD10 !== null && (
                      <span
                        className={`text-base font-semibold ${escombrosRoll === 5 ? "text-purple-200" : "text-yellow-200"}`}
                      >
                        {escombrosRoll === 5
                          ? "Pergamino impuro"
                          : "Pergamino sagrado"}{" "}
                        #{scrollD10}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-stone-300 transition hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!hasAnyChange}
                onClick={handleSave}
                className="rounded-full border border-amber-400/40 bg-amber-950/50 px-6 py-2.5 text-sm font-bold text-amber-200 transition hover:bg-amber-900/60 disabled:opacity-40"
              >
                Guardar mejoras
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
