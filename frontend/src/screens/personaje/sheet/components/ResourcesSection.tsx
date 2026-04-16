import type { DndCharacterDetailResponse } from "../../utils/dndApi";
import { PROFICIENCY_BONUS, SPELL_LEVELS } from "../data";
import { formatSignedValue } from "../utils";

interface ResourcesSectionProps {
  character: DndCharacterDetailResponse;
  movement: number;
  initiative: number;
}

export default function ResourcesSection({
  character,
  movement,
  initiative,
}: ResourcesSectionProps) {
  return (
    <section className="grid gap-6 xl:grid-cols-2 xl:items-stretch">
      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-[24px] border border-amber-200/25 bg-[linear-gradient(180deg,rgba(245,158,11,0.16),rgba(28,25,23,0.72))] px-4 py-5 text-center shadow-[0_14px_30px_rgba(0,0,0,0.2)]">
          <p className="text-xs uppercase tracking-[0.22em] text-amber-100/80">
            Movimiento
          </p>
          <p className="mt-3 text-4xl font-bold text-white">{movement}</p>
        </article>

        <article className="rounded-[24px] border border-amber-200/25 bg-[linear-gradient(180deg,rgba(245,158,11,0.16),rgba(28,25,23,0.72))] px-4 py-5 text-center shadow-[0_14px_30px_rgba(0,0,0,0.2)]">
          <p className="text-xs uppercase tracking-[0.22em] text-amber-100/80">
            Iniciativa
          </p>
          <p className="mt-3 text-4xl font-bold text-white">
            {formatSignedValue(initiative)}
          </p>
        </article>

        <article className="rounded-[24px] border border-amber-200/25 bg-[linear-gradient(180deg,rgba(245,158,11,0.16),rgba(28,25,23,0.72))] px-4 py-5 text-center shadow-[0_14px_30px_rgba(0,0,0,0.2)]">
          <p className="text-xs uppercase tracking-[0.22em] text-amber-100/80">
            Bonificador de competencia
          </p>
          <p className="mt-3 text-4xl font-bold text-white">
            {formatSignedValue(PROFICIENCY_BONUS)}
          </p>
        </article>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-black/15 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
        <p className="text-xs uppercase tracking-[0.24em] text-stone-400">
          Recursos
        </p>
        <h3 className="mt-2 text-xl font-bold text-white">Hechizos</h3>

        <div className="mt-5 grid grid-cols-9 gap-2">
          {SPELL_LEVELS.map((level) => {
            const totalSlots =
              character.estadisticas[`Hechizos nivel ${level}`];
            const spentSlots =
              character.estadisticas[`Hechizos nivel ${level} gastados`];

            return (
              <article
                key={level}
                className="rounded-[18px] border border-white/10 bg-black/20 px-2 py-3 text-center"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                  {level}
                </p>
                <p className="mt-3 text-2xl font-bold text-white">
                  {typeof totalSlots === "number" ? totalSlots : "--"}
                </p>
                <p className="mt-3 text-sm font-semibold text-white/70">
                  {typeof spentSlots === "number" ? spentSlots : "--"}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
