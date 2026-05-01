import DiceRollOverlay from "../../../../components/dice/DiceRollOverlay";
import SpellDetailModal from "../../../../components/spells/SpellDetailModal";
import type { SpellDetailInteractionsController } from "../../utils/useSpellDetailInteractions";
import type {
  AddDndCharacterInventoryItemRequest,
  CharacterAbilityResponse,
  CharacterInventoryItemResponse,
  DndCharacterDetailResponse,
  LevelUpDndCharacterRequest,
} from "../../utils/dndApi";
import { getExperienceProgress, resolveCharacterFormula } from "../utils";
import CharacterDetailModal from "./CharacterDetailModal";
import ConfirmationModal from "./ConfirmationModal";
import InventoryCatalogModal from "./InventoryCatalogModal";
import LevelManagementModal from "./LevelManagementModal";
import LevelUpModal from "./LevelUpModal";
import SpellCatalogModal from "./SpellCatalogModal";

interface CharacterSheetOverlaysProps {
  token: string;
  character: DndCharacterDetailResponse | null;
  classCompetencies: string[];
  totalCharacterLevel: number;
  isEditMode: boolean;
  isInventoryCatalogOpen: boolean;
  isSpellCatalogOpen: boolean;
  isDeleteCharacterConfirmOpen: boolean;
  isLevelManagementOpen: boolean;
  isLevelUpOpen: boolean;
  levelModalMode: "up" | "down";
  selectedPassive: CharacterAbilityResponse | null;
  selectedInventoryItem: CharacterInventoryItemResponse | null;
  spellInteractions: SpellDetailInteractionsController;
  onSetInventoryCatalogOpen: (open: boolean) => void;
  onSetSpellCatalogOpen: (open: boolean) => void;
  onSetDeleteCharacterConfirmOpen: (open: boolean) => void;
  onSetLevelManagementOpen: (open: boolean) => void;
  onSetLevelUpOpen: (open: boolean) => void;
  onSetLevelModalMode: (mode: "up" | "down") => void;
  onSetSelectedPassive: (ability: CharacterAbilityResponse | null) => void;
  onSetSelectedInventoryItem: (
    item: CharacterInventoryItemResponse | null,
  ) => void;
  onDeleteSelectedSpell: (spell: CharacterAbilityResponse) => Promise<void>;
  onDeleteSelectedInventoryItem: () => Promise<void>;
  onUpdateSelectedInventoryQuantity: (quantity: number) => Promise<void>;
  onAddInventoryItem: (
    payload: AddDndCharacterInventoryItemRequest,
  ) => Promise<void>;
  onAddSpell: (abilityId: number) => Promise<void>;
  onDeleteCharacter: () => Promise<void>;
  onSaveExperience: (experience: number) => Promise<void>;
  onSubmitLevelUp: (payload: LevelUpDndCharacterRequest) => Promise<void>;
  onLevelDown: (classId: string) => Promise<void>;
}

