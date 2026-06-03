import type { ObjectCatalogResponse } from "../../utils/dndApi";
import { MB_WEAPONS } from "../../createmorkborg/utils/morkBorgUtils";

export interface CustomDiePart {
  count: string;
  sides: string;
}

export type CustomObjectType = "ARMA" | "ARMADURA" | "OTROS";

export interface MbCatalogItem extends ObjectCatalogResponse {
  fallback?: boolean;
}

export function hasMbTag(tags: string | null | undefined) {
  if (!tags) return false;
  return tags.split(",").some((tag) => tag.trim() === "MORK_BORG");
}

export function isVisibleMbCatalogItem(
  item: ObjectCatalogResponse,
  typeFilter: string,
) {
  if (!hasMbTag(item.tags)) return false;
  if (typeFilter === "OTROS") {
    return item.tipoObjeto !== "ARMA" && item.tipoObjeto !== "ARMADURA";
  }
  return true;
}

export function buildMbCustomIndice(customType: CustomObjectType) {
  if (customType === "ARMA") return "MORK_BORG,Arma,MorkBorgCustom";
  if (customType === "ARMADURA") return "MORK_BORG,Armadura,MorkBorgCustom";
  return "MORK_BORG,Miscelaneo,MorkBorgCustom";
}

export function normalizeCatalogName(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
}

export function buildMbWeaponFallbackItems(
  existingItems: ObjectCatalogResponse[],
  search: string,
): MbCatalogItem[] {
  const normalizedSearch = normalizeCatalogName(search);
  const existingNames = new Set(
    existingItems.map((item) => normalizeCatalogName(item.nombre)),
  );

  return MB_WEAPONS.filter((weapon) => {
    const normalizedName = normalizeCatalogName(weapon.nombre);
    const matchesSearch =
      !normalizedSearch || normalizedName.includes(normalizedSearch);
    return matchesSearch && !existingNames.has(normalizedName);
  }).map((weapon) => ({
    id: -weapon.idx,
    nombre: weapon.nombre,
    formula: weapon.formula,
    descripcion: "Arma base de Mork Borg.",
    tipoObjeto: "ARMA",
    tags: `MORK_BORG,Arma,ArmaIdx;${weapon.idx}`,
    fallback: true,
  }));
}
