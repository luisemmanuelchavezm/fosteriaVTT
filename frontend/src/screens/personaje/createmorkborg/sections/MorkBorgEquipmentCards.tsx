import { useState } from "react";
import {
  getMbScrollByIdx,
  getMbArmorByRoll,
  MB_WEAPONS,
} from "../utils/morkBorgUtils";
import { ResultChip, PendingRollWarning } from "./MorkBorgEquipmentHelpers";
import {
  Z_PLATA,
  Z_COMIDA,
  Z_ARMA,
  Z_ARMADURA,
  Z_PER_TIPO,
  Z_PER_IDX,
  Z_ESOT_TIPO,
  Z_ESOT_IDX,
} from "./useMorkBorgEquipmentRolls";

type RollFn = (slot: string, expr: string, label: string) => void;
type IsZFn = (slot: string) => boolean;

// ── SilverCard ────────────────────────────────────────────────────────────────

interface SilverCardProps {
  plataExpr: string;
  plataValue: number | null;
  isRolling: boolean;
  isZ: IsZFn;
  roll: RollFn;
  hasAttemptedCreation: boolean;
}

export function SilverCard({
  plataExpr,
  plataValue,
  isRolling,
  isZ,
  roll,
  hasAttemptedCreation,
}: SilverCardProps) {
  return (
    <div
      className={`flex flex-1 flex-col gap-2 rounded-2xl border px-5 py-4 ${plataValue !== null ? "border-amber-300/60 bg-gradient-to-r from-stone-900/95 to-amber-400/12" : "border-[#4A3520] bg-[#2A1F12]"}`}
    >
      <div className="flex items-center gap-3">
        <p className="shrink-0 text-sm font-bold uppercase tracking-wider text-amber-300/80">
          Plata
        </p>
        <p className="text-xs font-semibold text-stone-200">{plataExpr} × 10</p>
        <div className="ml-auto flex items-center gap-3">
          {isZ(Z_PLATA) ? (
            <span className="text-lg font-bold text-stone-500 animate-pulse">
              …
            </span>
          ) : plataValue !== null ? (
            <span className="text-lg font-bold text-white">
              {plataValue}
              <span className="ml-1 text-xs font-semibold text-stone-200">
                s
              </span>
            </span>
          ) : (
            <span className="text-lg font-bold text-stone-600">—</span>
          )}
          <button
            type="button"
            onClick={() => roll(Z_PLATA, plataExpr, "Tirada de Plata")}
            disabled={isRolling}
            className="shrink-0 rounded-full border border-stone-600 bg-stone-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-stone-800 active:scale-95 disabled:opacity-50"
          >
            {isZ(Z_PLATA) ? "…" : plataValue !== null ? "🎲" : "🎲 Tirar"}
          </button>
        </div>
      </div>
      {hasAttemptedCreation && plataValue === null && !isZ(Z_PLATA) ? (
        <PendingRollWarning />
      ) : null}
    </div>
  );
}

// ── FoodCard ──────────────────────────────────────────────────────────────────

interface FoodCardProps {
  comidaExpr: string;
  comidaValue: number | null;
  isRolling: boolean;
  isZ: IsZFn;
  roll: RollFn;
  hasAttemptedCreation: boolean;
}