export default function CharacterSheetOverlays(
  props: CharacterSheetOverlaysProps,
) {
  const {
    token,
    character,
    classCompetencies,
    totalCharacterLevel,
    isEditMode,
    isInventoryCatalogOpen,
    isSpellCatalogOpen,
    isDeleteCharacterConfirmOpen,
    isLevelManagementOpen,
    isLevelUpOpen,
    levelModalMode,
    selectedPassive,
    selectedInventoryItem,
    spellInteractions,
    onSetInventoryCatalogOpen,
    onSetSpellCatalogOpen,
    onSetDeleteCharacterConfirmOpen,
    onSetLevelManagementOpen,
    onSetLevelUpOpen,
    onSetLevelModalMode,
    onSetSelectedPassive,
    onSetSelectedInventoryItem,
    onDeleteSelectedSpell,
    onDeleteSelectedInventoryItem,
    onUpdateSelectedInventoryQuantity,
    onAddInventoryItem,
    onAddSpell,
    onDeleteCharacter,
    onSaveExperience,
    onSubmitLevelUp,
    onLevelDown,
  } = props;

  return (
    <>
      <DiceRollOverlay
        diceBoxHostId={spellInteractions.diceRoller.diceBoxHostId}
        diceBoxError={spellInteractions.diceRoller.diceBoxError}
        isRolling={spellInteractions.diceRoller.isRolling}
        summary={spellInteractions.diceRoller.summary}
      />

      <SpellDetailModal
        spell={spellInteractions.selectedSpell}
        isOpen={spellInteractions.selectedSpell !== null}
        onClose={spellInteractions.closeSpellDetail}
        onRollExpression={spellInteractions.rollSpellExpression}
        onDelete={isEditMode ? onDeleteSelectedSpell : undefined}
      />

      <CharacterDetailModal
        key={`passive-${selectedPassive?.id ?? "closed"}`}
        isOpen={selectedPassive !== null}
        title={selectedPassive?.nombre ?? ""}
        description={selectedPassive?.descripcion}
        formula={selectedPassive?.formula}
        onClose={() => onSetSelectedPassive(null)}
      />

      <CharacterDetailModal
        key={`inventory-${selectedInventoryItem?.id ?? "closed"}-${selectedInventoryItem?.cantidad ?? "none"}`}
        isOpen={selectedInventoryItem !== null}
        title={selectedInventoryItem?.nombre ?? ""}
        subtitle={selectedInventoryItem?.tipoObjeto ?? null}
        description={selectedInventoryItem?.descripcion}
        formula={
          character && selectedInventoryItem
            ? resolveCharacterFormula(character, selectedInventoryItem.formula)
            : null
        }
        quantity={selectedInventoryItem?.cantidad ?? null}
        deleteLabel="Eliminar objeto"
        onClose={() => onSetSelectedInventoryItem(null)}
        onDelete={onDeleteSelectedInventoryItem}
        onSaveQuantity={onUpdateSelectedInventoryQuantity}
      />

      <InventoryCatalogModal
        token={token}
        isOpen={isInventoryCatalogOpen}
        onClose={() => onSetInventoryCatalogOpen(false)}
        onAddItem={onAddInventoryItem}
      />

      <SpellCatalogModal
        token={token}
        isOpen={isSpellCatalogOpen}
        onClose={() => onSetSpellCatalogOpen(false)}
        onAddSpell={onAddSpell}
      />

      <ConfirmationModal
        isOpen={isDeleteCharacterConfirmOpen}
        title="Eliminar personaje"
        description="El personaje se va a eliminar permanentemente, estas seguro de tu eleccion?"
        confirmLabel="Eliminar personaje"
        cancelLabel="Mantener personaje"
        onCancel={() => onSetDeleteCharacterConfirmOpen(false)}
        onConfirm={() => void onDeleteCharacter()}
      />

      {character ? (
        <LevelManagementModal
          isOpen={isLevelManagementOpen}
          currentXp={character.estadisticas.Experiencia ?? 0}
          nextLevelXp={
            getExperienceProgress(character.clases, character.estadisticas)
              .nextLevelXp
          }
          canLevelDown={totalCharacterLevel > 1}
          onClose={() => onSetLevelManagementOpen(false)}
          onOpenLevelDown={() => {
            onSetLevelManagementOpen(false);
            onSetLevelModalMode("down");
            onSetLevelUpOpen(true);
          }}
          onOpenLevelUp={() => {
            onSetLevelManagementOpen(false);
            onSetLevelModalMode("up");
            onSetLevelUpOpen(true);
          }}
          onSaveExperience={onSaveExperience}
        />
      ) : null}

      {character ? (
        <LevelUpModal
          token={token}
          character={character}
          classCompetencies={classCompetencies}
          isOpen={isLevelUpOpen}
          mode={levelModalMode}
          onClose={() => onSetLevelUpOpen(false)}
          onSubmit={onSubmitLevelUp}
          onLevelDown={onLevelDown}
        />
      ) : null}
    </>
  );
}
