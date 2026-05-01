// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BackgroundSelectionSection from "../../../screens/personaje/creatednd/sections/BackgroundSelectionSection";

const backgroundSummaries = [{ id: "sage", nombre: "Sabio" }];

const selectedBackground = {
  id: "sage",
  nombre: "Sabio",
  descripcion: "Erudito y bibliotecario.",
  competenciasHabilidades: ["Arcano", "Historia"],
  competenciasHerramientas: ["Calígrafo"],
  resumenIdiomas: ["Dos idiomas adicionales"],
  nombreRasgo: "Investigador",
  descripcionRasgo: "Siempre encuentras la pista adecuada.",
  equipamiento: {
    fijos: [
      {
        id: 1,
        etiqueta: "Piezas de oro",
        cantidad: 10,
        objeto: null,
      },
      {
        id: 2,
        etiqueta: "Tintero",
        cantidad: 2,
        objeto: { nombre: "Tintero", formula: null },
      },
    ],
  },
  elecciones: [
    {
      id: "tool-choice",
      etiqueta: "Herramientas",
      resumen: "Elige dos herramientas",
      cantidad: 2,
      catalogo: "herramientasartesano",
      opciones: ["Flauta", "Lira", "Laúd"],
    },
    {
      id: "language-choice",
      etiqueta: "Idiomas extra",
      resumen: "Elige un idioma",
      cantidad: 1,
      catalogo: "idiomas",
      opciones: ["Draconico", "Élfico"],
    },
  ],
} as never;

function renderSection(
  overrides: Partial<
    React.ComponentProps<typeof BackgroundSelectionSection>
  > = {},
) {
  const onSelectionChange = vi.fn();
  const onSelectedBackgroundChange = vi.fn();

  render(
    <BackgroundSelectionSection
      backgrounds={backgroundSummaries}
      selectedBackgroundId=""
      selectedBackground={null}
      onSelectionChange={onSelectionChange}
      onSelectedBackgroundChange={onSelectedBackgroundChange}
      isLoadingBackgrounds={false}
      backgroundsError={null}
      isLoadingBackgroundInfo={false}
      backgroundInfoError={null}
      {...overrides}
    />,
  );

  return { onSelectionChange, onSelectedBackgroundChange };
}

describe("creacion de personaje - BackgroundSelectionSection", () => {
  it("muestra placeholder, validaciones y estados de carga/error", () => {
    const { onSelectedBackgroundChange } = renderSection({
      isLoadingBackgrounds: true,
      fieldErrors: { background: "Campo obligatorio" },
    });

    expect(
      screen.getByText(
        /Selecciona un trasfondo en el desplegable para ver su información/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Campo obligatorio")).toBeInTheDocument();
    expect(
      screen.getByText("Cargando trasfondos disponibles..."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Selecciona un trasfondo"), {
      target: { value: "sage" },
    });

    expect(onSelectedBackgroundChange).toHaveBeenCalledWith("sage");
  });

  it("muestra la carga y el error de información del trasfondo seleccionado", () => {
    const { rerender } = render(
      <BackgroundSelectionSection
        backgrounds={backgroundSummaries}
        selectedBackgroundId="sage"
        selectedBackground={null}
        onSelectionChange={vi.fn()}
        onSelectedBackgroundChange={vi.fn()}
        isLoadingBackgrounds={false}
        backgroundsError={null}
        isLoadingBackgroundInfo
        backgroundInfoError={null}
      />,
    );

    expect(
      screen.getByText("Cargando información del trasfondo..."),
    ).toBeInTheDocument();

    rerender(
      <BackgroundSelectionSection
        backgrounds={backgroundSummaries}
        selectedBackgroundId="sage"
        selectedBackground={null}
        onSelectionChange={vi.fn()}
        onSelectedBackgroundChange={vi.fn()}
        isLoadingBackgrounds={false}
        backgroundsError={null}
        isLoadingBackgroundInfo={false}
        backgroundInfoError="Fallo al cargar el trasfondo"
      />,
    );

    expect(
      screen.getByText("Fallo al cargar el trasfondo"),
    ).toBeInTheDocument();
  });

  it("renderiza el detalle completo y propaga elecciones, alineamiento e historia", async () => {
    const { onSelectionChange } = renderSection({
      selectedBackgroundId: "sage",
      selectedBackground,
      fieldErrors: { "tool-choice-1": "Debes elegir una herramienta" },
    });

    expect(screen.getByRole("heading", { name: "Sabio" })).toBeInTheDocument();
    expect(screen.getByText("Erudito y bibliotecario.")).toBeInTheDocument();
    expect(screen.getByText("Investigador")).toBeInTheDocument();
    expect(screen.getByText("10 PO")).toBeInTheDocument();
    expect(screen.getByText("2 x Tintero")).toBeInTheDocument();
    expect(screen.getByText("Arcano")).toBeInTheDocument();
    expect(screen.getByText("Calígrafo")).toBeInTheDocument();
    expect(screen.getByText("Dos idiomas adicionales")).toBeInTheDocument();
    expect(
      screen.getByText("Debes elegir una herramienta"),
    ).toBeInTheDocument();

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[1], { target: { value: "Lira" } });
    fireEvent.change(selects[2], { target: { value: "Laúd" } });
    fireEvent.change(selects[3], { target: { value: "Draconico" } });
    fireEvent.change(selects[4], { target: { value: "Legal Bueno" } });
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Criado entre pergaminos." },
    });

    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          selectedBackgroundId: "sage",
          alignment: "Legal Bueno",
          personalHistory: "Criado entre pergaminos.",
          selectedChoices: {
            "tool-choice": ["Lira", "Laúd"],
            "language-choice": ["Draconico"],
          },
        }),
      );
    });

    expect(
      screen
        .getAllByRole("option", { name: "Lira" })
        .some((option) => option.hasAttribute("disabled")),
    ).toBe(true);
  });
});
