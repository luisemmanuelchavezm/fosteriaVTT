import type {
  AddDndCharacterInventoryItemRequest,
  CharacterAbilityResponse,
  DndCharacterDetailResponse,
  LevelDownDndCharacterRequest,
  LevelUpDndCharacterRequest,
  UpdateDndCharacterSheetRequest,
} from "../../utils/dndApi";
import {
  addDndCharacterAbility,
  addDndCharacterInventoryItem,
  deleteDndCharacter,
  deleteDndCharacterAbility,
  deleteDndCharacterInventoryItem,
  levelDownDndCharacter,
  levelUpDndCharacter,
  updateDndCharacterExperience,
  updateDndCharacterInventoryItem,
  updateDndCharacterSheet,
} from "../../utils/dndApi";

interface UseCharacterSheetRemoteActionsOptions {
  character: DndCharacterDetailResponse | null;
  currentExtraResources: Record<number, number>;
  currentSpellSlots: Record<number, number>;
  editableAlignment: string;
  editableExtraResourceMaximums: Record<number, number>;
  editableLanguagesText: string;
  editableMaxHp: number;
  editableMovement: number;
  editableName: string;
  editablePersonalHistory: string;
  editableSavingThrowProficiencies: string[];
  editableSkillExpertise: string[];
  editableSkillProficiencies: string[];
  editableSpellSlotMaximums: Record<number, number>;
  editableStatScores: Record<string, number>;
  editableToolCompetencies: string[];
  editableWeaponArmorCompetencies: string[];
  onCloseSpellDetail: () => void;
  onGoCharacters: () => void;
  onSetDeleteCharacterConfirmOpen: (value: boolean) => void;
  onSetEditMode: (value: boolean) => void;
  onSetResourceSaveError: (value: string | null) => void;
  onSetSelectedInventoryItem: (value: null) => void;
  onSyncCharacterDetail: (character: DndCharacterDetailResponse) => void;
  selectedInventoryItemId: number | null;
}

