import { describe, expect, it } from "vitest";
import {
  serializeRollMessage,
  parseRollMessage,
} from "../../../screens/campaign/components/chatRollUtils";

describe("serializeRollMessage", () => {
  it("serializa un mensaje de tirada básico", () => {
    const result = serializeRollMessage("Ataque", [4, 6], 3, 13);
    const parsed = JSON.parse(result);

    expect(parsed.__type).toBe("roll");
    expect(parsed.title).toBe("Ataque");
    expect(parsed.diceValues).toEqual([4, 6]);
    expect(parsed.modifier).toBe(3);
    expect(parsed.total).toBe(13);
  });

  it("incluye struck cuando es true", () => {
    const result = serializeRollMessage("Daño", [5], 0, 5, true);
    const parsed = JSON.parse(result);
    expect(parsed.struck).toBe(true);
  });

  it("no incluye struck cuando es false/undefined", () => {
    const result = serializeRollMessage("Daño", [5], 0, 5, false);
    const parsed = JSON.parse(result);
    expect(parsed.struck).toBeUndefined();
  });

  it("incluye expression cuando se proporciona", () => {
    const result = serializeRollMessage("Hechizo", [3], 2, 5, false, "1d6+2");
    const parsed = JSON.parse(result);
    expect(parsed.expression).toBe("1d6+2");
  });

  it("no incluye expression cuando no se proporciona", () => {
    const result = serializeRollMessage("Tirada", [4], 0, 4);
    const parsed = JSON.parse(result);
    expect(parsed.expression).toBeUndefined();
  });
});

describe("parseRollMessage", () => {
  it("parsea un mensaje JSON de tirada válido", () => {
    const json = JSON.stringify({
      __type: "roll",
      title: "Salvación",
      diceValues: [12],
      modifier: 4,
      total: 16,
    });

    const result = parseRollMessage(json);
    expect(result).not.toBeNull();
    expect(result!.title).toBe("Salvación");
    expect(result!.diceValues).toEqual([12]);
    expect(result!.modifier).toBe(4);
    expect(result!.total).toBe(16);
  });

  it("retorna null para mensajes que no empiezan con {", () => {
    expect(parseRollMessage("texto normal")).toBeNull();
    expect(parseRollMessage("hola mundo")).toBeNull();
  });

  it("retorna null si __type no es roll", () => {
    const json = JSON.stringify({ __type: "chat", title: "hola" });
    expect(parseRollMessage(json)).toBeNull();
  });

  it("retorna null si title no es string", () => {
    const json = JSON.stringify({
      __type: "roll",
      title: 42,
      diceValues: [],
      modifier: 0,
      total: 0,
    });
    expect(parseRollMessage(json)).toBeNull();
  });

  it("retorna null si diceValues no es array", () => {
    const json = JSON.stringify({
      __type: "roll",
      title: "X",
      diceValues: "no",
      modifier: 0,
      total: 0,
    });
    expect(parseRollMessage(json)).toBeNull();
  });

  it("retorna null para JSON inválido", () => {
    expect(parseRollMessage("{invalid json")).toBeNull();
  });

  it("mapea struck a true correctamente", () => {
    const json = JSON.stringify({
      __type: "roll",
      title: "T",
      diceValues: [1],
      modifier: 0,
      total: 1,
      struck: true,
    });
    const result = parseRollMessage(json);
    expect(result!.struck).toBe(true);
  });

  it("struck es false cuando no está en el JSON", () => {
    const json = JSON.stringify({
      __type: "roll",
      title: "T",
      diceValues: [1],
      modifier: 0,
      total: 1,
    });
    const result = parseRollMessage(json);
    expect(result!.struck).toBe(false);
  });

  it("incluye expression si está en el JSON", () => {
    const json = JSON.stringify({
      __type: "roll",
      title: "T",
      diceValues: [1],
      modifier: 0,
      total: 1,
      expression: "2d6",
    });
    const result = parseRollMessage(json);
    expect(result!.expression).toBe("2d6");
  });
});
