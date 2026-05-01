// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { DndCharacterDetailResponse } from "../../../screens/personaje/utils/dndApi";
import IdentitySection from "../../../screens/personaje/dndcharactersheet/components/IdentitySection";

afterEach(() => {
  cleanup();
});

const baseCharacter: DndCharacterDetailResponse = {
  id: 1,
  nombre: "Thorin",
  retrato: "",
  biografia: null,
  sistemaDeJuego: "DnD",
  raza: "Enano",
  subraza: null,
  clases: [{ nombre: "Guerrero", nivel: 3 }],
  caracteristicaLanzamientoConjuros: null,
  estadisticas: {
    Fuerza: 16,
    Destreza: 12,
    Constitucion: 14,
    Inteligencia: 10,
    Sabiduria: 10,
    Carisma: 8,
    Experiencia: 900,
  },
  habilidades: [],
  mochila: [],
  usado: "{}",
};

const defaultProps = {
  character: baseCharacter,
  editableName: "Thorin",
  isEditMode: false,
  onShortRest: vi.fn(),
  onLongRest: vi.fn(),
  onToggleEditMode: vi.fn(),
  onOpenLevelManagement: vi.fn(),
  onDeleteCharacter: vi.fn(),
  onEditableNameChange: vi.fn(),
  onSaveEdit: vi.fn(),
  onCancelEdit: vi.fn(),
};

describe("IdentitySection", () => {
  it("renders character name and class summary", () => {
    render(<IdentitySection {...defaultProps} />);

    expect(screen.getByText("Thorin")).toBeInTheDocument();
    expect(screen.getByText(/Guerrero/)).toBeInTheDocument();
  });

  it("calls onShortRest when short rest button is pressed", () => {
    const onShortRest = vi.fn();
    render(<IdentitySection {...defaultProps} onShortRest={onShortRest} />);

    fireEvent.click(screen.getByText("Descanso corto"));
    expect(onShortRest).toHaveBeenCalledTimes(1);
  });

  it("calls onLongRest when long rest button is pressed", () => {
    const onLongRest = vi.fn();
    render(<IdentitySection {...defaultProps} onLongRest={onLongRest} />);

    fireEvent.click(screen.getByText("Descanso largo"));
    expect(onLongRest).toHaveBeenCalledTimes(1);
  });

  it("calls onToggleEditMode when Editar button is pressed", () => {
    const onToggleEditMode = vi.fn();
    render(
      <IdentitySection {...defaultProps} onToggleEditMode={onToggleEditMode} />,
    );

    fireEvent.click(screen.getByText("Editar"));
    expect(onToggleEditMode).toHaveBeenCalledTimes(1);
  });

  it("shows edit-mode buttons when isEditMode is true", () => {
    render(<IdentitySection {...defaultProps} isEditMode />);

    expect(screen.getByText("Eliminar personaje")).toBeInTheDocument();
    expect(screen.getByText("Cancelar cambios")).toBeInTheDocument();
    expect(screen.getByText("Guardar edición")).toBeInTheDocument();
    expect(screen.getByText("Cerrar edición")).toBeInTheDocument();
  });

  it("calls onDeleteCharacter when Eliminar personaje is clicked in edit mode", () => {
    const onDeleteCharacter = vi.fn();
    render(
      <IdentitySection
        {...defaultProps}
        isEditMode
        onDeleteCharacter={onDeleteCharacter}
      />,
    );

    fireEvent.click(screen.getByText("Eliminar personaje"));
    expect(onDeleteCharacter).toHaveBeenCalledTimes(1);
  });

  it("calls onSaveEdit when Guardar edición is clicked in edit mode", () => {
    const onSaveEdit = vi.fn();
    render(
      <IdentitySection {...defaultProps} isEditMode onSaveEdit={onSaveEdit} />,
    );

    fireEvent.click(screen.getByText("Guardar edición"));
    expect(onSaveEdit).toHaveBeenCalledTimes(1);
  });

  it("calls onCancelEdit when Cancelar cambios is clicked in edit mode", () => {
    const onCancelEdit = vi.fn();
    render(
      <IdentitySection
        {...defaultProps}
        isEditMode
        onCancelEdit={onCancelEdit}
      />,
    );

    fireEvent.click(screen.getByText("Cancelar cambios"));
    expect(onCancelEdit).toHaveBeenCalledTimes(1);
  });

  it("calls onOpenLevelManagement when Modificar nivel is clicked", () => {
    const onOpenLevelManagement = vi.fn();
    render(
      <IdentitySection
        {...defaultProps}
        onOpenLevelManagement={onOpenLevelManagement}
      />,
    );

    fireEvent.click(screen.getByText("Modificar nivel"));
    expect(onOpenLevelManagement).toHaveBeenCalledTimes(1);
  });

  it("renders character portrait when retrato is set", () => {
    const characterWithPortrait = {
      ...baseCharacter,
      retrato: "https://example.com/portrait.jpg",
    };
    render(
      <IdentitySection {...defaultProps} character={characterWithPortrait} />,
    );

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://example.com/portrait.jpg");
  });
});
