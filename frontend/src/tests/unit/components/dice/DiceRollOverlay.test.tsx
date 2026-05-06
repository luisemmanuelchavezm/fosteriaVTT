// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DiceRollOverlay from "../../../../components/dice/DiceRollOverlay";

describe("lanzamiento de dados - DiceRollOverlay", () => {
  it("muestra el estado de tirada, errores y resumen de resultado", () => {
    render(
      <DiceRollOverlay
        diceBoxHostId="dice-host"
        diceBoxError="No se pudo inicializar Dice-Box"
        isRolling
        summary={{
          id: 1,
          title: "Ataque de espada",
          expression: "1d20 + 5",
          diceValues: [17],
          modifier: 5,
          modifierDisplay: "+5",
          totalLabel: "Total",
          total: 22,
        }}
      />,
    );

    expect(document.getElementById("dice-host")).toBeInTheDocument();
    expect(screen.getByText("Tirando dados")).toBeInTheDocument();
    expect(
      screen.getByText("No se pudo inicializar Dice-Box"),
    ).toBeInTheDocument();
    expect(screen.getByText("Ataque de espada")).toBeInTheDocument();
    expect(screen.getByText("1d20 + 5")).toBeInTheDocument();
    expect(screen.getByText("17")).toBeInTheDocument();
    expect(screen.getByText("+5")).toBeInTheDocument();
    expect(screen.getByText("22")).toBeInTheDocument();
  });
});
