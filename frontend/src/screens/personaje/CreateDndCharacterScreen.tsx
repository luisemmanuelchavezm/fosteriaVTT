import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Flame } from "lucide-react";
import HomeNavbar, { type NavTab } from "../../components/HomeNavbar";
import LogoLayout from "../../components/LogoLayout";
import UserMenu from "../../components/UserMenu";
import ClassSelectionSection from "./components/ClassSelectionSection";
import CharacterIdentitySection from "./components/CharacterIdentitySection";
import ClassDetailModal from "./components/ClassDetailModal";
import BackgroundSelectionSection from "./components/BackgroundSelectionSection";
import EquipmentSelectionSection from "./components/EquipmentSelectionSection";
import RaceSelectionSection from "./components/RaceSelectionSection";
import StatisticsSelectionSection from "./components/StatisticsSelectionSection";
import type {
  BackgroundSelectionSnapshot,
  CharacterStatisticsSnapshot,
  ClassSkillChoiceGroup,
  CreateDndCharacterRequest,
  DndBackgroundChoice,
  DndEquipment,
  DndRaceChoice,
  EquipmentSelectionSnapshot,
  RaceSelectionSnapshot,
} from "./types";
import { ABILITY_STATS } from "./utils/statisticsUtils";
import { useCreateDndCharacter } from "./useCreateDndCharacter";
import { createDndCharacter } from "./utils/dndApi";
import {
  buildInitialClassSkillSelections,
  parseClassSkillChoiceGroups,
} from "./utils/classSkillChoices";

interface CreateDndCharacterScreenProps {
  username: string;
  avatarUrl: string;
  onLogout: () => void;
  onGoHome: () => void;
  onGoCampaigns: () => void;
  onGoCharacters: () => void;
  onCharacterCreated?: (characterId: string) => void;
}

interface CreationPhase {
  id: string;
  title: string;
}

const CREATION_PHASES: CreationPhase[] = [
  { id: "class", title: "1. clase" },
  { id: "background", title: "2. transfondo" },
  { id: "species", title: "3. raza" },
  { id: "skills", title: "4. estadisticas" },
  { id: "equipment", title: "5. equipamiento" },
];

function buildChoiceErrors(
  choices: Array<DndBackgroundChoice | DndRaceChoice>,
  selectedChoices: Record<string, string[]>,
) {
  return choices.reduce<Record<string, string>>((errors, choice) => {
    Array.from({ length: choice.cantidad }).forEach((_, index) => {
      if (!(selectedChoices[choice.id]?.[index] ?? "").trim()) {
        errors[`${choice.id}-${index}`] = "Campo obligatorio";
      }
    });

    return errors;
  }, {});
}

function buildEquipmentSelectionKey(originId: string, groupId: string) {
  return `${originId}:${groupId}`;
}

function compactNumericSelections<T extends number | null>(
  values: Record<string, T> | undefined,
) {
  return Object.entries(values ?? {}).reduce<Record<string, number>>(
    (accumulator, [key, value]) => {
      if (value !== null) {
        accumulator[key] = value;
      }
      return accumulator;
    },
    {},
  );
}

function buildCharacterStatisticsPayload(
  statisticsSelection: CharacterStatisticsSnapshot | null,
) {
  if (!statisticsSelection) {
    throw new Error("Debes completar las estadisticas del personaje");
  }

  return ABILITY_STATS.reduce<Record<string, number>>((accumulator, stat) => {
    const value = statisticsSelection.resolvedScores[stat.id];

    if (value === null) {
      throw new Error("Debes completar las estadisticas del personaje");
    }

    accumulator[stat.id] = value;
    return accumulator;
  }, {});
}

