import { useEffect, useMemo, useState } from "react";
import type {
  BackgroundSelectionSnapshot,
  DndBackgroundChoice,
  DndBackgroundDetail,
  DndBackgroundSummary,
} from "../types";
import ValidationMessage from "./ValidationMessage";

const PANEL_CLASSES =
  "rounded-[24px] border border-stone-300/10 bg-[linear-gradient(180deg,rgba(12,10,9,0.72),rgba(41,37,36,0.18))]";

const SELECT_CLASSES =
  "h-12 w-full appearance-none rounded-[18px] border border-stone-300/15 bg-black/45 px-4 text-sm text-stone-100 outline-none transition focus:border-amber-300/50 focus:bg-stone-950";

interface BackgroundSelectionSectionProps {
  backgrounds: DndBackgroundSummary[];
  selectedBackgroundId: string;
  selectedBackground: DndBackgroundDetail | null;
  onSelectionChange?: (selection: BackgroundSelectionSnapshot) => void;
  onSelectedBackgroundChange: (backgroundId: string) => void;
  isLoadingBackgrounds: boolean;
  backgroundsError: string | null;
  isLoadingBackgroundInfo: boolean;
  backgroundInfoError: string | null;
  fieldErrors?: Record<string, string>;
  hasError?: boolean;
}
function buildInitialChoiceState(background: DndBackgroundDetail | null) {
  if (!background) {
    return {} as Record<string, string[]>;
  }

  return background.elecciones.reduce<Record<string, string[]>>(
    (accumulator, choice) => {
      accumulator[choice.id] = Array.from(
        { length: choice.cantidad },
        () => "",
      );
      return accumulator;
    },
    {},
  );
}

function SectionCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className={`${PANEL_CLASSES} p-5`}>
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200/80">
        {title}
      </h3>
      <ul className="mt-4 space-y-2 text-sm leading-6 text-stone-200/90">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatEquipmentItem(
  nombre: string,
  cantidad: number,
  formula: string | null | undefined,
) {
  if (nombre === "Piezas de oro") {
    return `${cantidad} PO`;
  }

  const quantityLabel = cantidad > 1 ? `${cantidad} x ` : "";
  const formulaLabel = formula ? ` (${formula})` : "";
  return `${quantityLabel}${nombre}${formulaLabel}`;
}

