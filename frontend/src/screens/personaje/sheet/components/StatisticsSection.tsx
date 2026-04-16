import type { DndCharacterDetailResponse } from "../../utils/dndApi";
import {
  ABILITY_STATS,
  formatAbilityModifier,
} from "../../utils/statisticsUtils";
import { getStatValue } from "../utils";

interface StatisticsSectionProps {
  character: DndCharacterDetailResponse;
  hpDelta: string;
  currentHp: number;
  tempHp: number;
  totalHp: number;
  onHpDeltaChange: (value: string) => void;
  onHeal: () => void;
  onDamage: () => void;
}

export default function StatisticsSection({
  character,
  hpDelta,
  currentHp,
  tempHp,
  totalHp,
  onHpDeltaChange,
  onHeal,
  onDamage,
}: StatisticsSectionProps) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-black/15 p-6 shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
      <h3 className="text-2xl font-bold text-white">Estadisticas</h3>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(320px,1fr)] xl:items-start">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {ABILITY_STATS.map((stat) => {
            const score = getStatValue(character, stat.name);

            return (
              <article
                key={stat.id}
                className="rounded-[24px] border border-amber-200/25 bg-[linear-gradient(180deg,rgba(245,158,11,0.16),rgba(28,25,23,0.72))] px-4 py-5 text-center shadow-[0_14px_30px_rgba(0,0,0,0.2)]"
              >
                <p className="text-xs uppercase tracking-[0.22em] text-amber-100/80">
                  {stat.name}
                </p>
                <p className="mt-3 text-4xl font-bold text-white">
                  {formatAbilityModifier(score)}
                </p>
                <p className="mt-2 text-lg font-semibold text-white/70">
                  {score}
                </p>
              </article>
            );
          })}
        </div>

        <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.18))] p-4 shadow-[0_14px_30px_rgba(0,0,0,0.2)]">
          <div className="grid gap-4 md:grid-cols-[92px_minmax(0,1fr)] xl:grid-cols-[92px_minmax(0,1fr)]">
            <div className="grid grid-rows-[56px_56px_56px] gap-2">
              <button
                type="button"
                onClick={onHeal}
                className="rounded-[18px] border border-emerald-300/35 bg-emerald-400/10 px-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/15"
              >
                Curar
              </button>

              <div className="rounded-[18px] border border-white/10 bg-black/25 px-3 py-2">
                <input
                  type="number"
                  value={hpDelta}
                  onChange={(event) => onHpDeltaChange(event.target.value)}
                  className="h-full w-full bg-transparent text-center text-lg font-semibold text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:opacity-100 [&::-webkit-outer-spin-button]:opacity-100"
                />
              </div>

              <button
                type="button"
                onClick={onDamage}
                className="rounded-[18px] border border-rose-300/35 bg-rose-400/10 px-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/15"
              >
                Danio
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <article className="rounded-[20px] border border-white/10 bg-black/25 px-3 py-4 text-center">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-400">
                  Actual
                </p>
                <p className="mt-3 text-3xl font-bold text-white">
                  {currentHp}
                </p>
              </article>

              <article className="rounded-[20px] border border-white/10 bg-black/25 px-3 py-4 text-center">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-400">
                  Total
                </p>
                <p className="mt-3 text-3xl font-bold text-white">{totalHp}</p>
              </article>

              <article className="rounded-[20px] border border-white/10 bg-black/25 px-3 py-4 text-center">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-400">
                  Temporal
                </p>
                <p className="mt-3 text-3xl font-bold text-white">{tempHp}</p>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
