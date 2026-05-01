import type { ReactNode } from "react";
import type { DndCharacterDetailResponse } from "../../utils/dndApi";
import {
  ABILITY_STATS,
  formatAbilityModifier,
} from "../../utils/statisticsUtils";
import { getProficiencyBonus, getStatValue } from "../utils";

interface StatisticsSectionProps {
  character: DndCharacterDetailResponse;
  isEditMode?: boolean;
  editableStatScores?: Record<string, number>;
  editableMovement?: number;
  editableMaxHp?: number;
  movement: number;
  initiative: number;
  armorClass: number;
  hpDelta: string;
  tempHpDelta: string;
  currentHp: number;
  tempHp: number;
  totalHp: number;
  onHpDeltaChange: (value: string) => void;
  onTempHpDeltaChange: (value: string) => void;
  onHeal: () => void;
  onDamage: () => void;
  onGainTempHp: () => void;
  onLoseTempHp: () => void;
  onRollAbilityCheck: (statName: string) => void;
  onRollInitiative: () => void;
  onIncrementHpDelta: () => void;
  onDecrementHpDelta: () => void;
  onIncrementTempHpDelta: () => void;
  onDecrementTempHpDelta: () => void;
  onStatScoreChange?: (statName: string, value: number) => void;
  onMovementChange?: (value: number) => void;
  onMaxHpChange?: (value: number) => void;
  resourcesSlot: ReactNode;
}