export function FoodCard({
  comidaExpr,
  comidaValue,
  isRolling,
  isZ,
  roll,
  hasAttemptedCreation,
}: FoodCardProps) {
  return (
    <div
      className={`flex flex-1 flex-col gap-2 rounded-2xl border px-5 py-4 ${comidaValue !== null ? "border-amber-300/60 bg-gradient-to-r from-stone-900/95 to-amber-400/12" : "border-[#4A3520] bg-[#2A1F12]"}`}
    >
      <div className="flex items-center gap-3">
        <p className="shrink-0 text-sm font-bold uppercase tracking-wider text-amber-300/80">
          Comida
        </p>
        <p className="text-xs font-semibold text-stone-200">{comidaExpr}</p>
        <div className="ml-auto flex items-center gap-3">
          {isZ(Z_COMIDA) ? (
            <span className="text-lg font-bold text-stone-500 animate-pulse">
              …
            </span>
          ) : comidaValue !== null ? (
            <span className="text-lg font-bold text-white">
              {comidaValue}
              <span className="ml-1 text-xs font-semibold text-stone-200">
                {comidaValue === 1 ? "ración" : "raciones"}
              </span>
            </span>
          ) : (
            <span className="text-lg font-bold text-stone-600">—</span>
          )}
          <button
            type="button"
            onClick={() => roll(Z_COMIDA, comidaExpr, "Tirada de Comida")}
            disabled={isRolling}
            className="shrink-0 rounded-full border border-stone-600 bg-stone-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-stone-800 active:scale-95 disabled:opacity-50"
          >
            {isZ(Z_COMIDA) ? "…" : comidaValue !== null ? "🎲" : "🎲 Tirar"}
          </button>
        </div>
      </div>
      {hasAttemptedCreation && comidaValue === null && !isZ(Z_COMIDA) ? (
        <PendingRollWarning />
      ) : null}
    </div>
  );
}

// ── WeaponCard ────────────────────────────────────────────────────────────────

interface WeaponCardProps {
  armaExpr: string;
  armaResult: { nombre: string; formula: string } | null;
  isRolling: boolean;
  isZ: IsZFn;
  roll: RollFn;
  hasAttemptedCreation: boolean;
}

