import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Flame } from "lucide-react";
import DiceRollOverlay from "../../../components/dice/DiceRollOverlay";
import HomeNavbar, { type NavTab } from "../../../components/HomeNavbar";
import LogoLayout from "../../../components/LogoLayout";
import SpellDetailModal from "../../../components/spells/SpellDetailModal";
import UserMenu from "../../../components/UserMenu";
import ClassSelectionSection from "./sections/ClassSelectionSection";
import CharacterIdentitySection from "./components/CharacterIdentitySection";
import ClassDetailModal from "./components/ClassDetailModal";
import BackgroundSelectionSection from "./sections/BackgroundSelectionSection";
import EquipmentSelectionSection from "./sections/EquipmentSelectionSection";
import RaceSelectionSection from "./sections/RaceSelectionSection";
import StatisticsSelectionSection from "./sections/StatisticsSelectionSection";
import type {
  BackgroundSelectionSnapshot,
  CharacterStatisticsSnapshot,
  EquipmentSelectionSnapshot,
  RaceSelectionSnapshot,
} from "./types";
import { ABILITY_STATS } from "./utils/statisticsUtils";
import { useCreateDndCharacter } from "./hooks/useCreateDndCharacter";
import { createDndCharacter } from "./utils/dndApi";
import { buildInitialClassSkillSelections } from "./utils/classSkillChoices";
import {
  appendEquipmentErrors,
  buildChoiceErrors,
  buildCreateCharacterPayload,
  CREATION_PHASES,
  scrollToFirstVisibleValidationError,
} from "./utils/createDndScreenUtils";
import { useSpellDetailInteractions } from "../utils/useSpellDetailInteractions";
import { normalizeChoiceCatalog } from "../../../components/spells/spellReferenceUtils";
import {
  EXPERTISE_CHOICE_SECTION_ID,
  getExpertiseChoiceConfig,
  THIEVES_TOOLS_NAME,
} from "../utils/dndExpertise";
import { normalizeDndText } from "../utils/dndProgressionRules";

