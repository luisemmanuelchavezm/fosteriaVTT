import type { CharacterInventoryItemResponse } from "../../../utils/dndApi";
import { InventoryRows } from "./shared";

interface InventoryTabProps {
  equipmentItems: CharacterInventoryItemResponse[];
  additionalItems: CharacterInventoryItemResponse[];
  onToggleInventoryEquip: (itemId: number, equipped: boolean) => void;
  onOpenInventoryDetails: (item: CharacterInventoryItemResponse) => void;
  onOpenAddInventory: () => void;
}

export default function InventoryTab({
  equipmentItems,
  additionalItems,
  onToggleInventoryEquip,
  onOpenInventoryDetails,
  onOpenAddInventory,
}: InventoryTabProps) {
  return (
    <div className="mt-5 space-y-6">
      <InventoryRows
        title="Equipamiento"
        items={equipmentItems}
        emptyMessage="No hay equipamiento cargado para este personaje."
        onToggleInventoryEquip={onToggleInventoryEquip}
        onOpenInventoryDetails={onOpenInventoryDetails}
      />
      <InventoryRows
        title="Objetos adicionales"
        items={additionalItems}
        emptyMessage="No hay objetos adicionales cargados para este personaje."
        onToggleInventoryEquip={onToggleInventoryEquip}
        onOpenInventoryDetails={onOpenInventoryDetails}
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onOpenAddInventory}
          className="rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-100"
        >
          + Añadir nuevo objeto
        </button>
      </div>
    </div>
  );
}
