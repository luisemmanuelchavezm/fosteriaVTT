import {
  ABILITY_STATS,
  formatAbilityModifier,
  STAT_BOX_CLASSES,
  type StatsMethod,
} from "../../utils/statisticsUtils";

interface StatisticsSummaryGridProps {
  selectedMethod: StatsMethod;
  renderStatValue: (statId: string) => string | number;
  getStatNumericValue: (statId: string) => number | null;
  onCustomScoreChange: (statId: string, value: string) => void;
}

export default function StatisticsSummaryGrid({
  selectedMethod,
  renderStatValue,
  getStatNumericValue,
  onCustomScoreChange,
}: StatisticsSummaryGridProps) {
  return (
    <div className="mt-8 grid grid-cols-6 gap-3">
      {ABILITY_STATS.map((stat) => {
        const numericValue = getStatNumericValue(stat.id);

        return (
          <div key={stat.id}>
            <p className="mb-2 text-center text-sm font-semibold uppercase tracking-[0.18em] text-amber-100">
              {stat.name}
            </p>
            <div className={STAT_BOX_CLASSES}>
              {selectedMethod === "custom" ? (
                <input
                  type="text"
                  inputMode="numeric"
                  value={renderStatValue(stat.id)}
                  onChange={(event) =>
                    onCustomScoreChange(stat.id, event.target.value)
                  }
                  placeholder="0"
                  className="w-full bg-transparent text-center text-4xl font-bold text-stone-950 outline-none placeholder:text-stone-500"
                  aria-label={`Valor custom de ${stat.name}`}
                />
              ) : (
                <p className="text-4xl font-bold text-stone-950">
                  {renderStatValue(stat.id)}
                </p>
              )}
              <p className="mt-2 text-sm font-semibold text-stone-700">
                {numericValue !== null
                  ? formatAbilityModifier(numericValue)
                  : "-"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
