// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import PointBuyMethodSection from "../../../screens/personaje/creatednd/sections/statistics/PointBuyMethodSection";
import StatisticsSummaryGrid from "../../../screens/personaje/creatednd/sections/statistics/StatisticsSummaryGrid";

const baseScores: Record<string, number> = {
  strength: 8,
  dexterity: 12,
  constitution: 14,
  intelligence: 10,
  wisdom: 13,
  charisma: 15,
  fuerza: 8,
  destreza: 12,
  constitucion: 14,
  inteligencia: 10,
  sabiduria: 13,
  carisma: 15,
};

describe("Statistics method sections", () => {
  it("renderiza compra de puntuaciones y permite usar botones +/-", () => {
    const onScoreChange = vi.fn();

    render(
      <PointBuyMethodSection
        pointBuyScores={baseScores}
        remainingPointBuy={12}
        onScoreChange={onScoreChange}
      />,
    );

    expect(screen.getByText("Compra de Puntuaciones")).toBeInTheDocument();
    expect(screen.getByText(/Puntos restantes/i)).toHaveTextContent("12");
    expect(screen.getByText("Coste actual: 0 puntos")).toBeInTheDocument();

    const plusButtons = screen.getAllByRole("button", { name: "+" });
    const minusButtons = screen.getAllByRole("button", { name: "-" });

    fireEvent.click(plusButtons[0]);
    fireEvent.click(minusButtons[1]);

    expect(onScoreChange).toHaveBeenCalledTimes(2);
    expect(onScoreChange).toHaveBeenNthCalledWith(1, expect.any(String), 1);
    expect(onScoreChange).toHaveBeenNthCalledWith(2, expect.any(String), -1);
  });

  it("renderiza resumen en modo custom y muestra errores de campo", () => {
    const onCustomScoreChange = vi.fn();

    render(
      <StatisticsSummaryGrid
        selectedMethod="custom"
        renderStatValue={(statId) =>
          statId === "strength" || statId === "fuerza" ? "15" : "10"
        }
        getStatNumericValue={(statId) =>
          statId === "strength" || statId === "fuerza" ? 15 : 10
        }
        onCustomScoreChange={onCustomScoreChange}
        fieldErrors={{ strength: "Valor inválido", fuerza: "Valor inválido" }}
      />,
    );

    const customInputs = screen.getAllByRole("textbox");
    expect(customInputs.length).toBeGreaterThan(0);

    fireEvent.change(customInputs[0], { target: { value: "16" } });
    expect(onCustomScoreChange).toHaveBeenCalled();
    expect(screen.getAllByText("Valor inválido").length).toBeGreaterThan(0);
  });
});
