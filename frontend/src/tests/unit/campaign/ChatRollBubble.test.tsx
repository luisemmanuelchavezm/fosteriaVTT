// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ChatRollBubble } from "../../../screens/campaign/components/ChatRollBubble";
import {
  serializeRollMessage,
  parseRollMessage,
} from "../../../screens/campaign/components/chatRollUtils";

describe("serializeRollMessage", () => {
  it("serializes a basic roll message", () => {
    const json = serializeRollMessage("Ataque", [5, 3], 2, 10);
    const parsed = JSON.parse(json);
    expect(parsed.__type).toBe("roll");
    expect(parsed.title).toBe("Ataque");
    expect(parsed.diceValues).toEqual([5, 3]);
    expect(parsed.modifier).toBe(2);
    expect(parsed.total).toBe(10);
  });

  it("includes struck when true", () => {
    const json = serializeRollMessage("Ataque", [4], 0, 4, true);
    const parsed = JSON.parse(json);
    expect(parsed.struck).toBe(true);
  });

  it("does not include struck when false/undefined", () => {
    const json = serializeRollMessage("Ataque", [4], 0, 4);
    const parsed = JSON.parse(json);
    expect(parsed.struck).toBeUndefined();
  });

  it("includes expression when provided", () => {
    const json = serializeRollMessage("Ataque", [4], 1, 5, false, "1d6+1");
    const parsed = JSON.parse(json);
    expect(parsed.expression).toBe("1d6+1");
  });

  it("does not include expression when not provided", () => {
    const json = serializeRollMessage("Ataque", [4], 1, 5);
    const parsed = JSON.parse(json);
    expect(parsed.expression).toBeUndefined();
  });
});

describe("parseRollMessage", () => {
  it("returns null for plain text messages", () => {
    expect(parseRollMessage("Hola!")).toBeNull();
  });

  it("returns null for JSON without __type:roll", () => {
    expect(
      parseRollMessage(
        '{"__type":"other","title":"x","diceValues":[],"modifier":0,"total":0}',
      ),
    ).toBeNull();
  });

  it("returns null for JSON missing title", () => {
    expect(
      parseRollMessage(
        '{"__type":"roll","diceValues":[],"modifier":0,"total":0}',
      ),
    ).toBeNull();
  });

  it("returns null for JSON missing diceValues array", () => {
    expect(
      parseRollMessage('{"__type":"roll","title":"x","modifier":0,"total":0}'),
    ).toBeNull();
  });

  it("returns null for JSON missing modifier", () => {
    expect(
      parseRollMessage(
        '{"__type":"roll","title":"x","diceValues":[],"total":0}',
      ),
    ).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    expect(parseRollMessage("{invalid json}")).toBeNull();
  });

  it("parses a valid roll message", () => {
    const json = serializeRollMessage("Salvación", [12, 3], 4, 19);
    const result = parseRollMessage(json);
    expect(result).not.toBeNull();
    expect(result!.title).toBe("Salvación");
    expect(result!.diceValues).toEqual([12, 3]);
    expect(result!.modifier).toBe(4);
    expect(result!.total).toBe(19);
  });

  it("parses struck field", () => {
    const json = serializeRollMessage("Ataque", [8], 3, 11, true);
    const result = parseRollMessage(json);
    expect(result!.struck).toBe(true);
  });

  it("parses expression field", () => {
    const json = serializeRollMessage("Ataque", [8], 3, 11, false, "1d8+3");
    const result = parseRollMessage(json);
    expect(result!.expression).toBe("1d8+3");
  });

  it("struck defaults to false when absent", () => {
    const json = serializeRollMessage("Ataque", [4], 0, 4);
    const result = parseRollMessage(json);
    expect(result!.struck).toBe(false);
  });
});

describe("ChatRollBubble", () => {
  it("renders the title", () => {
    render(
      <ChatRollBubble
        title="Salvación contra Veneno"
        diceValues={[10, 5]}
        modifier={3}
        total={18}
      />,
    );
    expect(screen.getByText("Salvación contra Veneno")).toBeInTheDocument();
  });

  it("renders dice values", () => {
    render(
      <ChatRollBubble
        title="Ataque"
        diceValues={[6, 4, 2]}
        modifier={0}
        total={12}
      />,
    );
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders the total", () => {
    render(
      <ChatRollBubble
        title="Ataque"
        diceValues={[10]}
        modifier={2}
        total={12}
      />,
    );
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("renders positive modifier with + sign", () => {
    render(
      <ChatRollBubble
        title="Ataque"
        diceValues={[8]}
        modifier={3}
        total={11}
      />,
    );
    expect(screen.getByText("+3")).toBeInTheDocument();
  });

  it("renders negative modifier without + sign", () => {
    render(
      <ChatRollBubble
        title="Ataque"
        diceValues={[4]}
        modifier={-2}
        total={2}
      />,
    );
    expect(screen.getByText("-2")).toBeInTheDocument();
  });

  it("does not render modifier when modifier is 0", () => {
    render(
      <ChatRollBubble title="Ataque" diceValues={[8]} modifier={0} total={8} />,
    );
    expect(screen.queryByText("+0")).not.toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("renders expression when provided", () => {
    render(
      <ChatRollBubble
        title="Personalizada"
        expression="1d8 + 1d4"
        diceValues={[5, 3]}
        modifier={0}
        total={8}
      />,
    );
    expect(screen.getByText("1d8 + 1d4")).toBeInTheDocument();
  });

  it("does not render expression element when expression is absent", () => {
    render(
      <ChatRollBubble title="Ataque" diceValues={[5]} modifier={0} total={5} />,
    );
    // Expression element should not appear when not provided
    expect(screen.queryByText("1d8 + 1d4")).not.toBeInTheDocument();
  });

  it("renders 'Total' label", () => {
    render(
      <ChatRollBubble title="Test" diceValues={[10]} modifier={0} total={10} />,
    );
    expect(screen.getByText("Total")).toBeInTheDocument();
  });
});