function ChoicePickerGroup({
  choice,
  values,
  errors,
  onChange,
}: {
  choice: DndBackgroundChoice;
  values: string[];
  errors?: Record<string, string>;
  onChange: (choiceId: string, choiceIndex: number, value: string) => void;
}) {
  const options = choice.opciones;

  return (
    <div className="border-t border-stone-300/10 pt-4 first:border-t-0 first:pt-0">
      <p className="text-sm font-semibold text-white">{choice.etiqueta}</p>
      <p className="mt-1 text-xs leading-5 text-stone-400">{choice.resumen}</p>

      <div className="mt-4">
        {values.map((value, index) => {
          const fieldError = errors?.[`${choice.id}-${index}`];
          const usedValues = values.filter(
            (selectedValue, selectedIndex) =>
              selectedIndex !== index && selectedValue !== "",
          );

          return (
            <div
              key={`${choice.id}-${index}`}
              data-validation-error={fieldError ? "true" : undefined}
              className="relative border-t border-stone-300/10 pt-3 first:border-t-0 first:pt-0"
            >
              <select
                value={value}
                onChange={(event) =>
                  onChange(choice.id, index, event.target.value)
                }
                className={`${SELECT_CLASSES} pr-10 ${
                  fieldError ? "border-rose-400/70 focus:border-rose-300" : ""
                }`}
              >
                <option value="" className="bg-stone-950 text-white">
                  Selecciona una opcion
                </option>
                {options.map((option) => (
                  <option
                    key={option}
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
              {fieldError ? <ValidationMessage message={fieldError} /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function BackgroundSelectionSection({
  backgrounds,
  selectedBackgroundId,
  selectedBackground,
  onSelectionChange,
  onSelectedBackgroundChange,
  isLoadingBackgrounds,
  backgroundsError,
  isLoadingBackgroundInfo,
  backgroundInfoError,
  fieldErrors = {},
  hasError = false,
}: BackgroundSelectionSectionProps) {
  const [selectedChoices, setSelectedChoices] = useState<
    Record<string, string[]>
  >({});

  useEffect(() => {
    setSelectedChoices(buildInitialChoiceState(selectedBackground));
  }, [selectedBackground]);

  useEffect(() => {
    onSelectionChange?.({
      selectedBackgroundId,
      selectedBackground,
      selectedChoices,
    });
  }, [
    onSelectionChange,
    selectedBackground,
    selectedBackgroundId,
    selectedChoices,
  ]);

  const languageChoices = useMemo(
    () =>
      selectedBackground?.elecciones.filter(
        (choice) => choice.catalogo === "languages",
      ) ?? [],
    [selectedBackground],
  );

  const toolChoices = useMemo(
    () =>
      selectedBackground?.elecciones.filter(
        (choice) => choice.catalogo !== "languages",
      ) ?? [],
    [selectedBackground],
  );

  const hasSkillProficiencies =
    (selectedBackground?.competenciasHabilidades.length ?? 0) > 0;
  const hasToolContent =
    (selectedBackground?.competenciasHerramientas.length ?? 0) > 0 ||
    toolChoices.length > 0;
  const hasLanguageContent =
    (selectedBackground?.resumenIdiomas.length ?? 0) > 0 ||
    languageChoices.length > 0;
  const hasEquipment = (selectedBackground?.equipamiento.fijos.length ?? 0) > 0;

  const handleBackgroundChange = (backgroundId: string) => {
    onSelectedBackgroundChange(backgroundId);
    setSelectedChoices({});
  };

  const handleChoiceChange = (
    choiceId: string,
    choiceIndex: number,
    value: string,
  ) => {
    setSelectedChoices((current) => {
      const nextValues = [...(current[choiceId] ?? [])];
      nextValues[choiceIndex] = value;

      return {
        ...current,
        [choiceId]: nextValues,
      };
    });
  };

  return (
    <section className="mt-10">
      <div
        className={`rounded-[28px] border bg-[linear-gradient(180deg,rgba(12,10,9,0.72),rgba(41,37,36,0.18))] p-6 transition ${
          hasError ? "border-rose-400/45" : "border-stone-300/10"
        }`}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Trasfondos</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-300">
              Elige el pasado de tu personaje. Segun el trasfondo, aqui veras
              sus competencias, equipo, rasgo especial y las elecciones que
              debes personalizar.
            </p>
          </div>

          <div className="w-full md:max-w-[380px]">
            <label
              className="mb-2 block text-sm font-semibold text-amber-100/85"
              htmlFor="background-select"
            >
              Selecciona un trasfondo
            </label>
            <div className="relative">
              <select
                id="background-select"
                value={selectedBackgroundId}
                onChange={(event) => handleBackgroundChange(event.target.value)}
                data-validation-error={
                  fieldErrors.background ? "true" : undefined
                }
                className={`${SELECT_CLASSES} pr-10 ${
                  fieldErrors.background
                    ? "border-rose-400/70 focus:border-rose-300"
                    : ""
                }`}
              >
                <option value="" className="bg-stone-950 text-white">
                  Elige un trasfondo
                </option>
                {backgrounds.map((background) => (
                  <option
                    key={background.id}
                    value={background.id}
                    className="bg-stone-950 text-white"
                  >
                    {background.nombre}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone-300">
                ▾
              </span>
            </div>
            {fieldErrors.background ? (
              <ValidationMessage message={fieldErrors.background} />
            ) : null}
            {isLoadingBackgrounds ? (
              <p className="mt-3 text-sm text-stone-300">
                Cargando trasfondos disponibles...
              </p>
            ) : null}
            {!isLoadingBackgrounds && backgroundsError ? (
              <p className="mt-3 text-sm text-amber-100">{backgroundsError}</p>
            ) : null}
          </div>
        </div>

        {selectedBackgroundId && isLoadingBackgroundInfo ? (
          <div className="mt-8 rounded-[24px] border border-stone-300/10 bg-black/20 p-8 text-center text-sm text-stone-300">
            Cargando informacion del trasfondo...
          </div>
        ) : null}

        {selectedBackgroundId &&
        !isLoadingBackgroundInfo &&
        backgroundInfoError ? (
          <div className="mt-8 rounded-[24px] border border-amber-300/20 bg-amber-950/20 p-8 text-center text-sm text-amber-100">
            {backgroundInfoError}
          </div>
        ) : null}

        {selectedBackground ? (
          <div className="mt-8 space-y-6">
            <div className="rounded-[24px] border border-stone-300/10 bg-[linear-gradient(180deg,rgba(28,25,23,0.92),rgba(12,10,9,0.7))] p-6">
              <h3 className="text-2xl font-bold text-white">
                {selectedBackground.nombre}
              </h3>
              <p className="mt-4 text-sm leading-7 text-stone-200/90">
                {selectedBackground.descripcion}
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {hasSkillProficiencies ? (
                <SectionCard
                  title="Competencias en habilidades"
                  items={selectedBackground.competenciasHabilidades}
                />
              ) : null}
              {hasToolContent ? (
                <div className={`${PANEL_CLASSES} p-5`}>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200/80">
                    Competencias con herramientas
                  </h3>
                  {selectedBackground.competenciasHerramientas.length > 0 ? (
                    <ul className="mt-4 space-y-2 text-sm leading-6 text-stone-200/90">
                      {selectedBackground.competenciasHerramientas.map(
                        (item) => (
                          <li key={item} className="flex gap-2">
                            <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
                            <span>{item}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  ) : null}

                  {toolChoices.length > 0 ? (
                    <div className="mt-5 space-y-4">
                      {toolChoices.map((choice) => (
                        <ChoicePickerGroup
                          key={choice.id}
                          choice={choice}
                          values={
                            selectedChoices[choice.id] ??
                            Array.from({ length: choice.cantidad }, () => "")
                          }
                          errors={fieldErrors}
                          onChange={handleChoiceChange}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {hasLanguageContent ? (
                <div className={`${PANEL_CLASSES} p-5`}>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200/80">
                    Idiomas
                  </h3>
                  {selectedBackground.resumenIdiomas.length > 0 ? (
                    <ul className="mt-4 space-y-2 text-sm leading-6 text-stone-200/90">
                      {selectedBackground.resumenIdiomas.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {languageChoices.length > 0 ? (
                    <div className="mt-5 space-y-4">
                      {languageChoices.map((choice) => (
                        <ChoicePickerGroup
                          key={choice.id}
                          choice={choice}
                          values={
                            selectedChoices[choice.id] ??
                            Array.from({ length: choice.cantidad }, () => "")
                          }
                          errors={fieldErrors}
                          onChange={handleChoiceChange}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {hasEquipment ? (
                <div className={`${PANEL_CLASSES} p-5`}>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200/80">
                    Equipo
                  </h3>
                  {selectedBackground ? (
                    <ul className="mt-4 space-y-2 text-sm leading-6 text-stone-200/90">
                      {selectedBackground.equipamiento.fijos.map((item) => (
                        <li key={item.id} className="flex gap-2">
                          <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
                          <span>
                            {formatEquipmentItem(
                              item.objeto?.nombre ?? item.etiqueta,
                              item.cantidad,
                              item.objeto?.formula,
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className={`${PANEL_CLASSES} p-6`}>
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200/80">
                Rasgo
              </h3>
              <h4 className="mt-3 text-xl font-bold text-white">
                {selectedBackground.nombreRasgo}
              </h4>
              <p className="mt-4 text-sm leading-7 text-stone-200/90">
                {selectedBackground.descripcionRasgo}
              </p>
            </div>
          </div>
        ) : !selectedBackgroundId ? (
          <div className="mt-8 rounded-[24px] border border-dashed border-stone-300/15 bg-black/20 p-8 text-center text-sm text-stone-300">
            Selecciona un trasfondo en el desplegable para ver su informacion y
            sus elecciones.
          </div>
        ) : null}
      </div>
    </section>
  );
}
