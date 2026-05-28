// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import ExistingInventoryCatalogTab from "../../../screens/personaje/dndcharactersheet/components/inventoryCatalog/ExistingInventoryCatalogTab";
import type { ObjectCatalogResponse } from "../../../screens/personaje/utils/dndApi";

const BASE_PROPS = {
  search: "",
  typeFilter: "",
  isLoading: false,
  error: null,
  items: [] as ObjectCatalogResponse[],
  isSubmitting: false,
  onSearchChange: vi.fn(),
  onTypeFilterChange: vi.fn(),
  onAddExisting: vi.fn(),
};

const SAMPLE_ITEM: ObjectCatalogResponse = {
  id: 1,
  nombre: "Espada larga",
  formula: "1d8+3",
  descripcion: "Una espada larga de acero.",
  tipoObjeto: "ARMA",
};

describe("ExistingInventoryCatalogTab", () => {
  // ── Basic rendering ───────────────────────────────────────────────────────

  it("renders search input and type filter select", () => {
    render(<ExistingInventoryCatalogTab {...BASE_PROPS} />);
    expect(
      screen.getByPlaceholderText("Filtrar por nombre"),
    ).toBeInTheDocument();
    expect(screen.getByText("Todos los tipos")).toBeInTheDocument();
  });

  it("renders type filter options", () => {
    render(<ExistingInventoryCatalogTab {...BASE_PROPS} />);
    expect(screen.getByRole("option", { name: "ARMA" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "ARMADURA" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "CONSUMIBLE" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "MISCELANEO" }),
    ).toBeInTheDocument();
  });

  it("calls onSearchChange when search input changes", () => {
    const onSearchChange = vi.fn();
    render(
      <ExistingInventoryCatalogTab
        {...BASE_PROPS}
        onSearchChange={onSearchChange}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText("Filtrar por nombre"), {
      target: { value: "espada" },
    });
    expect(onSearchChange).toHaveBeenCalledWith("espada");
  });

  it("calls onTypeFilterChange when select changes", () => {
    const onTypeFilterChange = vi.fn();
    render(
      <ExistingInventoryCatalogTab
        {...BASE_PROPS}
        onTypeFilterChange={onTypeFilterChange}
      />,
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "ARMA" },
    });
    expect(onTypeFilterChange).toHaveBeenCalledWith("ARMA");
  });

  // ── States ────────────────────────────────────────────────────────────────

  it("shows loading message when isLoading is true", () => {
    render(<ExistingInventoryCatalogTab {...BASE_PROPS} isLoading />);
    expect(
      screen.getByText("Cargando catálogo de objetos..."),
    ).toBeInTheDocument();
  });

  it("shows empty state when not loading and items are empty", () => {
    render(
      <ExistingInventoryCatalogTab
        {...BASE_PROPS}
        isLoading={false}
        items={[]}
      />,
    );
    expect(
      screen.getByText("No hay objetos que coincidan con el filtro actual."),
    ).toBeInTheDocument();
  });

  it("shows error message when error is provided", () => {
    render(
      <ExistingInventoryCatalogTab {...BASE_PROPS} error="Error de servidor" />,
    );
    expect(screen.getByText("Error de servidor")).toBeInTheDocument();
  });

  // ── Items rendering ───────────────────────────────────────────────────────

  it("renders items with nombre and tipoObjeto", () => {
    render(
      <ExistingInventoryCatalogTab {...BASE_PROPS} items={[SAMPLE_ITEM]} />,
    );
    expect(screen.getByText("Espada larga")).toBeInTheDocument();
    // "ARMA" appears in both the select option and the item — getAllByText is safe
    expect(screen.getAllByText("ARMA").length).toBeGreaterThan(0);
  });

  it("renders item formula when available", () => {
    render(
      <ExistingInventoryCatalogTab {...BASE_PROPS} items={[SAMPLE_ITEM]} />,
    );
    expect(screen.getByText("1d8+3")).toBeInTheDocument();
  });

  it("renders item description", () => {
    render(
      <ExistingInventoryCatalogTab {...BASE_PROPS} items={[SAMPLE_ITEM]} />,
    );
    expect(screen.getByText("Una espada larga de acero.")).toBeInTheDocument();
  });

  it("shows 'Sin descripción.' when item has no description", () => {
    const itemNoDesc = { ...SAMPLE_ITEM, descripcion: null };
    render(
      <ExistingInventoryCatalogTab {...BASE_PROPS} items={[itemNoDesc]} />,
    );
    expect(screen.getByText("Sin descripción.")).toBeInTheDocument();
  });

  it("does not show formula section when item has no formula", () => {
    const itemNoFormula = { ...SAMPLE_ITEM, formula: null };
    render(
      <ExistingInventoryCatalogTab {...BASE_PROPS} items={[itemNoFormula]} />,
    );
    expect(screen.queryByText("1d8+3")).not.toBeInTheDocument();
  });

  it("calls onAddExisting with item id when Añadir is clicked", () => {
    const onAddExisting = vi.fn();
    render(
      <ExistingInventoryCatalogTab
        {...BASE_PROPS}
        items={[SAMPLE_ITEM]}
        onAddExisting={onAddExisting}
      />,
    );
    fireEvent.click(screen.getByText("Añadir"));
    expect(onAddExisting).toHaveBeenCalledWith(1);
  });

  it("Añadir button is disabled when isSubmitting is true", () => {
    render(
      <ExistingInventoryCatalogTab
        {...BASE_PROPS}
        items={[SAMPLE_ITEM]}
        isSubmitting
      />,
    );
    const btn = screen.getByText("Añadir") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("renders multiple items", () => {
    const items: ObjectCatalogResponse[] = [
      SAMPLE_ITEM,
      {
        id: 2,
        nombre: "Armadura de cuero",
        formula: null,
        descripcion: null,
        tipoObjeto: "ARMADURA",
      },
    ];
    render(<ExistingInventoryCatalogTab {...BASE_PROPS} items={items} />);
    expect(screen.getByText("Espada larga")).toBeInTheDocument();
    expect(screen.getByText("Armadura de cuero")).toBeInTheDocument();
  });
});
