import { isSpellChoiceCatalog } from "../../../../../components/spells/spellReferenceUtils";
import ValidationMessage from "../../components/ValidationMessage";
import type { DndRaceChoice, DndRaceTrait } from "../../../types";
import { getChoiceTargetTitle } from "./raceSelectionUtils";

const PANEL_CLASSES =
  "rounded-[24px] border border-stone-300/10 bg-[linear-gradient(180deg,rgba(12,10,9,0.72),rgba(41,37,36,0.18))]";

const SELECT_CLASSES =
  "h-12 w-full appearance-none rounded-[18px] border border-stone-300/15 bg-black/45 px-4 text-sm text-stone-100 outline-none transition focus:border-amber-300/50 focus:bg-stone-950";

const INFO_CARD_CLASSES =
  "rounded-[24px] border border-stone-300/10 bg-[linear-gradient(180deg,rgba(12,10,9,0.72),rgba(41,37,36,0.18))] p-5";

type RaceChoiceChangeHandler = (
  choiceId: string,
  index: number,
  value: string,
) => void;

interface ChoiceGroupProps {
  choice: DndRaceChoice;
  values: string[];
  fieldErrors?: Record<string, string>;
  onChange: RaceChoiceChangeHandler;
  onSpellInfoRequest?: (spellName: string) => void;
  showHeading?: boolean;
  showSummary?: boolean;
  labelAsListItem?: boolean;
}

function ChoicePickerGroup({
  choice,
  values,
  fieldErrors,
  onChange,
  onSpellInfoRequest,
  showHeading = true,
  showSummary = true,
  labelAsListItem = false,
}: ChoiceGroupProps) {
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
              className={`border-t border-stone-300/10 pt-3 first:border-t-0 first:pt-0 ${labelAsListItem ? "ml-4" : ""}`}
            >
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select
                    value={value}
                    onChange={(event) =>
                      onChange(choice.id, index, event.target.value)
                    }
                    className={`${SELECT_CLASSES} pr-10 ${
                      fieldError
                        ? "border-rose-400/70 focus:border-rose-300"
                        : ""
                    }`}
                  >
                    <option value="" className="bg-stone-950 text-white">
                      Selecciona una opción
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
                </div>
                {isSpellChoiceCatalog(choice.catalogo) && onSpellInfoRequest ? (
                  <button
                    type="button"
                    disabled={!value}
                    onClick={() => value && onSpellInfoRequest(value)}
                    className="shrink-0 rounded-full border border-sky-300/30 bg-sky-400/10 px-3 py-2 text-xs font-semibold text-sky-100 transition hover:border-sky-200/50 hover:bg-sky-400/20 disabled:cursor-default disabled:opacity-50"
                  >
                    Info+
                  </button>
                ) : null}
              </div>
              {fieldError ? <ValidationMessage message={fieldError} /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface TraitAccordionProps {
  title: string;
  traits: DndRaceTrait[];
  choices?: DndRaceChoice[];
  selectedChoices?: Record<string, string[]>;
  fieldErrors?: Record<string, string>;
  onChange?: RaceChoiceChangeHandler;
  onSpellInfoRequest?: (spellName: string) => void;
}

export function TraitAccordion({
  title,
  traits,
  choices = [],
  selectedChoices = {},
  fieldErrors = {},
  onChange,
  onSpellInfoRequest,
}: TraitAccordionProps) {
  if (traits.length === 0) {
    return null;
  }

  const unattachedChoices = choices.filter(
    (choice) =>
      !traits.some(
        (trait) =>
          getChoiceTargetTitle(choice).toLowerCase() ===
          trait.titulo.toLowerCase(),
      ),
  );

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
                      onSpellInfoRequest={onSpellInfoRequest}
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

      {unattachedChoices.length > 0 ? (
        <div className="mt-5 space-y-4 border-t border-stone-300/10 pt-5">
          {unattachedChoices.map((choice) => (
            <ChoicePickerGroup
              key={`orphan-${title}-${choice.id}`}
              choice={choice}
              values={
                selectedChoices[choice.id] ??
                Array.from({ length: choice.cantidad }, () => "")
              }
              fieldErrors={fieldErrors}
              onChange={onChange!}
              onSpellInfoRequest={onSpellInfoRequest}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface SummaryChoiceCardProps {
  title: string;
  items: string[];
  choices: DndRaceChoice[];
  selectedChoices: Record<string, string[]>;
  fieldErrors: Record<string, string>;
  onChange: RaceChoiceChangeHandler;
  onSpellInfoRequest?: (spellName: string) => void;
}

export function SummaryChoiceCard({
  title,
  items,
  choices,
  selectedChoices,
  fieldErrors,
  onChange,
  onSpellInfoRequest,
}: SummaryChoiceCardProps) {
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
        <div className="mt-4">
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
              onSpellInfoRequest={onSpellInfoRequest}
              showSummary={false}
              labelAsListItem
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface ChoiceSectionProps {
  title: string;
  choices: DndRaceChoice[];
  selectedChoices: Record<string, string[]>;
  fieldErrors: Record<string, string>;
  onChange: RaceChoiceChangeHandler;
  onSpellInfoRequest?: (spellName: string) => void;
}

export function ChoiceSection({
  title,
  choices,
  selectedChoices,
  fieldErrors,
  onChange,
  onSpellInfoRequest,
}: ChoiceSectionProps) {
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
            onSpellInfoRequest={onSpellInfoRequest}
          />
        ))}
      </div>
    </div>
  );
}
