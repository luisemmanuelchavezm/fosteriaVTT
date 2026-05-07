import type {
  CharacterInventoryItemResponse,
  DndCharacterDetailResponse,
} from "../../utils/dndApi";
import { normalizeText } from "./characterText";

const MONEY_ITEMS = {
  ppt: "Piezas de platino",
  po: "Piezas de oro",
  pp: "Piezas de plata",
  pc: "Piezas de cobre",
} as const;

export function getInventoryTagLabel(item: CharacterInventoryItemResponse) {
  return item.tags
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((entry) => {
      const normalized = normalizeText(entry);
      return (
        normalized !== "visibilidadoficial" &&
        normalized !== "visibilidadprivado" &&
        !normalized.startsWith("propietario") &&
        normalized !== "competentepordefecto"
      );
    })
    .map((entry) => {
      const [left, right] = entry.split(";", 2);
      return (right ?? left).replaceAll("_", " ");
    })
    .join(", ");
}

export function getCharacterMoney(
  character: DndCharacterDetailResponse | null,
) {
  const inventory = character?.mochila ?? [];

  return Object.entries(MONEY_ITEMS).reduce<Record<string, number>>(
    (accumulator, [key, label]) => {
      accumulator[key] =
        inventory.find(
          (item) => normalizeText(item.nombre) === normalizeText(label),
        )?.cantidad ?? 0;
      return accumulator;
    },
    { ppt: 0, po: 0, pp: 0, pc: 0 },
  );
}
