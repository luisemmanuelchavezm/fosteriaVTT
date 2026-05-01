// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";

import BiographyTab from "../../../screens/personaje/dndcharactersheet/components/detailTabs/BiographyTab";

const baseProps = {
  isEditMode: false,
  languages: ["Comun", "Elfico"],
  biographySections: {
    alignment: "Neutral bueno",
    personalHistory: "Sirvió en un templo.",
  },
  editableLanguagesText: "Comun, Elfico",
  editableAlignment: "Neutral bueno",
  editablePersonalHistory: "Sirvió en un templo.",
  editableWeaponArmorCompetencies: ["Armas simples"],
  editableToolCompetencies: ["Laúd"],
  filteredWeaponArmorCatalog: ["Escudos", "Armaduras ligeras"],
  filteredToolCatalog: [
    { name: "Juego de dados", category: "juegos" as const },
    { name: "Flauta", category: "instrumentos" as const },
  ],
  onLanguagesTextChange: vi.fn(),
  onAlignmentChange: vi.fn(),
  onPersonalHistoryChange: vi.fn(),
  onRemoveWeaponArmorCompetency: vi.fn(),
  onRemoveToolCompetency: vi.fn(),
  onAddWeaponArmorCompetency: vi.fn(),
  onAddToolCompetency: vi.fn(),
  onWeaponArmorSearchChange: vi.fn(),
  onToolSearchChange: vi.fn(),
  onWeaponArmorFilterChange: vi.fn(),
  onToolFilterChange: vi.fn(),
  weaponArmorSearch: "",
  toolSearch: "",
  weaponArmorFilter: "all" as const,
  toolFilter: "all" as const,
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("BiographyTab", () => {
  it("renders read-only biography information", () => {
    render(<BiographyTab {...baseProps} />);

    expect(screen.getByText("Comun, Elfico")).toBeInTheDocument();
    expect(screen.getByText("Neutral bueno")).toBeInTheDocument();
    expect(screen.getByText("Sirvió en un templo.")).toBeInTheDocument();
    expect(screen.getByText("Armas simples")).toBeInTheDocument();
    expect(screen.getByText("Laúd")).toBeInTheDocument();
  });

  it("supports editing text fields and adding/removing competencies", () => {
    render(<BiographyTab {...baseProps} isEditMode />);

    const textareas = screen.getAllByRole("textbox");
    fireEvent.change(textareas[0], { target: { value: "Comun, Infernal" } });
    fireEvent.change(textareas[1], { target: { value: "Nueva historia" } });
    fireEvent.change(screen.getByDisplayValue("Neutral bueno"), {
      target: { value: "Legal bueno" },
    });

    expect(baseProps.onLanguagesTextChange).toHaveBeenCalledWith(
      "Comun, Infernal",
    );
    expect(baseProps.onPersonalHistoryChange).toHaveBeenCalledWith(
      "Nueva historia",
    );
    expect(baseProps.onAlignmentChange).toHaveBeenCalledWith("Legal bueno");

    fireEvent.click(
      screen.getAllByRole("button", { name: "Añadir nueva competencia" })[0],
    );
    fireEvent.change(screen.getByPlaceholderText("Buscar por nombre"), {
      target: { value: "escu" },
    });
    fireEvent.change(screen.getAllByDisplayValue("Todas")[0], {
      target: { value: "armor" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Escudos/i }));
    const weaponChip =
      screen.getByText("Armas simples").parentElement?.parentElement;
    fireEvent.click(
      within(weaponChip as HTMLElement).getByRole("button", { name: "×" }),
    );

    expect(baseProps.onWeaponArmorSearchChange).toHaveBeenCalledWith("escu");
    expect(baseProps.onWeaponArmorFilterChange).toHaveBeenCalledWith("armor");
    expect(baseProps.onAddWeaponArmorCompetency).toHaveBeenCalledWith(
      "Escudos",
    );
    expect(baseProps.onRemoveWeaponArmorCompetency).toHaveBeenCalledWith(
      "Armas simples",
    );

    fireEvent.click(
      screen.getAllByRole("button", { name: "Añadir nueva competencia" })[1],
    );
    fireEvent.change(screen.getAllByPlaceholderText("Buscar por nombre")[1], {
      target: { value: "fla" },
    });
    fireEvent.change(screen.getAllByDisplayValue("Todas")[1], {
      target: { value: "instrumentos" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Flauta/i }));
    const toolChip = screen.getByText("Laúd").parentElement?.parentElement;
    fireEvent.click(
      within(toolChip as HTMLElement).getByRole("button", { name: "×" }),
    );

    expect(baseProps.onToolSearchChange).toHaveBeenCalledWith("fla");
    expect(baseProps.onToolFilterChange).toHaveBeenCalledWith("instrumentos");
    expect(baseProps.onAddToolCompetency).toHaveBeenCalledWith("Flauta");
    expect(baseProps.onRemoveToolCompetency).toHaveBeenCalledWith("Laúd");
  });

  it("shows empty messages when there is no biography data", () => {
    render(
      <BiographyTab
        {...baseProps}
        languages={[]}
        biographySections={{ alignment: null, personalHistory: null }}
        editableWeaponArmorCompetencies={[]}
        editableToolCompetencies={[]}
      />,
    );

    expect(
      screen.getByText("No hay idiomas registrados para este personaje."),
    ).toBeInTheDocument();
    expect(screen.getByText("No indicado")).toBeInTheDocument();
    expect(
      screen.getByText(
        "No hay competencias con armas o armaduras registradas para este personaje.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "No hay competencias con herramientas registradas para este personaje.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No hay historia personal registrada."),
    ).toBeInTheDocument();
  });
});
