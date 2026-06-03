import { describe, expect, it } from "vitest";
import {
  clampNumber,
  buildEquipmentTag,
  buildRandomTable,
  buildStaticText,
} from "../../../screens/campaign/components/MorkBorgEnemyFormUtils";

describe("MorkBorgEnemyFormUtils", () => {
  describe("clampNumber", () => {
    it("retorna el valor cuando está dentro del rango", () => {
      expect(clampNumber(5, 0, 10)).toBe(5);
    });

    it("clampea al mínimo cuando es menor", () => {
      expect(clampNumber(-5, 0, 10)).toBe(0);
    });

    it("clampea al máximo cuando es mayor", () => {
      expect(clampNumber(15, 0, 10)).toBe(10);
    });

    it("acepta exactamente el límite inferior", () => {
      expect(clampNumber(0, 0, 10)).toBe(0);
    });

    it("acepta exactamente el límite superior", () => {
      expect(clampNumber(10, 0, 10)).toBe(10);
    });
  });

  describe("buildEquipmentTag", () => {
    it("retorna tag de arma para ARMA", () => {
      expect(buildEquipmentTag("ARMA")).toBe("MORK_BORG,MBEnemyArma");
    });

    it("retorna tag de armadura para ARMADURA", () => {
      expect(buildEquipmentTag("ARMADURA")).toBe("MORK_BORG,MBEnemyArmadura");
    });
  });

  describe("buildRandomTable", () => {
    it("construye tabla con dados basado en número de entradas", () => {
      const table = buildRandomTable("tagKey", "Nombre", [
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
      ]);
      expect(table.dados).toBe("d6");
      expect(table.tagKey).toBe("tagKey");
      expect(table.nombre).toBe("Nombre");
      expect(table.opciones).toEqual(["a", "b", "c", "d", "e", "f"]);
    });

    it("crea tabla de d4 con 4 entradas", () => {
      const table = buildRandomTable("k", "n", ["1", "2", "3", "4"]);
      expect(table.dados).toBe("d4");
    });
  });

  describe("buildStaticText", () => {
    it("retorna primer elemento si existe", () => {
      expect(buildStaticText(["primero", "segundo"])).toBe("primero");
    });

    it("retorna Nada para array vacío", () => {
      expect(buildStaticText([])).toBe("Nada");
    });
  });
});
