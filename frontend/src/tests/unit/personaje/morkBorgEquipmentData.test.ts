import { describe, expect, it } from "vitest";
import {
  getMbWeaponByIdx,
  getMbArmorByNivel,
  getMbArmorByRoll,
  getMbPresagiosExpression,
  getMbTableEntry,
  getMbPlataExpression,
  getMbComidaExpression,
  getMbArmaExpression,
  getMbArmaduraExpression,
  MB_SIN_CLASE_CONTAINER_TABLE,
  MB_SIN_CLASE_ITEM_TABLE_1,
  MB_SIN_CLASE_ITEM_TABLE_2,
  MB_WEAPONS,
  MB_ARMORS,
} from "../../../screens/personaje/createmorkborg/utils/morkBorgEquipmentData";

describe("morkBorgEquipmentData - getMbWeaponByIdx", () => {
  it("retorna el arma con idx=1", () => {
    const w = getMbWeaponByIdx(1);
    expect(w).not.toBeNull();
    expect(w!.nombre).toBe("Fémur");
  });

  it("retorna null para idx inexistente", () => {
    expect(getMbWeaponByIdx(99)).toBeNull();
  });

  it("retorna todos los 10 armas correctamente", () => {
    for (let i = 1; i <= 10; i++) {
      expect(getMbWeaponByIdx(i)).not.toBeNull();
    }
  });
});

describe("morkBorgEquipmentData - getMbArmorByNivel", () => {
  it("retorna armadura ligera para nivel 1", () => {
    const a = getMbArmorByNivel(1);
    expect(a).not.toBeNull();
    expect(a!.nombre).toBe("Armadura ligera");
  });

  it("retorna null para nivel inexistente", () => {
    expect(getMbArmorByNivel(99)).toBeNull();
  });
});

describe("morkBorgEquipmentData - getMbArmorByRoll", () => {
  it("retorna null para roll 1 (Nada)", () => {
    expect(getMbArmorByRoll(1)).toBeNull();
  });

  it("retorna null para roll 0 o menos", () => {
    expect(getMbArmorByRoll(0)).toBeNull();
  });

  it("retorna armadura ligera para roll 2", () => {
    const a = getMbArmorByRoll(2);
    expect(a).not.toBeNull();
    expect(a!.nivel).toBe(1);
  });

  it("retorna armadura media para roll 3", () => {
    const a = getMbArmorByRoll(3);
    expect(a).not.toBeNull();
    expect(a!.nivel).toBe(2);
  });

  it("retorna armadura pesada para roll 4", () => {
    const a = getMbArmorByRoll(4);
    expect(a).not.toBeNull();
    expect(a!.nivel).toBe(3);
  });
});

describe("morkBorgEquipmentData - getMbPresagiosExpression", () => {
  it("retorna 1d4 para ermitano-esoterico", () => {
    expect(getMbPresagiosExpression("ermitano-esoterico")).toBe("1d4");
  });

  it("retorna 1d4 para sacerdote-hereje", () => {
    expect(getMbPresagiosExpression("sacerdote-hereje")).toBe("1d4");
  });

  it("retorna 1d2 para otras clases", () => {
    expect(getMbPresagiosExpression("escoria-alcantarillas")).toBe("1d2");
    expect(getMbPresagiosExpression(undefined)).toBe("1d2");
    expect(getMbPresagiosExpression("desertor-colmilludo")).toBe("1d2");
  });
});

describe("morkBorgEquipmentData - getMbTableEntry", () => {
  it("encuentra una entrada por result", () => {
    const entry = getMbTableEntry(MB_SIN_CLASE_CONTAINER_TABLE, 3);
    expect(entry).not.toBeNull();
    expect(entry!.nombre).toBe("Mochila");
  });

  it("retorna null si result no existe", () => {
    expect(getMbTableEntry(MB_SIN_CLASE_CONTAINER_TABLE, 99)).toBeNull();
  });

  it("encuentra entrada de result 1 (Nada)", () => {
    const entry = getMbTableEntry(MB_SIN_CLASE_CONTAINER_TABLE, 1);
    expect(entry).not.toBeNull();
    expect(entry!.nombre).toBeNull();
  });

  it("funciona con la tabla de items 1", () => {
    const entry = getMbTableEntry(MB_SIN_CLASE_ITEM_TABLE_1, 1);
    expect(entry).not.toBeNull();
    expect(entry!.nombre).toBe("Cuerda");
  });

  it("funciona con la tabla de items 2", () => {
    const entry = getMbTableEntry(MB_SIN_CLASE_ITEM_TABLE_2, 1);
    expect(entry).not.toBeNull();
    expect(entry!.nombre).toBe("Elixir de vida");
  });
});

