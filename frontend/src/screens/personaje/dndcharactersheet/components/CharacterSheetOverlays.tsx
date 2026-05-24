import { useState } from "react";
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
import { getExperienceProgress } from "../utils/characterCore";
import { resolveCharacterFormula } from "../utils/characterAbilities";
import CharacterDetailModal from "./CharacterDetailModal";
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
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

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

      {isDeleteCharacterConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/20 bg-zinc-900 p-6 shadow-2xl">
            <p className="mb-1 text-base font-bold text-white">
              ¿Borrar personaje?
            </p>
            <p className="mb-4 text-sm text-white/70">
              Esta acción es{" "}
              <span className="font-semibold text-red-400">
                permanente e irreversible
              </span>
              . Escribe{" "}
              <span className="font-mono font-bold text-white">borrar</span>{" "}
              para confirmar.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="borrar"
              className="mb-4 h-10 w-full rounded-xl border border-white/20 bg-black/40 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-red-400/60"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onSetDeleteCharacterConfirmOpen(false);
                  setDeleteConfirmText("");
                }}
                className="flex-1 rounded-xl border border-white/20 bg-white/5 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting || deleteConfirmText !== "borrar"}
                onClick={() => {
                  setIsDeleting(true);
                  void onDeleteCharacter().finally(() => {
                    setIsDeleting(false);
                    setDeleteConfirmText("");
                  });
                }}
                className="flex-1 rounded-xl border border-red-500/50 bg-red-900/30 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-900/50 disabled:opacity-40"
              >
                {isDeleting ? "Borrando…" : "Borrar"}
              </button>
            </div>
          </div>
        </div>
      )}

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
