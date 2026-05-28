// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import NpcInfoTab from "../../../screens/personaje/dndcharactersheet/components/npc/NpcInfoTab";
import type {
  DndCharacterDetailResponse,
  CharacterAbilityResponse,
} from "../../../screens/personaje/utils/dndApi";

const BASE_CHARACTER: DndCharacterDetailResponse = {
  id: 1,
  nombre: "Goblin",
  retrato: "",
  biografia: null,
  sistemaDeJuego: "DND5",
  raza: null,
  subraza: null,
  clases: [],
  caracteristicaLanzamientoConjuros: null,
  estadisticas: {},
  habilidades: [],
  mochila: [],
  usado: "",
  tipo: "NPC",
  vd: null,
};

const BASE_PROPS = {
  character: BASE_CHARACTER,
  isEditMode: false,
  editVd: "",
  onEditVdChange: vi.fn(),
  editBiografia: "",
  onEditBiografiaChange: vi.fn(),
  displayHabilidades: [] as CharacterAbilityResponse[],
  onDeleteHabilidad: vi.fn(),
  newIdioma: "",
  onNewIdiomaChange: vi.fn(),
  isAddingIdioma: false,
  onAddIdioma: vi.fn(),
};

describe("NpcInfoTab", () => {
  // ── Valor de Desafío ──────────────────────────────────────────────────────

  it("shows VD badge in view mode when character.vd is set", () => {
    render(
      <NpcInfoTab
        {...BASE_PROPS}
        character={{ ...BASE_CHARACTER, vd: "5 (1.800 PX)" }}
      />,
    );
    expect(screen.getByText("Valor de Desafío")).toBeInTheDocument();
    expect(screen.getByText("5 (1.800 PX)")).toBeInTheDocument();
  });

  it("does not show VD section when not in edit mode and vd is null", () => {
    render(<NpcInfoTab {...BASE_PROPS} />);
    expect(screen.queryByText("Valor de Desafío")).not.toBeInTheDocument();
  });

  it("shows VD input in edit mode", () => {
    render(<NpcInfoTab {...BASE_PROPS} isEditMode editVd="3 (700 PX)" />);
    expect(screen.getByText("Valor de Desafío")).toBeInTheDocument();
    const input = screen.getByPlaceholderText(
      "Ej. 5 (1.800 PX)",
    ) as HTMLInputElement;
    expect(input.value).toBe("3 (700 PX)");
  });

  it("calls onEditVdChange when VD input changes", () => {
    const onEditVdChange = vi.fn();
    render(
      <NpcInfoTab {...BASE_PROPS} isEditMode onEditVdChange={onEditVdChange} />,
    );
    fireEvent.change(screen.getByPlaceholderText("Ej. 5 (1.800 PX)"), {
      target: { value: "10" },
    });
    expect(onEditVdChange).toHaveBeenCalledWith("10");
  });

  // ── Idiomas ───────────────────────────────────────────────────────────────

  it("does not show idiomas section in view mode when no idioma habilidades", () => {
    render(<NpcInfoTab {...BASE_PROPS} />);
    expect(screen.queryByText("Idiomas")).not.toBeInTheDocument();
  });

  it("shows idiomas in view mode when idioma habilidades exist", () => {
    const habilidades: CharacterAbilityResponse[] = [
      {
        id: 1,
        nombre: "Idioma: Común",
        bonificacion: null,
        formula: null,
        descripcion: null,
        tags: null,
      },
      {
        id: 2,
        nombre: "Idioma: Élfico",
        bonificacion: null,
        formula: null,
        descripcion: null,
        tags: null,
      },
    ];
    render(<NpcInfoTab {...BASE_PROPS} displayHabilidades={habilidades} />);
    expect(screen.getByText("Idiomas")).toBeInTheDocument();
    expect(screen.getByText("Común, Élfico")).toBeInTheDocument();
  });

  it("shows idiomas edit form with 'Sin idiomas' when no idiomas in edit mode", () => {
    render(<NpcInfoTab {...BASE_PROPS} isEditMode />);
    expect(screen.getByText("Idiomas")).toBeInTheDocument();
    expect(screen.getByText("Sin idiomas")).toBeInTheDocument();
  });

  it("shows idiomas chips with delete buttons in edit mode", () => {
    const onDeleteHabilidad = vi.fn();
    const habilidades: CharacterAbilityResponse[] = [
      {
        id: 5,
        nombre: "Idioma: Dracónico",
        bonificacion: null,
        formula: null,
        descripcion: null,
        tags: null,
      },
    ];
    render(
      <NpcInfoTab
        {...BASE_PROPS}
        isEditMode
        displayHabilidades={habilidades}
        onDeleteHabilidad={onDeleteHabilidad}
      />,
    );
    expect(screen.getByText("Dracónico")).toBeInTheDocument();
    fireEvent.click(screen.getByTitle("Eliminar idioma"));
    expect(onDeleteHabilidad).toHaveBeenCalledWith(5);
  });

  it("calls onNewIdiomaChange when idioma input changes", () => {
    const onNewIdiomaChange = vi.fn();
    render(
      <NpcInfoTab
        {...BASE_PROPS}
        isEditMode
        onNewIdiomaChange={onNewIdiomaChange}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText("Ej. Común, Élfico…"), {
      target: { value: "Abismal" },
    });
    expect(onNewIdiomaChange).toHaveBeenCalledWith("Abismal");
  });

  it("calls onAddIdioma when Enter is pressed in idioma input", () => {
    const onAddIdioma = vi.fn();
    render(<NpcInfoTab {...BASE_PROPS} isEditMode onAddIdioma={onAddIdioma} />);
    fireEvent.keyDown(screen.getByPlaceholderText("Ej. Común, Élfico…"), {
      key: "Enter",
    });
    expect(onAddIdioma).toHaveBeenCalled();
  });

  it("calls onAddIdioma when '+ Agregar' button is clicked", () => {
    const onAddIdioma = vi.fn();
    render(
      <NpcInfoTab
        {...BASE_PROPS}
        isEditMode
        newIdioma="Élfico"
        onAddIdioma={onAddIdioma}
      />,
    );
    fireEvent.click(screen.getByText("+ Agregar"));
    expect(onAddIdioma).toHaveBeenCalled();
  });

  it("shows '…' when isAddingIdioma is true", () => {
    render(
      <NpcInfoTab
        {...BASE_PROPS}
        isEditMode
        newIdioma="Común"
        isAddingIdioma
      />,
    );
    expect(screen.getByText("…")).toBeInTheDocument();
  });

  // ── Descripción / Biografía ───────────────────────────────────────────────

  it("shows biography in view mode", () => {
    render(
      <NpcInfoTab
        {...BASE_PROPS}
        character={{ ...BASE_CHARACTER, biografia: "Este es un goblin feroz." }}
      />,
    );
    expect(screen.getByText("Este es un goblin feroz.")).toBeInTheDocument();
  });

  it("shows 'Sin descripción' in view mode when biography is null", () => {
    render(<NpcInfoTab {...BASE_PROPS} />);
    expect(screen.getByText("Sin descripción")).toBeInTheDocument();
  });

  it("shows description textarea in edit mode", () => {
    render(
      <NpcInfoTab
        {...BASE_PROPS}
        isEditMode
        editBiografia="Descripción del NPC"
      />,
    );
    const textarea = screen.getByPlaceholderText(
      "Descripción del NPC...",
    ) as HTMLTextAreaElement;
    expect(textarea.value).toBe("Descripción del NPC");
  });

  it("calls onEditBiografiaChange when biography textarea changes", () => {
    const onEditBiografiaChange = vi.fn();
    render(
      <NpcInfoTab
        {...BASE_PROPS}
        isEditMode
        onEditBiografiaChange={onEditBiografiaChange}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText("Descripción del NPC..."), {
      target: { value: "Nueva descripción" },
    });
    expect(onEditBiografiaChange).toHaveBeenCalledWith("Nueva descripción");
  });
});