export default function StatisticsSection({
  character,
  isEditMode = false,
  editableStatScores,
  editableMovement,
  editableMaxHp,
  movement,
  initiative,
  armorClass,
  hpDelta,
  tempHpDelta,
  currentHp,
  tempHp,
  totalHp,
  onHpDeltaChange,
  onTempHpDeltaChange,
  onHeal,
  onDamage,
  onGainTempHp,
  onLoseTempHp,
  onRollAbilityCheck,
  onRollInitiative,
  onIncrementHpDelta,
  onDecrementHpDelta,
  onIncrementTempHpDelta,
  onDecrementTempHpDelta,
  onStatScoreChange,
  onMovementChange,
  onMaxHpChange,
  resourcesSlot,
}: StatisticsSectionProps) {
  const proficiencyBonus = getProficiencyBonus(character);
  const secondaryStats = [
    {
      key: "movement",
      label: "Movimiento",
      value: String(isEditMode ? (editableMovement ?? movement) : movement),
      onClick: undefined,
    },
    {
      key: "initiative",
      label: "Iniciativa",
      value: `${initiative >= 0 ? "+" : ""}${initiative}`,
      onClick: onRollInitiative,
    },
    {
      key: "proficiency",
      label: "Bonificador por competencia",
      value: `${proficiencyBonus >= 0 ? "+" : ""}${proficiencyBonus}`,
      onClick: undefined,
    },
    {
      key: "armor-class",
      label: "CA",
      value: String(armorClass),
      onClick: undefined,
    },
  ];

  return (
    <section className="space-y-6">
      <h3 className="text-[1.7rem] font-bold text-white">Estadísticas</h3>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,5.8fr)_minmax(400px,4.2fr)] xl:items-stretch">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {ABILITY_STATS.map((stat) => {
            const score = getStatValue(character, stat.name);
            const displayScore = isEditMode
              ? (editableStatScores?.[stat.name] ?? score)
              : score;

            return (
              <button
                key={stat.id}
                type="button"
                onClick={() => {
                  if (!isEditMode) {
                    onRollAbilityCheck(stat.name);
                  }
                }}
                className="rounded-[20px] border border-amber-200/25 bg-[linear-gradient(180deg,rgba(245,158,11,0.16),rgba(28,25,23,0.72))] px-3 py-3 text-center shadow-[0_14px_30px_rgba(0,0,0,0.2)] transition hover:border-amber-200/40"
              >
                <p className="text-sm uppercase tracking-[0.18em] text-amber-100/80">
                  {stat.name}
                </p>
                <p className="mt-1.5 text-[2rem] font-bold text-white">
                  {formatAbilityModifier(displayScore)}
                </p>
                {isEditMode ? (
                  <input
                    type="number"
                    min={8}
                    max={30}
                    value={displayScore}
                    onChange={(event) =>
                      onStatScoreChange?.(
                        stat.name,
                        Number.parseInt(event.target.value, 10) || 8,
                      )
                    }
                    className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/30 px-2 py-1 text-center text-base font-semibold text-white/80 outline-none"
                  />
                ) : (
                  <p className="mt-0.5 text-base font-semibold text-white/70">
                    {displayScore}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        <div className="rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.18))] p-3 shadow-[0_14px_30px_rgba(0,0,0,0.2)]">
          <div className="grid gap-3 md:grid-cols-[120px_120px_minmax(0,1fr)]">
            <div className="grid grid-rows-[48px_48px_48px] gap-2">
              <button
                type="button"
                onClick={onHeal}
                className="rounded-[16px] border border-emerald-300/35 bg-emerald-400/10 px-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/15"
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
                    onChange={(event) => onHpDeltaChange(event.target.value)}
                    aria-label="Cantidad de curacion o danio"
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
                className="rounded-[16px] border border-rose-300/35 bg-rose-400/10 px-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/15"
              >
                Danio
              </button>
            </div>

            <div className="grid grid-rows-[48px_48px_48px] gap-2">
              <button
                type="button"
                onClick={onGainTempHp}
                className="rounded-[16px] border border-sky-300/35 bg-sky-400/10 px-3 text-sm font-semibold text-sky-100 transition hover:bg-sky-400/15"
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
                    onChange={(event) =>
                      onTempHpDeltaChange(event.target.value)
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
                className="rounded-[16px] border border-cyan-300/35 bg-cyan-400/10 px-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/15"
              >
                Temp -
              </button>
            </div>

            <div className="flex min-h-[156px] flex-col items-center justify-center px-2 text-center">
              <div className="flex items-center justify-center gap-3">
                <p className="text-[2.3rem] font-bold leading-none text-white md:text-[2.7rem]">
                  {currentHp}
                </p>
                <span className="text-[2rem] font-bold leading-none text-white/45 md:text-[2.4rem]">
                  /
                </span>
                {isEditMode ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={editableMaxHp ?? totalHp}
                      onChange={(event) =>
                        onMaxHpChange?.(
                          Number.parseInt(event.target.value, 10) || 1,
                        )
                      }
                      className="w-24 rounded-[12px] border border-white/10 bg-black/30 px-2 py-1 text-center text-[1.6rem] font-bold leading-none text-white outline-none md:w-28 md:text-[2rem]"
                    />
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          onMaxHpChange?.(
                            Math.min(1000, (editableMaxHp ?? totalHp) + 1),
                          )
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs text-white"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onMaxHpChange?.(
                            Math.max(1, (editableMaxHp ?? totalHp) - 1),
                          )
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs text-white"
                      >
                        -
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[2.3rem] font-bold leading-none text-white md:text-[2.7rem]">
                    {totalHp}
                  </p>
                )}
              </div>
              <p className="mt-3 text-sm font-semibold uppercase tracking-[0.22em] text-stone-400">
                Puntos de vida
              </p>
              <p className="mt-3 text-base font-semibold text-sky-100/90">
                Temporal: {tempHp}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,3.9fr)_minmax(480px,6.1fr)] xl:items-start">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {secondaryStats.map((stat) => {
            const content = (
              <>
                <p className="text-sm uppercase tracking-[0.18em] text-amber-100/80">
                  {stat.label}
                </p>
                {isEditMode && stat.key === "movement" ? (
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    value={editableMovement ?? movement}
                    onChange={(event) =>
                      onMovementChange?.(
                        Number.parseInt(event.target.value, 10) || 0,
                      )
                    }
                    className="mt-3 w-full rounded-[12px] border border-white/10 bg-black/30 px-2 py-1 text-center text-xl font-bold text-white outline-none"
                  />
                ) : (
                  <p className="mt-1.5 text-[1.75rem] font-bold text-white">
                    {stat.value}
                  </p>
                )}
              </>
            );

            const sizeClass = "md:col-span-1";

            if (stat.onClick) {
              return (
                <button
                  key={stat.key}
                  type="button"
                  onClick={stat.onClick}
                  className={`${sizeClass} flex min-h-[112px] flex-col items-center justify-center rounded-[20px] border border-amber-200/25 bg-[linear-gradient(180deg,rgba(245,158,11,0.16),rgba(28,25,23,0.72))] px-4 py-4 text-center shadow-[0_14px_30px_rgba(0,0,0,0.2)] transition hover:border-amber-200/40`}
                >
                  {content}
                </button>
              );
            }

            return (
              <article
                key={stat.key}
                className={`${sizeClass} flex min-h-[112px] flex-col items-center justify-center rounded-[20px] border border-amber-200/25 bg-[linear-gradient(180deg,rgba(245,158,11,0.16),rgba(28,25,23,0.72))] px-4 py-4 text-center shadow-[0_14px_30px_rgba(0,0,0,0.2)]`}
              >
                {content}
              </article>
            );
          })}
        </div>

        <div className="min-w-0">{resourcesSlot}</div>
      </div>
    </section>
  );
}
