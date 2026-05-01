import { describe, expect, it } from "vitest";
import {
  buildEquipmentCatalogSelections,
  buildEquipmentMeta,
  formatEquipmentOption,
  resolveReadableProperties,
} from "../../../screens/personaje/creatednd/utils/equipmentUtils";
import type {
  DndEquipmentOption,
  InitialEquipmentItem,
} from "../../../screens/personaje/types";

const longsword: InitialEquipmentItem = {
  id: 1,
  nombre: "Espada larga",
  descripcion: "",
  formula: "1d8 cortante",
  tipoObjeto: "ARMA",
  indice: "AMCuerpo,Versatil1d10,Ligera,Versatil1d10,CatalogoAMCuerpo",
  cantidad: 1,
};

describe("equipmentUtils", () => {
  it("extrae propiedades legibles y evita duplicados o tags no visibles", () => {
    expect(resolveReadableProperties(longsword)).toEqual([
      "versátil 1d10",
      "ligera",
    ]);
  });

  it("construye metadatos legibles del equipo", () => {
    expect(buildEquipmentMeta(longsword)).toEqual([
      "Daño: 1d8 cortante",
      "Propiedades: versátil 1d10, ligera",
    ]);
    expect(buildEquipmentMeta(null)).toEqual([]);
  });

  it("formatea opciones especiales como dinero y cantidades", () => {
    const gold: DndEquipmentOption = {
      id: "gold",
      etiqueta: "Piezas de oro",
      cantidad: 15,
      objeto: { ...longsword, nombre: "Piezas de oro", formula: null },
      catalogo: null,
      opcionesCatalogo: [],
    };
    const daggers: DndEquipmentOption = {
      id: "daggers",
      etiqueta: "Dos dagas",
      cantidad: 2,
      objeto: { ...longsword, nombre: "Daga", formula: "1d4 perforante" },
      catalogo: null,
      opcionesCatalogo: [],
    };

    expect(formatEquipmentOption(gold)).toBe("15 PO");
    expect(formatEquipmentOption(daggers)).toBe("2 x Daga");
  });

  it("genera selecciones de catálogo según la cantidad", () => {
    const onePick = buildEquipmentCatalogSelections("class:weapons", {
      cantidad: 1,
      opcionesCatalogo: [longsword],
    });
    const twoPicks = buildEquipmentCatalogSelections("class:weapons", {
      cantidad: 2,
      opcionesCatalogo: [longsword],
    });

    expect(onePick).toEqual([{ key: "class:weapons", index: 0 }]);
    expect(twoPicks).toEqual([
      { key: "class:weapons:0", index: 0 },
      { key: "class:weapons:1", index: 1 },
    ]);
  });
});