export function WeaponCard({
  armaExpr,
  armaResult,
  isRolling,
  isZ,
  roll,
  hasAttemptedCreation,
}: WeaponCardProps) {
  const [showModal, setShowModal] = useState(false);
  return (
    <div
      className={`relative flex flex-col gap-3 rounded-[22px] border px-4 py-5 transition ${armaResult ? "border-amber-300/60 bg-gradient-to-r from-stone-900/95 to-amber-400/12" : "border-[#4A3520] bg-[#2A1F12]"}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-300/80">
            Arma
          </p>
          <span className="rounded-full border border-stone-500/40 bg-stone-800/60 px-2 py-0.5 text-xs font-bold text-white">
            {armaExpr}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowModal((v) => !v)}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-stone-600 bg-stone-900 text-xs font-bold text-stone-200 transition hover:bg-stone-800 hover:text-white"
          title="Ver armas posibles"
        >
          ?
        </button>
      </div>

      {showModal ? (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowModal(false)}
          />
          <div className="absolute right-0 top-11 z-20 w-64 rounded-2xl border border-stone-300/15 bg-stone-950 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-300/80">
              Armas posibles · {armaExpr}
            </p>
            <div className="flex flex-col gap-1">
              {MB_WEAPONS.filter(
                (w) => w.idx <= (parseInt(armaExpr.replace("1d", "")) || 10),
              ).map((w) => (
                <div key={w.idx} className="flex gap-2 text-xs">
                  <span className="w-5 shrink-0 font-bold text-white">
                    {w.idx}
                  </span>
                  <span className="text-white">{w.nombre}</span>
                  <span className="ml-auto text-stone-500">{w.formula}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}

      <div className="flex flex-1 min-h-[2.5rem] items-center">
        {isZ(Z_ARMA) ? (
          <span className="text-2xl font-bold text-stone-500 animate-pulse">
            …
          </span>
        ) : armaResult ? (
          <div>
            <p className="text-base font-bold text-amber-200">
              {armaResult.nombre}
            </p>
            <p className="text-xs text-stone-200">{armaResult.formula}</p>
          </div>
        ) : (
          <span className="text-3xl font-bold text-stone-600">—</span>
        )}
      </div>

      <button
        type="button"
        onClick={() => roll(Z_ARMA, armaExpr, "Tirada de Arma")}
        disabled={isRolling}
        className="w-full rounded-full border border-stone-600 bg-stone-900 py-2 text-xs font-bold text-white transition hover:bg-stone-800 active:scale-95 disabled:opacity-50"
      >
        {isZ(Z_ARMA)
          ? "Tirando…"
          : armaResult
            ? "🎲 Volver a tirar"
            : "🎲 Tirar"}
      </button>
      {hasAttemptedCreation && !armaResult && !isZ(Z_ARMA) ? (
        <PendingRollWarning />
      ) : null}
    </div>
  );
}

// ── ArmorCard ─────────────────────────────────────────────────────────────────

interface ArmorResult {
  nombre: string;
  formula: string;
  descripcion?: string | null;
  nivel: number;
}

interface ArmorCardProps {
  effectiveArmaduraExpr: string;
  armaduraResult: ArmorResult | null;
  armaduraRolled: boolean;
  armaduraIsReroll: boolean;
  classId: string | undefined;
  isRolling: boolean;
  isZ: IsZFn;
  rollArmadura: () => void;
  hasAttemptedCreation: boolean;
}

export function ArmorCard({
  effectiveArmaduraExpr,
  armaduraResult,
  armaduraRolled,
  armaduraIsReroll,
  classId,
  isRolling,
  isZ,
  rollArmadura,
  hasAttemptedCreation,
}: ArmorCardProps) {
  const [showModal, setShowModal] = useState(false);
  return (
    <div
      className={`relative flex flex-col gap-3 rounded-[22px] border px-4 py-5 transition ${armaduraRolled ? "border-amber-300/60 bg-gradient-to-r from-stone-900/95 to-amber-400/12" : "border-[#4A3520] bg-[#2A1F12]"}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-300/80">
            Armadura
          </p>
          <span className="rounded-full border border-stone-500/40 bg-stone-800/60 px-2 py-0.5 text-xs font-bold text-white">
            {effectiveArmaduraExpr}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowModal((v) => !v)}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-stone-600 bg-stone-900 text-xs font-bold text-stone-200 transition hover:bg-stone-800 hover:text-white"
          title="Ver armaduras posibles"
        >
          ?
        </button>
      </div>

      {showModal ? (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowModal(false)}
          />
          <div className="absolute right-0 top-11 z-20 w-56 rounded-2xl border border-stone-300/15 bg-stone-950 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-300/80">
              Armaduras posibles · {effectiveArmaduraExpr}
            </p>
            <div className="flex flex-col gap-1">
              {Array.from(
                {
                  length:
                    parseInt(effectiveArmaduraExpr.replace("1d", "")) || 4,
                },
                (_, i) => i + 1,
              ).map((n) => {
                const a = getMbArmorByRoll(n);
                return (
                  <div key={n} className="flex gap-2 text-xs">
                    <span className="w-5 shrink-0 font-bold text-white">
                      {n}
                    </span>
                    <span className="text-white">{a ? a.nombre : "Nada"}</span>
                    {a ? (
                      <span className="ml-auto text-stone-500">
                        {a.formula}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : null}

      <div className="flex flex-1 min-h-[2.5rem] items-center">
        {isZ(Z_ARMADURA) ? (
          <span className="text-xl font-bold text-stone-500 animate-pulse">
            …
          </span>
        ) : armaduraRolled ? (
          armaduraResult ? (
            <div>
              <p className="text-sm font-bold text-amber-200">
                {armaduraResult.nombre}
              </p>
              <p className="text-xs text-stone-200">{armaduraResult.formula}</p>
              {armaduraResult.descripcion ? (
                <p className="text-xs text-stone-200 mt-0.5">
                  {armaduraResult.descripcion}
                </p>
              ) : null}
              {classId === "realeza-desgracia" &&
              armaduraResult.nivel === 3 &&
              !armaduraIsReroll ? (
                <p className="mt-1.5 rounded-lg border border-amber-400/50 bg-amber-950/40 px-2 py-1 text-xs font-bold text-amber-300">
                  ⚠ Deberías tirar 1 vez más
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-base font-bold text-white">Nada</p>
          )
        ) : (
          <span className="text-2xl font-bold text-stone-600">—</span>
        )}
      </div>

      <button
        type="button"
        onClick={rollArmadura}
        disabled={isRolling}
        className="w-full rounded-full border border-stone-600 bg-stone-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-stone-800 active:scale-95 disabled:opacity-50"
      >
        {isZ(Z_ARMADURA)
          ? "Tirando…"
          : armaduraRolled
            ? "🎲 Volver a tirar"
            : "🎲 Tirar"}
      </button>
      {hasAttemptedCreation && !armaduraRolled && !isZ(Z_ARMADURA) ? (
        <PendingRollWarning />
      ) : null}
    </div>
  );
}

// ── ScrollSection ─────────────────────────────────────────────────────────────

interface ScrollSectionProps {
  wantsScroll: boolean;
  setWantsScroll: (v: boolean) => void;
  perScrollTipo: number | null;
  perScrollIdx: number | null;
  isRolling: boolean;
  isZ: IsZFn;
  roll: RollFn;
  hasAttemptedCreation: boolean;
}

export function ScrollSection({
  wantsScroll,
  setWantsScroll,
  perScrollTipo,
  perScrollIdx,
  isRolling,
  isZ,
  roll,
  hasAttemptedCreation,
}: ScrollSectionProps) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-[22px] border px-4 py-5 transition ${wantsScroll ? "border-amber-300/60 bg-gradient-to-r from-stone-900/95 to-amber-400/12" : "border-[#4A3520] bg-[#2A1F12]"}`}
    >
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-300/80">
        Pergamino
      </p>

      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={wantsScroll}
          onChange={(e) => setWantsScroll(e.target.checked)}
          className="h-3.5 w-3.5 accent-amber-400"
        />
        <span className="text-xs font-semibold text-white">
          Empezar con pergamino
        </span>
      </label>

      {wantsScroll ? (
        <div className="flex flex-col gap-3">
          <p className="text-xs italic text-amber-400/80">
            tu dado de armadura se reducirá a 1d2
          </p>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => roll(Z_PER_TIPO, "1d4", "Tipo de pergamino")}
                disabled={isRolling}
                className="flex items-center gap-1 rounded-full border border-stone-600 bg-stone-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-stone-800 active:scale-95 disabled:opacity-50"
              >
                {isZ(Z_PER_TIPO)
                  ? "Tirando…"
                  : perScrollTipo !== null
                    ? "🎲 Volver a tirar"
                    : "🎲 1d2 (tipo)"}
              </button>

              {perScrollTipo !== null && !isZ(Z_PER_TIPO) ? (
                <>
                  <ResultChip>
                    {perScrollTipo === 1
                      ? "🕊 Pergamino sagrado"
                      : "💀 Pergamino impuro"}
                  </ResultChip>
                  <button
                    type="button"
                    onClick={() => roll(Z_PER_IDX, "1d10", "Pergamino al azar")}
                    disabled={isRolling}
                    className="flex items-center gap-1 rounded-full border border-stone-600 bg-stone-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-stone-800 active:scale-95 disabled:opacity-50"
                  >
                    {isZ(Z_PER_IDX)
                      ? "Tirando…"
                      : perScrollIdx !== null
                        ? "🎲 Tirar de nuevo"
                        : "🎲 Tirar"}
                  </button>
                </>
              ) : null}
            </div>

            {hasAttemptedCreation &&
            perScrollTipo === null &&
            !isZ(Z_PER_TIPO) ? (
              <PendingRollWarning message="Tirada pendiente — elige el tipo de pergamino" />
            ) : hasAttemptedCreation &&
              perScrollTipo !== null &&
              perScrollIdx === null &&
              !isZ(Z_PER_IDX) ? (
              <PendingRollWarning message="Tirada pendiente — tira para obtener el pergamino" />
            ) : null}
          </div>

          {perScrollIdx !== null && !isZ(Z_PER_IDX)
            ? (() => {
                const scroll = getMbScrollByIdx(
                  perScrollTipo === 1 ? "sagrado" : "impuro",
                  perScrollIdx,
                );
                return scroll ? (
                  <div
                    className={`rounded-xl border px-3 py-2 ${perScrollTipo === 1 ? "border-amber-300/60 bg-stone-900/80" : "border-red-400/40 bg-stone-900/80"}`}
                  >
                    <p
                      className={`text-sm font-bold ${perScrollTipo === 1 ? "text-amber-300" : "text-red-400"}`}
                    >
                      {scroll.nombre}
                    </p>
                    <p className="mt-0.5 text-xs text-stone-200">
                      {scroll.descripcion}
                    </p>
                  </div>
                ) : null;
              })()
            : null}
        </div>
      ) : null}
    </div>
  );
}

// ── InitialScrollSection ──────────────────────────────────────────────────────

interface InitialScrollSectionProps {
  esotScrollTipo: number | null;
  esotScrollIdx: number | null;
  isRolling: boolean;
  isZ: IsZFn;
  roll: RollFn;
}

export function InitialScrollSection({
  esotScrollTipo,
  esotScrollIdx,
  isRolling,
  isZ,
  roll,
}: InitialScrollSectionProps) {
  return (
    <div className="mt-3">
      <div className="mb-3 mt-4 flex items-center gap-2">
        <div className="h-px flex-1 bg-stone-700" />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300/80">
          Pergamino inicial
        </p>
        <div className="h-px flex-1 bg-stone-700" />
      </div>

      <div
        className={`flex flex-col gap-3 rounded-[22px] border px-4 py-5 transition ${esotScrollIdx !== null ? "border-amber-300/60 bg-gradient-to-r from-stone-900/95 to-amber-400/12" : "border-[#4A3520] bg-[#2A1F12]"}`}
      >
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-300/80">
            Pergamino de inicio
          </p>
          <p className="mt-1 text-xs text-stone-200">
            El ermitaño esotérico siempre comienza con un pergamino al azar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              roll(Z_ESOT_TIPO, "1d4", "Tipo de pergamino inicial")
            }
            disabled={isRolling}
            className="flex items-center gap-1 rounded-full border border-stone-600 bg-stone-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-stone-800 active:scale-95 disabled:opacity-50"
          >
            {isZ(Z_ESOT_TIPO)
              ? "Tirando…"
              : esotScrollTipo !== null
                ? "🎲 Volver a tirar"
                : "🎲 1d2 (tipo)"}
          </button>

          {esotScrollTipo !== null && !isZ(Z_ESOT_TIPO) ? (
            <>
              <ResultChip>
                {esotScrollTipo === 1
                  ? "🕊 Pergamino sagrado"
                  : "💀 Pergamino impuro"}
              </ResultChip>
              <button
                type="button"
                onClick={() => roll(Z_ESOT_IDX, "1d10", "Pergamino al azar")}
                disabled={isRolling}
                className="flex items-center gap-1 rounded-full border border-stone-600 bg-stone-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-stone-800 active:scale-95 disabled:opacity-50"
              >
                {isZ(Z_ESOT_IDX)
                  ? "Tirando…"
                  : esotScrollIdx !== null
                    ? "🎲 Tirar de nuevo"
                    : "🎲 Tirar"}
              </button>
            </>
          ) : null}
        </div>

        {esotScrollIdx !== null && !isZ(Z_ESOT_IDX)
          ? (() => {
              const scroll = getMbScrollByIdx(
                esotScrollTipo === 1 ? "sagrado" : "impuro",
                esotScrollIdx,
              );
              return scroll ? (
                <div
                  className={`rounded-xl border px-3 py-2 ${esotScrollTipo === 1 ? "border-amber-300/60 bg-stone-900/80" : "border-red-400/40 bg-stone-900/80"}`}
                >
                  <p
                    className={`text-sm font-bold ${esotScrollTipo === 1 ? "text-amber-300" : "text-red-400"}`}
                  >
                    {scroll.nombre}
                  </p>
                  <p className="mt-0.5 text-xs text-stone-200">
                    {scroll.descripcion}
                  </p>
                </div>
              ) : null;
            })()
          : null}
      </div>
    </div>
  );
}
