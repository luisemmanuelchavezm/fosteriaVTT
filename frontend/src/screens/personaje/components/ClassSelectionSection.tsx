import { Search } from "lucide-react";
import type { DndClassSummary } from "../types";

interface ClassSelectionSectionProps {
  filteredClasses: DndClassSummary[];
  selectedClassId: string | null;
  classSearch: string;
  isLoadingClasses: boolean;
  classesError: string | null;
  onClassSearchChange: (value: string) => void;
  onClassClick: (item: DndClassSummary) => void;
}

export default function ClassSelectionSection({
  filteredClasses,
  selectedClassId,
  classSearch,
  isLoadingClasses,
  classesError,
  onClassSearchChange,
  onClassClick,
}: ClassSelectionSectionProps) {
  return (
    <section className="mt-10">
      <div className="flex flex-col gap-4">
        <h2 className="text-center text-2xl font-bold text-white">Clases</h2>
        <div className="relative w-full md:ml-auto md:max-w-[340px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-300/70" />
          <input
            type="text"
            value={classSearch}
            onChange={(event) => onClassSearchChange(event.target.value)}
            placeholder="Buscar por nombre"
            className="h-12 w-full rounded-full border border-stone-300/15 bg-black/30 pl-11 pr-5 text-sm text-white outline-none transition placeholder:text-stone-400 focus:border-amber-300/50"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {isLoadingClasses ? (
          <div className="rounded-[24px] border border-stone-300/10 bg-black/20 px-4 py-6 text-center text-sm text-stone-300 md:col-span-2">
            Cargando clases disponibles...
          </div>
        ) : null}

        {!isLoadingClasses && classesError ? (
          <div className="rounded-[24px] border border-amber-300/20 bg-amber-950/20 px-4 py-6 text-center text-sm text-amber-100 md:col-span-2">
            {classesError}
          </div>
        ) : null}

        {filteredClasses.map((item) => {
          const isSelected = selectedClassId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onClassClick(item)}
              className={`group relative flex w-full items-center gap-4 overflow-hidden rounded-[24px] border px-4 py-4 text-left transition ${
                isSelected
                  ? "border-amber-300/60 bg-[linear-gradient(90deg,rgba(28,25,23,0.94),rgba(245,158,11,0.14))]"
                  : "border-stone-300/10 bg-[linear-gradient(180deg,rgba(12,10,9,0.72),rgba(41,37,36,0.18))] hover:border-amber-300/20 hover:bg-stone-950/55"
              }`}
            >
              <div className="pointer-events-none absolute right-[-18px] top-[-18px] h-20 w-20 rounded-full bg-amber-300/8 blur-2xl transition group-hover:bg-amber-300/14" />
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] border border-amber-300/20 bg-[linear-gradient(180deg,rgba(28,25,23,0.95),rgba(12,10,9,0.95))] text-lg font-bold text-amber-100 shadow-[0_10px_24px_rgba(0,0,0,0.25)]">
                {item.insignia}
              </div>
              <div>
                <p className="text-lg font-semibold text-white">
                  {item.nombre}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
