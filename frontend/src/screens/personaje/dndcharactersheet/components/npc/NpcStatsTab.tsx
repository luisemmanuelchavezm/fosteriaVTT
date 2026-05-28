import type { DndCharacterDetailResponse } from "../../../utils/dndApi";
import { ABILITY_STATS } from "../../../creatednd/utils/statisticsUtils";
import { SKILL_ROWS, SAVING_THROW_ROWS } from "../../data";

function abilitySuffix(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : String(mod);
}

function fmtBonus(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}

const SECONDARY_STATS_DISPLAY = [
  { key: "CA", label: "CA", unit: "", min: 0, max: 100 },
  { key: "Movimiento", label: "Movimiento", unit: " m", min: 0, max: 999 },
  { key: "Iniciativa", label: "Iniciativa", unit: "", min: -1, max: 100 },
] as const;

interface NpcStatsTabProps {
  character: DndCharacterDetailResponse;
  isEditMode: boolean;
  editStats: Record<string, number>;
  onEditStatsChange: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
  // HP
  isOwner?: boolean;
  currentHp: number;
  totalHp: number;
  tempHp: number;
  hpDelta: string;
  tempHpDelta: string;
  onHpDeltaChange: (value: string) => void;
  onTempHpDeltaChange: (value: string) => void;
  onHeal: () => void;
  onDamage: () => void;
  onGainTempHp: () => void;
  onLoseTempHp: () => void;
  onIncrementHpDelta: () => void;
  onDecrementHpDelta: () => void;
  onIncrementTempHpDelta: () => void;
  onDecrementTempHpDelta: () => void;
  sanitizeNonNegativeNumber: (value: string) => string;
}