function buildCreateCharacterPayload({
  creation,
  classSkillChoiceGroups,
  classSkillSelections,
  raceSelection,
  backgroundSelection,
  statisticsSelection,
  equipmentSelection,
}: {
  creation: ReturnType<typeof useCreateDndCharacter>;
  classSkillChoiceGroups: ClassSkillChoiceGroup[];
  classSkillSelections: Record<string, string[]>;
  raceSelection: RaceSelectionSnapshot | null;
  backgroundSelection: BackgroundSelectionSnapshot | null;
  statisticsSelection: CharacterStatisticsSnapshot | null;
  equipmentSelection: EquipmentSelectionSnapshot | null;
}): CreateDndCharacterRequest {
  if (!creation.selectedClass) {
    throw new Error("Debes seleccionar una clase");
  }

  if (!creation.selectedBackgroundId) {
    throw new Error("Debes seleccionar un trasfondo");
  }

  if (!raceSelection?.selectedRaceId) {
    throw new Error("Debes seleccionar una raza");
  }

  return {
    nombre: creation.name.trim(),
    claseId: creation.selectedClass.id,
    trasfondoId: creation.selectedBackgroundId,
    razaId: raceSelection.selectedRaceId,
    subrazaId: raceSelection.selectedSubraceId || null,
    estadisticas: buildCharacterStatisticsPayload(statisticsSelection),
    competenciasClase: classSkillChoiceGroups.flatMap(
      (group) => classSkillSelections[group.id] ?? [],
    ),
    eleccionesTrasfondo: backgroundSelection?.selectedChoices ?? {},
    eleccionesRaza: raceSelection.selectedChoices,
    gruposEquipamiento: compactNumericSelections(
      equipmentSelection?.selectedGroups,
    ),
    catalogosEquipamiento: compactNumericSelections(
      equipmentSelection?.selectedCatalogByGroup,
    ),
  };
}

function appendEquipmentErrors(
  originId: string,
  equipment: DndEquipment | null,
  selection: EquipmentSelectionSnapshot | null,
  errors: Record<string, string>,
) {
  if (!equipment) {
    return;
  }

  equipment.gruposEleccion.forEach((group) => {
    const selectionKey = buildEquipmentSelectionKey(originId, group.id);
    const selectedOptionIndex = selection?.selectedGroups[selectionKey] ?? null;

    if (selectedOptionIndex === null) {
      errors[selectionKey] = "Campo obligatorio";
      return;
    }

    const selectedOption = group.opciones[selectedOptionIndex] ?? null;

    if (
      selectedOption?.opcionesCatalogo.length &&
      !(selection?.selectedCatalogByGroup[selectionKey] ?? null)
    ) {
      errors[`${selectionKey}:catalog`] = "Campo obligatorio";
    }
  });
}

