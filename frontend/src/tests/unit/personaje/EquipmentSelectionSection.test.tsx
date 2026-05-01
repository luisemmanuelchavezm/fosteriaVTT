// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EquipmentSelectionSection from "../../../screens/personaje/creatednd/sections/EquipmentSelectionSection";

const classEquipment = {
  fijos: [],
  gruposEleccion: [
    {
      id: "weapon-group",
      etiqueta: "Arma inicial",
      opciones: [
        {
          id: 1,
          etiqueta: "Espada larga",
          cantidad: 1,
          objeto: {
            id: 101,
            nombre: "Espada larga",
            formula: "1d8",
            indice: "Versatil1d10, Ligera",
          },
          opcionesCatalogo: [],
        },
        {
          id: 2,
          etiqueta: "Arma marcial",
          cantidad: 1,
          objeto: null,
          opcionesCatalogo: [
            {
              id: 201,
              nombre: "Alabarda",
              formula: "1d10",
              indice: "Pesada, Alcance",
              descripcion: "**Alcance** y potencia.",
            },
          ],
        },
      ],
    },
  ],
} as never;

const backgroundEquipment = {
  fijos: [
    {
      id: 11,
      etiqueta: "Piezas de oro",
      cantidad: 15,
      objeto: null,
    },
  ],
  gruposEleccion: [],
} as never;

function renderSection(
  overrides: Partial<
    React.ComponentProps<typeof EquipmentSelectionSection>
  > = {},
) {
  const onCreateCharacter = vi.fn();
  const onSelectionChange = vi.fn();

  render(
    <EquipmentSelectionSection
      classEquipment={null}
      backgroundEquipment={null}
      classEquipmentName="Guerrero"
      backgroundEquipmentName="Sabio"
      isLoadingClassEquipment={false}
      isLoadingBackgroundEquipment={false}
      classEquipmentError={null}
      backgroundEquipmentError={null}
      onCreateCharacter={onCreateCharacter}
      onSelectionChange={onSelectionChange}
      {...overrides}
    />,
  );

  return { onCreateCharacter, onSelectionChange };
}

describe("creacion de personaje - EquipmentSelectionSection", () => {
  it("muestra el placeholder sin selecciones y permite lanzar la creación", () => {
    const { onCreateCharacter, onSelectionChange } = renderSection();

    expect(
      screen.getByText(/Selecciona primero una clase o un trasfondo/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Crear personaje" }));

    expect(onCreateCharacter).toHaveBeenCalledTimes(1);
    expect(onSelectionChange).toHaveBeenCalledWith({
      selectedGroups: {},
      selectedCatalogByGroup: {},
    });
  });

  it("muestra estados de carga, error y botón deshabilitado durante la creación", () => {
    renderSection({
      isLoadingClassEquipment: true,
      backgroundEquipmentError: "Sin equipo de trasfondo",
      isCreating: true,
      isCreateDisabled: true,
    });

    expect(
      screen.getByText("Cargando equipamiento de clase..."),
    ).toBeInTheDocument();
    expect(screen.getByText("Sin equipo de trasfondo")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Creando personaje..." }),
    ).toBeDisabled();
  });

  it("renderiza las cartas de origen y propaga selección de grupo y catálogo", async () => {
    const { onSelectionChange } = renderSection({
      classEquipment,
      backgroundEquipment,
      fieldErrors: {
        "class:weapon-group": "Debes elegir un bloque",
        "class:weapon-group:catalog": "Debes elegir un arma concreta",
      },
    });

    expect(screen.getByText("de Guerrero")).toBeInTheDocument();
    expect(screen.getByText("de Sabio")).toBeInTheDocument();
    expect(screen.getByText("Debes elegir un bloque")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Arma marcial"));

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "201" } });

    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenLastCalledWith({
        selectedGroups: { "class:weapon-group": 1 },
        selectedCatalogByGroup: { "class:weapon-group": 201 },
      });
    });

    expect(screen.getByText("Daño: 1d10")).toBeInTheDocument();
    expect(
      screen.getByText("Propiedades: pesada, alcance"),
    ).toBeInTheDocument();
    expect(screen.getByText("Alcance y potencia.")).toBeInTheDocument();
  });

  it("muestra varios picklist cuando una opcion requiere varias armas de catalogo", async () => {
    const multiCatalogEquipment = {
      fijos: [],
      gruposEleccion: [
        {
          id: "multi-weapon-group",
          etiqueta: "Armamento principal",
          opciones: [
            {
              id: 31,
              etiqueta: "Dos armas marciales",
              cantidad: 2,
              objeto: { id: 301, nombre: "Dos armas marciales" },
              opcionesCatalogo: [
                {
                  id: 401,
                  nombre: "Espada larga",
                  formula: "1d8",
                  indice: "AMCuerpo,Versatil1d10",
                  descripcion: "**Arma marcial** versátil.",
                },
                {
                  id: 402,
                  nombre: "Martillo de guerra",
                  formula: "1d8",
                  indice: "AMCuerpo,Versatil1d10",
                  descripcion: "**Arma marcial** contundente.",
                },
              ],
            },
          ],
        },
      ],
    } as never;

    const { onSelectionChange } = renderSection({
      classEquipment: multiCatalogEquipment,
      fieldErrors: {
        "class:multi-weapon-group:0:catalog": "Campo obligatorio",
        "class:multi-weapon-group:1:catalog": "Campo obligatorio",
      },
    });

    fireEvent.click(screen.getByText(/Dos armas marciales/));

    const selects = screen.getAllByRole("combobox");
    expect(selects).toHaveLength(2);

    fireEvent.change(selects[0], { target: { value: "401" } });
    fireEvent.change(selects[1], { target: { value: "402" } });

    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenLastCalledWith({
        selectedGroups: { "class:multi-weapon-group": 0 },
        selectedCatalogByGroup: {
          "class:multi-weapon-group:0": 401,
          "class:multi-weapon-group:1": 402,
        },
      });
    });

    expect(screen.getByText("Selección 1")).toBeInTheDocument();
    expect(screen.getByText("Selección 2")).toBeInTheDocument();
    expect(screen.getByText("Has seleccionado 2 armas.")).toBeInTheDocument();
  });
});
