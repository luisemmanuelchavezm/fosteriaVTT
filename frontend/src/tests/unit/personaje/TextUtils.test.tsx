// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import {
  readableContentStyle,
  renderInlineFormattedText,
  renderSkillDescription,
} from "../../../screens/personaje/utils/textUtils";

describe("textUtils", () => {
  it("renderiza texto inline con segmentos en negrita", () => {
    render(
      <div>
        {renderInlineFormattedText("Ataque **potente** y preciso", "skill")}
      </div>,
    );

    expect(screen.getByText(/Ataque/)).toBeInTheDocument();
    expect(screen.getByText("potente").tagName).toBe("STRONG");
    expect(screen.getByText(/y preciso/)).toBeInTheDocument();
    expect(readableContentStyle.fontFamily).toContain("Georgia");
  });

  it("renderiza párrafos y listas de descripción con formato", () => {
    render(
      <div>
        {renderSkillDescription(
          "Linea inicial con **énfasis**.\n\n* Primer punto\n* Segundo **detalle**",
          7,
        )}
      </div>,
    );

    expect(screen.getByText(/Linea inicial con/)).toBeInTheDocument();
    expect(screen.getByText("énfasis").tagName).toBe("STRONG");

    const list = screen.getByRole("list");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText("Primer punto")).toBeInTheDocument();
    expect(within(items[1]).getByText("detalle").tagName).toBe("STRONG");
  });
});
