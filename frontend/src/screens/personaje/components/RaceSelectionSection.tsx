import { useEffect, useMemo, useState } from "react";
import { buildApiUrl } from "../../../lib/api";
import ValidationMessage from "./ValidationMessage";
import type {
  DndRaceChoice,
  DndRaceDetail,
  DndRaceSummary,
  DndRaceTrait,
  RaceSelectionSnapshot,
  DndSubraceDetail,
} from "../types";

interface RaceSelectionSectionProps {
  onSelectionChange?: (selection: RaceSelectionSnapshot) => void;
  fieldErrors?: Record<string, string>;
  hasError?: boolean;
}

const PANEL_CLASSES =
  "rounded-[24px] border border-stone-300/10 bg-[linear-gradient(180deg,rgba(12,10,9,0.72),rgba(41,37,36,0.18))]";

const SELECT_CLASSES =
  "h-12 w-full appearance-none rounded-[18px] border border-stone-300/15 bg-black/45 px-4 text-sm text-stone-100 outline-none transition focus:border-amber-300/50 focus:bg-stone-950";

const INFO_CARD_CLASSES =
  "rounded-[24px] border border-stone-300/10 bg-[linear-gradient(180deg,rgba(12,10,9,0.72),rgba(41,37,36,0.18))] p-5";

async function fetchDndRaceResource<T>(
  token: string,
  path: string,
  signal?: AbortSignal,
) {
  const response = await fetch(buildApiUrl(path), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal,
  });

  if (!response.ok) {
    throw new Error("No se pudo cargar la informacion de DnD");
  }

  return (await response.json()) as T;
}

function buildInitialChoiceState(
  race: DndRaceDetail | null,
  subrace: DndSubraceDetail | null,
) {
  const allChoices = [
    ...(race?.elecciones ?? []),
    ...(subrace?.elecciones ?? []),
  ];

  return allChoices.reduce<Record<string, string[]>>((accumulator, choice) => {
    accumulator[choice.id] = Array.from({ length: choice.cantidad }, () => "");
    return accumulator;
  }, {});
}

function preserveChoiceState(
  race: DndRaceDetail | null,
  subrace: DndSubraceDetail | null,
  currentState: Record<string, string[]>,
) {
  const nextState = buildInitialChoiceState(race, subrace);

  Object.keys(nextState).forEach((choiceId) => {
    if (currentState[choiceId]) {
      nextState[choiceId] = [...currentState[choiceId]];
    }
  });

  return nextState;
}

function splitRaceChoices(choices: DndRaceChoice[]) {
  return {
    languageChoices: choices.filter(
      (choice) => choice.catalogo === "languages",
    ),
    abilityChoices: choices.filter(
      (choice) => choice.catalogo === "abilityScores",
    ),
    skillChoices: choices.filter((choice) => choice.catalogo === "skills"),
    competencyChoices: choices.filter((choice) =>
      ["artisanTools", "games", "instruments"].includes(choice.catalogo),
    ),
    otherChoices: choices.filter(
      (choice) =>
        ![
          "languages",
          "abilityScores",
          "skills",
          "artisanTools",
          "games",
          "instruments",
          "wizardCantrips",
          "draconicAncestors",
        ].includes(choice.catalogo),
    ),
    traitChoices: choices.filter(
      (choice) =>
        choice.catalogo === "wizardCantrips" ||
        choice.catalogo === "draconicAncestors" ||
        choice.adjuntarATitulo,
    ),
  };
}

function getChoiceTargetTitle(choice: DndRaceChoice) {
  return choice.adjuntarATitulo ?? choice.etiqueta;
}

function removeChoiceDrivenItems(
  items: string[],
  shouldHide: boolean,
  pattern: RegExp,
) {
  if (!shouldHide) {
    return items;
  }

  return items.filter((item) => !pattern.test(item));
}

function splitCompetencyItems(items: string[]) {
  return {
    skillItems: items
      .filter((item) => item.toLowerCase().startsWith("habilidad:"))
      .map((item) => item.replace(/^habilidad:\s*/i, "")),
    otherItems: items.filter(
      (item) => !item.toLowerCase().startsWith("habilidad:"),
    ),
  };
}

