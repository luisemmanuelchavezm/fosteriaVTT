import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchDndCompetencyCatalog,
  fetchDndClassDetail,
  fetchDndClassSummaries,
  type CharacterAbilityResponse,
} from "../../utils/dndApi";
import type { DndCompetencyCatalog } from "../../types";
import { useSpellDetailInteractions } from "../../utils/useSpellDetailInteractions";
import { getStatValue } from "../utils/characterCore";
import {
  getCharacterCompetencies,
  splitCharacterCompetencies,
} from "../utils/characterCompetencies";
import { normalizeText, uniqueNormalizedValues } from "../utils/characterText";
import { resolveCharacterFormula } from "../utils/characterAbilities";
import type { DetailTab } from "../data";
import {
  ARMOR_CLASS_STAT,
  MOVEMENT_STAT,
  extractClassCompetencies,
  sanitizeNonNegativeNumber,
} from "./characterSheetConstants";
import { useCharacterSheetRemoteActions } from "./useCharacterSheetRemoteActions";
import { useCharacterSheetResourceManagement } from "./useCharacterSheetResourceManagement";
import { useCharacterSheetState } from "./useCharacterSheetState";

export function useDndCharacterSheetController(
  characterId: string,
  onGoCharacters: () => void,
) {
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>("actions");
  const [selectedPassive, setSelectedPassive] =
    useState<CharacterAbilityResponse | null>(null);
  const [isInventoryCatalogOpen, setIsInventoryCatalogOpen] = useState(false);
  const [isSpellCatalogOpen, setIsSpellCatalogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLevelManagementOpen, setIsLevelManagementOpen] = useState(false);
  const [isLevelUpOpen, setIsLevelUpOpen] = useState(false);
  const [levelModalMode, setLevelModalMode] = useState<"up" | "down">("up");
  const [isDeleteCharacterConfirmOpen, setIsDeleteCharacterConfirmOpen] =
    useState(false);
  const [classCompetencies, setClassCompetencies] = useState<string[]>([]);
  const [competencyCatalog, setCompetencyCatalog] =
    useState<DndCompetencyCatalog | null>(null);
  const spellInteractions = useSpellDetailInteractions();
  const competencySeedKeyRef = useRef<string | null>(null);
  const token = localStorage.getItem("jwtToken") ?? "";

  const {
    abilityUsage,
    character,
    currentExtraResources,
    currentHitDice,
    currentHp,
    currentMoney,
    currentSpellSlots,
    editableAlignment,
    editableExtraResourceMaximums,
    editableLanguagesText,
    editableMaxHp,
    editableMovement,
    editableName,
    editablePersonalHistory,
    editableSavingThrowProficiencies,
    editableSkillExpertise,
    editableSkillProficiencies,
    editableSkillProficiencyLevels,
    editableSpellSlotMaximums,
    editableStatScores,
    editableToolCompetencies,
    editableWeaponArmorCompetencies,
    isLoading,
    loadError,
    resourceSaveError,
    selectedInventoryItem,
    setAbilityUsage,
    setCharacter,
    setCurrentExtraResources,
    setCurrentHitDice,
    setCurrentHp,
    setCurrentMoney,
    setCurrentSpellSlots,
    setEditableAlignment,
    setEditableExtraResourceMaximums,
    setEditableLanguagesText,
    setEditableMaxHp,
    setEditableMovement,
    setEditableName,
    setEditablePersonalHistory,
    setEditableSavingThrowProficiencies,
    setEditableSkillExpertise,
    setEditableSkillProficiencies,
    setEditableSkillProficiencyLevels,
    setEditableSpellSlotMaximums,
    setEditableStatScores,
    setEditableToolCompetencies,
    setEditableWeaponArmorCompetencies,
    setResourceSaveError,
    setSelectedInventoryItem,
    setTempHp,
    syncCharacterDetail,
    tempHp,
  } = useCharacterSheetState({
    characterId,
    competencyCatalog,
    classCompetencies,
    healthCurrentStat: "Vida actual",
    healthTempStat: "Vida temporal",
    healthTotalStat: "Vida",
    movementStat: MOVEMENT_STAT,
  });

  useEffect(() => {
    const authToken = localStorage.getItem("jwtToken");
    if (!authToken) {
      setCompetencyCatalog(null);
      return;
    }

    const abortController = new AbortController();

    const loadCompetencyCatalog = async () => {
      try {
        const data = await fetchDndCompetencyCatalog(
          authToken,
          abortController.signal,
        );
        setCompetencyCatalog(data);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        setCompetencyCatalog(null);
      }
    };

    void loadCompetencyCatalog();

    return () => {
      abortController.abort();
    };
  }, [characterId]);

  useEffect(() => {
    if (!character) {
      setClassCompetencies([]);
      return;
    }

    const authToken = localStorage.getItem("jwtToken");
    if (!authToken || character.clases.length === 0) {
      setClassCompetencies([]);
      return;
    }

    const abortController = new AbortController();

    const loadClassCompetencies = async () => {
      try {
        const summaries = await fetchDndClassSummaries(
          authToken,
          abortController.signal,
        );
        const summaryByName = new Map(
          summaries.map((summary) => [
            normalizeText(summary.nombre),
            summary.id,
          ]),
        );
        const classIds = character.clases
          .map(
            (entry) => summaryByName.get(normalizeText(entry.nombre)) ?? null,
          )
          .filter((value): value is string => value !== null);

        if (classIds.length === 0) {
          setClassCompetencies([]);
          return;
        }

        const details = await Promise.all(
          classIds.map((classId) =>
            fetchDndClassDetail(authToken, classId, abortController.signal),
          ),
        );
        setClassCompetencies(
          uniqueNormalizedValues(
            details.flatMap(extractClassCompetencies),
          ).sort((left, right) => left.localeCompare(right, "es")),
        );
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        setClassCompetencies([]);
      }
    };

    void loadClassCompetencies();

    return () => {
      abortController.abort();
    };
  }, [character]);

  useEffect(() => {
    if (!character || isEditMode) {
      return;
    }
    if (!competencyCatalog) {
      return;
    }

    const seedKey = `${character.id}:${classCompetencies.join("|")}`;
    if (competencySeedKeyRef.current === seedKey) {
      return;
    }

    const competencyGroups = splitCharacterCompetencies(
      getCharacterCompetencies(character, classCompetencies, competencyCatalog),
      competencyCatalog,
    );
    setEditableWeaponArmorCompetencies(competencyGroups.weaponArmor);
    setEditableToolCompetencies(competencyGroups.tools);
    competencySeedKeyRef.current = seedKey;
  }, [character, classCompetencies, competencyCatalog, isEditMode]);

  const movement = useMemo(
    () => getStatValue(character, MOVEMENT_STAT),
    [character],
  );
  const armorClass = useMemo(
    () => getStatValue(character, ARMOR_CLASS_STAT),
    [character],
  );
  const resourceManagement = useCharacterSheetResourceManagement({
    character,
    currentExtraResources,
    currentHitDice,
    currentHp,
    currentMoney,
    currentSpellSlots,
    diceRoller: spellInteractions.diceRoller,
    editableExtraResourceMaximums,
    editableSpellSlotMaximums,
    isEditMode,
    isLoading,
    loadError,
    setAbilityUsage,
    setCharacter,
    setCurrentExtraResources,
    setCurrentHitDice,
    setCurrentHp,
    setCurrentMoney,
    setCurrentSpellSlots,
    setEditableExtraResourceMaximums,
    setEditableSpellSlotMaximums,
    setResourceSaveError,
    setTempHp,
    tempHp,
  });

  const remoteActions = useCharacterSheetRemoteActions({
    character,
    currentExtraResources,
    currentSpellSlots,
    editableAlignment,
    editableExtraResourceMaximums,
    editableLanguagesText,
    editableMaxHp,
    editableMovement,
    editableName,
    editablePersonalHistory,
    editableSavingThrowProficiencies,
    editableSkillExpertise,
    editableSkillProficiencies,
    editableSpellSlotMaximums,
    editableStatScores,
    editableToolCompetencies,
    editableWeaponArmorCompetencies,
    onCloseSpellDetail: spellInteractions.closeSpellDetail,
    onGoCharacters,
    onSetDeleteCharacterConfirmOpen: setIsDeleteCharacterConfirmOpen,
    onSetEditMode: setIsEditMode,
    onSetResourceSaveError: setResourceSaveError,
    onSetSelectedInventoryItem: setSelectedInventoryItem,
    onSyncCharacterDetail: syncCharacterDetail,
    selectedInventoryItemId: selectedInventoryItem?.id ?? null,
  });

  const handleToggleSavingThrowProficiency = (statName: string) => {
    setEditableSavingThrowProficiencies((current) =>
      current.includes(statName)
        ? current.filter((item) => item !== statName)
        : [...current, statName],
    );
  };

  const handleToggleSkillProficiency = (skillName: string) => {
    setEditableSkillProficiencyLevels((current) => {
      const nextLevel = (((current[skillName] ?? 0) + 1) % 3) as 0 | 1 | 2;
      const nextLevels = { ...current, [skillName]: nextLevel };
      if (nextLevel === 0) {
        delete nextLevels[skillName];
      }

      setEditableSkillProficiencies(
        Object.entries(nextLevels)
          .filter(([, level]) => level >= 1)
          .map(([name]) => name),
      );
      setEditableSkillExpertise(
        Object.entries(nextLevels)
          .filter(([, level]) => level >= 2)
          .map(([name]) => name),
      );

      return nextLevels;
    });
  };

  const handleToggleAbilityUsage = (abilityId: number) => {
    setAbilityUsage((current) => ({
      ...current,
      [abilityId]: !(current[abilityId] ?? false),
    }));
  };

  return {
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
    editableSavingThrowProficiencies,
    editableSkillExpertise,
    editableSkillProficiencyLevels,
    editableSkillProficiencies,
    editableSpellSlotMaximums,
    editableStatScores,
    editableToolCompetencies,
    editableWeaponArmorCompetencies,
    handleAddInventoryItem: remoteActions.handleAddInventoryItem,
    handleAddSpell: remoteActions.handleAddSpell,
    handleAdjustExtraResource: resourceManagement.handleAdjustExtraResource,
    handleAdjustExtraResourceMax:
      resourceManagement.handleAdjustExtraResourceMax,
    handleAdjustMoney: resourceManagement.handleAdjustMoney,
    handleAdjustSpellSlot: resourceManagement.handleAdjustSpellSlot,
    handleAdjustSpellSlotMax: resourceManagement.handleAdjustSpellSlotMax,
    handleCancelEdit: remoteActions.handleCancelEdit,
    handleConfirmShortRest: resourceManagement.handleConfirmShortRest,
    handleDamage: resourceManagement.handleDamage,
    handleDecrementHpDelta: resourceManagement.handleDecrementHpDelta,
    handleDecrementTempHpDelta: resourceManagement.handleDecrementTempHpDelta,
    handleDeleteCharacter: remoteActions.handleDeleteCharacter,
    handleDeleteSelectedInventoryItem:
      remoteActions.handleDeleteSelectedInventoryItem,
    handleDeleteSelectedSpell: remoteActions.handleDeleteSelectedSpell,
    handleGainTempHp: resourceManagement.handleGainTempHp,
    handleHeal: resourceManagement.handleHeal,
    handleIncrementHpDelta: resourceManagement.handleIncrementHpDelta,
    handleIncrementTempHpDelta: resourceManagement.handleIncrementTempHpDelta,
    handleLevelDown: remoteActions.handleLevelDown,
    handleLongRest: resourceManagement.handleLongRest,
    handleLoseTempHp: resourceManagement.handleLoseTempHp,
    handleOpenShortRest: resourceManagement.handleOpenShortRest,
    handleRollAbilityCheck: resourceManagement.handleRollAbilityCheck,
    handleRollActionDamage: resourceManagement.handleRollActionDamage,
    handleRollInitiative: resourceManagement.handleRollInitiative,
    handleRollSavingThrow: resourceManagement.handleRollSavingThrow,
    handleRollSkill: resourceManagement.handleRollSkill,
    handleRollSpellAttack: resourceManagement.handleRollSpellAttack,
    handleRollWeaponAttack: resourceManagement.handleRollWeaponAttack,
    handleSaveEdit: remoteActions.handleSaveEdit,
    handleSaveExperience: remoteActions.handleSaveExperience,
    handleSubmitLevelUp: remoteActions.handleSubmitLevelUp,
    handleToggleAbilityUsage,
    handleToggleInventoryEquip: remoteActions.handleToggleInventoryEquip,
    handleToggleSavingThrowProficiency,
    handleToggleSkillProficiency,
    handleUpdateSelectedInventoryQuantity:
      remoteActions.handleUpdateSelectedInventoryQuantity,
    hitDiceEntries: resourceManagement.hitDiceEntries,
    hpDelta: resourceManagement.hpDelta,
    initiative: resourceManagement.initiative,
    isDeleteCharacterConfirmOpen,
    isEditMode,
    isInventoryCatalogOpen,
    isLevelManagementOpen,
    isLevelUpOpen,
    isLoading,
    isShortRestModalOpen: resourceManagement.isShortRestModalOpen,
    isSpellCatalogOpen,
    levelModalMode,
    loadError,
    movement,
    resourceSaveError,
    sanitizeNonNegativeNumber,
    selectedInventoryItem,
    selectedPassive,
    setActiveDetailTab,
    setEditableAlignment,
    setEditableExtraResourceMaximums,
    setEditableLanguagesText,
    setEditableMaxHp,
    setEditableMovement,
    setEditableName,
    setEditablePersonalHistory,
    setEditableSkillExpertise,
    setEditableSkillProficiencyLevels,
    setEditableSkillProficiencies,
    setEditableStatScores,
    setEditableToolCompetencies,
    setEditableWeaponArmorCompetencies,
    setHpDelta: resourceManagement.setHpDelta,
    setIsDeleteCharacterConfirmOpen,
    setIsEditMode,
    setIsInventoryCatalogOpen,
    setIsLevelManagementOpen,
    setIsLevelUpOpen,
    setIsShortRestModalOpen: resourceManagement.setIsShortRestModalOpen,
    setIsSpellCatalogOpen,
    setLevelModalMode,
    setSelectedInventoryItem,
    setSelectedPassive,
    setShortRestHitDiceCounts: resourceManagement.setShortRestHitDiceCounts,
    setTempHpDelta: resourceManagement.setTempHpDelta,
    shortRestHitDiceCounts: resourceManagement.shortRestHitDiceCounts,
    spellInteractions,
    tempHp,
    tempHpDelta: resourceManagement.tempHpDelta,
    token,
    totalCharacterLevel: resourceManagement.totalCharacterLevel,
    totalHp: resourceManagement.totalHp,
    resolveCharacterFormula,
    normalizeText,
  };
}
