import {
  ABILITY_STATS,
  getAvailableStandardOptions,
  PARCHMENT_CARD_CLASSES,
  PANEL_CLASSES,
  SELECT_CLASSES,
} from "../../utils/statisticsUtils";

interface StandardMethodSectionProps {
  standardAssignments: Record<string, string>;
  usedStandardValues: string[];
  onAssignmentChange: (statId: string, value: string) => void;
}

export default function StandardMethodSection({
  standardAssignments,
  usedStandardValues,
  onAssignmentChange,
}: StandardMethodSectionProps) {
  return (
    <div className={`${PANEL_CLASSES} p-6`}>
      <h3 className="text-lg font-semibold text-white">
        Puntuaciones Estandar
      </h3>
      <p className="mt-2 text-sm leading-6 text-stone-300">
        Asigna una vez cada numero del conjunto fijo 15, 14, 13, 12, 10 y 8 a
        una estadistica distinta.
      </p>

      <div className="mt-5 grid grid-cols-6 gap-3">
        {ABILITY_STATS.map((stat) => {
          const selectedValue = standardAssignments[stat.id] ?? "";

          return (
            <div key={`standard-${stat.id}`} className={PARCHMENT_CARD_CLASSES}>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-700">
                {stat.name}
              </p>
              <div className="relative mt-4">
                <select
                  value={selectedValue}
                  onChange={(event) =>
                    onAssignmentChange(stat.id, event.target.value)
                  }
                  className={`${SELECT_CLASSES} pr-10`}
                >
                  <option value="" className="bg-stone-950 text-white">
                    Asigna una puntuacion
                  </option>
                  {getAvailableStandardOptions(
                    usedStandardValues,
                    selectedValue,
                  ).map((optionKey) => (
                    <option
                      key={optionKey}
                      value={optionKey}
                      className="bg-stone-950 text-white"
                    >
                      {optionKey.split("-")[0]}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone-300">
                  ▾
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