function TraitAccordion({
  title,
  traits,
  choices = [],
  selectedChoices = {},
  fieldErrors = {},
  onChange,
}: {
  title: string;
  traits: DndRaceTrait[];
  choices?: DndRaceChoice[];
  selectedChoices?: Record<string, string[]>;
  fieldErrors?: Record<string, string>;
  onChange?: (choiceId: string, index: number, value: string) => void;
}) {
  if (traits.length === 0) {
    return null;
  }

  return (
    <div className={`${PANEL_CLASSES} p-6`}>
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200/80">
        {title}
      </h3>
      <div className="mt-5 space-y-3">
        {traits.map((trait) => {
          const attachedChoices = choices.filter(
            (choice) =>
              getChoiceTargetTitle(choice).toLowerCase() ===
              trait.titulo.toLowerCase(),
          );

          return (
            <details
              key={`${title}-${trait.titulo}`}
              open={attachedChoices.length > 0}
              className="rounded-[18px] border border-stone-300/10 bg-black/20 p-4 open:border-amber-300/25 open:bg-stone-950/35"
            >
              <summary className="cursor-pointer list-none text-sm font-semibold text-white">
                {trait.titulo}
              </summary>
              {trait.descripcion ? (
                <p className="mt-3 text-sm leading-6 text-stone-200/90">
                  {trait.descripcion}
                </p>
              ) : null}
              {attachedChoices.length > 0 && onChange ? (
                <div className="mt-4">
                  {attachedChoices.map((choice) => (
                    <ChoicePickerGroup
                      key={`${trait.titulo}-${choice.id}`}
                      choice={choice}
                      values={
                        selectedChoices[choice.id] ??
                        Array.from({ length: choice.cantidad }, () => "")
                      }
                      fieldErrors={fieldErrors}
                      onChange={onChange}
                      showHeading={false}
                      showSummary={false}
                    />
                  ))}
                </div>
              ) : null}
            </details>
          );
        })}
      </div>

      {choices.filter(
        (choice) =>
          !traits.some(
            (trait) =>
              getChoiceTargetTitle(choice).toLowerCase() ===
              trait.titulo.toLowerCase(),
          ),
      ).length > 0 ? (
        <div className="mt-5 space-y-4 border-t border-stone-300/10 pt-5">
          {choices
            .filter(
              (choice) =>
                !traits.some(
                  (trait) =>
                    getChoiceTargetTitle(choice).toLowerCase() ===
                    trait.titulo.toLowerCase(),
                ),
            )
            .map((choice) => (
              <ChoicePickerGroup
                key={`orphan-${title}-${choice.id}`}
                choice={choice}
                values={
                  selectedChoices[choice.id] ??
                  Array.from({ length: choice.cantidad }, () => "")
                }
                fieldErrors={fieldErrors}
                onChange={onChange!}
              />
            ))}
        </div>
      ) : null}
    </div>
  );
}

