import { describe, expect, it } from "vitest";
import {
  getMbStatExpression,
  mbUsesDropLowest,
  getMbModifier,
  getMbHpDice,
  MORK_BORG_STATS,
  MORK_BORG_CREATION_PHASES,
} from "../../../screens/personaje/createmorkborg/utils/morkBorgStats";

describe("morkBorgStats", () => {
  describe("MORK_BORG_STATS", () => {
    it("contiene las 4 estadísticas esperadas", () => {
      expect(MORK_BORG_STATS).toHaveLength(4);
      const ids = MORK_BORG_STATS.map((s) => s.id);
      expect(ids).toContain("fuerza");
      expect(ids).toContain("agilidad");
      expect(ids).toContain("presencia");
      expect(ids).toContain("resistencia");
    });
  });

  describe("MORK_BORG_CREATION_PHASES", () => {
    it("contiene las 4 fases", () => {
      expect(MORK_BORG_CREATION_PHASES).toHaveLength(4);
      expect(MORK_BORG_CREATION_PHASES[0].id).toBe("class");
    });
  });

  describe("getMbStatExpression", () => {
    it("devuelve 3d6 sin classId", () => {
      expect(getMbStatExpression(undefined, "fuerza")).toBe("3d6");
    });

    it("devuelve 4d6 para sin-clase", () => {
      expect(getMbStatExpression("sin-clase", "fuerza")).toBe("4d6");
    });

    it("devuelve expresión modificada para desertor-colmilludo/fuerza", () => {
      expect(getMbStatExpression("desertor-colmilludo", "fuerza")).toBe(
        "3d6+2",
      );
    });

    it("devuelve 3d6-1 para desertor-colmilludo/agilidad", () => {
      expect(getMbStatExpression("desertor-colmilludo", "agilidad")).toBe(
        "3d6-1",
      );
    });

    it("devuelve 3d6-2 para escoria-alcantarillas/fuerza", () => {
      expect(getMbStatExpression("escoria-alcantarillas", "fuerza")).toBe(
        "3d6-2",
      );
    });

    it("devuelve 3d6 para escoria-alcantarillas/agilidad (no modificada)", () => {
      expect(getMbStatExpression("escoria-alcantarillas", "agilidad")).toBe(
        "3d6",
      );
    });

    it("devuelve 3d6+2 para ermitano-esoterico/presencia", () => {
      expect(getMbStatExpression("ermitano-esoterico", "presencia")).toBe(
        "3d6+2",
      );
    });

    it("devuelve 3d6+2 para sacerdote-hereje/presencia", () => {
      expect(getMbStatExpression("sacerdote-hereje", "presencia")).toBe(
        "3d6+2",
      );
    });

    it("devuelve 3d6+2 para herborista-ocultista/resistencia", () => {
      expect(getMbStatExpression("herborista-ocultista", "resistencia")).toBe(
        "3d6+2",
      );
    });

    it("devuelve 3d6 para clase desconocida", () => {
      expect(getMbStatExpression("clase-inexistente", "fuerza")).toBe("3d6");
    });
  });

  describe("mbUsesDropLowest", () => {
    it("devuelve true solo para sin-clase", () => {
      expect(mbUsesDropLowest("sin-clase")).toBe(true);
    });

    it("devuelve false para otras clases", () => {
      expect(mbUsesDropLowest("desertor-colmilludo")).toBe(false);
      expect(mbUsesDropLowest(undefined)).toBe(false);
    });
  });

  describe("getMbModifier", () => {
    it("devuelve -3 para valores <= 4", () => {
      expect(getMbModifier(1)).toBe(-3);
      expect(getMbModifier(4)).toBe(-3);
    });

    it("devuelve -2 para 5-6", () => {
      expect(getMbModifier(5)).toBe(-2);
      expect(getMbModifier(6)).toBe(-2);
    });

    it("devuelve -1 para 7-8", () => {
      expect(getMbModifier(7)).toBe(-1);
      expect(getMbModifier(8)).toBe(-1);
    });

    it("devuelve 0 para 9-12", () => {
      expect(getMbModifier(9)).toBe(0);
      expect(getMbModifier(12)).toBe(0);
    });

    it("devuelve 1 para 13-14", () => {
      expect(getMbModifier(13)).toBe(1);
      expect(getMbModifier(14)).toBe(1);
    });

    it("devuelve 2 para 15-16", () => {
      expect(getMbModifier(15)).toBe(2);
      expect(getMbModifier(16)).toBe(2);
    });

    it("devuelve 3 para valores >= 17", () => {
      expect(getMbModifier(17)).toBe(3);
      expect(getMbModifier(20)).toBe(3);
    });
  });

  describe("getMbHpDice", () => {
    it("devuelve 8 sin classId", () => {
      expect(getMbHpDice(undefined)).toBe(8);
    });

    it("devuelve 10 para desertor-colmilludo", () => {
      expect(getMbHpDice("desertor-colmilludo")).toBe(10);
    });

    it("devuelve 6 para escoria-alcantarillas", () => {
      expect(getMbHpDice("escoria-alcantarillas")).toBe(6);
    });

    it("devuelve 4 para ermitano-esoterico", () => {
      expect(getMbHpDice("ermitano-esoterico")).toBe(4);
    });

    it("devuelve 6 para realeza-desgracia", () => {
      expect(getMbHpDice("realeza-desgracia")).toBe(6);
    });

    it("devuelve 8 para sacerdote-hereje", () => {
      expect(getMbHpDice("sacerdote-hereje")).toBe(8);
    });

    it("devuelve 6 para herborista-ocultista", () => {
      expect(getMbHpDice("herborista-ocultista")).toBe(6);
    });

    it("devuelve 8 para clase desconocida", () => {
      expect(getMbHpDice("clase-rara")).toBe(8);
    });
  });
});