function scrollToFirstVisibleValidationError() {
  window.requestAnimationFrame(() => {
    const activePhase = document.querySelector('[data-phase-active="true"]');

    const errorTarget = activePhase?.querySelector(
      '[data-validation-error="true"]',
    );

    if (errorTarget instanceof HTMLElement) {
      errorTarget.scrollIntoView({ behavior: "smooth", block: "center" });

      const focusTarget = errorTarget.matches("input, select, button, textarea")
        ? errorTarget
        : errorTarget.querySelector("input, select, button, textarea");

      if (focusTarget instanceof HTMLElement) {
        focusTarget.focus({ preventScroll: true });
      }
      return;
    }

    if (activePhase instanceof HTMLElement) {
      activePhase.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

export default function CreateDndCharacterScreen({
  username,
  avatarUrl,
  onLogout,
  onGoHome,
  onGoCampaigns,
  onGoCharacters,
  onCharacterCreated,
}: CreateDndCharacterScreenProps) {
  const creation = useCreateDndCharacter();
  const activePhase = CREATION_PHASES[creation.activePhaseIndex];
  const [raceSelection, setRaceSelection] =
    useState<RaceSelectionSnapshot | null>(null);
  const [backgroundSelection, setBackgroundSelection] =
    useState<BackgroundSelectionSnapshot | null>(null);
  const [classSkillSelections, setClassSkillSelections] = useState<
    Record<string, string[]>
  >({});
  const [statisticsSelection, setStatisticsSelection] =
    useState<CharacterStatisticsSnapshot | null>(null);
  const [equipmentSelection, setEquipmentSelection] =
    useState<EquipmentSelectionSnapshot | null>(null);
  const [hasAttemptedCreation, setHasAttemptedCreation] = useState(false);
  const [creationMessage, setCreationMessage] = useState<string | null>(null);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creationSucceeded, setCreationSucceeded] = useState(false);

  const classSkillChoiceGroups = useMemo(
    () => parseClassSkillChoiceGroups(creation.selectedClassDetail),
    [creation.selectedClassDetail],
  );

  useEffect(() => {
    setClassSkillSelections(
      buildInitialClassSkillSelections(classSkillChoiceGroups),
    );
  }, [classSkillChoiceGroups]);

  const handleNavChange = (tab: NavTab) => {
    if (tab === "home") {
      onGoHome();
      return;
    }

    if (tab === "campaigns") {
      onGoCampaigns();
      return;
    }

    onGoCharacters();
  };

  const handleNextPhase = () => {
    creation.setActivePhaseIndex((current) =>
      Math.min(current + 1, CREATION_PHASES.length - 1),
    );
  };

  const handlePreviousPhase = () => {
    creation.setActivePhaseIndex((current) => Math.max(current - 1, 0));
  };

  const validation = useMemo(() => {
    const nameError = creation.name.trim() ? null : "Campo obligatorio";
    const portraitError = creation.portraitPreview ? null : "Campo obligatorio";

    const classErrors: Record<string, string> = creation.selectedClass
      ? {}
      : { class: "Campo obligatorio" };

    if (creation.selectedClass) {
      classSkillChoiceGroups.forEach((group) => {
        Array.from({ length: group.cantidad }).forEach((_, index) => {
          if (!(classSkillSelections[group.id]?.[index] ?? "").trim()) {
            classErrors[`${group.id}-${index}`] = "Campo obligatorio";
          }
        });
      });
    }

    const selectedBackground =
      backgroundSelection?.selectedBackground ??
      creation.selectedBackgroundDetail;
    const backgroundChoices = backgroundSelection?.selectedChoices ?? {};
    const backgroundErrors: Record<string, string> = {};

    if (!creation.selectedBackgroundId) {
      backgroundErrors.background = "Campo obligatorio";
    }

    if (selectedBackground) {
      Object.assign(
        backgroundErrors,
        buildChoiceErrors(selectedBackground.elecciones, backgroundChoices),
      );
    }

    const speciesErrors: Record<string, string> = {};
    if (!raceSelection?.selectedRaceId) {
      speciesErrors.race = "Campo obligatorio";
    }

    if (raceSelection?.selectedRace) {
      Object.assign(
        speciesErrors,
        buildChoiceErrors(
          raceSelection.selectedRace.elecciones,
          raceSelection.selectedChoices,
        ),
      );

      if (
        raceSelection.selectedRace.subrazas.length > 0 &&
        !raceSelection.selectedSubraceId
      ) {
        speciesErrors.subrace = "Campo obligatorio";
      }

      if (raceSelection.selectedSubrace) {
        Object.assign(
          speciesErrors,
          buildChoiceErrors(
            raceSelection.selectedSubrace.elecciones,
            raceSelection.selectedChoices,
          ),
        );
      }
    }

    const skillsErrors: Record<string, string> = {};
    if (!statisticsSelection) {
      ABILITY_STATS.forEach((stat) => {
        skillsErrors[stat.id] = "Campo obligatorio";
      });
    } else if (statisticsSelection.selectedMethod === "standard") {
      ABILITY_STATS.forEach((stat) => {
        if (!statisticsSelection.standardAssignments[stat.id]) {
          skillsErrors[stat.id] = "Campo obligatorio";
        }
      });
    } else if (statisticsSelection.selectedMethod === "custom") {
      ABILITY_STATS.forEach((stat) => {
        if (!statisticsSelection.customScores[stat.id]) {
          skillsErrors[stat.id] = "Campo obligatorio";
        }
      });
    } else if (statisticsSelection.selectedMethod === "dice") {
      ABILITY_STATS.forEach((stat) => {
        if (statisticsSelection.resolvedScores[stat.id] === null) {
          skillsErrors[stat.id] = "Campo obligatorio";
        }
      });
    }

    const equipmentErrors: Record<string, string> = {};
    appendEquipmentErrors(
      "class",
      creation.selectedClassDetail?.equipamiento ?? null,
      equipmentSelection,
      equipmentErrors,
    );
    appendEquipmentErrors(
      "background",
      creation.selectedBackgroundDetail?.equipamiento ?? null,
      equipmentSelection,
      equipmentErrors,
    );

    const invalidPhases = CREATION_PHASES.filter((phase) => {
      if (phase.id === "class") {
        return Object.keys(classErrors).length > 0;
      }

      if (phase.id === "background") {
        return Object.keys(backgroundErrors).length > 0;
      }

      if (phase.id === "species") {
        return Object.keys(speciesErrors).length > 0;
      }

      if (phase.id === "skills") {
        return Object.keys(skillsErrors).length > 0;
      }

      return Object.keys(equipmentErrors).length > 0;
    }).map((phase) => phase.id);

    const firstInvalidPhaseIndex = CREATION_PHASES.findIndex((phase) =>
      invalidPhases.includes(phase.id),
    );

    return {
      nameError,
      portraitError,
      classErrors,
      backgroundErrors,
      speciesErrors,
      skillsErrors,
      equipmentErrors,
      invalidPhases,
      firstInvalidPhaseIndex:
        firstInvalidPhaseIndex >= 0 ? firstInvalidPhaseIndex : null,
      isValid:
        nameError === null &&
        portraitError === null &&
        invalidPhases.length === 0,
    };
  }, [
    backgroundSelection,
    creation.name,
    creation.portraitPreview,
    creation.selectedBackgroundDetail,
    creation.selectedBackgroundId,
    creation.selectedClass,
    creation.selectedClassDetail,
    classSkillChoiceGroups,
    classSkillSelections,
    equipmentSelection,
    raceSelection,
    statisticsSelection,
  ]);

  useEffect(() => {
    setCreationMessage(null);
    setCreationError(null);
    setCreationSucceeded(false);
  }, [
    backgroundSelection,
    creation.name,
    creation.portraitFile,
    creation.selectedBackgroundId,
    creation.selectedClass,
    classSkillSelections,
    equipmentSelection,
    raceSelection,
    statisticsSelection,
  ]);

  const handleCreateCharacter = async () => {
    setHasAttemptedCreation(true);

    if (!validation.isValid) {
      if (validation.firstInvalidPhaseIndex !== null) {
        creation.setActivePhaseIndex(validation.firstInvalidPhaseIndex);
      }
      scrollToFirstVisibleValidationError();
      return;
    }

    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setCreationError("No se pudo autenticar la creacion del personaje.");
      return;
    }

    if (!creation.portraitFile) {
      setCreationError("Debes seleccionar un retrato para el personaje.");
      return;
    }

    try {
      setIsSubmitting(true);
      setCreationError(null);

      const payload = buildCreateCharacterPayload({
        creation,
        classSkillChoiceGroups,
        classSkillSelections,
        raceSelection,
        backgroundSelection,
        statisticsSelection,
        equipmentSelection,
      });
      const createdCharacter = await createDndCharacter(
        token,
        payload,
        creation.portraitFile,
      );

      setCreationSucceeded(true);
      setCreationMessage(
        `Personaje creado correctamente: ${createdCharacter.nombre}.`,
      );
      onCharacterCreated?.(String(createdCharacter.id));
    } catch (error) {
      setCreationError(
        error instanceof Error
          ? error.message
          : "No se pudo crear el personaje.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClassSkillChoiceChange = (
    choiceId: string,
    choiceIndex: number,
    value: string,
  ) => {
    setClassSkillSelections((current) => {
      const nextValues = [...(current[choiceId] ?? [])];
      nextValues[choiceIndex] = value;

      return {
        ...current,
        [choiceId]: nextValues,
      };
    });
  };

  return (
    <LogoLayout onLogoClick={onGoHome} fullWidth>
      <>
        <UserMenu
          username={username}
          avatarUrl={avatarUrl}
          onLogout={onLogout}
        />

        <ClassDetailModal
          previewClass={creation.previewClass}
          previewClassDetail={creation.previewClassDetail}
          classSkills={creation.classSkills}
          isOpen={creation.isClassModalOpen}
          isLoadingPreviewClassDetail={creation.isLoadingPreviewClassDetail}
          previewClassDetailError={creation.previewClassDetailError}
          isLoadingClassSkills={creation.isLoadingClassSkills}
          classSkillsError={creation.classSkillsError}
          onClose={creation.closeClassModal}
          onSelect={creation.selectPreviewClass}
        />

        <div className="relative z-10 w-full px-4 pt-28 pb-32 md:px-8 md:pb-36">
          <div className="relative overflow-hidden rounded-[32px] border border-stone-300/10 bg-[linear-gradient(180deg,rgba(12,10,9,0.96)_0%,rgba(28,25,23,0.9)_48%,rgba(10,10,10,0.98)_100%)] p-6 text-stone-50 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-md md:p-8">
            <div className="pointer-events-none absolute -top-20 right-[-40px] h-56 w-56 rounded-full bg-stone-400/8 blur-3xl" />
            <div className="pointer-events-none absolute bottom-[-90px] left-[-20px] h-64 w-64 rounded-full bg-amber-300/10 blur-3xl" />

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium text-amber-200/80">
                  <Flame className="h-4 w-4" />
                  Dungeons and Dragons
                </p>
                <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">
                  Crear personaje
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-stone-300 md:text-base">
                  Forja un aventurero digno de la taberna, la mazmorra y la
                  gloria.
                </p>
              </div>

              <button
                type="button"
                onClick={onGoCharacters}
                className="rounded-full border border-stone-300/15 bg-stone-950/70 px-5 py-3 text-sm font-semibold text-white transition hover:border-amber-300/25 hover:bg-stone-900"
              >
                Volver a personajes
              </button>
            </div>

            <div className="mt-8 grid gap-3 lg:grid-cols-5">
              {CREATION_PHASES.map((phase, index) => {
                const isActive = index === creation.activePhaseIndex;
                const isCompleted = index < creation.activePhaseIndex;
                const hasPhaseError =
                  hasAttemptedCreation &&
                  validation.invalidPhases.includes(phase.id);

                return (
                  <button
                    key={phase.id}
                    type="button"
                    onClick={() => creation.setActivePhaseIndex(index)}
                    className={`rounded-[22px] border px-4 py-4 text-left transition ${
                      hasPhaseError
                        ? isActive
                          ? "border-rose-400/70 bg-[linear-gradient(90deg,rgba(69,10,10,0.72),rgba(127,29,29,0.26))] text-rose-50 shadow-[0_12px_30px_rgba(127,29,29,0.18)]"
                          : "border-rose-400/45 bg-rose-950/20 text-rose-100 hover:border-rose-300/60"
                        : isActive
                          ? "border-amber-300/60 bg-gradient-to-r from-stone-900/95 to-amber-400/12 text-amber-100 shadow-[0_12px_30px_rgba(0,0,0,0.25)]"
                          : isCompleted
                            ? "border-stone-300/15 bg-stone-900/65 text-white"
                            : "border-white/10 bg-black/20 text-stone-300 hover:border-amber-300/15 hover:bg-stone-950/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{phase.title}</p>
                      {hasPhaseError ? (
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            <div
              data-phase-active={
                activePhase.id === "class" ? "true" : undefined
              }
              className={activePhase.id === "class" ? "" : "hidden"}
            >
              <CharacterIdentitySection
                name={creation.name}
                portraitPreview={creation.portraitPreview}
                fileInputRef={creation.fileInputRef}
                portraitError={
                  hasAttemptedCreation
                    ? (validation.portraitError ?? undefined)
                    : undefined
                }
                nameError={
                  hasAttemptedCreation
                    ? (validation.nameError ?? undefined)
                    : undefined
                }
                onNameChange={creation.setName}
                onPortraitSelection={creation.handlePortraitSelection}
                onOpenFilePicker={creation.openFilePicker}
              />

              <ClassSelectionSection
                filteredClasses={creation.filteredClasses}
                selectedClassId={creation.selectedClass?.id ?? null}
                classSearch={creation.classSearch}
                isLoadingClasses={creation.isLoadingClasses}
                classesError={creation.classesError}
                selectionError={
                  hasAttemptedCreation
                    ? validation.classErrors.class
                    : undefined
                }
                selectedClassName={creation.selectedClassDetail?.nombre}
                classSkillChoices={classSkillChoiceGroups}
                selectedClassSkillChoices={classSkillSelections}
                classSkillErrors={validation.classErrors}
                hasError={
                  hasAttemptedCreation &&
                  Object.keys(validation.classErrors).length > 0
                }
                onClassSearchChange={creation.setClassSearch}
                onClassClick={creation.openClassModal}
                onClassSkillChoiceChange={handleClassSkillChoiceChange}
              />
            </div>

            <div
              data-phase-active={
                activePhase.id === "background" ? "true" : undefined
              }
              className={activePhase.id === "background" ? "" : "hidden"}
            >
              <BackgroundSelectionSection
                backgrounds={creation.availableBackgrounds}
                selectedBackgroundId={creation.selectedBackgroundId}
                selectedBackground={creation.selectedBackgroundDetail}
                onSelectionChange={setBackgroundSelection}
                onSelectedBackgroundChange={creation.setSelectedBackgroundId}
                isLoadingBackgroundInfo={
                  creation.isLoadingSelectedBackgroundDetail
                }
                backgroundInfoError={creation.selectedBackgroundDetailError}
                isLoadingBackgrounds={creation.isLoadingBackgrounds}
                backgroundsError={creation.backgroundsError}
                fieldErrors={
                  hasAttemptedCreation ? validation.backgroundErrors : {}
                }
                hasError={
                  hasAttemptedCreation &&
                  Object.keys(validation.backgroundErrors).length > 0
                }
              />
            </div>

            <div
              data-phase-active={
                activePhase.id === "species" ? "true" : undefined
              }
              className={activePhase.id === "species" ? "" : "hidden"}
            >
              <RaceSelectionSection
                onSelectionChange={setRaceSelection}
                fieldErrors={
                  hasAttemptedCreation ? validation.speciesErrors : {}
                }
                hasError={
                  hasAttemptedCreation &&
                  Object.keys(validation.speciesErrors).length > 0
                }
              />
            </div>

            <div
              data-phase-active={
                activePhase.id === "skills" ? "true" : undefined
              }
              className={activePhase.id === "skills" ? "" : "hidden"}
            >
              <StatisticsSelectionSection
                raceSelection={raceSelection}
                onSelectionChange={setStatisticsSelection}
                fieldErrors={
                  hasAttemptedCreation ? validation.skillsErrors : {}
                }
                hasError={
                  hasAttemptedCreation &&
                  Object.keys(validation.skillsErrors).length > 0
                }
              />
            </div>

            <div
              data-phase-active={
                activePhase.id === "equipment" ? "true" : undefined
              }
              className={activePhase.id === "equipment" ? "" : "hidden"}
            >
              <EquipmentSelectionSection
                classEquipment={
                  creation.selectedClassDetail?.equipamiento ?? null
                }
                backgroundEquipment={
                  creation.selectedBackgroundDetail?.equipamiento ?? null
                }
                classEquipmentName={
                  creation.selectedClassDetail?.nombre ??
                  creation.selectedClass?.nombre ??
                  "la clase"
                }
                backgroundEquipmentName={
                  creation.selectedBackgroundDetail?.nombre ??
                  creation.selectedBackgroundName ??
                  "el trasfondo"
                }
                isLoadingClassEquipment={creation.isLoadingSelectedClassDetail}
                isLoadingBackgroundEquipment={
                  creation.isLoadingSelectedBackgroundDetail
                }
                classEquipmentError={creation.selectedClassDetailError}
                backgroundEquipmentError={
                  creation.selectedBackgroundDetailError
                }
                onCreateCharacter={handleCreateCharacter}
                onSelectionChange={setEquipmentSelection}
                fieldErrors={
                  hasAttemptedCreation ? validation.equipmentErrors : {}
                }
                hasError={
                  hasAttemptedCreation &&
                  Object.keys(validation.equipmentErrors).length > 0
                }
                isCreating={isSubmitting}
                isCreateDisabled={isSubmitting || creationSucceeded}
              />
            </div>

            {activePhase.id === "equipment" && creationMessage ? (
              <div className="mt-6 rounded-[22px] border border-emerald-400/35 bg-emerald-950/25 px-5 py-4 text-sm font-medium text-emerald-100">
                {creationMessage}
              </div>
            ) : null}

            {activePhase.id === "equipment" && creationError ? (
              <div className="mt-6 rounded-[22px] border border-rose-400/35 bg-rose-950/25 px-5 py-4 text-sm font-medium text-rose-100">
                {creationError}
              </div>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handlePreviousPhase}
                disabled={creation.activePhaseIndex === 0}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300/15 bg-stone-950/70 px-5 py-3 text-sm font-semibold text-white transition hover:border-amber-300/25 hover:bg-stone-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>
              {creation.activePhaseIndex === CREATION_PHASES.length - 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    void handleCreateCharacter();
                  }}
                  disabled={isSubmitting || creationSucceeded}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-300/35 bg-[linear-gradient(90deg,rgba(28,25,23,0.92),rgba(245,158,11,0.12))] px-5 py-3 text-sm font-semibold text-amber-100 transition hover:border-amber-300/60 hover:bg-[linear-gradient(90deg,rgba(41,37,36,0.96),rgba(245,158,11,0.18))] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? "Creando personaje" : "Crear personaje"}
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextPhase}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-300/35 bg-[linear-gradient(90deg,rgba(28,25,23,0.92),rgba(245,158,11,0.12))] px-5 py-3 text-sm font-semibold text-amber-100 transition hover:border-amber-300/60 hover:bg-[linear-gradient(90deg,rgba(41,37,36,0.96),rgba(245,158,11,0.18))]"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <HomeNavbar activeTab="characters" onTabChange={handleNavChange} />
      </>
    </LogoLayout>
  );
}
