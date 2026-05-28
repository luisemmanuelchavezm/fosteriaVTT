import { ABILITY_STATS } from "../../../personaje/creatednd/utils/statisticsUtils";
import { calcMod, formatMod } from "../../utils/enemyUtils";

interface EnemyStatsSectionProps {
  abilityScores: Record<string, number>;
  abilityScoreInputs: Record<string, string>;
  onInputChange: (name: string, raw: string) => void;
  onBlur: (name: string) => void;
}

export default function EnemyStatsSection({
  abilityScores,
  abilityScoreInputs,
  onInputChange,
  onBlur,
}: EnemyStatsSectionProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/60">
        Estadísticas
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {ABILITY_STATS.map((stat) => {
          const score = abilityScores[stat.name] ?? 10;
          const mod = calcMod(score);
          return (
            <div
              key={stat.id}
              className="flex flex-col items-center rounded-[18px] border-2 border-white bg-white px-2 py-3 text-center shadow-md"
            >
              <p className="text-[9px] font-bold uppercase tracking-wider text-stone-500">
                {stat.displayName}
              </p>
              <p className="my-0.5 text-xl font-bold text-stone-900">
                {formatMod(mod)}
              </p>
              <input
                type="number"
                min={8}
                max={30}
                value={abilityScoreInputs[stat.name] ?? String(score)}
                onChange={(e) => onInputChange(stat.name, e.target.value)}
                onBlur={() => onBlur(stat.name)}
                className="mt-0.5 w-full rounded-lg border border-stone-200 bg-stone-50 py-0.5 text-center text-sm font-semibold text-stone-800 outline-none focus:border-amber-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
