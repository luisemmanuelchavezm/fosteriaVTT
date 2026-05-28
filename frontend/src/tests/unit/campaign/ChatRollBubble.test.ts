import { describe, expect, it } from "vitest";
import {
  serializeRollMessage,
  parseRollMessage,
} from "../../../screens/campaign/components/ChatRollBubble";

describe("serializeRollMessage", () => {
  it("serializa un mensaje de tirada básico", () => {
    const json = serializeRollMessage("Ataque", [15], 3, 18);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    expect(parsed.__type).toBe("roll");
    expect(parsed.title).toBe("Ataque");
    expect(parsed.diceValues).toEqual([15]);
    expect(parsed.modifier).toBe(3);
    expect(parsed.total).toBe(18);
  });

  it("incluye struck si se pasa como true", () => {
    const json = serializeRollMessage("Crítico", [20], 5, 25, true);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    expect(parsed.struck).toBe(true);
  });

  it("no incluye struck si no se pasa", () => {
    const json = serializeRollMessage("Daño", [6], 0, 6);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    expect(parsed.struck).toBeUndefined();
  });

  it("incluye expression si se pasa", () => {
    const json = serializeRollMessage("Hechizo", [4, 3], 2, 9, false, "2d6+2");
    const parsed = JSON.parse(json) as Record<string, unknown>;
    expect(parsed.expression).toBe("2d6+2");
  });

  it("no incluye expression si no se pasa", () => {
    const json = serializeRollMessage("Defensa", [10], 0, 10);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    expect(parsed.expression).toBeUndefined();
  });

  it("serializa múltiples dados", () => {
    const json = serializeRollMessage("Daño múltiple", [3, 5, 6], 4, 18);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    expect(parsed.diceValues).toEqual([3, 5, 6]);
  });
});

describe("parseRollMessage", () => {
  it("parsea correctamente un mensaje de tirada válido", () => {
    const json = serializeRollMessage("Ataque", [12], 3, 15);
    const result = parseRollMessage(json);
    expect(result).not.toBeNull();
    expect(result!.title).toBe("Ataque");
    expect(result!.diceValues).toEqual([12]);
    expect(result!.modifier).toBe(3);
    expect(result!.total).toBe(15);
  });

  it("retorna null para mensajes que no empiezan con {", () => {
    expect(parseRollMessage("Hola mundo")).toBeNull();
  });

  it("retorna null para JSON sin __type roll", () => {
    expect(
      parseRollMessage(JSON.stringify({ __type: "text", title: "Hi" })),
    ).toBeNull();
  });

  it("retorna null si falta title", () => {
    const bad = JSON.stringify({
      __type: "roll",
      diceValues: [5],
      modifier: 0,
      total: 5,
    });
    expect(parseRollMessage(bad)).toBeNull();
  });

  it("retorna null si diceValues no es array", () => {
    const bad = JSON.stringify({
      __type: "roll",
      title: "X",
      diceValues: "5",
      modifier: 0,
      total: 5,
    });
    expect(parseRollMessage(bad)).toBeNull();
  });

  it("retorna null para JSON inválido", () => {
    expect(parseRollMessage("{invalid json")).toBeNull();
  });

  it("parsea struck correctamente", () => {
    const json = serializeRollMessage("Crítico", [20], 5, 25, true);
    const result = parseRollMessage(json);
    expect(result!.struck).toBe(true);
  });

  it("parsea struck como false cuando es false", () => {
    const json = serializeRollMessage("Normal", [8], 2, 10, false);
    const result = parseRollMessage(json);
    expect(result!.struck).toBe(false);
  });

  it("parsea expression cuando está presente", () => {
    const json = serializeRollMessage("Hechizo", [4, 4], 3, 11, false, "2d6+3");
    const result = parseRollMessage(json);
    expect(result!.expression).toBe("2d6+3");
  });
});
