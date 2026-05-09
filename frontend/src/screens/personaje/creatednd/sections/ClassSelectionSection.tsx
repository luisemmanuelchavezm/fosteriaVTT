import { Search } from "lucide-react";
import type {
  ClassSkillChoiceGroup,
  DndClassSummary,
  DndSubclassDetail,
} from "../../types";
import ChoiceChecklist from "../components/ChoiceChecklist";
import ExpertisePicklistSection from "../components/ExpertisePicklistSection";
import ProgressionTablesBlock from "../components/ProgressionTablesBlock";
import ValidationMessage from "../components/ValidationMessage";
import type { ClassSkillGroup } from "../../utils/dndApi";
import {
  readableContentStyle,
  renderSkillDescription,
} from "../utils/textUtils";
import {
  extractSpellReferenceItems,
  hasSpellLikeTags,
  isSpellChoiceCatalog,
} from "../../../../components/spells/spellReferenceUtils";
import {
  EXPERTISE_CHOICE_SECTION_ID,
  type ExpertiseChoiceConfig,
} from "../../utils/dndExpertise";

interface ClassSelectionSectionProps {
  filteredClasses: DndClassSummary[];
  selectedClassId: string | null;
  classSearch: string;
  isLoadingClasses: boolean;
  classesError: string | null;
  isLoadingSelectedClassDetail?: boolean;
  selectedClassDetailError?: string | null;
  selectionError?: string;
  selectedClassName?: string | null;
  subclasses?: DndSubclassDetail[];
  selectedSubclassId?: string | null;
  selectedSubclass?: DndSubclassDetail | null;
  selectedSubclassName?: string | null;
  subclassSkills?: ClassSkillGroup[];
  isLoadingSubclassSkills?: boolean;
  subclassSkillsError?: string | null;
  classSkillChoices?: ClassSkillChoiceGroup[];
  selectedClassSkillChoices?: Record<string, string[]>;
  classSkillErrors?: Record<string, string>;
  expertiseChoiceConfig?: ExpertiseChoiceConfig | null;
  expertiseOptions?: string[];
  selectedExpertiseChoices?: string[];
  hasError?: boolean;
  onSpellReferenceClick?: (spellName: string) => void;
  onClassSearchChange: (value: string) => void;
  onClassClick: (item: DndClassSummary) => void;
  onClearSelection?: () => void;
  onSubclassChange?: (value: string) => void;
  onClassSkillChoiceChange?: (choiceId: string, values: string[]) => void;
  onClassExpertiseChange?: (values: string[]) => void;
}

