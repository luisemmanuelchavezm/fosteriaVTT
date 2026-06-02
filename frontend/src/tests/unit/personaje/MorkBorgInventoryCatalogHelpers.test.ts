import { describe, expect, it } from "vitest";
import {
  hasMbTag,
  isVisibleMbCatalogItem,
  buildMbCustomIndice,
  normalizeCatalogName,
  buildMbWeaponFallbackItems,
} from "../../../screens/personaje/morkborgcharactersheet/components/MorkBorgInventoryCatalogHelpers";
import type { ObjectCatalogResponse } from "../../../screens/personaje/utils/dndApi";

function makeItem(
  overrides: Partial<ObjectCatalogResponse> = {},
): ObjectCatalogResponse {
  return {
    id: 1,
    nombre: "Item",
    descripcion: "",
    formula: null,
    tipoObjeto: "MISCELANEO",
    tags: "MORK_BORG",
    ...overrides,
  } as unknown as ObjectCatalogResponse;
}

describe("MorkBorgInventoryCatalogHelpers", () => {
  describe("hasMbTag", () => {
    it("retorna true cuando tiene tag MORK_BORG exacto", () => {
      expect(hasMbTag("MORK_BORG,Arma")).toBe(true);
    });

    it("retorna false para tags nulos", () => {
      expect(hasMbTag(null)).toBe(false);
      expect(hasMbTag(undefined)).toBe(false);
      expect(hasMbTag("")).toBe(false);
    });

    it("retorna false si el tag no es exactamente MORK_BORG", () => {
      expect(hasMbTag("NOT_MORK_BORG")).toBe(false);
    });
  });

  describe("isVisibleMbCatalogItem", () => {
    it("retorna false si no tiene tag MORK_BORG", () => {
      const item = makeItem({ tags: "DND" });
      expect(isVisibleMbCatalogItem(item, "ARMA")).toBe(false);
    });

    it("retorna false para OTROS si es ARMA o ARMADURA", () => {
      expect(
        isVisibleMbCatalogItem(makeItem({ tipoObjeto: "ARMA" }), "OTROS"),
      ).toBe(false);
      expect(
        isVisibleMbCatalogItem(makeItem({ tipoObjeto: "ARMADURA" }), "OTROS"),
      ).toBe(false);
    });

    it("retorna true para OTROS si no es ARMA ni ARMADURA", () => {
      expect(
        isVisibleMbCatalogItem(makeItem({ tipoObjeto: "MISCELANEO" }), "OTROS"),
      ).toBe(true);
    });

    it("retorna true para cualquier tipo con filtro no OTROS", () => {
      expect(
        isVisibleMbCatalogItem(makeItem({ tipoObjeto: "ARMA" }), "ARMA"),
      ).toBe(true);
    });
  });

  describe("buildMbCustomIndice", () => {
    it("construye índice para ARMA", () => {
      expect(buildMbCustomIndice("ARMA")).toBe("MORK_BORG,Arma,MorkBorgCustom");
    });

    it("construye índice para ARMADURA", () => {
      expect(buildMbCustomIndice("ARMADURA")).toBe(
        "MORK_BORG,Armadura,MorkBorgCustom",
      );
    });

    it("construye índice para OTROS", () => {
      expect(buildMbCustomIndice("OTROS")).toBe(
        "MORK_BORG,Miscelaneo,MorkBorgCustom",
      );
    });
  });

  describe("normalizeCatalogName", () => {
    it("normaliza acentos y espacios", () => {
      expect(normalizeCatalogName("Espada Rápida")).toBe("espada rapida");
      expect(normalizeCatalogName("Hacha de Güerre")).toBe("hacha de guerre");
    });

    it("convierte a minúsculas", () => {
      expect(normalizeCatalogName("ESPADA")).toBe("espada");
    });
  });

  describe("buildMbWeaponFallbackItems", () => {
    it("retorna armas que no están en existingItems", () => {
      const items = buildMbWeaponFallbackItems([], "");
      expect(items.length).toBeGreaterThan(0);
      expect(items[0].fallback).toBe(true);
      expect(items[0].tipoObjeto).toBe("ARMA");
    });

    it("filtra por búsqueda", () => {
      const all = buildMbWeaponFallbackItems([], "");
      const filtered = buildMbWeaponFallbackItems([], "espada");
      expect(filtered.length).toBeLessThanOrEqual(all.length);
      filtered.forEach((item) => {
        expect(normalizeCatalogName(item.nombre)).toContain("espada");
      });
    });

    it("excluye armas que ya existen", () => {
      const allItems = buildMbWeaponFallbackItems([], "");
      if (allItems.length === 0) return;
      const first = allItems[0];
      const existing = [makeItem({ nombre: first.nombre })];
      const result = buildMbWeaponFallbackItems(existing, "");
      expect(result.find((i) => i.nombre === first.nombre)).toBeUndefined();
    });

    it("tiene ids negativos para items de fallback", () => {
      const items = buildMbWeaponFallbackItems([], "");
      items.forEach((item) => {
        expect(item.id).toBeLessThan(0);
      });
    });
  });
});
