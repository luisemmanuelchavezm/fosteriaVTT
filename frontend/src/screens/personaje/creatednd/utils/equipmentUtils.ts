import type { DndEquipmentOption, InitialEquipmentItem } from "../types";

const TAGS_NO_PROPIEDAD = new Set([
  "AMCuerpo",
  "AMRango",
  "ASCuerpo",
  "ASRango",
  "ASimple",
]);

const ETIQUETAS_PROPIEDAD: Record<string, string> = {
  ADosManos: "a dos manos",
  Alcance: "alcance",
  "Alcance5/15": "alcance 5/15",
  "Alcance20/60": "alcance 20/60",
  "Alcance25/100": "alcance 25/100",
  "Alcance30/120": "alcance 30/120",
  "Alcance80/320": "alcance 80/320",
  "Alcance100/400": "alcance 100/400",
  "Alcance150/600": "alcance 150/600",
  Arrojadiza: "arrojadiza",
  Especial: "especial",
  Ligera: "ligera",
  Municion: "munición",
  Pesada: "pesada",
  Recarga: "recarga",
  Sutil: "sutil",
  Versatil1d8: "versátil 1d8",
  Versatil1d10: "versátil 1d10",
};

function parseIndiceEntries(indice: string | null | undefined) {
  return (indice ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function resolveReadableProperties(item: InitialEquipmentItem) {
  const readableProperties = parseIndiceEntries(item.indice)
    .filter((entry) => !entry.includes(";"))
    .filter((entry) => !entry.startsWith("Catalogo"))
    .filter((entry) => !entry.startsWith("C") && !entry.startsWith("T"))
    .filter((entry) => !TAGS_NO_PROPIEDAD.has(entry))
    .map((entry) => ETIQUETAS_PROPIEDAD[entry] ?? null)
    .filter((entry): entry is string => Boolean(entry));

  return Array.from(new Set(readableProperties));
}

export function buildEquipmentMeta(
  item: InitialEquipmentItem | null | undefined,
) {
  if (!item) {
    return [];
  }

  const parts: string[] = [];

  if (item.formula) {
    parts.push(`Daño: ${item.formula}`);
  }

  const properties = resolveReadableProperties(item);

  if (properties.length > 0) {
    parts.push(`Propiedades: ${properties.join(", ")}`);
  }

  return parts;
}

export function formatEquipmentOption(option: DndEquipmentOption) {
  const itemName = option.objeto?.nombre ?? option.etiqueta;

  if (itemName === "Piezas de oro") {
    return `${option.cantidad} PO`;
  }

  const quantityLabel = option.cantidad > 1 ? `${option.cantidad} x ` : "";
  return `${quantityLabel}${itemName}`;
}

export function buildEquipmentCatalogSelectionKeys(
  selectionKey: string,
  option: Pick<DndEquipmentOption, "cantidad" | "opcionesCatalogo">,
) {
  if (!option.opcionesCatalogo.length) {
    return [];
  }

  const amount = Math.max(1, option.cantidad ?? 1);
  if (amount === 1) {
    return [selectionKey];
  }

  return Array.from(
    { length: amount },
    (_, index) => `${selectionKey}:${index}`,
  );
}

export function buildEquipmentCatalogSelections(
  selectionKey: string,
  option: Pick<DndEquipmentOption, "cantidad" | "opcionesCatalogo">,
) {
  return buildEquipmentCatalogSelectionKeys(selectionKey, option).map(
    (key, index) => ({ key, index }),
  );
}