function SummaryChoiceCard({
  title,
  items,
  choices,
  selectedChoices,
  fieldErrors,
  onChange,
}: {
  title: string;
  items: string[];
  choices: DndRaceChoice[];
  selectedChoices: Record<string, string[]>;
  fieldErrors: Record<string, string>;
  onChange: (choiceId: string, index: number, value: string) => void;
}) {
  if (items.length === 0 && choices.length === 0) {
    return null;
  }

  return (
    <div className={INFO_CARD_CLASSES}>
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200/80">
        {title}
      </h3>
      {items.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm leading-6 text-stone-200/90">
          {items.map((item) => (
            <li key={`${title}-${item}`} className="flex gap-2">
              <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {choices.length > 0 ? (
        <div className={items.length > 0 ? "mt-4" : "mt-4"}>
          {choices.map((choice) => (
            <ChoicePickerGroup
              key={`${title}-${choice.id}`}
              choice={choice}
              values={
                selectedChoices[choice.id] ??
                Array.from({ length: choice.cantidad }, () => "")
              }
              fieldErrors={fieldErrors}
              onChange={onChange}
              showSummary={false}
              labelAsListItem
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ChoiceSection({
  title,
  choices,
  selectedChoices,
  fieldErrors,
  onChange,
}: {
  title: string;
  choices: DndRaceChoice[];
  selectedChoices: Record<string, string[]>;
  fieldErrors: Record<string, string>;
  onChange: (choiceId: string, index: number, value: string) => void;
}) {
  if (choices.length === 0) {
    return null;
  }

  return (
    <div className={`${PANEL_CLASSES} p-6`}>
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200/80">
        {title}
      </h3>
      <div className="mt-5 space-y-4">
        {choices.map((choice) => (
          <ChoicePickerGroup
            key={choice.id}
            choice={choice}
            values={
              selectedChoices[choice.id] ??
              Array.from({ length: choice.cantidad }, () => "")
            }
            fieldErrors={fieldErrors}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );
}

function ChoicePickerGroup({
  choice,
  values,
  fieldErrors,
  onChange,
  showHeading = true,
  showSummary = true,
  labelAsListItem = false,
}: {
  choice: DndRaceChoice;
  values: string[];
  fieldErrors?: Record<string, string>;
  onChange: (choiceId: string, index: number, value: string) => void;
  showHeading?: boolean;
  showSummary?: boolean;
  labelAsListItem?: boolean;
}) {
  const options = choice.opciones.filter(
    (option) => !choice.excluirOpciones.includes(option),
  );

  return (
    <div className="border-t border-stone-300/10 pt-4 first:border-t-0 first:pt-0">
      {showHeading ? (
        labelAsListItem ? (
          <div className="flex gap-2 text-sm leading-6 text-stone-200/90">
            <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
            <span className="font-normal">{choice.etiqueta}</span>
          </div>
        ) : (
          <p className="text-sm font-semibold text-white">{choice.etiqueta}</p>
        )
      ) : null}
      {showSummary ? (
        <p
          className={`${showHeading ? "mt-1" : "mb-3"} text-xs leading-5 text-stone-400`}
        >
          {choice.resumen}
        </p>
      ) : null}

      <div className={showHeading || showSummary ? "mt-4" : "mt-0"}>
        {values.map((value, index) => {
          const fieldError = fieldErrors?.[`${choice.id}-${index}`];
          const usedValues = values.filter(
            (selectedValue, selectedIndex) =>
              selectedIndex !== index && selectedValue !== "",
          );
          const availableOptions = options.filter(
            (option) => option === value || !usedValues.includes(option),
          );

          return (
            <div
              key={`${choice.id}-${index}`}
              data-validation-error={fieldError ? "true" : undefined}
              className={`relative border-t border-stone-300/10 pt-3 first:border-t-0 first:pt-0 ${labelAsListItem ? "ml-4" : ""}`}
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
                {availableOptions.map((option) => (
                  <option
                    key={option}
                    value={option}
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

export default function RaceSelectionSection({
  onSelectionChange,
  fieldErrors = {},
  hasError = false,
}: RaceSelectionSectionProps) {
  const [availableRaces, setAvailableRaces] = useState<DndRaceSummary[]>([]);
  const [isLoadingRaces, setIsLoadingRaces] = useState(false);
  const [selectedRaceId, setSelectedRaceId] = useState("");
  const [racesError, setRacesError] = useState<string | null>(null);
  const [selectedRace, setSelectedRace] = useState<DndRaceDetail | null>(null);
  const [isLoadingRaceDetail, setIsLoadingRaceDetail] = useState(false);
  const [raceDetailError, setRaceDetailError] = useState<string | null>(null);
  const [selectedSubraceId, setSelectedSubraceId] = useState("");
  const [selectedChoices, setSelectedChoices] = useState<
    Record<string, string[]>
  >({});

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");

    if (!token) {
      setAvailableRaces([]);
      setRacesError("No se pudo autenticar la carga de razas.");
      return;
    }
    const abortController = new AbortController();

    const loadRaces = async () => {
      try {
        setIsLoadingRaces(true);
        setRacesError(null);
        const data = await fetchDndRaceResource<DndRaceSummary[]>(
          token,
          "/api/informacion/dnd/razas",
          abortController.signal,
        );
        setAvailableRaces(data);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setAvailableRaces([]);
          setRacesError("No se pudo cargar la lista de razas.");
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingRaces(false);
        }
      }
    };

    void loadRaces();

    return () => {
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    if (!selectedRaceId) {
      setSelectedRace(null);
      setRaceDetailError(null);
      setIsLoadingRaceDetail(false);
      setSelectedSubraceId("");
      setSelectedChoices({});
      return;
    }

    const token = localStorage.getItem("jwtToken");

    if (!token) {
      setSelectedRace(null);
      setRaceDetailError("No se pudo autenticar la carga de la raza.");
      return;
    }

    const abortController = new AbortController();

    const loadRaceDetail = async () => {
      try {
        setIsLoadingRaceDetail(true);
        setRaceDetailError(null);
        const data = await fetchDndRaceResource<DndRaceDetail>(
          token,
          `/api/informacion/dnd/razas/${selectedRaceId}`,
          abortController.signal,
        );
        setSelectedRace(data);
        setSelectedSubraceId("");
        setSelectedChoices(buildInitialChoiceState(data, null));
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setSelectedRace(null);
          setRaceDetailError("No se pudo cargar la informacion de la raza.");
          setSelectedChoices({});
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingRaceDetail(false);
        }
      }
    };

    void loadRaceDetail();

    return () => {
      abortController.abort();
    };
  }, [selectedRaceId]);

  const selectedSubrace = useMemo(
    () =>
      selectedRace?.subrazas.find(
        (subrace) => subrace.id === selectedSubraceId,
      ) ?? null,
    [selectedRace, selectedSubraceId],
  );

  const raceChoiceGroups = useMemo(
    () => splitRaceChoices(selectedRace?.elecciones ?? []),
    [selectedRace],
  );

  const subraceChoiceGroups = useMemo(
    () => splitRaceChoices(selectedSubrace?.elecciones ?? []),
    [selectedSubrace],
  );

  const raceCompetencyItems = useMemo(
    () => splitCompetencyItems(selectedRace?.competencias ?? []),
    [selectedRace],
  );

  const subraceCompetencyItems = useMemo(
    () => splitCompetencyItems(selectedSubrace?.competencias ?? []),
    [selectedSubrace],
  );

  const visibleRaceLanguages = useMemo(
    () =>
      removeChoiceDrivenItems(
        selectedRace?.idiomas ?? [],
        raceChoiceGroups.languageChoices.length > 0,
        /(1 idioma|idioma .*eleccion|idioma .*elección)/i,
      ),
    [raceChoiceGroups.languageChoices.length, selectedRace],
  );

  const visibleRaceAbilityBonuses = useMemo(
    () =>
      removeChoiceDrivenItems(
        selectedRace?.aumentoCaracteristicas ?? [],
        raceChoiceGroups.abilityChoices.length > 0,
        /(eleccion|elección)/i,
      ),
    [raceChoiceGroups.abilityChoices.length, selectedRace],
  );

  const visibleRaceSkillCompetencies = useMemo(
    () => raceCompetencyItems.skillItems,
    [raceCompetencyItems.skillItems],
  );

  const visibleRaceOtherCompetencies = useMemo(
    () =>
      removeChoiceDrivenItems(
        raceCompetencyItems.otherItems,
        raceChoiceGroups.competencyChoices.length > 0,
        /(a elegir|a eleccion|a elección)/i,
      ),
    [raceChoiceGroups.competencyChoices.length, raceCompetencyItems.otherItems],
  );

  const visibleSubraceSkillCompetencies = useMemo(
    () => subraceCompetencyItems.skillItems,
    [subraceCompetencyItems.skillItems],
  );

  const visibleSubraceOtherCompetencies = useMemo(
    () =>
      removeChoiceDrivenItems(
        subraceCompetencyItems.otherItems,
        subraceChoiceGroups.competencyChoices.length > 0,
        /(a elegir|a eleccion|a elección)/i,
      ),
    [
      subraceChoiceGroups.competencyChoices.length,
      subraceCompetencyItems.otherItems,
    ],
  );

  const handleRaceChange = (raceId: string) => {
    setSelectedRaceId(raceId);
  };

  const handleSubraceChange = (subraceId: string) => {
    const nextSubrace =
      selectedRace?.subrazas.find((subrace) => subrace.id === subraceId) ??
      null;
    setSelectedSubraceId(subraceId);
    setSelectedChoices((current) =>
      preserveChoiceState(selectedRace, nextSubrace, current),
    );
  };

  const handleChoiceChange = (
    choiceId: string,
    index: number,
    value: string,
  ) => {
    setSelectedChoices((current) => {
      const nextValues = [...(current[choiceId] ?? [])];
      nextValues[index] = value;

      return {
        ...current,
        [choiceId]: nextValues,
      };
    });
  };

  useEffect(() => {
    onSelectionChange?.({
      selectedRaceId,
      selectedRace,
      selectedSubraceId,
      selectedSubrace,
      selectedChoices,
    });
  }, [
    onSelectionChange,
    selectedChoices,
    selectedRace,
    selectedRaceId,
    selectedSubrace,
    selectedSubraceId,
  ]);

  return (
    <section className="mt-10">
      <div
        className={`rounded-[28px] border bg-[linear-gradient(180deg,rgba(12,10,9,0.72),rgba(41,37,36,0.18))] p-6 transition ${
          hasError ? "border-rose-400/45" : "border-stone-300/10"
        }`}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Raza</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-300">
              Elige la raza y, cuando exista, la subraza de tu personaje para
              revisar sus rasgos y resolver sus elecciones.
            </p>
          </div>

          <div className="w-full md:max-w-[380px]">
            <label
              className="mb-2 block text-sm font-semibold text-amber-100/85"
              htmlFor="race-select"
            >
              Selecciona una raza
            </label>
            <div className="relative">
              <select
                id="race-select"
                value={selectedRaceId}
                onChange={(event) => handleRaceChange(event.target.value)}
                className={`${SELECT_CLASSES} pr-10 ${
                  fieldErrors.race
                    ? "border-rose-400/70 focus:border-rose-300"
                    : ""
                }`}
              >
                <option value="" className="bg-stone-950 text-white">
                  Elige una raza
                </option>
                {availableRaces.map((race) => (
                  <option
                    key={race.id}
                    value={race.id}
                    className="bg-stone-950 text-white"
                  >
                    {race.nombre}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone-300">
                ▾
              </span>
            </div>
            {fieldErrors.race ? (
              <ValidationMessage message={fieldErrors.race} />
            ) : null}
            {isLoadingRaces ? (
              <p className="mt-3 text-sm text-stone-300">
                Cargando razas disponibles...
              </p>
            ) : null}
            {!isLoadingRaces && racesError ? (
              <p className="mt-3 text-sm text-amber-100">{racesError}</p>
            ) : null}
          </div>
        </div>

        {selectedRaceId && isLoadingRaceDetail ? (
          <div className="mt-8 rounded-[24px] border border-stone-300/10 bg-black/20 p-8 text-center text-sm text-stone-300">
            Cargando informacion de la raza...
          </div>
        ) : null}

        {selectedRaceId && !isLoadingRaceDetail && raceDetailError ? (
          <div className="mt-8 rounded-[24px] border border-amber-300/20 bg-amber-950/20 p-8 text-center text-sm text-amber-100">
            {raceDetailError}
          </div>
        ) : null}

        {selectedRace ? (
          <div className="mt-8 space-y-6">
            <div className="rounded-[24px] border border-stone-300/10 bg-[linear-gradient(180deg,rgba(28,25,23,0.92),rgba(12,10,9,0.7))] p-6">
              <h3 className="text-2xl font-bold text-white">
                {selectedRace.nombre}
              </h3>
              <p className="mt-4 text-sm leading-7 text-stone-200/90">
                {selectedRace.descripcion}
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              <SummaryChoiceCard
                title="Aumentos de característica"
                items={visibleRaceAbilityBonuses}
                choices={raceChoiceGroups.abilityChoices}
                selectedChoices={selectedChoices}
                fieldErrors={fieldErrors}
                onChange={handleChoiceChange}
              />
              <div className={INFO_CARD_CLASSES}>
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200/80">
                  Tamaño
                </h3>
                <p className="mt-4 text-sm leading-6 text-stone-200/90">
                  {selectedRace.tamano}
                </p>
              </div>
              <div className={INFO_CARD_CLASSES}>
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200/80">
                  Velocidad
                </h3>
                <div className="mt-4 space-y-2 text-sm leading-6 text-stone-200/90">
                  <p>{selectedRace.velocidad} pies</p>
                </div>
              </div>
              <SummaryChoiceCard
                title="Idiomas"
                items={visibleRaceLanguages}
                choices={raceChoiceGroups.languageChoices}
                selectedChoices={selectedChoices}
                fieldErrors={fieldErrors}
                onChange={handleChoiceChange}
              />
              <SummaryChoiceCard
                title="Competencias"
                items={visibleRaceOtherCompetencies}
                choices={raceChoiceGroups.competencyChoices}
                selectedChoices={selectedChoices}
                fieldErrors={fieldErrors}
                onChange={handleChoiceChange}
              />
              <SummaryChoiceCard
                title="Competencia en habilidades"
                items={visibleRaceSkillCompetencies}
                choices={raceChoiceGroups.skillChoices}
                selectedChoices={selectedChoices}
                fieldErrors={fieldErrors}
                onChange={handleChoiceChange}
              />
            </div>

            <ChoiceSection
              title="Elecciones de raza"
              choices={raceChoiceGroups.otherChoices}
              selectedChoices={selectedChoices}
              fieldErrors={fieldErrors}
              onChange={handleChoiceChange}
            />

            {selectedRace.subrazas.length > 0 ? (
              <div className={`${PANEL_CLASSES} p-5`}>
                <label
                  className="mb-2 block text-sm font-semibold uppercase tracking-[0.2em] text-amber-200/80"
                  htmlFor="subrace-select"
                >
                  Subraza
                </label>
                <div className="relative">
                  <select
                    id="subrace-select"
                    value={selectedSubraceId}
                    onChange={(event) =>
                      handleSubraceChange(event.target.value)
                    }
                    className={`${SELECT_CLASSES} pr-10 ${
                      fieldErrors.subrace
                        ? "border-rose-400/70 focus:border-rose-300"
                        : ""
                    }`}
                  >
                    <option value="" className="bg-stone-950 text-white">
                      Elige una subraza
                    </option>
                    {selectedRace.subrazas.map((subrace) => (
                      <option
                        key={subrace.id}
                        value={subrace.id}
                        className="bg-stone-950 text-white"
                      >
                        {subrace.nombre}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone-300">
                    ▾
                  </span>
                </div>
                {fieldErrors.subrace ? (
                  <ValidationMessage message={fieldErrors.subrace} />
                ) : null}
              </div>
            ) : null}

            <TraitAccordion
              title="Rasgos de raza"
              traits={selectedRace.rasgos}
              choices={raceChoiceGroups.traitChoices}
              selectedChoices={selectedChoices}
              fieldErrors={fieldErrors}
              onChange={handleChoiceChange}
            />

            {selectedSubrace ? (
              <div className="space-y-4">
                <div className="rounded-[24px] border border-stone-300/10 bg-[linear-gradient(180deg,rgba(28,25,23,0.92),rgba(12,10,9,0.7))] p-6">
                  <h3 className="text-2xl font-bold text-white">
                    {selectedSubrace.nombre}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-stone-200/90">
                    {selectedSubrace.descripcion}
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  <SummaryChoiceCard
                    title="Aumentos de subraza"
                    items={selectedSubrace.aumentoCaracteristicas}
                    choices={subraceChoiceGroups.abilityChoices}
                    selectedChoices={selectedChoices}
                    fieldErrors={fieldErrors}
                    onChange={handleChoiceChange}
                  />
                  <SummaryChoiceCard
                    title="Idiomas de subraza"
                    items={[]}
                    choices={subraceChoiceGroups.languageChoices}
                    selectedChoices={selectedChoices}
                    fieldErrors={fieldErrors}
                    onChange={handleChoiceChange}
                  />
                  <SummaryChoiceCard
                    title="Competencias de subraza"
                    items={visibleSubraceOtherCompetencies}
                    choices={subraceChoiceGroups.competencyChoices}
                    selectedChoices={selectedChoices}
                    fieldErrors={fieldErrors}
                    onChange={handleChoiceChange}
                  />
                  <SummaryChoiceCard
                    title="Competencia en habilidades de subraza"
                    items={visibleSubraceSkillCompetencies}
                    choices={subraceChoiceGroups.skillChoices}
                    selectedChoices={selectedChoices}
                    fieldErrors={fieldErrors}
                    onChange={handleChoiceChange}
                  />
                </div>

                <TraitAccordion
                  title="Rasgos de subraza"
                  traits={selectedSubrace.rasgos}
                  choices={subraceChoiceGroups.traitChoices}
                  selectedChoices={selectedChoices}
                  fieldErrors={fieldErrors}
                  onChange={handleChoiceChange}
                />

                <ChoiceSection
                  title="Elecciones de subraza"
                  choices={subraceChoiceGroups.otherChoices}
                  selectedChoices={selectedChoices}
                  fieldErrors={fieldErrors}
                  onChange={handleChoiceChange}
                />
              </div>
            ) : null}
          </div>
        ) : !selectedRaceId ? (
          <div className="mt-8 rounded-[24px] border border-dashed border-stone-300/15 bg-black/20 p-8 text-center text-sm text-stone-300">
            Selecciona una raza en el desplegable para ver su informacion, sus
            subrazas y sus elecciones.
          </div>
        ) : null}
      </div>
    </section>
  );
}
