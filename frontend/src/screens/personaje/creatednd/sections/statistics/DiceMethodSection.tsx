import { createPortal } from "react-dom";

import {
  ABILITY_STATS,
  PARCHMENT_CARD_CLASSES,
  PANEL_CLASSES,
  SELECT_CLASSES,
  type ActiveRollContext,
  type DiceRound,
} from "../../utils/statisticsUtils";

interface DiceMethodSectionProps {
  diceRounds: DiceRound[];
  enteringRoundId: string | null;
  enteredRoundId: string | null;
  activeRollContext: ActiveRollContext | null;
  diceBoxError: string | null;
  diceStatusMessage: string | null;
  diceBoxHostId: string;
  onAddRound: () => void;
  onRollSlot: (roundId: string, slotIndex: number) => void;
  onAssignSlot: (roundId: string, slotIndex: number, statId: string) => void;
}

export default function DiceMethodSection({
  diceRounds,
  enteringRoundId,
  enteredRoundId,
  activeRollContext,
  diceBoxError,
  diceStatusMessage,
  diceBoxHostId,
  onAddRound,
  onRollSlot,
  onAssignSlot,
}: DiceMethodSectionProps) {
  const diceViewportLayer =
    typeof document !== "undefined"
      ? createPortal(
          <div
            className="pointer-events-none fixed inset-0 z-[80] overflow-hidden"
            aria-hidden="true"
          >
            <div
              id={diceBoxHostId}
              className="absolute left-1/2 top-[58%] h-[min(58vh,460px)] w-[min(88vw,700px)] -translate-x-1/2 -translate-y-1/2 [&_canvas]:h-full [&_canvas]:w-full"
            />
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={`${PANEL_CLASSES} p-6`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Tirada de Dados</h3>
          <p className="mt-2 text-sm leading-6 text-stone-300">
            Cada ranura tira 4d6, descarta el dado mas bajo y luego te deja
            asignar ese resultado a la estadistica que quieras.
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 md:items-end">
          {diceStatusMessage ? (
            <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
              {diceStatusMessage}
            </p>
          ) : null}
          <button
            type="button"
            onClick={onAddRound}
            disabled={activeRollContext !== null}
            className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Nueva ronda
          </button>
        </div>
      </div>

      {diceBoxError ? (
        <p className="mt-3 text-sm text-rose-300">{diceBoxError}</p>
      ) : null}

      {diceViewportLayer}

      <div className="mt-6 space-y-5">
        {diceRounds.map((round) => (
          <div
            key={round.id}
            className={`rounded-[22px] border border-white/10 bg-black/20 p-4 transition-all duration-500 ease-out ${
              round.id !== enteringRoundId
                ? "translate-y-0 opacity-100"
                : enteredRoundId === round.id
                  ? "translate-y-0 scale-100 opacity-100"
                  : "-translate-y-6 scale-[0.98] opacity-0"
            }`}
          >
            <div className="grid grid-cols-6 gap-3">
              {round.slots.map((slot, index) => {
                const isRollingThisSlot =
                  activeRollContext?.roundId === round.id &&
                  activeRollContext.slotIndex === index;
                const canAssign = slot.total !== null && !isRollingThisSlot;

                return (
                  <div
                    key={`${round.id}-dice-slot-${index}`}
                    className={PARCHMENT_CARD_CLASSES}
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-700">
                      Tirada {index + 1}
                    </p>
                    <p className="mt-3 text-3xl font-bold text-stone-950">
                      {slot.total ?? "-"}
                    </p>
                    <div className="mt-3 min-h-10">
                      {slot.rolls.length ? (
                        <div className="flex flex-wrap gap-2">
                          {slot.rolls.map((roll, rollIndex) => (
                            <div
                              key={`${round.id}-${index}-${roll}-${rollIndex}`}
                              className={
                                rollIndex === slot.rolls.length - 1
                                  ? "flex h-5 w-5 items-center justify-center rounded-sm border border-stone-400 bg-stone-300 text-[9px] font-bold leading-none text-stone-700"
                                  : "flex h-5 w-5 items-center justify-center rounded-sm border border-emerald-700 bg-emerald-600 text-[9px] font-bold leading-none text-white"
                              }
                            >
                              {roll}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-stone-600">Aun no tirada</p>
                      )}
                    </div>

                    {!canAssign ? (
                      <button
                        type="button"
                        onClick={() => onRollSlot(round.id, index)}
                        disabled={activeRollContext !== null}
                        className="mt-4 w-full rounded-full border border-amber-300/35 bg-black/55 px-4 py-3 text-sm font-semibold text-stone-100 transition hover:border-amber-300/60 hover:bg-stone-950 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isRollingThisSlot ? "Tirando..." : "Tirar dados"}
                      </button>
                    ) : (
                      <div className="relative mt-4">
                        <select
                          value={slot.assignedStatId}
                          onChange={(event) =>
                            onAssignSlot(round.id, index, event.target.value)
                          }
                          className={`${SELECT_CLASSES} pr-10`}
                        >
                          <option value="" className="bg-stone-950 text-white">
                            Elige estadistica
                          </option>
                          {ABILITY_STATS.filter((stat) => {
                            if (slot.assignedStatId === stat.id) {
                              return true;
                            }

                            return !round.slots.some(
                              (candidateSlot, candidateIndex) =>
                                candidateIndex !== index &&
                                candidateSlot.assignedStatId === stat.id,
                            );
                          }).map((stat) => (
                            <option
                              key={`${round.id}-${index}-${stat.id}`}
                              value={stat.id}
                              className="bg-stone-950 text-white"
                            >
                              {stat.name}
                            </option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone-300">
                          ▾
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