/** Pestaña de estadísticas del NPC: atributos, estadísticas secundarias, PV y habilidades. */
export default function NpcStatsTab({
  character,
  isEditMode,
  editStats,
  onEditStatsChange,
  isOwner,
  currentHp,
  totalHp,
  tempHp,
  hpDelta,
  tempHpDelta,
  onHpDeltaChange,
  onTempHpDeltaChange,
  onHeal,
  onDamage,
  onGainTempHp,
  onLoseTempHp,
  onIncrementHpDelta,
  onDecrementHpDelta,
  onIncrementTempHpDelta,
  onDecrementTempHpDelta,
  sanitizeNonNegativeNumber,
}: NpcStatsTabProps) {
  const skillBonuses = SKILL_ROWS.filter((skill) => {
    const val = character.estadisticas[skill.name];
    return val !== undefined && val !== 0;
  }).map((skill) => ({
    displayName: skill.displayName,
    bonus: character.estadisticas[skill.name] ?? 0,
  }));

  const saveBonuses = SAVING_THROW_ROWS.filter((save) => {
    const val =
      character.estadisticas[`Salvacion de ${save.statName}`] ??
      character.estadisticas[`Salvación de ${save.statName}`];
    return val !== undefined && val !== 0;
  }).map((save) => ({
    displayName: save.displayName,
    bonus:
      character.estadisticas[`Salvacion de ${save.statName}`] ??
      character.estadisticas[`Salvación de ${save.statName}`] ??
      0,
  }));

  return (
    <div className="space-y-5">
      {/* Atributos principales */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {ABILITY_STATS.map((stat) => {
          const score = isEditMode
            ? (editStats[stat.name] ?? 10)
            : (character.estadisticas[stat.name] ?? 10);
          return (
            <div
              key={stat.id}
              className="flex flex-col items-center rounded-[18px] border-2 border-white bg-white px-2 py-3 text-center shadow-md"
            >
              <p className="text-[9px] font-bold uppercase tracking-wider text-stone-500">
                {stat.displayName}
              </p>
              <p className="my-0.5 text-xl font-bold text-stone-900">
                {abilitySuffix(score)}
              </p>
              {isEditMode ? (
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={score}
                  onChange={(e) =>
                    onEditStatsChange((prev) => ({
                      ...prev,
                      [stat.name]: Math.max(
                        1,
                        Math.min(30, Number(e.target.value) || 10),
                      ),
                    }))
                  }
                  className="w-full rounded border border-stone-300 bg-white px-1 py-0.5 text-center text-sm font-semibold text-stone-700 outline-none"
                />
              ) : (
                <p className="text-sm font-semibold text-stone-600">{score}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Estadísticas secundarias: CA / Mov / Ini */}
      <div className="grid grid-cols-3 gap-3">
        {SECONDARY_STATS_DISPLAY.map((s) => {
          const rawVal = isEditMode
            ? (editStats[s.key] ?? character.estadisticas[s.key] ?? 0)
            : (character.estadisticas[s.key] ?? 0);
          const displayVal =
            s.key === "Iniciativa"
              ? fmtBonus(rawVal as number)
              : `${rawVal}${s.unit}`;
          return (
            <div
              key={s.key}
              className="flex flex-col items-center rounded-xl border border-white/15 bg-white/5 py-3 text-center"
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
                {s.label}
              </p>
              {isEditMode ? (
                <input
                  type="number"
                  min={s.min}
                  max={s.max}
                  value={editStats[s.key] ?? 0}
                  onChange={(e) =>
                    onEditStatsChange((prev) => ({
                      ...prev,
                      [s.key]: Math.max(
                        s.min,
                        Math.min(s.max, Number(e.target.value) || 0),
                      ),
                    }))
                  }
                  className="mt-1 w-16 rounded border border-white/20 bg-white/10 px-1 py-0.5 text-center text-xl font-bold text-white outline-none focus:border-amber-400/60"
                />
              ) : (
                <p className="mt-1 text-2xl font-bold text-white">
                  {displayVal}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Edición de PV máximos */}
      {isEditMode && (
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <span className="text-sm font-semibold text-white/70">
            Puntos de vida máx.
          </span>
          <input
            type="number"
            min={1}
            max={999}
            value={editStats["Puntos de vida"] ?? totalHp}
            onChange={(e) =>
              onEditStatsChange((prev) => ({
                ...prev,
                "Puntos de vida": Math.max(
                  1,
                  Math.min(999, Number(e.target.value) || 1),
                ),
              }))
            }
            className="w-20 rounded border border-white/20 bg-white/10 px-2 py-1 text-center text-lg font-bold text-white outline-none focus:border-amber-400/60"
          />
        </div>
      )}

      {/* Widget de PV */}
      <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
        <div
          className={`grid gap-3 ${isOwner ? "sm:grid-cols-[120px_120px_minmax(0,1fr)]" : "justify-items-center"}`}
        >
          {isOwner && (
            <>
              {/* Columna Curar / Delta / Daño */}
              <div className="grid grid-rows-[48px_48px_48px] gap-2">
                <button
                  type="button"
                  onClick={onHeal}
                  className="rounded-[16px] border border-emerald-300/35 bg-emerald-400/10 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/15"
                >
                  Curar
                </button>
                <div className="rounded-[16px] border border-white/10 bg-black/25 px-2 py-1.5">
                  <div className="grid grid-cols-[28px_minmax(0,1fr)_28px] items-center gap-2">
                    <button
                      type="button"
                      onClick={onDecrementHpDelta}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs text-white"
                    >
                      -
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={hpDelta}
                      onChange={(e) =>
                        onHpDeltaChange(
                          sanitizeNonNegativeNumber(e.target.value),
                        )
                      }
                      aria-label="Cantidad de curación o daño"
                      className="h-full w-full bg-transparent text-center text-lg font-semibold text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={onIncrementHpDelta}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs text-white"
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onDamage}
                  className="rounded-[16px] border border-rose-300/35 bg-rose-400/10 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/15"
                >
                  Daño
                </button>
              </div>

              {/* Columna PV temporales */}
              <div className="grid grid-rows-[48px_48px_48px] gap-2">
                <button
                  type="button"
                  onClick={onGainTempHp}
                  className="rounded-[16px] border border-sky-300/35 bg-sky-400/10 text-sm font-semibold text-sky-100 transition hover:bg-sky-400/15"
                >
                  Temp +
                </button>
                <div className="rounded-[16px] border border-white/10 bg-black/25 px-2 py-1.5">
                  <div className="grid grid-cols-[28px_minmax(0,1fr)_28px] items-center gap-2">
                    <button
                      type="button"
                      onClick={onDecrementTempHpDelta}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs text-white"
                    >
                      -
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={tempHpDelta}
                      onChange={(e) =>
                        onTempHpDeltaChange(
                          sanitizeNonNegativeNumber(e.target.value),
                        )
                      }
                      aria-label="Cantidad de vida temporal"
                      className="h-full w-full bg-transparent text-center text-lg font-semibold text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={onIncrementTempHpDelta}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs text-white"
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onLoseTempHp}
                  className="rounded-[16px] border border-cyan-300/35 bg-cyan-400/10 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/15"
                >
                  Temp -
                </button>
              </div>
            </>
          )}

          {/* Visualización de PV — siempre visible */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2">
              <p className="text-[2.6rem] font-bold leading-none text-white">
                {currentHp}
              </p>
              <span className="text-[2rem] font-bold leading-none text-white/40">
                /
              </span>
              <p className="text-[2rem] font-bold leading-none text-white/70">
                {totalHp}
              </p>
            </div>
            {tempHp > 0 && (
              <p className="mt-2 text-sm font-semibold text-sky-300">
                +{tempHp} temp
              </p>
            )}
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-white/40">
              Puntos de vida
            </p>
          </div>
        </div>
      </div>

      {/* Habilidades (solo si hay modificadores) */}
      {skillBonuses.length > 0 && (
        <p className="text-sm text-white/80">
          <span className="font-bold text-white">Habilidades: </span>
          {skillBonuses
            .map((s) => `${s.displayName} ${fmtBonus(s.bonus)}`)
            .join(", ")}
        </p>
      )}

      {/* Salvaciones (solo si hay modificadores) */}
      {saveBonuses.length > 0 && (
        <p className="text-sm text-white/80">
          <span className="font-bold text-white">Salvaciones: </span>
          {saveBonuses
            .map((s) => `${s.displayName} ${fmtBonus(s.bonus)}`)
            .join(", ")}
        </p>
      )}
    </div>
  );
}
