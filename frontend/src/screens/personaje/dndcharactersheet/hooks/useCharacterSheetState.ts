import { useEffect, useState } from "react";
import {
  fetchDndCharacterDetail,
  type CharacterInventoryItemResponse,
  type DndCharacterDetailResponse,
} from "../../utils/dndApi";
import type { DndCompetencyCatalog } from "../../types";
import { buildCharacterSheetState } from "../screenState";
import {
  getCharacterCompetencies,
  splitCharacterCompetencies,
} from "../utils/characterCompetencies";

interface UseCharacterSheetStateOptions {
  characterId: string;
  competencyCatalog: DndCompetencyCatalog | null;
  classCompetencies: string[];
  healthCurrentStat: string;
  healthTempStat: string;
  healthTotalStat: string;
  movementStat: string;
}

export function useCharacterSheetState({
  characterId,
  competencyCatalog,
  classCompetencies,
  healthCurrentStat,
  healthTempStat,
  healthTotalStat,
  movementStat,
}: UseCharacterSheetStateOptions) {
  const [character, setCharacter] = useState<DndCharacterDetailResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentHp, setCurrentHp] = useState(0);
  const [tempHp, setTempHp] = useState(0);
  const [currentSpellSlots, setCurrentSpellSlots] = useState<
    Record<number, number>
  >({});
  const [currentExtraResources, setCurrentExtraResources] = useState<
    Record<number, number>
  >({});
  const [currentMoney, setCurrentMoney] = useState<Record<string, number>>({
    ppt: 0,
    po: 0,
    pp: 0,
    pc: 0,
  });
  const [currentHitDice, setCurrentHitDice] = useState<Record<string, number>>(
    {},
  );
  const [abilityUsage, setAbilityUsage] = useState<Record<number, boolean>>({});
  const [resourceSaveError, setResourceSaveError] = useState<string | null>(
    null,
  );
  const [selectedInventoryItem, setSelectedInventoryItem] =
    useState<CharacterInventoryItemResponse | null>(null);
  const [editableName, setEditableName] = useState("");
  const [editableAlignment, setEditableAlignment] = useState("");
  const [editablePersonalHistory, setEditablePersonalHistory] = useState("");
  const [editableLanguagesText, setEditableLanguagesText] = useState("");
  const [editableStatScores, setEditableStatScores] = useState<
    Record<string, number>
  >({});
  const [editableMovement, setEditableMovement] = useState(0);
  const [editableMaxHp, setEditableMaxHp] = useState(1);
  const [editableSpellSlotMaximums, setEditableSpellSlotMaximums] = useState<
    Record<number, number>
  >({});
  const [editableExtraResourceMaximums, setEditableExtraResourceMaximums] =
    useState<Record<number, number>>({});
  const [
    editableSavingThrowProficiencies,
    setEditableSavingThrowProficiencies,
  ] = useState<string[]>([]);
  const [editableSkillProficiencies, setEditableSkillProficiencies] = useState<
    string[]
  >([]);
  const [editableSkillProficiencyLevels, setEditableSkillProficiencyLevels] =
    useState<Record<string, number>>({});
  const [editableSkillExpertise, setEditableSkillExpertise] = useState<
    string[]
  >([]);
  const [editableWeaponArmorCompetencies, setEditableWeaponArmorCompetencies] =
    useState<string[]>([]);
  const [editableToolCompetencies, setEditableToolCompetencies] = useState<
    string[]
  >([]);

  const applyCharacterSheetState = (data: DndCharacterDetailResponse) => {
    const sheetState = buildCharacterSheetState(
      data,
      healthCurrentStat,
      healthTempStat,
      healthTotalStat,
      movementStat,
    );

    setCharacter(data);
    setCurrentHp(sheetState.currentHp);
    setTempHp(sheetState.tempHp);
    setCurrentSpellSlots(sheetState.currentSpellSlots);
    setCurrentExtraResources(sheetState.currentExtraResources);
    setCurrentHitDice(sheetState.currentHitDice);
    setCurrentMoney(sheetState.currentMoney);
    setEditableName(sheetState.editableName);
    setEditableAlignment(sheetState.editableAlignment);
    setEditablePersonalHistory(sheetState.editablePersonalHistory);
    setEditableLanguagesText(sheetState.editableLanguagesText);
    setEditableStatScores(sheetState.editableStatScores);
    setEditableMovement(sheetState.editableMovement);
    setEditableMaxHp(sheetState.editableMaxHp);
    setEditableSpellSlotMaximums(sheetState.editableSpellSlotMaximums);
    setEditableExtraResourceMaximums(sheetState.editableExtraResourceMaximums);
    setEditableSavingThrowProficiencies(
      sheetState.editableSavingThrowProficiencies,
    );
    setEditableSkillProficiencyLevels(
      sheetState.editableSkillProficiencyLevels,
    );
    setEditableSkillProficiencies(sheetState.editableSkillProficiencies);
    setEditableSkillExpertise(sheetState.editableSkillExpertise);

    if (competencyCatalog) {
      const competencyGroups = splitCharacterCompetencies(
        getCharacterCompetencies(data, classCompetencies, competencyCatalog),
        competencyCatalog,
      );
      setEditableWeaponArmorCompetencies(competencyGroups.weaponArmor);
      setEditableToolCompetencies(competencyGroups.tools);
    }

    setSelectedInventoryItem((current) =>
      current
        ? (data.mochila.find((item) => item.id === current.id) ?? null)
        : current,
    );
    setAbilityUsage({});
    setResourceSaveError(null);
  };

  useEffect(() => {
    const authToken = localStorage.getItem("jwtToken");

    if (!authToken) {
      setCharacter(null);
      setLoadError("No se pudo autenticar la hoja del personaje.");
      setIsLoading(false);
      return;
    }

    const abortController = new AbortController();

    const loadCharacter = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const data = await fetchDndCharacterDetail(
          authToken,
          characterId,
          abortController.signal,
        );
        applyCharacterSheetState(data);
        setEditableWeaponArmorCompetencies([]);
        setEditableToolCompetencies([]);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        setCharacter(null);
        setLoadError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar la hoja del personaje.",
        );
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadCharacter();

    return () => {
      abortController.abort();
    };
  }, [characterId]);

  return {
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
    syncCharacterDetail: applyCharacterSheetState,
    tempHp,
  };
}
