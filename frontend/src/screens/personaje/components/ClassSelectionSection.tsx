import { Search } from "lucide-react";
import type { ClassSkillChoiceGroup, DndClassSummary } from "../types";
import ValidationMessage from "./ValidationMessage";

interface ClassSelectionSectionProps {
  filteredClasses: DndClassSummary[];
  selectedClassId: string | null;
  classSearch: string;
  isLoadingClasses: boolean;
  classesError: string | null;
  selectionError?: string;
  selectedClassName?: string | null;
  classSkillChoices?: ClassSkillChoiceGroup[];
  selectedClassSkillChoices?: Record<string, string[]>;
  classSkillErrors?: Record<string, string>;
  hasError?: boolean;
  onClassSearchChange: (value: string) => void;
  onClassClick: (item: DndClassSummary) => void;
  onClassSkillChoiceChange?: (
    choiceId: string,
    choiceIndex: number,
    value: string,
  ) => void;
}

export default function ClassSelectionSection({
  filteredClasses,
  selectedClassId,
  classSearch,
  isLoadingClasses,
  classesError,
  selectionError,
  selectedClassName = null,
  classSkillChoices = [],
  selectedClassSkillChoices = {},
  classSkillErrors = {},
  hasError = false,
  onClassSearchChange,
  onClassClick,
  onClassSkillChoiceChange,
}: ClassSelectionSectionProps) {
  return (
    <section
      data-validation-error={hasError ? "true" : undefined}
      className={`mt-10 rounded-[28px] border p-6 transition ${
        hasError ? "border-rose-400/45 bg-rose-950/10" : "border-transparent"
      }`}
    >
      <div className="flex flex-col gap-4">
        <h2 className="text-center text-2xl font-bold text-white">Clases</h2>
        <div className="relative w-full md:ml-auto md:max-w-[340px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-300/70" />
          <input
            type="text"
            value={classSearch}
            onChange={(event) => onClassSearchChange(event.target.value)}
            placeholder="Buscar por nombre"
            className={`h-12 w-full rounded-full border bg-black/30 pl-11 pr-5 text-sm text-white outline-none transition placeholder:text-stone-400 ${
              hasError
                ? "border-rose-400/45 focus:border-rose-300"
                : "border-stone-300/15 focus:border-amber-300/50"
            }`}
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

      {selectionError ? (
        <ValidationMessage message={selectionError} className="mt-4" />
      ) : null}

      {classSkillChoices.length > 0 && onClassSkillChoiceChange ? (
        <div className="mt-6 rounded-[24px] border border-stone-300/10 bg-[linear-gradient(180deg,rgba(12,10,9,0.72),rgba(41,37,36,0.18))] p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200/80">
            Competencias de clase
          </h3>
          <p className="mt-2 text-sm leading-6 text-stone-300">
            Selecciona las habilidades iniciales de{" "}
            {selectedClassName ?? "la clase"}.
          </p>

          <div className="mt-5 space-y-4">
            {classSkillChoices.map((choice) =>
              (selectedClassSkillChoices[choice.id] ?? []).map(
                (value, index) => {
                  const fieldError = classSkillErrors[`${choice.id}-${index}`];
                  const usedValues = Object.entries(selectedClassSkillChoices)
                    .flatMap(([groupId, groupValues]) =>
                      groupValues
                        .map((groupValue, groupIndex) => ({
                          groupId,
                          groupIndex,
                          groupValue,
                        }))
                        .filter(({ groupValue }) => groupValue.trim() !== ""),
                    )
                    .filter(
                      ({ groupId, groupIndex }) =>
                        !(groupId === choice.id && groupIndex === index),
                    )
                    .map(({ groupValue }) => groupValue);

                  return (
                    <div key={`${choice.id}-${index}`}>
                      {index === 0 ? (
                        <p className="mb-2 text-sm font-semibold text-white">
                          {choice.etiqueta}
                        </p>
                      ) : null}
                      <div
                        data-validation-error={fieldError ? "true" : undefined}
                        className="relative"
                      >
                        <select
                          value={value}
                          onChange={(event) =>
                            onClassSkillChoiceChange(
                              choice.id,
                              index,
                              event.target.value,
                            )
                          }
                          className={`h-12 w-full appearance-none rounded-[18px] border bg-black/45 px-4 pr-10 text-sm text-stone-100 outline-none transition ${
                            fieldError
                              ? "border-rose-400/70 focus:border-rose-300"
                              : "border-stone-300/15 focus:border-amber-300/50 focus:bg-stone-950"
                          }`}
                        >
                          <option value="" className="bg-stone-950 text-white">
                            Selecciona una habilidad
                          </option>
                          {choice.opciones.map((option) => (
                            <option
                              key={`${choice.id}-${option}`}
                              value={option}
                              disabled={usedValues.includes(option)}
                              className="bg-stone-950 text-white"
                            >
                              {option}
                            </option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone-300">
                          ▾
                        </span>
                      </div>
                      {fieldError ? (
                        <ValidationMessage message={fieldError} />
                      ) : null}
                    </div>
                  );
                },
              ),
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
