import { describe, expect, it } from "vitest";
import {
  getExpertiseChoiceConfig,
  splitExpertiseChoices,
  THIEVES_TOOLS_NAME,
} from "../../../screens/personaje/utils/dndExpertise";

describe("getExpertiseChoiceConfig", () => {
  describe("Bardo", () => {
    it("devuelve config de pericia en nivel 3", () => {
      const result = getExpertiseChoiceConfig("Bardo", 3);
      expect(result).not.toBeNull();
      expect(result!.count).toBe(2);
      expect(result!.allowThievesTools).toBe(false);
    });

    it("devuelve config de pericia en nivel 10", () => {
      const result = getExpertiseChoiceConfig("Bardo", 10);
      expect(result).not.toBeNull();
      expect(result!.count).toBe(2);
    });

    it("devuelve null en niveles sin pericia (ej. nivel 1)", () => {
      expect(getExpertiseChoiceConfig("Bardo", 1)).toBeNull();
    });

    it("devuelve null en nivel 5", () => {
      expect(getExpertiseChoiceConfig("Bardo", 5)).toBeNull();
    });
  });

  describe("Picaro", () => {
    it("devuelve config de pericia en nivel 1", () => {
      const result = getExpertiseChoiceConfig("Picaro", 1);
      expect(result).not.toBeNull();
      expect(result!.count).toBe(2);
      expect(result!.allowThievesTools).toBe(true);
    });

    it("devuelve config de pericia en nivel 6", () => {
      const result = getExpertiseChoiceConfig("Picaro", 6);
      expect(result).not.toBeNull();
      expect(result!.count).toBe(2);
      expect(result!.allowThievesTools).toBe(true);
    });

    it("devuelve null en nivel 2", () => {
      expect(getExpertiseChoiceConfig("Picaro", 2)).toBeNull();
    });
  });

  it("devuelve null para clase desconocida", () => {
    expect(getExpertiseChoiceConfig("Guerrero", 1)).toBeNull();
    expect(getExpertiseChoiceConfig(null, 3)).toBeNull();
  });
});

describe("splitExpertiseChoices", () => {
  it("separa habilidades de herramientas de ladron", () => {
    const result = splitExpertiseChoices(["Sigilo", THIEVES_TOOLS_NAME]);
    expect(result.skillChoices).toEqual(["Sigilo"]);
    expect(result.toolChoices).toHaveLength(1);
  });

  it("filtra entradas en blanco", () => {
    const result = splitExpertiseChoices(["Acrobacias", "", "  "]);
    expect(result.skillChoices).toEqual(["Acrobacias"]);
    expect(result.toolChoices).toHaveLength(0);
  });

  it("devuelve listas vacias para array vacio", () => {
    const result = splitExpertiseChoices([]);
    expect(result.skillChoices).toHaveLength(0);
    expect(result.toolChoices).toHaveLength(0);
  });
});