export function useCharacterSheetRemoteActions({
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
  onCloseSpellDetail,
  onGoCharacters,
  onSetDeleteCharacterConfirmOpen,
  onSetEditMode,
  onSetResourceSaveError,
  onSetSelectedInventoryItem,
  onSyncCharacterDetail,
  selectedInventoryItemId,
}: UseCharacterSheetRemoteActionsOptions) {
  const handleCancelEdit = () => {
    if (!character) {
      return;
    }

    onSyncCharacterDetail(character);
    onSetEditMode(false);
  };

  const handleSaveEdit = async () => {
    const authToken = localStorage.getItem("jwtToken");
    if (!authToken || !character) {
      return;
    }

    try {
      const payload: UpdateDndCharacterSheetRequest = {
        nombre: editableName.trim() || character.nombre,
        alineamiento: editableAlignment.trim() || null,
        historiaPersonal: editablePersonalHistory.trim() || null,
        idiomasTexto: editableLanguagesText,
        competenciasArmasArmaduras: editableWeaponArmorCompetencies,
        competenciasHerramientas: editableToolCompetencies,
        estadisticasBase: editableStatScores,
        movimiento: editableMovement,
        vidaMaxima: editableMaxHp,
        espaciosConjuroMaximos: editableSpellSlotMaximums,
        espaciosConjuroActuales: currentSpellSlots,
        recursosExtraMaximos: editableExtraResourceMaximums,
        recursosExtraActuales: currentExtraResources,
        salvacionesCompetentes: editableSavingThrowProficiencies,
        habilidadesCompetentes: editableSkillProficiencies,
        habilidadesConPericia: editableSkillExpertise,
      };
      const updatedCharacter = await updateDndCharacterSheet(
        authToken,
        character.id,
        payload,
      );
      onSyncCharacterDetail(updatedCharacter);
      onSetEditMode(false);
      onSetResourceSaveError(null);
    } catch (error) {
      onSetResourceSaveError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la edición del personaje.",
      );
    }
  };

  const handleToggleInventoryEquip = async (
    itemId: number,
    equipped: boolean,
  ) => {
    const authToken = localStorage.getItem("jwtToken");
    if (!authToken || !character) {
      return;
    }

    try {
      const updatedCharacter = await updateDndCharacterInventoryItem(
        authToken,
        character.id,
        itemId,
        { equipado: equipped },
      );
      onSyncCharacterDetail(updatedCharacter);
      onSetResourceSaveError(null);
    } catch (error) {
      onSetResourceSaveError(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el equipamiento del personaje.",
      );
    }
  };

  const handleAddInventoryItem = async (
    payload: AddDndCharacterInventoryItemRequest,
  ) => {
    const authToken = localStorage.getItem("jwtToken");
    if (!authToken || !character) {
      throw new Error("No se pudo autenticar la hoja del personaje.");
    }
    const updatedCharacter = await addDndCharacterInventoryItem(
      authToken,
      character.id,
      payload,
    );
    onSyncCharacterDetail(updatedCharacter);
    onSetResourceSaveError(null);
  };

  const handleDeleteSelectedInventoryItem = async () => {
    const authToken = localStorage.getItem("jwtToken");
    if (!authToken || !character || selectedInventoryItemId === null) {
      return;
    }
    try {
      const updatedCharacter = await deleteDndCharacterInventoryItem(
        authToken,
        character.id,
        selectedInventoryItemId,
      );
      onSyncCharacterDetail(updatedCharacter);
      onSetSelectedInventoryItem(null);
      onSetResourceSaveError(null);
    } catch (error) {
      onSetResourceSaveError(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el objeto de la mochila.",
      );
    }
  };

  const handleUpdateSelectedInventoryQuantity = async (quantity: number) => {
    const authToken = localStorage.getItem("jwtToken");
    if (!authToken || !character || selectedInventoryItemId === null) {
      return;
    }
    try {
      const updatedCharacter = await updateDndCharacterInventoryItem(
        authToken,
        character.id,
        selectedInventoryItemId,
        { cantidad: quantity },
      );
      onSyncCharacterDetail(updatedCharacter);
      onSetResourceSaveError(null);
    } catch (error) {
      onSetResourceSaveError(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la cantidad del objeto.",
      );
    }
  };

  const handleAddSpell = async (abilityId: number) => {
    const authToken = localStorage.getItem("jwtToken");
    if (!authToken || !character) {
      throw new Error("No se pudo autenticar la hoja del personaje.");
    }
    const updatedCharacter = await addDndCharacterAbility(
      authToken,
      character.id,
      { habilidadId: abilityId },
    );
    onSyncCharacterDetail(updatedCharacter);
    onSetResourceSaveError(null);
  };

  const handleDeleteSelectedSpell = async (spell: CharacterAbilityResponse) => {
    const authToken = localStorage.getItem("jwtToken");
    if (!authToken || !character) {
      return;
    }
    try {
      const updatedCharacter = await deleteDndCharacterAbility(
        authToken,
        character.id,
        spell.id,
      );
      onSyncCharacterDetail(updatedCharacter);
      onCloseSpellDetail();
      onSetResourceSaveError(null);
    } catch (error) {
      onSetResourceSaveError(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el hechizo del personaje.",
      );
    }
  };

  const handleDeleteCharacter = async () => {
    const authToken = localStorage.getItem("jwtToken");
    if (!authToken || !character) {
      return;
    }
    try {
      await deleteDndCharacter(authToken, character.id);
      onSetDeleteCharacterConfirmOpen(false);
      onGoCharacters();
    } catch (error) {
      onSetResourceSaveError(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el personaje.",
      );
    }
  };

  const handleSaveExperience = async (experience: number) => {
    const authToken = localStorage.getItem("jwtToken");
    if (!authToken || !character) {
      throw new Error("No se pudo autenticar la hoja del personaje.");
    }
    const updatedCharacter = await updateDndCharacterExperience(
      authToken,
      character.id,
      { experiencia: experience },
    );
    onSyncCharacterDetail(updatedCharacter);
    onSetResourceSaveError(null);
  };

  const handleSubmitLevelUp = async (payload: LevelUpDndCharacterRequest) => {
    const authToken = localStorage.getItem("jwtToken");
    if (!authToken || !character) {
      throw new Error("No se pudo autenticar la hoja del personaje.");
    }
    const updatedCharacter = await levelUpDndCharacter(
      authToken,
      character.id,
      payload,
    );
    onSyncCharacterDetail(updatedCharacter);
    onSetResourceSaveError(null);
  };

  const handleLevelDown = async (classId: string) => {
    const authToken = localStorage.getItem("jwtToken");
    if (!authToken || !character) {
      throw new Error("No se pudo autenticar la hoja del personaje.");
    }
    const updatedCharacter = await levelDownDndCharacter(
      authToken,
      character.id,
      { claseId: classId } as LevelDownDndCharacterRequest,
    );
    onSyncCharacterDetail(updatedCharacter);
    onSetResourceSaveError(null);
  };

  return {
    handleAddInventoryItem,
    handleAddSpell,
    handleCancelEdit,
    handleDeleteCharacter,
    handleDeleteSelectedInventoryItem,
    handleDeleteSelectedSpell,
    handleLevelDown,
    handleSaveEdit,
    handleSaveExperience,
    handleSubmitLevelUp,
    handleToggleInventoryEquip,
    handleUpdateSelectedInventoryQuantity,
  };
}
