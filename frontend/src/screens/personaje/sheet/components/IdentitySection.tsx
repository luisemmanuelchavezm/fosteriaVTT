import type { DndCharacterDetailResponse } from "../../utils/dndApi";
import { formatClassSummary } from "../utils";

interface IdentitySectionProps {
  character: DndCharacterDetailResponse;
}

export default function IdentitySection({ character }: IdentitySectionProps) {
  return (
    <section className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
      <div className="overflow-hidden rounded-[28px] border border-amber-200/30 bg-black/25 shadow-[0_18px_40px_rgba(0,0,0,0.24)]">
        {character.retrato ? (
          <img
            src={character.retrato}
            alt={character.nombre}
            className="aspect-square h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex aspect-square items-center justify-center bg-[radial-gradient(circle_at_top,#f59e0b_0%,#292524_55%,#0c0a09_100%)] text-6xl font-semibold text-amber-100/90">
            {character.nombre.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>

      <div className="rounded-[28px] border border-white/10 bg-black/15 p-6 shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
        <h2 className="text-3xl font-bold text-white md:text-4xl">
          {character.nombre}
        </h2>

        <div className="mt-5 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-stone-400">
              Raza
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-100">
              {character.raza ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-stone-400">
              Subraza
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-100">
              {character.subraza ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-stone-400">
              Clase
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-100">
              {character.clases.length > 0
                ? formatClassSummary(character.clases)
                : "-"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
