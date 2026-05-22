import { useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import HomeNavbar, { type NavTab } from "../../../components/HomeNavbar";
import LogoLayout from "../../../components/LogoLayout";
import UserMenu from "../../../components/UserMenu";
import CharacterSheetOverlays from "./components/CharacterSheetOverlays";
import ChecksSection from "./components/ChecksSection";
import DetailTabsSection from "./components/DetailTabsSection";
import IdentitySection from "./components/IdentitySection";
import ResourcesSection from "./components/ResourcesSection";
import ShortRestModal from "./components/ShortRestModal";
import StatisticsSection from "./components/StatisticsSection";
import { useDndCharacterSheetController } from "./hooks/useDndCharacterSheetController";
import NpcSheetContent from "./NpcSheetContent";

const CHARACTER_UPDATED_EVENT = "fosteria:character-updated";

interface DndCharacterSheetScreenProps {
  username: string;
  avatarUrl: string;
  characterId: string;
  onLogout: () => void;
  onGoHome: () => void;
  onGoCampaigns: () => void;
  onGoCharacters: () => void;
  modalMode?: boolean;
}

export default function DndCharacterSheetScreen({
  username,
  avatarUrl,
  characterId,
  onLogout,
  onGoHome,
  onGoCampaigns,
  onGoCharacters,
  modalMode = false,
}: DndCharacterSheetScreenProps) {
  const {
    abilityUsage,
    activeDetailTab,
    armorClass,
    character,
    classCompetencies,
    competencyCatalog,
    currentExtraResources,
    currentHp,
    currentHitDice,
    currentMoney,
    currentSpellSlots,
    editableAlignment,
    editableExtraResourceMaximums,
    editableLanguagesText,
    editableMaxHp,
    editableMovement,
    editableName,
    editablePersonalHistory,
    editableSkillProficiencyLevels,
    editableSavingThrowProficiencies,
    editableSkillProficiencies,
    editableSpellSlotMaximums,
    editableStatScores,
    editableToolCompetencies,
    editableWeaponArmorCompetencies,
    handleAddInventoryItem,
    handleAddSpell,
    handleAdjustExtraResource,
    handleAdjustExtraResourceMax,
    handleAdjustMoney,
    handleAdjustSpellSlot,
    handleAdjustSpellSlotMax,
    handleCancelEdit,
    handleConfirmShortRest,
    handleDamage,
    handleDecrementHpDelta,
    handleDecrementTempHpDelta,
    handleDeleteCharacter,
    handleDeleteSelectedInventoryItem,
    handleDeleteSelectedSpell,
    handleGainTempHp,
    handleHeal,
    handleIncrementHpDelta,
    handleIncrementTempHpDelta,
    handleLevelDown,
    handleLongRest,
    handleLoseTempHp,
    handleOpenShortRest,
    handleRollAbilityCheck,
    handleRollActionDamage,
    handleRollInitiative,
    handleRollSavingThrow,
    handleRollSkill,
    handleRollSpellAttack,
    handleRollWeaponAttack,
    handleSaveEdit,
    handleSaveExperience,
    handleSubmitLevelUp,
    handleToggleAbilityUsage,
    handleToggleInventoryEquip,
    handleToggleSavingThrowProficiency,
    handleToggleSkillProficiency,
    handleUpdateSelectedInventoryQuantity,
    hitDiceEntries,
    hpDelta,
    initiative,
    isDeleteCharacterConfirmOpen,
    isEditMode,
    isInventoryCatalogOpen,
    isLevelManagementOpen,
    isLevelUpOpen,
    isLoading,
    isShortRestModalOpen,
    isSpellCatalogOpen,
    levelModalMode,
    loadError,
    movement,
    normalizeText,
    resourceSaveError,
    sanitizeNonNegativeNumber,
    selectedInventoryItem,
    selectedPassive,
    setActiveDetailTab,
    setEditableAlignment,
    setEditableLanguagesText,
    setEditableMaxHp,
    setEditableMovement,
    setEditableName,
    setEditablePersonalHistory,
    setEditableStatScores,
    setEditableToolCompetencies,
    setEditableWeaponArmorCompetencies,
    setHpDelta,
    setIsDeleteCharacterConfirmOpen,
    setIsEditMode,
    setIsInventoryCatalogOpen,
    setIsLevelManagementOpen,
    setIsLevelUpOpen,
    setIsShortRestModalOpen,
    setIsSpellCatalogOpen,
    setLevelModalMode,
    setSelectedInventoryItem,
    setSelectedPassive,
    setShortRestHitDiceCounts,
    setTempHpDelta,
    shortRestHitDiceCounts,
    spellInteractions,
    tempHp,
    tempHpDelta,
    token,
    totalCharacterLevel,
    totalHp,
  } = useDndCharacterSheetController(characterId, onGoCharacters);

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

  useEffect(() => {
    if (!character) {
      return;
    }

    const liveCharacter = {
      ...character,
      estadisticas: {
        ...character.estadisticas,
        "Vida actual": currentHp,
        "Vida temporal": tempHp,
        "Puntos de vida": totalHp,
      },
    };

    window.dispatchEvent(
      new CustomEvent(CHARACTER_UPDATED_EVENT, {
        detail: liveCharacter,
      }),
    );
  }, [character, currentHp, tempHp, totalHp]);

  const content = (
    <>
      <CharacterSheetOverlays
        token={token}
        character={character}
        classCompetencies={classCompetencies}
        totalCharacterLevel={totalCharacterLevel}
        isEditMode={isEditMode}
        isInventoryCatalogOpen={isInventoryCatalogOpen}
        isSpellCatalogOpen={isSpellCatalogOpen}
        isDeleteCharacterConfirmOpen={isDeleteCharacterConfirmOpen}
        isLevelManagementOpen={isLevelManagementOpen}
        isLevelUpOpen={isLevelUpOpen}
        levelModalMode={levelModalMode}
        selectedPassive={selectedPassive}
        selectedInventoryItem={selectedInventoryItem}
        spellInteractions={spellInteractions}
        onSetInventoryCatalogOpen={setIsInventoryCatalogOpen}
        onSetSpellCatalogOpen={setIsSpellCatalogOpen}
        onSetDeleteCharacterConfirmOpen={setIsDeleteCharacterConfirmOpen}
        onSetLevelManagementOpen={setIsLevelManagementOpen}
        onSetLevelUpOpen={setIsLevelUpOpen}
        onSetLevelModalMode={setLevelModalMode}
        onSetSelectedPassive={setSelectedPassive}
        onSetSelectedInventoryItem={setSelectedInventoryItem}
        onDeleteSelectedSpell={handleDeleteSelectedSpell}
        onDeleteSelectedInventoryItem={handleDeleteSelectedInventoryItem}
        onUpdateSelectedInventoryQuantity={
          handleUpdateSelectedInventoryQuantity
        }
        onAddInventoryItem={handleAddInventoryItem}
        onAddSpell={handleAddSpell}
        onDeleteCharacter={handleDeleteCharacter}
        onSaveExperience={handleSaveExperience}
        onSubmitLevelUp={handleSubmitLevelUp}
        onLevelDown={handleLevelDown}
      />

      <ShortRestModal
        isOpen={isShortRestModalOpen}
        hitDiceEntries={hitDiceEntries}
        currentHitDice={currentHitDice}
        shortRestHitDiceCounts={shortRestHitDiceCounts}
        onCountsChange={setShortRestHitDiceCounts}
        onClose={() => setIsShortRestModalOpen(false)}
        onConfirm={handleConfirmShortRest}
      />

      {!modalMode ? (
        <UserMenu
          username={username}
          avatarUrl={avatarUrl}
          onLogout={onLogout}
        />
      ) : null}

      <div
        className={
          modalMode
            ? "relative z-10 w-full px-4 py-4"
            : "relative z-10 w-full px-4 pb-32 pt-28 md:px-8 md:pb-36 xl:w-[125%] xl:[zoom:0.8]"
        }
      >
        <div className="relative overflow-hidden rounded-[32px] border border-stone-300/10 bg-[linear-gradient(180deg,rgba(12,10,9,0.96)_0%,rgba(28,25,23,0.92)_48%,rgba(10,10,10,0.98)_100%)] p-6 text-stone-50 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-md md:p-8">
          <div className="pointer-events-none absolute -top-20 right-[-50px] h-56 w-56 rounded-full bg-amber-300/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-90px] left-[-30px] h-64 w-64 rounded-full bg-stone-300/10 blur-3xl" />

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-amber-200/80">
                Dungeons and Dragons
              </p>
              <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">
                Hoja de personaje
              </h1>
            </div>

            {!modalMode ? (
              <button
                type="button"
                onClick={onGoCharacters}
                className="inline-flex items-center gap-2 rounded-full border border-stone-300/15 bg-stone-950/70 px-5 py-3 text-sm font-semibold text-white transition hover:border-amber-300/25 hover:bg-stone-900"
              >
                <ChevronLeft className="h-4 w-4" />
                Volver a personajes
              </button>
            ) : null}
          </div>

          {isLoading ? (
            <div className="mt-8 rounded-[26px] border border-white/10 bg-black/20 px-6 py-10 text-center text-sm text-stone-300">
              Cargando hoja del personaje...
            </div>
          ) : null}

          {!isLoading && loadError ? (
            <div className="mt-8 rounded-[26px] border border-rose-400/35 bg-rose-950/25 px-6 py-5 text-sm font-medium text-rose-100">
              {loadError}
            </div>
          ) : null}

          {!isLoading && !loadError && resourceSaveError ? (
            <div className="mt-4 rounded-[20px] border border-amber-400/35 bg-amber-950/20 px-5 py-4 text-sm font-medium text-amber-50">
              {resourceSaveError}
            </div>
          ) : null}

          {!isLoading &&
          !loadError &&
          character &&
          (character.tipo === "enemigo" || character.tipo === "PNJ") ? (
            <NpcSheetContent
              character={character}
              currentHp={currentHp}
              totalHp={totalHp}
              tempHp={tempHp}
              hpDelta={hpDelta}
              tempHpDelta={tempHpDelta}
              onHpDeltaChange={setHpDelta}
              onTempHpDeltaChange={setTempHpDelta}
              onHeal={handleHeal}
              onDamage={handleDamage}
              onGainTempHp={handleGainTempHp}
              onLoseTempHp={handleLoseTempHp}
              onIncrementHpDelta={handleIncrementHpDelta}
              onDecrementHpDelta={handleDecrementHpDelta}
              onIncrementTempHpDelta={handleIncrementTempHpDelta}
              onDecrementTempHpDelta={handleDecrementTempHpDelta}
              sanitizeNonNegativeNumber={sanitizeNonNegativeNumber}
            />
          ) : null}

          {!isLoading &&
          !loadError &&
          character &&
          character.tipo !== "enemigo" &&
          character.tipo !== "PNJ" ? (
            <div className="mt-8 space-y-8">
              <IdentitySection
                character={character}
                editableName={editableName}
                onShortRest={handleOpenShortRest}
                onLongRest={handleLongRest}
                isEditMode={isEditMode}
                onToggleEditMode={() => setIsEditMode((current) => !current)}
                onOpenLevelManagement={() => setIsLevelManagementOpen(true)}
                onDeleteCharacter={() => setIsDeleteCharacterConfirmOpen(true)}
                onEditableNameChange={setEditableName}
                onSaveEdit={() => void handleSaveEdit()}
                onCancelEdit={handleCancelEdit}
              />
              <StatisticsSection
                character={character}
                isEditMode={isEditMode}
                editableStatScores={editableStatScores}
                editableMovement={editableMovement}
                editableMaxHp={editableMaxHp}
                movement={movement}
                initiative={initiative}
                armorClass={armorClass}
                hpDelta={hpDelta}
                tempHpDelta={tempHpDelta}
                currentHp={currentHp}
                tempHp={tempHp}
                totalHp={totalHp}
                onHpDeltaChange={(value) =>
                  setHpDelta(sanitizeNonNegativeNumber(value))
                }
                onTempHpDeltaChange={(value) =>
                  setTempHpDelta(sanitizeNonNegativeNumber(value))
                }
                onHeal={handleHeal}
                onDamage={handleDamage}
                onGainTempHp={handleGainTempHp}
                onLoseTempHp={handleLoseTempHp}
                onRollAbilityCheck={handleRollAbilityCheck}
                onRollInitiative={handleRollInitiative}
                onIncrementHpDelta={handleIncrementHpDelta}
                onDecrementHpDelta={handleDecrementHpDelta}
                onIncrementTempHpDelta={handleIncrementTempHpDelta}
                onDecrementTempHpDelta={handleDecrementTempHpDelta}
                onStatScoreChange={(statName, value) =>
                  setEditableStatScores((current) => ({
                    ...current,
                    [statName]: Math.max(8, Math.min(30, value)),
                  }))
                }
                onMovementChange={(value) =>
                  setEditableMovement(Math.max(0, Math.min(1000, value)))
                }
                onMaxHpChange={(value) =>
                  setEditableMaxHp(Math.max(1, Math.min(1000, value)))
                }
                resourcesSlot={
                  <ResourcesSection
                    character={character}
                    currentSpellSlots={currentSpellSlots}
                    spellSlotMaximums={editableSpellSlotMaximums}
                    currentExtraResources={currentExtraResources}
                    extraResourceMaximums={editableExtraResourceMaximums}
                    currentMoney={currentMoney}
                    isEditMode={isEditMode}
                    onAdjustSpellSlot={handleAdjustSpellSlot}
                    onAdjustSpellSlotMax={handleAdjustSpellSlotMax}
                    onAdjustExtraResource={handleAdjustExtraResource}
                    onAdjustExtraResourceMax={handleAdjustExtraResourceMax}
                    onAdjustMoney={handleAdjustMoney}
                  />
                }
              />
              <section className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1.2fr)] xl:items-start">
                <ChecksSection
                  character={character}
                  isEditMode={isEditMode}
                  editableSavingThrowProficiencies={
                    editableSavingThrowProficiencies
                  }
                  editableSkillProficiencyLevels={
                    editableSkillProficiencyLevels
                  }
                  editableSkillProficiencies={editableSkillProficiencies}
                  onRollSavingThrow={handleRollSavingThrow}
                  onRollSkill={handleRollSkill}
                  onToggleSavingThrowProficiency={
                    handleToggleSavingThrowProficiency
                  }
                  onToggleSkillProficiency={handleToggleSkillProficiency}
                />
                <DetailTabsSection
                  character={character}
                  activeTab={activeDetailTab}
                  abilityUsage={abilityUsage}
                  isEditMode={isEditMode}
                  editableAlignment={editableAlignment}
                  editableLanguagesText={editableLanguagesText}
                  editablePersonalHistory={editablePersonalHistory}
                  editableWeaponArmorCompetencies={
                    editableWeaponArmorCompetencies
                  }
                  editableToolCompetencies={editableToolCompetencies}
                  onTabChange={setActiveDetailTab}
                  onRollWeaponAttack={handleRollWeaponAttack}
                  onRollSpellAttack={handleRollSpellAttack}
                  onRollActionDamage={handleRollActionDamage}
                  onOpenSpellDetails={spellInteractions.openSpellDetail}
                  onRollSpellExpression={spellInteractions.rollSpellExpression}
                  onToggleAbilityUsage={handleToggleAbilityUsage}
                  onToggleInventoryEquip={handleToggleInventoryEquip}
                  onOpenPassiveDetails={setSelectedPassive}
                  onOpenInventoryDetails={setSelectedInventoryItem}
                  onOpenAddInventory={() => setIsInventoryCatalogOpen(true)}
                  onOpenAddSpell={() => setIsSpellCatalogOpen(true)}
                  onAlignmentChange={setEditableAlignment}
                  onLanguagesTextChange={setEditableLanguagesText}
                  onPersonalHistoryChange={setEditablePersonalHistory}
                  onRemoveWeaponArmorCompetency={(value) =>
                    setEditableWeaponArmorCompetencies((current) =>
                      current.filter(
                        (item) => normalizeText(item) !== normalizeText(value),
                      ),
                    )
                  }
                  onRemoveToolCompetency={(value) =>
                    setEditableToolCompetencies((current) =>
                      current.filter(
                        (item) => normalizeText(item) !== normalizeText(value),
                      ),
                    )
                  }
                  onAddWeaponArmorCompetency={(value) =>
                    setEditableWeaponArmorCompetencies((current) =>
                      current.some(
                        (item) => normalizeText(item) === normalizeText(value),
                      )
                        ? current
                        : [...current, value].sort((left, right) =>
                            left.localeCompare(right, "es"),
                          ),
                    )
                  }
                  onAddToolCompetency={(value) =>
                    setEditableToolCompetencies((current) =>
                      current.some(
                        (item) => normalizeText(item) === normalizeText(value),
                      )
                        ? current
                        : [...current, value].sort((left, right) =>
                            left.localeCompare(right, "es"),
                          ),
                    )
                  }
                  classCompetencies={classCompetencies}
                  competencyCatalog={competencyCatalog}
                />
              </section>
            </div>
          ) : null}
        </div>
      </div>

      {!modalMode ? (
        <HomeNavbar activeTab="characters" onTabChange={handleNavChange} />
      ) : null}
    </>
  );

  if (modalMode) {
    return <div className="w-full">{content}</div>;
  }

  return (
    <LogoLayout onLogoClick={onGoHome} fullWidth hideLogo={isLevelUpOpen}>
      {content}
    </LogoLayout>
  );
}