export default function ClassSelectionSection({
  filteredClasses,
  selectedClassId,
  classSearch,
  isLoadingClasses,
  classesError,
  isLoadingSelectedClassDetail = false,
  selectedClassDetailError = null,
  selectionError,
  selectedClassName = null,
  subclasses = [],
  selectedSubclassId = null,
  selectedSubclass = null,
  selectedSubclassName = null,
  subclassSkills = [],
  isLoadingSubclassSkills = false,
  subclassSkillsError = null,
  classSkillChoices = [],
  selectedClassSkillChoices = {},
  classSkillErrors = {},
  expertiseChoiceConfig = null,
  expertiseOptions = [],
  selectedExpertiseChoices = [],
  hasError = false,
  onSpellReferenceClick,
  onClassSearchChange,
  onClassClick,
  onClearSelection,
  onSubclassChange,
  onClassSkillChoiceChange,
  onClassExpertiseChange,
}: ClassSelectionSectionProps) {
  const visibleClasses = selectedClassId
    ? filteredClasses.filter((item) => item.id === selectedClassId)
    : filteredClasses;
  const visibleSubclassSkills = subclassSkills.filter(
    (group) => group.nivel <= 1,
  );

  const renderSkillSummary = (
    skill: ClassSkillGroup["habilidades"][number],
  ) => {
    if (!skill.formula) {
      return null;
    }

    const spellReferences = hasSpellLikeTags(skill.tags)
      ? extractSpellReferenceItems(skill.formula)
      : [];

    return (
      <div className="mt-4 rounded-xl border border-sky-300/15 bg-sky-950/20 px-4 py-3 text-sm text-stone-100/90">
        <p className="text-xs uppercase tracking-[0.18em] text-sky-200/80">
          {spellReferences.length > 0
            ? "Conjuros o trucos otorgados"
            : "Resumen"}
        </p>
        {spellReferences.length > 0 && onSpellReferenceClick ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {spellReferences.map((reference) => (
              <button
                key={`${skill.id}-${reference.lookupName}`}
                type="button"
                onClick={() => onSpellReferenceClick(reference.lookupName)}
                className="rounded-full border border-sky-300/30 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-100 transition hover:border-sky-200/50 hover:bg-sky-400/20"
              >
                {reference.prefix
                  ? `${reference.prefix}: ${reference.displayText}`
                  : reference.displayText}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-2 leading-6 text-stone-100/90">{skill.formula}</p>
        )}
      </div>
    );
  };

  return (
    <section
      data-validation-error={hasError ? "true" : undefined}
      className={`mt-10 rounded-[28px] border p-6 transition ${
        hasError ? "border-rose-400/45 bg-rose-950/10" : "border-transparent"
      }`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-center text-2xl font-bold text-white">Clases</h2>
          {selectedClassId && selectedClassName && onClearSelection ? (
            <button
              type="button"
              onClick={onClearSelection}
              className="rounded-full border border-stone-300/15 bg-black/30 px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-amber-300/30 hover:bg-stone-950/50"
            >
              Eliminar eleccion
            </button>
          ) : null}
        </div>

        {!selectedClassId ? (
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
        ) : null}
        {selectedClassId && selectedClassName ? (
          <p className="text-sm text-stone-300">
            Clase elegida:{" "}
            <span className="font-semibold text-white">
              {selectedClassName}
            </span>
          </p>
        ) : null}
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

        {visibleClasses.map((item) => {
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

      {selectedClassId && isLoadingSelectedClassDetail ? (
        <div className="mt-6 rounded-[24px] border border-stone-300/10 bg-black/25 px-4 py-5 text-sm text-stone-200">
          Cargando la información de la clase seleccionada...
        </div>
      ) : null}

      {selectedClassId &&
      !isLoadingSelectedClassDetail &&
      selectedClassDetailError ? (
        <div className="mt-6 rounded-[24px] border border-amber-300/20 bg-amber-950/20 px-4 py-5 text-sm text-amber-100">
          {selectedClassDetailError}
        </div>
      ) : null}

      {selectedClassId && subclasses.length > 0 && onSubclassChange ? (
        <div className="mt-6 rounded-[24px] border border-stone-300/10 bg-[linear-gradient(180deg,rgba(12,10,9,0.72),rgba(41,37,36,0.18))] p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200/80">
            Subclase inicial
          </h3>
          <p className="mt-2 text-sm leading-6 text-stone-300">
            Selecciona la subclase inicial de {selectedClassName ?? "la clase"}{" "}
            para ver sus rasgos.
          </p>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {subclasses.map((subclass) => {
              const isSelected = selectedSubclassId === subclass.id;

              return (
                <button
                  key={subclass.id}
                  type="button"
                  onClick={() => onSubclassChange(subclass.id)}
                  className={`rounded-[22px] border p-4 text-left transition ${
                    isSelected
                      ? "border-amber-300/60 bg-[linear-gradient(180deg,rgba(41,37,36,0.96),rgba(245,158,11,0.14))]"
                      : "border-stone-300/10 bg-black/25 hover:border-amber-300/25 hover:bg-black/35"
                  }`}
                >
                  <p className="text-base font-semibold text-white">
                    {subclass.nombre}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-stone-300">
                    {subclass.descripcion}
                  </p>
                </button>
              );
            })}
          </div>

          {classSkillErrors.subclass ? (
            <ValidationMessage
              message={classSkillErrors.subclass}
              className="mt-4"
            />
          ) : null}

          {selectedSubclassName ? (
            <div className="mt-5 rounded-[22px] border border-stone-300/10 bg-black/25 p-4">
              <h4 className="text-base font-semibold text-amber-100">
                Rasgos de {selectedSubclassName}
              </h4>

              {selectedSubclass ? (
                <ProgressionTablesBlock
                  tables={selectedSubclass.tablas ?? []}
                  title="Progresion de subclase"
                  onSpellReferenceClick={onSpellReferenceClick}
                />
              ) : null}

              <div className="mt-4 space-y-3">
                {isLoadingSubclassSkills ? (
                  <div className="rounded-2xl border border-stone-200/10 bg-black/30 p-4 text-sm text-stone-200">
                    Cargando rasgos de subclase...
                  </div>
                ) : null}

                {!isLoadingSubclassSkills && subclassSkillsError ? (
                  <div className="rounded-2xl border border-amber-300/20 bg-amber-950/20 p-4 text-sm text-amber-100">
                    {subclassSkillsError}
                  </div>
                ) : null}

                {!isLoadingSubclassSkills &&
                !subclassSkillsError &&
                visibleSubclassSkills.length === 0 ? (
                  <div className="rounded-2xl border border-stone-200/10 bg-black/30 p-4 text-sm text-stone-200">
                    Esta subclase no tiene rasgos de nivel 1 persistidos para
                    mostrar aquí.
                  </div>
                ) : null}

                {!isLoadingSubclassSkills && !subclassSkillsError
                  ? visibleSubclassSkills.map((group) => (
                      <section
                        key={group.nivel}
                        className="rounded-2xl border border-stone-200/10 bg-black/30 p-4"
                      >
                        <div className="border-b border-stone-200/10 pb-3">
                          <h5 className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-300">
                            Nivel {group.nivel}
                          </h5>
                        </div>

                        <div className="mt-4 space-y-3">
                          {group.habilidades.map((skill, skillIndex) => (
                            <details
                              key={
                                skill.id ??
                                `${group.nivel}-${skill.nombre}-${skillIndex}`
                              }
                              className="rounded-2xl border border-stone-200/10 bg-stone-950/70 p-4 open:border-amber-300/30 open:bg-stone-950"
                            >
                              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                                <p className="text-base font-semibold text-white">
                                  {skill.nombre}
                                </p>
                                <span className="rounded-full border border-amber-300/20 bg-black/40 px-2 py-0.5 text-lg text-amber-100">
                                  +
                                </span>
                              </summary>
                              {skill.descripcion ? (
                                <div
                                  className="mt-4 rounded-xl border border-stone-200/10 bg-black/45 px-4 py-3 text-sm leading-6 text-stone-100/90"
                                  style={readableContentStyle}
                                >
                                  {renderSkillSummary(skill)}
                                  <div className="space-y-3">
                                    {renderSkillDescription(
                                      skill.descripcion,
                                      skill.id,
                                    )}
                                  </div>
                                </div>
                              ) : (
                                renderSkillSummary(skill)
                              )}
                            </details>
                          ))}
                        </div>
                      </section>
                    ))
                  : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {classSkillChoices.length > 0 && onClassSkillChoiceChange ? (
        <div className="mt-6 rounded-[24px] border border-stone-300/10 bg-[linear-gradient(180deg,rgba(12,10,9,0.72),rgba(41,37,36,0.18))] p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200/80">
            Elecciones de clase
          </h3>
          <p className="mt-2 text-sm leading-6 text-stone-300">
            Selecciona las opciones iniciales de{" "}
            {selectedClassName ?? "la clase"}.
          </p>

          <div className="mt-5 space-y-4">
            {classSkillChoices.map((choice) => (
              <ChoiceChecklist
                key={choice.id}
                title={choice.etiqueta}
                description={choice.resumen}
                options={choice.opciones}
                selectedValues={selectedClassSkillChoices[choice.id] ?? []}
                maxSelections={choice.cantidad}
                error={classSkillErrors[choice.id]}
                showInfoAction={isSpellChoiceCatalog(choice.catalogo)}
                onInfoClick={onSpellReferenceClick}
                onChange={(values) =>
                  onClassSkillChoiceChange(choice.id, values)
                }
              />
            ))}
          </div>
        </div>
      ) : null}

      {expertiseChoiceConfig && onClassExpertiseChange ? (
        <div className="mt-6 rounded-[24px] border border-stone-300/10 bg-[linear-gradient(180deg,rgba(12,10,9,0.72),rgba(41,37,36,0.18))] p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200/80">
            {expertiseChoiceConfig.title}
          </h3>
          <div className="mt-5">
            <ExpertisePicklistSection
              anchorId={`class-choice-${EXPERTISE_CHOICE_SECTION_ID}`}
              title="Elige tus pericias iniciales"
              description={expertiseChoiceConfig.description}
              options={expertiseOptions}
              selectedValues={selectedExpertiseChoices}
              selectionCount={expertiseChoiceConfig.count}
              error={classSkillErrors[EXPERTISE_CHOICE_SECTION_ID]}
              onChange={onClassExpertiseChange}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