describe("morkBorgEquipmentData - getMbPlataExpression", () => {
  it("retorna 1d6 para escoria-alcantarillas", () => {
    expect(getMbPlataExpression("escoria-alcantarillas")).toBe("1d6");
  });

  it("retorna 1d6 para ermitano-esoterico", () => {
    expect(getMbPlataExpression("ermitano-esoterico")).toBe("1d6");
  });

  it("retorna 3d6 para sacerdote-hereje", () => {
    expect(getMbPlataExpression("sacerdote-hereje")).toBe("3d6");
  });

  it("retorna 4d6 para realeza-desgracia", () => {
    expect(getMbPlataExpression("realeza-desgracia")).toBe("4d6");
  });

  it("retorna 2d6 por defecto", () => {
    expect(getMbPlataExpression("desertor-colmilludo")).toBe("2d6");
    expect(getMbPlataExpression("sin-clase")).toBe("2d6");
    expect(getMbPlataExpression("herborista-ocultista")).toBe("2d6");
    expect(getMbPlataExpression(undefined)).toBe("2d6");
  });
});

describe("morkBorgEquipmentData - getMbComidaExpression", () => {
  it("siempre retorna 1d4", () => {
    expect(getMbComidaExpression()).toBe("1d4");
  });
});

describe("morkBorgEquipmentData - getMbArmaExpression", () => {
  it("retorna 1d6 para escoria-alcantarillas", () => {
    expect(getMbArmaExpression("escoria-alcantarillas")).toBe("1d6");
  });

  it("retorna 1d6 para herborista-ocultista", () => {
    expect(getMbArmaExpression("herborista-ocultista")).toBe("1d6");
  });

  it("retorna 1d4 para ermitano-esoterico", () => {
    expect(getMbArmaExpression("ermitano-esoterico")).toBe("1d4");
  });

  it("retorna 1d8 para realeza-desgracia", () => {
    expect(getMbArmaExpression("realeza-desgracia")).toBe("1d8");
  });

  it("retorna 1d8 para sacerdote-hereje", () => {
    expect(getMbArmaExpression("sacerdote-hereje")).toBe("1d8");
  });

  it("retorna 1d10 por defecto", () => {
    expect(getMbArmaExpression("desertor-colmilludo")).toBe("1d10");
    expect(getMbArmaExpression("sin-clase")).toBe("1d10");
    expect(getMbArmaExpression(undefined)).toBe("1d10");
  });
});

describe("morkBorgEquipmentData - getMbArmaduraExpression", () => {
  it("retorna 1d2 para escoria-alcantarillas", () => {
    expect(getMbArmaduraExpression("escoria-alcantarillas")).toBe("1d2");
  });

  it("retorna 1d2 para ermitano-esoterico", () => {
    expect(getMbArmaduraExpression("ermitano-esoterico")).toBe("1d2");
  });

  it("retorna 1d2 para herborista-ocultista", () => {
    expect(getMbArmaduraExpression("herborista-ocultista")).toBe("1d2");
  });

  it("retorna 1d4 para realeza-desgracia", () => {
    expect(getMbArmaduraExpression("realeza-desgracia")).toBe("1d4");
  });

  it("retorna 1d4 por defecto", () => {
    expect(getMbArmaduraExpression("desertor-colmilludo")).toBe("1d4");
    expect(getMbArmaduraExpression("sin-clase")).toBe("1d4");
    expect(getMbArmaduraExpression(undefined)).toBe("1d4");
  });
});

describe("morkBorgEquipmentData - tablas", () => {
  it("MB_SIN_CLASE_CONTAINER_TABLE tiene 6 entradas", () => {
    expect(MB_SIN_CLASE_CONTAINER_TABLE).toHaveLength(6);
  });

  it("MB_SIN_CLASE_ITEM_TABLE_1 tiene 12 entradas", () => {
    expect(MB_SIN_CLASE_ITEM_TABLE_1).toHaveLength(12);
  });

  it("MB_SIN_CLASE_ITEM_TABLE_2 tiene 12 entradas", () => {
    expect(MB_SIN_CLASE_ITEM_TABLE_2).toHaveLength(12);
  });

  it("MB_WEAPONS tiene 10 armas", () => {
    expect(MB_WEAPONS).toHaveLength(10);
  });

  it("MB_ARMORS tiene al menos 3 armaduras", () => {
    expect(MB_ARMORS.length).toBeGreaterThanOrEqual(3);
  });
});
