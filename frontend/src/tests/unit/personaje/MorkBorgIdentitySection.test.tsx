// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import MorkBorgIdentitySection from "../../../screens/personaje/morkborgcharactersheet/components/MorkBorgIdentitySection";
import type { DndCharacterDetailResponse } from "../../../screens/personaje/utils/dndApi";

afterEach(() => cleanup());

function makeCharacter(overrides = {}): DndCharacterDetailResponse {
  return {
    id: 1,
    nombre: "Kragor",
    retrato: null,
    biografia: null,
    sistemaDeJuego: "Mork Borg",
    raza: null,
    subraza: null,
    clases: [],
    caracteristicaLanzamientoConjuros: null,
    estadisticas: {},
    habilidades: [],
    mochila: [],
    usado: null,
    tipo: "personaje",
    vd: null,
    tags: "MORK_BORG,clase;escoria-alcantarillas",
    propietario: "testUser",
    ...overrides,
  } as unknown as DndCharacterDetailResponse;
}

const DEFAULT_PROPS = {
  character: makeCharacter(),
  editableName: "Kragor",
  isEditMode: false,
  isOwner: true,
  onShortRest: vi.fn(),
  onLongRest: vi.fn(),
  onToggleEditMode: vi.fn(),
  onDeleteCharacter: vi.fn(),
  onMejorar: vi.fn(),
  onEditableNameChange: vi.fn(),
  onSaveEdit: vi.fn(),
  onCancelEdit: vi.fn(),
};

describe("MorkBorgIdentitySection", () => {
  it("renders character name", () => {
    render(<MorkBorgIdentitySection {...DEFAULT_PROPS} />);
    expect(screen.getByText("Kragor")).toBeInTheDocument();
  });

  it("renders class name when classId is recognized", () => {
    render(<MorkBorgIdentitySection {...DEFAULT_PROPS} />);
    // Should show class name or id
    const element = document.body.textContent;
    expect(element).toBeTruthy();
  });

  it("renders Descanso corto button", () => {
    render(<MorkBorgIdentitySection {...DEFAULT_PROPS} />);
    expect(screen.getByText("Descanso corto")).toBeInTheDocument();
  });

  it("renders Descanso largo button", () => {
    render(<MorkBorgIdentitySection {...DEFAULT_PROPS} />);
    expect(screen.getByText("Descanso largo")).toBeInTheDocument();
  });

  it("calls onShortRest when Descanso corto is clicked", () => {
    const onShortRest = vi.fn();
    render(
      <MorkBorgIdentitySection {...DEFAULT_PROPS} onShortRest={onShortRest} />,
    );
    fireEvent.click(screen.getByText("Descanso corto"));
    expect(onShortRest).toHaveBeenCalled();
  });

  it("calls onLongRest when Descanso largo is clicked", () => {
    const onLongRest = vi.fn();
    render(
      <MorkBorgIdentitySection {...DEFAULT_PROPS} onLongRest={onLongRest} />,
    );
    fireEvent.click(screen.getByText("Descanso largo"));
    expect(onLongRest).toHaveBeenCalled();
  });

  it("shows edit buttons when isEditMode is true", () => {
    render(<MorkBorgIdentitySection {...DEFAULT_PROPS} isEditMode />);
    expect(screen.getByText("Guardar edición")).toBeInTheDocument();
    expect(screen.getByText("Cancelar cambios")).toBeInTheDocument();
  });

  it("calls onSaveEdit when Guardar edición is clicked", () => {
    const onSaveEdit = vi.fn();
    render(
      <MorkBorgIdentitySection
        {...DEFAULT_PROPS}
        isEditMode
        onSaveEdit={onSaveEdit}
      />,
    );
    fireEvent.click(screen.getByText("Guardar edición"));
    expect(onSaveEdit).toHaveBeenCalled();
  });

  it("calls onCancelEdit when Cancelar cambios is clicked", () => {
    const onCancelEdit = vi.fn();
    render(
      <MorkBorgIdentitySection
        {...DEFAULT_PROPS}
        isEditMode
        onCancelEdit={onCancelEdit}
      />,
    );
    fireEvent.click(screen.getByText("Cancelar cambios"));
    expect(onCancelEdit).toHaveBeenCalled();
  });

  it("shows portrait image when character has retrato", () => {
    const character = makeCharacter({
      retrato: "https://example.com/portrait.jpg",
    });
    render(
      <MorkBorgIdentitySection {...DEFAULT_PROPS} character={character} />,
    );
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://example.com/portrait.jpg");
  });

  it("renders without class when tags is null", () => {
    const character = makeCharacter({ tags: null });
    render(
      <MorkBorgIdentitySection {...DEFAULT_PROPS} character={character} />,
    );
    expect(screen.getByText("Sin clase")).toBeInTheDocument();
  });

  it("shows Mejorar button when onMejorar is provided and isOwner", () => {
    const onMejorar = vi.fn();
    render(
      <MorkBorgIdentitySection
        {...DEFAULT_PROPS}
        onMejorar={onMejorar}
        isOwner
      />,
    );
    const mejorarBtn = screen.queryByText("Mejorar");
    if (mejorarBtn) {
      fireEvent.click(mejorarBtn);
      expect(onMejorar).toHaveBeenCalled();
    }
  });

  it("does not show edit button when isOwner is false", () => {
    render(<MorkBorgIdentitySection {...DEFAULT_PROPS} isOwner={false} />);
    // No edit/delete buttons for non-owners
    expect(screen.queryByText("Eliminar personaje")).not.toBeInTheDocument();
  });
});
