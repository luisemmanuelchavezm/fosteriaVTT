// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import ProgressionTablesBlock from "../../../screens/personaje/creatednd/components/ProgressionTablesBlock";
import type { DndProgressionTable } from "../../../screens/personaje/creatednd/types";

afterEach(() => {
  cleanup();
});

const sampleTable: DndProgressionTable = {
  titulo: "Tabla de Guerrero",
  columnas: ["Nivel", "Bonificador de competencia", "Ataques"],
  filas: [
    ["1", "+2", "1"],
    ["2", "+2", "2"],
  ],
};

describe("ProgressionTablesBlock", () => {
  it("renders nothing when tables array is empty", () => {
    const { container } = render(<ProgressionTablesBlock tables={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders table title and default section heading when provided", () => {
    render(<ProgressionTablesBlock tables={[sampleTable]} />);

    expect(screen.getByText("Tablas de progresion")).toBeInTheDocument();
    expect(screen.getByText("Tabla de Guerrero")).toBeInTheDocument();
  });

  it("renders custom title when title prop is provided", () => {
    render(
      <ProgressionTablesBlock
        tables={[sampleTable]}
        title="Progresión de clase"
      />,
    );

    expect(screen.getByText("Progresión de clase")).toBeInTheDocument();
  });

  it("renders column headers correctly", () => {
    render(<ProgressionTablesBlock tables={[sampleTable]} />);

    expect(screen.getByText("Nivel")).toBeInTheDocument();
    expect(screen.getByText("Bonificador de competencia")).toBeInTheDocument();
    expect(screen.getByText("Ataques")).toBeInTheDocument();
  });

  it("renders row cell values in the table", () => {
    render(<ProgressionTablesBlock tables={[sampleTable]} />);

    expect(screen.getAllByText("+2")).toHaveLength(2);
    const tdCells = document.querySelectorAll("td");
    const firstCell = Array.from(tdCells).find((el) => el.textContent === "1");
    expect(firstCell).toBeTruthy();
  });

  it("renders spell reference buttons in conjuros column", () => {
    const tableWithSpells: DndProgressionTable = {
      titulo: "Hechizos de Bardo",
      columnas: ["Nivel", "Conjuros conocidos"],
      filas: [["1", "Curar heridas, Luz"]],
    };
    const onSpellReferenceClick = vi.fn();

    render(
      <ProgressionTablesBlock
        tables={[tableWithSpells]}
        onSpellReferenceClick={onSpellReferenceClick}
      />,
    );

    expect(screen.getByText("Curar heridas")).toBeInTheDocument();
    expect(screen.getByText("Luz")).toBeInTheDocument();
  });

  it("calls onSpellReferenceClick when a spell reference button is clicked", () => {
    const tableWithSpells: DndProgressionTable = {
      titulo: "Hechizos de Bardo",
      columnas: ["Nivel", "Conjuros conocidos"],
      filas: [["1", "Curar heridas, Luz"]],
    };
    const onSpellReferenceClick = vi.fn();

    render(
      <ProgressionTablesBlock
        tables={[tableWithSpells]}
        onSpellReferenceClick={onSpellReferenceClick}
      />,
    );

    fireEvent.click(screen.getByText("Curar heridas"));
    expect(onSpellReferenceClick).toHaveBeenCalledWith("Curar heridas");
  });
});
