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
import { useCreateDndCharacter } from "./hooks/useCreateDndCharacter";
import { useCreateDndCharacterWorkflow } from "./hooks/useCreateDndCharacterWorkflow";
import { CREATION_PHASES } from "./utils/createDndScreenUtils";
import { useSpellDetailInteractions } from "../utils/useSpellDetailInteractions";

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
  const workflow = useCreateDndCharacterWorkflow({
    creation,
    onCharacterCreated,
  });
  const activePhase = CREATION_PHASES[creation.activePhaseIndex];
  const spellInteractions = useSpellDetailInteractions();

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

  const handleSpellReferenceClick = async (spellName: string) => {
    await spellInteractions.openSpellDetailByName(
      localStorage.getItem("jwtToken"),
      spellName,
    );
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
                  workflow.hasAttemptedCreation &&
                  workflow.validation.invalidPhases.includes(phase.id);

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
                  workflow.hasAttemptedCreation
                    ? (workflow.validation.portraitError ?? undefined)
                    : undefined
                }
                nameError={
                  workflow.hasAttemptedCreation
                    ? (workflow.validation.nameError ?? undefined)
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
                  workflow.hasAttemptedCreation
                    ? workflow.validation.classErrors.class
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
                classSkillChoices={workflow.classSkillChoiceGroups}
                selectedClassSkillChoices={workflow.classSkillSelections}
                classSkillErrors={workflow.validation.classErrors}
                expertiseChoiceConfig={workflow.classExpertiseChoiceConfig}
                expertiseOptions={workflow.availableClassExpertiseOptions}
                selectedExpertiseChoices={workflow.classExpertiseSelections}
                hasError={
                  workflow.hasAttemptedCreation &&
                  Object.keys(workflow.validation.classErrors).length > 0
                }
                onSpellReferenceClick={handleSpellReferenceClick}
                onClassSearchChange={creation.setClassSearch}
                onClassClick={creation.openClassModal}
                onClearSelection={creation.clearSelectedClass}
                onSubclassChange={creation.setSelectedSubclassId}
                onClassSkillChoiceChange={workflow.handleClassSkillChoiceChange}
                onClassExpertiseChange={workflow.setClassExpertiseSelections}
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
                onSelectionChange={workflow.setBackgroundSelection}
                onSelectedBackgroundChange={creation.setSelectedBackgroundId}
                isLoadingBackgroundInfo={
                  creation.isLoadingSelectedBackgroundDetail
                }
                backgroundInfoError={creation.selectedBackgroundDetailError}
                isLoadingBackgrounds={creation.isLoadingBackgrounds}
                backgroundsError={creation.backgroundsError}
                fieldErrors={
                  workflow.hasAttemptedCreation
                    ? workflow.validation.backgroundErrors
                    : {}
                }
                hasError={
                  workflow.hasAttemptedCreation &&
                  Object.keys(workflow.validation.backgroundErrors).length > 0
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
                onSelectionChange={workflow.setRaceSelection}
                fieldErrors={
                  workflow.hasAttemptedCreation
                    ? workflow.validation.speciesErrors
                    : {}
                }
                hasError={
                  workflow.hasAttemptedCreation &&
                  Object.keys(workflow.validation.speciesErrors).length > 0
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
                raceSelection={workflow.raceSelection}
                isActive={activePhase.id === "skills"}
                onSelectionChange={workflow.setStatisticsSelection}
                fieldErrors={
                  workflow.hasAttemptedCreation
                    ? workflow.validation.skillsErrors
                    : {}
                }
                hasError={
                  workflow.hasAttemptedCreation &&
                  Object.keys(workflow.validation.skillsErrors).length > 0
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
                onCreateCharacter={workflow.handleCreateCharacter}
                onSelectionChange={workflow.setEquipmentSelection}
                fieldErrors={
                  workflow.hasAttemptedCreation
                    ? workflow.validation.equipmentErrors
                    : {}
                }
                hasError={
                  workflow.hasAttemptedCreation &&
                  Object.keys(workflow.validation.equipmentErrors).length > 0
                }
                isCreating={workflow.isSubmitting}
                isCreateDisabled={
                  workflow.isSubmitting || workflow.creationSucceeded
                }
              />
            </div>

            {activePhase.id === "equipment" && workflow.creationMessage ? (
              <div className="mt-6 rounded-[22px] border border-emerald-400/35 bg-emerald-950/25 px-5 py-4 text-sm font-medium text-emerald-100">
                {workflow.creationMessage}
              </div>
            ) : null}

            {activePhase.id === "equipment" && workflow.creationError ? (
              <div className="mt-6 rounded-[22px] border border-rose-400/35 bg-rose-950/25 px-5 py-4 text-sm font-medium text-rose-100">
                {workflow.creationError}
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
                    void workflow.handleCreateCharacter();
                  }}
                  disabled={workflow.isSubmitting || workflow.creationSucceeded}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-300/35 bg-[linear-gradient(90deg,rgba(28,25,23,0.92),rgba(245,158,11,0.12))] px-5 py-3 text-sm font-semibold text-amber-100 transition hover:border-amber-300/60 hover:bg-[linear-gradient(90deg,rgba(41,37,36,0.96),rgba(245,158,11,0.18))] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {workflow.isSubmitting
                    ? "Creando personaje"
                    : "Crear personaje"}
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