interface CreateDndCharacterScreenProps {
  username: string;
  avatarUrl: string;
  onLogout: () => void;
  onGoHome: () => void;
  onGoCampaigns: () => void;
  onGoCharacters: () => void;
  onCharacterCreated?: (characterId: string) => void;
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
  const [classExpertiseSelections, setClassExpertiseSelections] = useState<
    string[]
  >([]);
  const [statisticsSelection, setStatisticsSelection] =
    useState<CharacterStatisticsSnapshot | null>(null);
  const [equipmentSelection, setEquipmentSelection] =
    useState<EquipmentSelectionSnapshot | null>(null);
  const [hasAttemptedCreation, setHasAttemptedCreation] = useState(false);
  const [creationMessage, setCreationMessage] = useState<string | null>(null);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creationSucceeded, setCreationSucceeded] = useState(false);
  const spellInteractions = useSpellDetailInteractions();

  const classSkillChoiceGroups = useMemo(
    () => creation.selectedClassDetail?.elecciones ?? [],
    [creation.selectedClassDetail],
  );
  const classExpertiseChoiceConfig = useMemo(
    () =>
      getExpertiseChoiceConfig(
        creation.selectedClassDetail?.id ?? creation.selectedClass?.id ?? null,
        1,
      ),
    [creation.selectedClass, creation.selectedClassDetail],
  );
  const availableClassExpertiseOptions = useMemo(() => {
    if (!classExpertiseChoiceConfig) {
      return [];
    }

    const selectedSkillChoices = classSkillChoiceGroups
      .filter(
        (group) => normalizeChoiceCatalog(group.catalogo) === "habilidades",
      )
      .flatMap((group) => classSkillSelections[group.id] ?? [])
      .filter((value) => value.trim().length > 0);

    const uniqueSkillChoices = [...new Set(selectedSkillChoices)].sort(
      (left, right) => left.localeCompare(right, "es"),
    );

    if (!classExpertiseChoiceConfig.allowThievesTools) {
      return uniqueSkillChoices;
    }

    const hasThievesToolsCompetency = (
      creation.selectedClassDetail?.competencias.herramientas ?? []
    ).some(
      (entry) =>
        normalizeDndText(entry) === normalizeDndText(THIEVES_TOOLS_NAME),
    );

    return hasThievesToolsCompetency
      ? [...uniqueSkillChoices, THIEVES_TOOLS_NAME]
      : uniqueSkillChoices;
  }, [
    classExpertiseChoiceConfig,
    classSkillChoiceGroups,
    classSkillSelections,
    creation.selectedClassDetail,
  ]);

  useEffect(() => {
    setClassSkillSelections(
      buildInitialClassSkillSelections(classSkillChoiceGroups),
    );
  }, [classSkillChoiceGroups]);

  useEffect(() => {
    if (!classExpertiseChoiceConfig) {
      setClassExpertiseSelections([]);
      return;
    }

    setClassExpertiseSelections((current) =>
      Array.from({ length: classExpertiseChoiceConfig.count }, (_, index) => {
        const currentValue = current[index] ?? "";
        return availableClassExpertiseOptions.some(
          (option) =>
            normalizeDndText(option) === normalizeDndText(currentValue),
        )
          ? currentValue
          : "";
      }),
    );
  }, [availableClassExpertiseOptions, classExpertiseChoiceConfig]);

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
      const initialSubclasses =
        creation.selectedClassDetail?.subclases.filter(
          (item) => item.nivelDesbloqueo <= 1,
        ) ?? [];

      if (initialSubclasses.length > 0 && !creation.selectedSubclassId) {
        classErrors.subclass = "Debes seleccionar una subclase";
      }

      classSkillChoiceGroups.forEach((group) => {
        const selectedValues = classSkillSelections[group.id] ?? [];
        if (selectedValues.length !== group.cantidad) {
          classErrors[group.id] = "Debes completar esta elección";
        }
      });

      if (classExpertiseChoiceConfig) {
        const selectedExpertiseCount = classExpertiseSelections.filter(
          (value) => value.trim().length > 0,
        ).length;

        if (selectedExpertiseCount !== classExpertiseChoiceConfig.count) {
          classErrors[EXPERTISE_CHOICE_SECTION_ID] =
            "Debes completar esta elección";
        }
      }
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

    const hasClassPhaseErrors =
      nameError !== null ||
      portraitError !== null ||
      Object.keys(classErrors).length > 0;

    const invalidPhases = CREATION_PHASES.filter((phase) => {
      if (phase.id === "class") {
        return hasClassPhaseErrors;
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
    creation.selectedSubclassId,
    classExpertiseChoiceConfig,
    classExpertiseSelections,
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
    creation.selectedSubclassId,
    classExpertiseSelections,
    classSkillSelections,
    equipmentSelection,
    raceSelection,
    statisticsSelection,
  ]);

  const handleSpellReferenceClick = async (spellName: string) => {
    await spellInteractions.openSpellDetailByName(
      localStorage.getItem("jwtToken"),
      spellName,
    );
  };

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
        classExpertiseSelections,
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

  const handleClassSkillChoiceChange = (choiceId: string, values: string[]) => {
    setClassSkillSelections((current) => ({
      ...current,
      [choiceId]: values,
    }));
  };

  return (
    <LogoLayout onLogoClick={onGoHome} fullWidth>
      <>
        <DiceRollOverlay
          diceBoxHostId={spellInteractions.diceRoller.diceBoxHostId}
          diceBoxError={spellInteractions.diceRoller.diceBoxError}
          isRolling={spellInteractions.diceRoller.isRolling}
          summary={spellInteractions.diceRoller.summary}
        />

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

        <SpellDetailModal
          spell={spellInteractions.selectedSpell}
          isOpen={spellInteractions.selectedSpell !== null}
          onClose={spellInteractions.closeSpellDetail}
          onRollExpression={spellInteractions.rollSpellExpression}
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
                isLoadingSelectedClassDetail={
                  creation.isLoadingSelectedClassDetail
                }
                selectedClassDetailError={creation.selectedClassDetailError}
                selectionError={
                  hasAttemptedCreation
                    ? validation.classErrors.class
                    : undefined
                }
                selectedClassName={creation.selectedClassDetail?.nombre}
                subclasses={
                  creation.selectedClassDetail?.subclases.filter(
                    (item) => item.nivelDesbloqueo <= 1,
                  ) ?? []
                }
                selectedSubclassId={creation.selectedSubclassId || null}
                selectedSubclass={creation.selectedSubclass}
                selectedSubclassName={creation.selectedSubclass?.nombre ?? null}
                subclassSkills={creation.subclassSkills}
                isLoadingSubclassSkills={creation.isLoadingSubclassSkills}
                subclassSkillsError={creation.subclassSkillsError}
                classSkillChoices={classSkillChoiceGroups}
                selectedClassSkillChoices={classSkillSelections}
                classSkillErrors={validation.classErrors}
                expertiseChoiceConfig={classExpertiseChoiceConfig}
                expertiseOptions={availableClassExpertiseOptions}
                selectedExpertiseChoices={classExpertiseSelections}
                hasError={
                  hasAttemptedCreation &&
                  Object.keys(validation.classErrors).length > 0
                }
                onSpellReferenceClick={handleSpellReferenceClick}
                onClassSearchChange={creation.setClassSearch}
                onClassClick={creation.openClassModal}
                onClearSelection={creation.clearSelectedClass}
                onSubclassChange={creation.setSelectedSubclassId}
                onClassSkillChoiceChange={handleClassSkillChoiceChange}
                onClassExpertiseChange={setClassExpertiseSelections}
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
                onSpellInfoRequest={handleSpellReferenceClick}
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
                isActive={activePhase.id === "skills"}
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
