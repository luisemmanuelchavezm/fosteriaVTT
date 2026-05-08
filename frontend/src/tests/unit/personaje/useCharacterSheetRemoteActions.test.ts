import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCharacterSheetRemoteActions } from "../../../screens/personaje/dndcharactersheet/hooks/useCharacterSheetRemoteActions";

vi.mock("../../../screens/personaje/utils/dndApi", () => ({
  addDndCharacterAbility: vi.fn(),
  addDndCharacterInventoryItem: vi.fn(),
  deleteDndCharacter: vi.fn(),
  deleteDndCharacterAbility: vi.fn(),
  deleteDndCharacterInventoryItem: vi.fn(),
  levelDownDndCharacter: vi.fn(),
  levelUpDndCharacter: vi.fn(),
  updateDndCharacterExperience: vi.fn(),
  updateDndCharacterInventoryItem: vi.fn(),
  updateDndCharacterSheet: vi.fn(),
}));

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
} from "../../../screens/personaje/utils/dndApi";

const TOKEN = "test-token";

function makeCharacter(id = 1) {
  return { id, nombre: "Theron" } as never;
}

function useTestOpts(
  overrides: Partial<Parameters<typeof useCharacterSheetRemoteActions>[0]> = {},
) {
  return useCharacterSheetRemoteActions({
    character: makeCharacter(),
    currentExtraResources: {},
    currentSpellSlots: {},
    editableAlignment: "",
    editableExtraResourceMaximums: {},
    editableLanguagesText: "",
    editableMaxHp: 20,
    editableMovement: 30,
    editableName: "Theron",
    editablePersonalHistory: "",
    editableSavingThrowProficiencies: [],
    editableSkillExpertise: [],
    editableSkillProficiencies: [],
    editableSpellSlotMaximums: {},
    editableStatScores: {},
    editableToolCompetencies: [],
    editableWeaponArmorCompetencies: [],
    onCloseSpellDetail: vi.fn(),
    onGoCharacters: vi.fn(),
    onSetDeleteCharacterConfirmOpen: vi.fn(),
    onSetEditMode: vi.fn(),
    onSetResourceSaveError: vi.fn(),
    onSetSelectedInventoryItem: vi.fn(),
    onSyncCharacterDetail: vi.fn(),
    selectedInventoryItemId: null,
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("useCharacterSheetRemoteActions", () => {
  describe("handleCancelEdit", () => {
    it("no hace nada si character es null", () => {
      const onSyncCharacterDetail = vi.fn();
      const { handleCancelEdit } = useCharacterSheetRemoteActions({
        ...useTestOpts(),
        character: null,
        onSyncCharacterDetail,
      } as never);
      handleCancelEdit();
      expect(onSyncCharacterDetail).not.toHaveBeenCalled();
    });

    it("llama a onSyncCharacterDetail y onSetEditMode si hay personaje", () => {
      const onSyncCharacterDetail = vi.fn();
      const onSetEditMode = vi.fn();
      const character = makeCharacter();
      const { handleCancelEdit } = useCharacterSheetRemoteActions({
        ...useTestOpts(),
        character,
        onSyncCharacterDetail,
        onSetEditMode,
      } as never);
      handleCancelEdit();
      expect(onSyncCharacterDetail).toHaveBeenCalledWith(character);
      expect(onSetEditMode).toHaveBeenCalledWith(false);
    });
  });

  describe("handleSaveEdit", () => {
    it("no hace nada si no hay token", async () => {
      const { handleSaveEdit } = useTestOpts();
      await handleSaveEdit();
      expect(updateDndCharacterSheet).not.toHaveBeenCalled();
    });

    it("llama a updateDndCharacterSheet y callbacks en caso de exito", async () => {
      localStorage.setItem("jwtToken", TOKEN);
      const updated = makeCharacter(1);
      vi.mocked(updateDndCharacterSheet).mockResolvedValueOnce(
        updated as never,
      );
      const onSyncCharacterDetail = vi.fn();
      const onSetEditMode = vi.fn();
      const onSetResourceSaveError = vi.fn();
      const { handleSaveEdit } = useTestOpts({
        onSyncCharacterDetail,
        onSetEditMode,
        onSetResourceSaveError,
      });
      await handleSaveEdit();
      expect(onSyncCharacterDetail).toHaveBeenCalledWith(updated);
      expect(onSetEditMode).toHaveBeenCalledWith(false);
      expect(onSetResourceSaveError).toHaveBeenCalledWith(null);
    });

    it("llama a onSetResourceSaveError en caso de error", async () => {
      localStorage.setItem("jwtToken", TOKEN);
      vi.mocked(updateDndCharacterSheet).mockRejectedValueOnce(
        new Error("Error al guardar"),
      );
      const onSetResourceSaveError = vi.fn();
      const { handleSaveEdit } = useTestOpts({ onSetResourceSaveError });
      await handleSaveEdit();
      expect(onSetResourceSaveError).toHaveBeenCalledWith("Error al guardar");
    });
  });

  describe("handleToggleInventoryEquip", () => {
    it("no hace nada si no hay token", async () => {
      const { handleToggleInventoryEquip } = useTestOpts();
      await handleToggleInventoryEquip(5, true);
      expect(updateDndCharacterInventoryItem).not.toHaveBeenCalled();
    });

    it("llama a updateDndCharacterInventoryItem con equipado en exito", async () => {
      localStorage.setItem("jwtToken", TOKEN);
      const updated = makeCharacter(1);
      vi.mocked(updateDndCharacterInventoryItem).mockResolvedValueOnce(
        updated as never,
      );
      const onSyncCharacterDetail = vi.fn();
      const { handleToggleInventoryEquip } = useTestOpts({
        onSyncCharacterDetail,
      });
      await handleToggleInventoryEquip(7, true);
      expect(updateDndCharacterInventoryItem).toHaveBeenCalledWith(
        TOKEN,
        1,
        7,
        { equipado: true },
      );
      expect(onSyncCharacterDetail).toHaveBeenCalledWith(updated);
    });

    it("llama a onSetResourceSaveError en caso de error", async () => {
      localStorage.setItem("jwtToken", TOKEN);
      vi.mocked(updateDndCharacterInventoryItem).mockRejectedValueOnce(
        new Error("Error equip"),
      );
      const onSetResourceSaveError = vi.fn();
      const { handleToggleInventoryEquip } = useTestOpts({
        onSetResourceSaveError,
      });
      await handleToggleInventoryEquip(7, false);
      expect(onSetResourceSaveError).toHaveBeenCalledWith("Error equip");
    });
  });

  describe("handleAddInventoryItem", () => {
    it("lanza error si no hay token", async () => {
      const { handleAddInventoryItem } = useTestOpts();
      await expect(
        handleAddInventoryItem({ nombre: "Espada" } as never),
      ).rejects.toThrow();
      expect(addDndCharacterInventoryItem).not.toHaveBeenCalled();
    });

    it("llama a addDndCharacterInventoryItem en caso de exito", async () => {
      localStorage.setItem("jwtToken", TOKEN);
      const updated = makeCharacter(1);
      vi.mocked(addDndCharacterInventoryItem).mockResolvedValueOnce(
        updated as never,
      );
      const onSyncCharacterDetail = vi.fn();
      const { handleAddInventoryItem } = useTestOpts({ onSyncCharacterDetail });
      await handleAddInventoryItem({ nombre: "Espada" } as never);
      expect(onSyncCharacterDetail).toHaveBeenCalledWith(updated);
    });
  });

  describe("handleDeleteSelectedInventoryItem", () => {
    it("no hace nada si no hay token", async () => {
      const { handleDeleteSelectedInventoryItem } = useTestOpts({
        selectedInventoryItemId: 1,
      });
      await handleDeleteSelectedInventoryItem();
      expect(deleteDndCharacterInventoryItem).not.toHaveBeenCalled();
    });

    it("no hace nada si selectedInventoryItemId es null", async () => {
      localStorage.setItem("jwtToken", TOKEN);
      const { handleDeleteSelectedInventoryItem } = useTestOpts({
        selectedInventoryItemId: null,
      });
      await handleDeleteSelectedInventoryItem();
      expect(deleteDndCharacterInventoryItem).not.toHaveBeenCalled();
    });

    it("llama a deleteDndCharacterInventoryItem en caso de exito", async () => {
      localStorage.setItem("jwtToken", TOKEN);
      const updated = makeCharacter(1);
      vi.mocked(deleteDndCharacterInventoryItem).mockResolvedValueOnce(
        updated as never,
      );
      const onSyncCharacterDetail = vi.fn();
      const onSetSelectedInventoryItem = vi.fn();
      const { handleDeleteSelectedInventoryItem } = useTestOpts({
        onSyncCharacterDetail,
        onSetSelectedInventoryItem,
        selectedInventoryItemId: 3,
      });
      await handleDeleteSelectedInventoryItem();
      expect(deleteDndCharacterInventoryItem).toHaveBeenCalledWith(TOKEN, 1, 3);
      expect(onSetSelectedInventoryItem).toHaveBeenCalledWith(null);
    });

    it("llama a onSetResourceSaveError en caso de error", async () => {
      localStorage.setItem("jwtToken", TOKEN);
      vi.mocked(deleteDndCharacterInventoryItem).mockRejectedValueOnce(
        new Error("Error borrar"),
      );
      const onSetResourceSaveError = vi.fn();
      const { handleDeleteSelectedInventoryItem } = useTestOpts({
        onSetResourceSaveError,
        selectedInventoryItemId: 3,
      });
      await handleDeleteSelectedInventoryItem();
      expect(onSetResourceSaveError).toHaveBeenCalledWith("Error borrar");
    });
  });

  describe("handleUpdateSelectedInventoryQuantity", () => {
    it("no hace nada si no hay token", async () => {
      const { handleUpdateSelectedInventoryQuantity } = useTestOpts({
        selectedInventoryItemId: 1,
      });
      await handleUpdateSelectedInventoryQuantity(5);
      expect(updateDndCharacterInventoryItem).not.toHaveBeenCalled();
    });

    it("llama a updateDndCharacterInventoryItem con cantidad", async () => {
      localStorage.setItem("jwtToken", TOKEN);
      const updated = makeCharacter(1);
      vi.mocked(updateDndCharacterInventoryItem).mockResolvedValueOnce(
        updated as never,
      );
      const onSyncCharacterDetail = vi.fn();
      const { handleUpdateSelectedInventoryQuantity } = useTestOpts({
        onSyncCharacterDetail,
        selectedInventoryItemId: 4,
      });
      await handleUpdateSelectedInventoryQuantity(10);
      expect(updateDndCharacterInventoryItem).toHaveBeenCalledWith(
        TOKEN,
        1,
        4,
        { cantidad: 10 },
      );
      expect(onSyncCharacterDetail).toHaveBeenCalledWith(updated);
    });

    it("llama a onSetResourceSaveError en caso de error", async () => {
      localStorage.setItem("jwtToken", TOKEN);
      vi.mocked(updateDndCharacterInventoryItem).mockRejectedValueOnce(
        new Error("Error cantidad"),
      );
      const onSetResourceSaveError = vi.fn();
      const { handleUpdateSelectedInventoryQuantity } = useTestOpts({
        onSetResourceSaveError,
        selectedInventoryItemId: 4,
      });
      await handleUpdateSelectedInventoryQuantity(10);
      expect(onSetResourceSaveError).toHaveBeenCalledWith("Error cantidad");
    });
  });

  describe("handleAddSpell", () => {
    it("lanza error si no hay token", async () => {
      const { handleAddSpell } = useTestOpts();
      await expect(handleAddSpell(99)).rejects.toThrow();
    });

    it("llama a addDndCharacterAbility en caso de exito", async () => {
      localStorage.setItem("jwtToken", TOKEN);
      const updated = makeCharacter(1);
      vi.mocked(addDndCharacterAbility).mockResolvedValueOnce(updated as never);
      const onSyncCharacterDetail = vi.fn();
      const { handleAddSpell } = useTestOpts({ onSyncCharacterDetail });
      await handleAddSpell(99);
      expect(addDndCharacterAbility).toHaveBeenCalledWith(TOKEN, 1, {
        habilidadId: 99,
      });
      expect(onSyncCharacterDetail).toHaveBeenCalledWith(updated);
    });
  });

  describe("handleDeleteSelectedSpell", () => {
    it("no hace nada si no hay token", async () => {
      const { handleDeleteSelectedSpell } = useTestOpts();
      await handleDeleteSelectedSpell({ id: 5 } as never);
      expect(deleteDndCharacterAbility).not.toHaveBeenCalled();
    });

    it("llama a deleteDndCharacterAbility y onCloseSpellDetail en caso de exito", async () => {
      localStorage.setItem("jwtToken", TOKEN);
      const updated = makeCharacter(1);
      vi.mocked(deleteDndCharacterAbility).mockResolvedValueOnce(
        updated as never,
      );
      const onSyncCharacterDetail = vi.fn();
      const onCloseSpellDetail = vi.fn();
      const { handleDeleteSelectedSpell } = useTestOpts({
        onSyncCharacterDetail,
        onCloseSpellDetail,
      });
      await handleDeleteSelectedSpell({ id: 5 } as never);
      expect(deleteDndCharacterAbility).toHaveBeenCalledWith(TOKEN, 1, 5);
      expect(onCloseSpellDetail).toHaveBeenCalled();
    });

    it("llama a onSetResourceSaveError en caso de error", async () => {
      localStorage.setItem("jwtToken", TOKEN);
      vi.mocked(deleteDndCharacterAbility).mockRejectedValueOnce(
        new Error("Error hechizo"),
      );
      const onSetResourceSaveError = vi.fn();
      const { handleDeleteSelectedSpell } = useTestOpts({
        onSetResourceSaveError,
      });
      await handleDeleteSelectedSpell({ id: 5 } as never);
      expect(onSetResourceSaveError).toHaveBeenCalledWith("Error hechizo");
    });
  });

  describe("handleDeleteCharacter", () => {
    it("no hace nada si no hay token", async () => {
      const { handleDeleteCharacter } = useTestOpts();
      await handleDeleteCharacter();
      expect(deleteDndCharacter).not.toHaveBeenCalled();
    });

    it("llama a deleteDndCharacter y onGoCharacters en caso de exito", async () => {
      localStorage.setItem("jwtToken", TOKEN);
      vi.mocked(deleteDndCharacter).mockResolvedValueOnce(undefined);
      const onGoCharacters = vi.fn();
      const onSetDeleteCharacterConfirmOpen = vi.fn();
      const { handleDeleteCharacter } = useTestOpts({
        onGoCharacters,
        onSetDeleteCharacterConfirmOpen,
      });
      await handleDeleteCharacter();
      expect(deleteDndCharacter).toHaveBeenCalledWith(TOKEN, 1);
      expect(onSetDeleteCharacterConfirmOpen).toHaveBeenCalledWith(false);
      expect(onGoCharacters).toHaveBeenCalled();
    });

    it("llama a onSetResourceSaveError en caso de error", async () => {
      localStorage.setItem("jwtToken", TOKEN);
      vi.mocked(deleteDndCharacter).mockRejectedValueOnce(
        new Error("Error eliminar"),
      );
      const onSetResourceSaveError = vi.fn();
      const { handleDeleteCharacter } = useTestOpts({ onSetResourceSaveError });
      await handleDeleteCharacter();
      expect(onSetResourceSaveError).toHaveBeenCalledWith("Error eliminar");
    });
  });

  describe("handleSaveExperience", () => {
    it("lanza error si no hay token", async () => {
      const { handleSaveExperience } = useTestOpts();
      await expect(handleSaveExperience(100)).rejects.toThrow();
    });

    it("llama a updateDndCharacterExperience con experiencia", async () => {
      localStorage.setItem("jwtToken", TOKEN);
      const updated = makeCharacter(1);
      vi.mocked(updateDndCharacterExperience).mockResolvedValueOnce(
        updated as never,
      );
      const onSyncCharacterDetail = vi.fn();
      const { handleSaveExperience } = useTestOpts({ onSyncCharacterDetail });
      await handleSaveExperience(300);
      expect(updateDndCharacterExperience).toHaveBeenCalledWith(TOKEN, 1, {
        experiencia: 300,
      });
      expect(onSyncCharacterDetail).toHaveBeenCalledWith(updated);
    });
  });

  describe("handleSubmitLevelUp", () => {
    it("lanza error si no hay token", async () => {
      const { handleSubmitLevelUp } = useTestOpts();
      await expect(handleSubmitLevelUp({} as never)).rejects.toThrow();
    });

    it("llama a levelUpDndCharacter con el payload", async () => {
      localStorage.setItem("jwtToken", TOKEN);
      const updated = makeCharacter(1);
      vi.mocked(levelUpDndCharacter).mockResolvedValueOnce(updated as never);
      const onSyncCharacterDetail = vi.fn();
      const { handleSubmitLevelUp } = useTestOpts({ onSyncCharacterDetail });
      const payload = { claseId: "picaro", nivel: 2 } as never;
      await handleSubmitLevelUp(payload);
      expect(levelUpDndCharacter).toHaveBeenCalledWith(TOKEN, 1, payload);
      expect(onSyncCharacterDetail).toHaveBeenCalledWith(updated);
    });
  });

  describe("handleLevelDown", () => {
    it("lanza error si no hay token", async () => {
      const { handleLevelDown } = useTestOpts();
      await expect(handleLevelDown("picaro")).rejects.toThrow();
    });

    it("llama a levelDownDndCharacter con el classId", async () => {
      localStorage.setItem("jwtToken", TOKEN);
      const updated = makeCharacter(1);
      vi.mocked(levelDownDndCharacter).mockResolvedValueOnce(updated as never);
      const onSyncCharacterDetail = vi.fn();
      const { handleLevelDown } = useTestOpts({ onSyncCharacterDetail });
      await handleLevelDown("picaro");
      expect(levelDownDndCharacter).toHaveBeenCalledWith(TOKEN, 1, {
        claseId: "picaro",
      });
      expect(onSyncCharacterDetail).toHaveBeenCalledWith(updated);
    });
  });
});
