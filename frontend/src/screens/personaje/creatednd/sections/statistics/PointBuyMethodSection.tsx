import {
  ABILITY_STATS,
  PARCHMENT_CARD_CLASSES,
  PANEL_CLASSES,
  POINT_BUY_COSTS,
  POINT_BUY_MAX,
  POINT_BUY_MIN,
} from "../../utils/statisticsUtils";

interface PointBuyMethodSectionProps {
  pointBuyScores: Record<string, number>;
  remainingPointBuy: number;
  onScoreChange: (statId: string, delta: 1 | -1) => void;
}

export default function PointBuyMethodSection({
  pointBuyScores,
  remainingPointBuy,
  onScoreChange,
}: PointBuyMethodSectionProps) {
  return (
    <div className={`${PANEL_CLASSES} p-6`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Compra de Puntuaciones
          </h3>
          <p className="mt-2 text-sm leading-6 text-stone-300">
            Todas las estadísticas empiezan en 8. Tienes 27 puntos para
            subirlas, sin bajar de 8 ni pasar de 15 antes de aplicar bonos
            raciales.
          </p>
        </div>
        <div className="rounded-[20px] border border-white/20 bg-black/30 px-4 py-3 text-sm text-white">
          Puntos restantes:{" "}
          <span className="font-bold">{remainingPointBuy}</span>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-[20px] border border-stone-300/10 bg-black/25">
        <table className="min-w-full text-sm text-white/85">
          <thead>
            <tr className="border-b border-stone-300/10 text-left text-white/65">
              <th className="px-4 py-3 font-medium">Puntuacion</th>
              {[8, 9, 10, 11, 12, 13, 14, 15].map((score) => (
                <th key={score} className="px-4 py-3 font-medium">
                  {score}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-3 font-medium text-white">Coste</td>
              {[8, 9, 10, 11, 12, 13, 14, 15].map((score) => (
                <td key={score} className="px-4 py-3 text-white/80">
                  {POINT_BUY_COSTS[score]}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-5 grid grid-cols-6 gap-3">
        {ABILITY_STATS.map((stat) => {
          const pointBuyValue = pointBuyScores[stat.id];

          return (
            <div
              key={`point-buy-${stat.id}`}
              className={PARCHMENT_CARD_CLASSES}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-700">
                {stat.name}
              </p>
              <div className="mt-4 flex items-center justify-between gap-3 rounded-[18px] border border-[#d6bb75] bg-white/55 p-3">
                <button
                  type="button"
                  onClick={() => onScoreChange(stat.id, -1)}
                  disabled={pointBuyValue <= POINT_BUY_MIN}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c9a34a] bg-white/80 text-lg text-stone-900 transition hover:border-[#8f6a1f] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  -
                </button>
                <p className="text-3xl font-bold text-stone-950">
                  {pointBuyValue}
                </p>
                <button
                  type="button"
                  onClick={() => onScoreChange(stat.id, 1)}
                  disabled={
                    pointBuyValue >= POINT_BUY_MAX || remainingPointBuy <= 0
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c9a34a] bg-white/80 text-lg text-stone-900 transition hover:border-[#8f6a1f] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  +
                </button>
              </div>
              <p className="mt-3 text-sm text-stone-700">
                Coste actual: {POINT_BUY_COSTS[pointBuyValue]} puntos
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
